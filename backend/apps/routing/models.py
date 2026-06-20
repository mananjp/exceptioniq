from django.db import models
from apps.common.models import TimeStampedModel
from apps.entities.models import Entity

class RoutingRule(TimeStampedModel):
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='routing_rules')
    reconciliation_type = models.CharField(max_length=20)
    exception_code = models.CharField(max_length=50)
    min_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    assign_to_role = models.CharField(max_length=20, default='analyst')
    sla_hours = models.PositiveIntegerField(default=24)
    priority = models.CharField(max_length=20, default='medium')
    active = models.BooleanField(default=True)
