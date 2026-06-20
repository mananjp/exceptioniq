import csv
import io
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from apps.entities.models import Entity
from apps.reconciliation.models import Batch, LedgerEntry, BankStatementLine
from apps.exceptions_app.models import ExceptionRecord, ExceptionComment, AuditLog
from apps.routing.models import RoutingRule
from django.contrib.auth import get_user_model
from .serializers import (
    EntitySerializer, BatchSerializer, LedgerEntrySerializer,
    BankStatementLineSerializer, ExceptionRecordSerializer,
    ExceptionCommentSerializer, RoutingRuleSerializer, UserSerializer
)
User = get_user_model()
from .services import detect_bank_exceptions, apply_routing

class EntityViewSet(viewsets.ModelViewSet):
    queryset = Entity.objects.all().order_by('name')
    serializer_class = EntitySerializer

class RoutingRuleViewSet(viewsets.ModelViewSet):
    queryset = RoutingRule.objects.select_related('entity').all().order_by('-created_at')
    serializer_class = RoutingRuleSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer

class ExceptionViewSet(viewsets.ModelViewSet):
    queryset = ExceptionRecord.objects.select_related('entity', 'assigned_to').prefetch_related('comments', 'audit_logs').all().order_by('-created_at')
    serializer_class = ExceptionRecordSerializer
    filterset_fields = ['entity', 'reconciliation_type', 'exception_code', 'status', 'severity']

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        exception = self.get_object()
        serializer = ExceptionCommentSerializer(data={
            'exception': str(exception.id),
            'user': None,
            'message': request.data.get('message', '').strip(),
        })
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        AuditLog.objects.create(exception=exception, action='commented', metadata={'comment_id': str(comment.id)})
        return Response(ExceptionRecordSerializer(exception).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        exception = self.get_object()
        # Analyst resolves exception - status moves to resolved/pending_approval for maker-checker
        exception.status = 'resolved'
        exception.resolution_code = request.data.get('resolution_code', 'manual_resolution')
        exception.resolved_at = timezone.now()
        exception.save(update_fields=['status', 'resolution_code', 'resolved_at', 'updated_at'])
        
        note = request.data.get('note', '').strip()
        if note:
            ExceptionComment.objects.create(exception=exception, message=f"Resolved: {note}")
            
        AuditLog.objects.create(exception=exception, action='resolved', metadata={'resolution_code': exception.resolution_code, 'note': note})
        return Response(ExceptionRecordSerializer(exception).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        exception = self.get_object()
        # Approver approves - status moves to closed
        exception.status = 'closed'
        exception.save(update_fields=['status', 'updated_at'])
        
        note = request.data.get('note', '').strip()
        if note:
            ExceptionComment.objects.create(exception=exception, message=f"Approved: {note}")
            
        AuditLog.objects.create(exception=exception, action='approved', metadata={'note': note})
        return Response(ExceptionRecordSerializer(exception).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        exception = self.get_object()
        # Approver rejects - status moves back to investigating
        exception.status = 'investigating'
        exception.save(update_fields=['status', 'updated_at'])
        
        note = request.data.get('note', '').strip()
        if note:
            ExceptionComment.objects.create(exception=exception, message=f"Rejected: {note}")
            
        AuditLog.objects.create(exception=exception, action='rejected', metadata={'reason': note})
        return Response(ExceptionRecordSerializer(exception).data)

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        exception = self.get_object()
        user_id = request.data.get('user_id')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            exception.assigned_to = user
            exception.save(update_fields=['assigned_to', 'updated_at'])
            AuditLog.objects.create(exception=exception, user=user, action='reassigned', metadata={'assigned_to': user.username})
            return Response(ExceptionRecordSerializer(exception).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='ai-summary')
    def ai_summary(self, request, pk=None):
        exception = self.get_object()
        import requests
        from django.conf import settings
        
        # Build description markdown
        desc = f"""# Reconciliation Exception Details
- **Exception ID**: {exception.id}
- **Type**: {exception.reconciliation_type.upper()}
- **Exception Code**: {exception.exception_code}
- **Severity**: {exception.severity.upper()}
- **Status**: {exception.status.upper()}
- **Amount Difference**: {exception.amount_difference}
- **Date Difference**: {exception.date_difference} days
- **Context**: {exception.context}
"""
        try:
            res = requests.post(
                f"{settings.AI_SERVICE_URL}/summarize-exception",
                json={'markdown': desc},
                timeout=5
            )
            if res.status_code == 200:
                return Response(res.json())
            return Response({'summary': f"AI service returned status code {res.status_code}"})
        except Exception as e:
            return Response({'summary': f"Error calling AI Service: {str(e)}"})


class ReconciliationViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='bank/upload')
    def bank_upload(self, request):
        entity_id = request.data.get('entity_id')
        csv_text = request.data.get('csv_text', '')
        source_type = request.data.get('source_type', 'bank')
        entity = Entity.objects.get(id=entity_id)
        batch = Batch.objects.create(entity=entity, recon_type='bank', status='processing', source_name=f'{source_type}_upload')

        reader = csv.DictReader(io.StringIO(csv_text))
        total = 0
        with transaction.atomic():
            for row in reader:
                total += 1
                payload = {
                    'entity': entity,
                    'batch': batch,
                    'txn_date': row['txn_date'],
                    'amount': Decimal(str(row['amount'])),
                    'reference': row.get('reference', ''),
                    'counterparty': row.get('counterparty', ''),
                    'raw_data': row,
                }
                if source_type == 'bank':
                    BankStatementLine.objects.create(narration=row.get('narration', ''), **payload)
                else:
                    LedgerEntry.objects.create(account_type=row.get('account_type', 'bank'), **payload)
        batch.total_rows = total
        batch.status = 'completed'
        batch.save(update_fields=['total_rows', 'status', 'updated_at'])
        return Response(BatchSerializer(batch).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='bank/run')
    def bank_run(self, request):
        entity = Entity.objects.get(id=request.data.get('entity_id'))
        created = detect_bank_exceptions(entity)
        routed = [apply_routing(exc) for exc in created]
        return Response({'exceptions_created': len(routed)})

    @action(detail=False, methods=['post'], url_path='bank/clear')
    def bank_clear(self, request):
        from django.conf import settings
        if not settings.DEBUG:
            return Response(
                {"error": "This action is only available in debug mode."},
                status=status.HTTP_403_FORBIDDEN
            )
        entity_id = request.data.get('entity_id')
        if not entity_id:
            return Response({'error': 'entity_id is required'}, status=400)
        entity = Entity.objects.get(id=entity_id)
        with transaction.atomic():
            ExceptionRecord.objects.filter(entity=entity).delete()
            LedgerEntry.objects.filter(entity=entity).delete()
            BankStatementLine.objects.filter(entity=entity).delete()
            Batch.objects.filter(entity=entity).delete()
        return Response({'status': 'cleared'})


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})

