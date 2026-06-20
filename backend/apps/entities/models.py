from django.db import models
from apps.common.models import TimeStampedModel

class Entity(TimeStampedModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    gstin = models.CharField(max_length=20, blank=True)
    currency = models.CharField(max_length=10, default='INR')

    def __str__(self):
        return self.name
