from django.contrib import admin
from django.urls import include, path

from store.webhooks import SiiWebhookView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('webhooks/sii/', SiiWebhookView.as_view(), name='sii-webhook'),
]
