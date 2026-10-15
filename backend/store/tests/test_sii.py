from unittest import mock

import requests
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from store.models import Product, Receipt, WebhookEvent

SII_SETTINGS = {
    'SII_API_URL': 'https://sii.example.test/document-sii',
    'PUBLIC_BASE_URL': 'https://backend.example.test',
    'SII_WEBHOOK_TOKEN': 'secret-token',
}


def make_receipt(**kwargs):
    return Receipt.objects.create(gross_total=4200, tax=630, net_total=3570, **kwargs)


@override_settings(**SII_SETTINGS)
@mock.patch('store.services.sii.requests.post')
class EmitReceiptTests(APITestCase):
    def emit(self, receipt):
        return self.client.post(reverse('receipt-emit', args=[receipt.id]))

    def test_creating_a_receipt_does_not_call_the_sii(self, post):
        product = Product.objects.create(name='Pan test', price=1500)
        self.client.post(reverse('receipt-list'), {'items': [{'product_id': product.id, 'quantity': 1}]}, format='json')
        post.assert_not_called()

    def test_emit_sends_callback_url_and_document_id(self, post):
        receipt = make_receipt()
        response = self.emit(receipt)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sii_status'], 'requested')
        self.assertIsNotNone(response.data['sii_requested_at'])
        post.assert_called_once_with(
            'https://sii.example.test/document-sii',
            json={
                'callbackUrl': 'https://backend.example.test/webhooks/sii/?token=secret-token',
                'documentId': receipt.id,
            },
            timeout=10,
        )

    def test_failed_request_marks_receipt_as_failed_and_can_be_retried(self, post):
        receipt = make_receipt()
        post.side_effect = requests.ConnectionError('boom')
        response = self.emit(receipt)
        self.assertEqual(response.data['sii_status'], 'failed')
        self.assertIn('boom', response.data['sii_error'])

        post.side_effect = None
        response = self.emit(receipt)
        self.assertEqual(response.data['sii_status'], 'requested')
        self.assertEqual(response.data['sii_error'], '')

    def test_cannot_emit_twice(self, post):
        for sii_status in ('requested', 'issued'):
            with self.subTest(sii_status=sii_status):
                response = self.emit(make_receipt(sii_status=sii_status))
                self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        post.assert_not_called()

    @override_settings(PUBLIC_BASE_URL='')
    def test_not_configured_does_not_spend_requests(self, post):
        receipt = make_receipt()
        self.assertEqual(self.emit(receipt).data['sii_status'], 'pending')
        post.assert_not_called()


@override_settings(**SII_SETTINGS)
class SiiWebhookTests(APITestCase):
    url = reverse('sii-webhook') + '?token=secret-token'

    def setUp(self):
        self.receipt = make_receipt(sii_status=Receipt.SiiStatus.REQUESTED)

    def payload(self, **overrides):
        return {
            'documentId': self.receipt.id,
            'status': 'issued',
            'siiCode': 'SII-123456',
            'pdfUrl': 'https://example.test/boleta.pdf',
            **overrides,
        }

    def test_issued_webhook_updates_receipt(self):
        response = self.client.post(self.url, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.receipt.refresh_from_db()
        self.assertEqual(self.receipt.sii_status, 'issued')
        self.assertEqual(self.receipt.sii_code, 'SII-123456')
        self.assertEqual(self.receipt.pdf_url, 'https://example.test/boleta.pdf')
        self.assertIsNotNone(self.receipt.sii_issued_at)
        self.assertTrue(WebhookEvent.objects.get().processed)

    def test_webhook_is_idempotent(self):
        self.client.post(self.url, self.payload(), format='json')
        self.receipt.refresh_from_db()
        issued_at = self.receipt.sii_issued_at
        self.client.post(self.url, self.payload(), format='json')
        self.receipt.refresh_from_db()
        self.assertEqual(self.receipt.sii_issued_at, issued_at)
        self.assertEqual(WebhookEvent.objects.count(), 2)

    def test_non_issued_status_marks_receipt_as_failed(self):
        self.client.post(self.url, self.payload(status='rejected'), format='json')
        self.receipt.refresh_from_db()
        self.assertEqual(self.receipt.sii_status, 'failed')
        self.assertIn('rejected', self.receipt.sii_error)

    def test_rejects_wrong_token(self):
        response = self.client.post(reverse('sii-webhook') + '?token=nope', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.receipt.refresh_from_db()
        self.assertEqual(self.receipt.sii_status, 'requested')

    def test_rejects_invalid_payload_and_unknown_document(self):
        self.assertEqual(
            self.client.post(self.url, {'status': 'issued'}, format='json').status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(self.url, self.payload(documentId=999999), format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(WebhookEvent.objects.filter(processed=False).count(), 2)
