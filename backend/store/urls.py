from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('products', views.ProductViewSet)
router.register('receipts', views.ReceiptViewSet)

urlpatterns = [
    path('tax/', views.tax_info, name='tax-info'),
    path('', include(router.urls)),
]
