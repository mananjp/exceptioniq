from django.contrib import admin
from apps.users.models import User
from apps.entities.models import Entity
from apps.reconciliation.models import Batch, LedgerEntry, BankStatementLine
from apps.exceptions_app.models import ExceptionRecord, ExceptionComment, AuditLog
from apps.routing.models import RoutingRule

admin.site.register(User)
admin.site.register(Entity)
admin.site.register(Batch)
admin.site.register(LedgerEntry)
admin.site.register(BankStatementLine)
admin.site.register(ExceptionRecord)
admin.site.register(ExceptionComment)
admin.site.register(AuditLog)
admin.site.register(RoutingRule)
