import logging
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.urls import reverse
from django.utils import timezone

from ..models import Receipt

logger = logging.getLogger(__name__)

Status = Receipt.SiiStatus


def build_callback_url() -> str:
    url = f'{settings.PUBLIC_BASE_URL}{reverse("sii-webhook")}'
    if settings.SII_WEBHOOK_TOKEN:
        url += '?' + urlencode({'token': settings.SII_WEBHOOK_TOKEN})
    return url


def sii_is_configured() -> bool:
    return bool(settings.SII_API_URL and settings.PUBLIC_BASE_URL)


def request_sii_emission(receipt_id: int) -> None:
    """Ask the SII mock to issue the receipt; the result arrives later by webhook.

    The status is set to "requested" *before* the HTTP call, because the webhook can
    arrive before this request returns. On failure only a still-"requested" receipt is
    marked as failed, so a webhook that already arrived is never overwritten.
    """
    if not sii_is_configured():
        logger.warning(
            'SII integration not configured (SII_API_URL / PUBLIC_BASE_URL); receipt %s stays pending', receipt_id
        )
        return

    Receipt.objects.filter(pk=receipt_id).update(
        sii_status=Status.REQUESTED, sii_requested_at=timezone.now(), sii_error=''
    )
    body = {'callbackUrl': build_callback_url(), 'documentId': receipt_id}
    try:
        response = requests.post(settings.SII_API_URL, json=body, timeout=settings.SII_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException as exc:
        logger.exception('SII emission request failed for receipt %s', receipt_id)
        Receipt.objects.filter(pk=receipt_id, sii_status=Status.REQUESTED).update(
            sii_status=Status.FAILED, sii_error=f'No se pudo solicitar la emisión: {exc}'[:1000]
        )
        return
    logger.info('SII emission requested for receipt %s (HTTP %s)', receipt_id, response.status_code)
