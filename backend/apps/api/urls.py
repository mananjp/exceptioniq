from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import EntityViewSet, RoutingRuleViewSet, ExceptionViewSet, ReconciliationViewSet, UserViewSet, health

router = DefaultRouter()
router.register('entities', EntityViewSet, basename='entities')
router.register('routing/rules', RoutingRuleViewSet, basename='routing-rules')
router.register('exceptions', ExceptionViewSet, basename='exceptions')
router.register('recon', ReconciliationViewSet, basename='recon')
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('health/', health),
    path('', include(router.urls)),
]
