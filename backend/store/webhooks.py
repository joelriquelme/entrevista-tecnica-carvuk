import logging
import secrets

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Receipt, WebhookEvent
from .serializers import SiiWebhookSerializer

logger = logging.getLogger(__name__)


class SiiWebhookView(APIView):
    """Receives the asynchronous result of the SII emission.

    Public endpoint (the SII mock can't authenticate with Clerk); it is protected
    by a shared token sent as a query param in the callbackUrl.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {'raw': request.data}
        event = WebhookEvent.objects.create(payload=payload)

        expected = settings.SII_WEBHOOK_TOKEN
        if expected and not secrets.compare_digest(request.query_params.get('token', ''), expected):
            return self._reject(event, 'Token inválido.', status.HTTP_403_FORBIDDEN)

        serializer = SiiWebhookSerializer(data=request.data)
        if not serializer.is_valid():
            return self._reject(event, str(serializer.errors), status.HTTP_400_BAD_REQUEST, serializer.errors)
        data = serializer.validated_data

        receipt = Receipt.objects.filter(pk=data['documentId']).first()
        if receipt is None:
            return self._reject(event, f'Documento {data["documentId"]} no existe.', status.HTTP_404_NOT_FOUND)

        if data['status'].lower() == 'issued':
            receipt.sii_status = Receipt.SiiStatus.ISSUED
            receipt.sii_code = data['siiCode']
            receipt.pdf_url = data['pdfUrl']
            receipt.sii_error = ''
            receipt.sii_issued_at = receipt.sii_issued_at or timezone.now()
        else:
            receipt.sii_status = Receipt.SiiStatus.FAILED
            receipt.sii_error = f'El SII respondió con estado "{data["status"]}".'
        receipt.save(update_fields=['sii_status', 'sii_code', 'pdf_url', 'sii_error', 'sii_issued_at'])

        event.processed = True
        event.save(update_fields=['processed'])
        logger.info('SII webhook processed for receipt %s: %s', receipt.pk, data['status'])
        return Response({'received': True})

    def _reject(self, event, error, code, body=None):
        event.error = error
        event.save(update_fields=['error'])
        logger.warning('SII webhook rejected: %s', error)
        return Response(body or {'detail': error}, status=code)
