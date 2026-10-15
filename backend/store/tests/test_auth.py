import base64
import time
from types import SimpleNamespace
from unittest import mock

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from store.authentication import frontend_api_from_publishable_key, get_jwks_client

AUTH_SETTINGS = {
    'AUTH_ENABLED': True,
    'CLERK_PUBLISHABLE_KEY': 'pk_test_' + base64.b64encode(b'example.clerk.accounts.dev$').decode(),
    'CORS_ALLOWED_ORIGINS': ['http://localhost:5173'],
}

PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def make_token(**claims):
    now = int(time.time())
    payload = {'sub': 'user_123', 'iat': now, 'exp': now + 60, 'azp': 'http://localhost:5173', **claims}
    return jwt.encode(payload, PRIVATE_KEY, algorithm='RS256')


@override_settings(**AUTH_SETTINGS)
class ClerkAuthenticationTests(APITestCase):
    def setUp(self):
        get_jwks_client.cache_clear()
        jwks = SimpleNamespace(get_signing_key_from_jwt=lambda token: SimpleNamespace(key=PRIVATE_KEY.public_key()))
        patcher = mock.patch('store.authentication.get_jwks_client', return_value=jwks)
        patcher.start()
        self.addCleanup(patcher.stop)

    def get(self, token=None):
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'} if token else {}
        return self.client.get(reverse('product-list'), **headers)

    def test_requires_a_token(self):
        response = self.get()
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response['WWW-Authenticate'], 'Bearer')

    def test_accepts_a_valid_clerk_token(self):
        self.assertEqual(self.get(make_token()).status_code, status.HTTP_200_OK)

    def test_rejects_expired_tampered_or_foreign_tokens(self):
        other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        tokens = {
            'expired': make_token(exp=int(time.time()) - 3600),
            'garbage': 'not-a-jwt',
            'wrong signature': jwt.encode({'sub': 'x', 'iat': 1, 'exp': 2**31}, other_key, algorithm='RS256'),
            'other origin': make_token(azp='https://evil.example'),
        }
        for name, token in tokens.items():
            with self.subTest(name):
                self.assertEqual(self.get(token).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_webhook_stays_public(self):
        response = self.client.post(reverse('sii-webhook'), {}, format='json')
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_frontend_api_is_derived_from_publishable_key(self):
        self.assertEqual(
            frontend_api_from_publishable_key(AUTH_SETTINGS['CLERK_PUBLISHABLE_KEY']),
            'https://example.clerk.accounts.dev',
        )
