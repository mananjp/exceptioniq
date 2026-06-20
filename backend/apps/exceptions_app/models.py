from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from apps.entities.models import Entity

class ExceptionRecord(TimeStampedModel):
    STATUS_CHOICES = [
        ('detected','Detected'),('routed','Routed'),('investigating','Investigating'),
        ('pending_approval','Pending Approval'),('resolved','Resolved'),('approved','Approved'),('closed','Closed')
    ]
    SEVERITY_CHOICES = [('low','Low'),('medium','Medium'),('high','High'),('critical','Critical')]
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE)
    reconciliation_type = models.CharField(max_length=20)
    exception_code = models.CharField(max_length=50)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='detected')
    source_record_ids = models.JSONField(default=list)
    amount_difference = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    date_difference = models.IntegerField(default=0)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    context = models.JSONField(default=dict)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_exceptions')
    sla_deadline = models.DateTimeField(null=True, blank=True)
    resolution_code = models.CharField(max_length=100, blank=True)
    root_cause_code = models.CharField(max_length=100, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

class ExceptionComment(TimeStampedModel):
    exception = models.ForeignKey(ExceptionRecord, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    message = models.TextField()

class AuditLog(TimeStampedModel):
    exception = models.ForeignKey(ExceptionRecord, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=50)
    metadata = models.JSONField(default=dict)
