from django.db import models
from apps.common.models import TimeStampedModel
from apps.entities.models import Entity

class Batch(TimeStampedModel):
    RECON_CHOICES = [('bank','Bank'),('ap','AP'),('ar','AR'),('gst','GST')]
    STATUS_CHOICES = [('uploaded','Uploaded'),('processing','Processing'),('completed','Completed'),('failed','Failed')]
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='batches')
    recon_type = models.CharField(max_length=20, choices=RECON_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    source_name = models.CharField(max_length=255)
    total_rows = models.PositiveIntegerField(default=0)
    matched_rows = models.PositiveIntegerField(default=0)
    exception_rows = models.PositiveIntegerField(default=0)
    error_rows = models.PositiveIntegerField(default=0)

class LedgerEntry(TimeStampedModel):
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='ledger_entries')
    txn_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reference = models.CharField(max_length=255, blank=True)
    counterparty = models.CharField(max_length=255, blank=True)
    account_type = models.CharField(max_length=30, default='bank')
    raw_data = models.JSONField(default=dict)

class BankStatementLine(TimeStampedModel):
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='bank_lines')
    txn_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reference = models.CharField(max_length=255, blank=True)
    counterparty = models.CharField(max_length=255, blank=True)
    narration = models.TextField(blank=True)
    raw_data = models.JSONField(default=dict)
