import base64
import logging
from dataclasses import dataclass, field
from functools import lru_cache

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)


@dataclass
class ClerkUser:
    """Minimal user built from a verified Clerk session token (no local user table)."""

    id: str
    claims: dict = field(default_factory=dict)
    is_authenticated: bool = True


def frontend_api_from_publishable_key(key: str) -> str:
    """pk_test_<base64("<frontend-api-host>$")> -> https://<frontend-api-host>"""
    encoded = key.split('_', 2)[-1]
    encoded += '=' * (-len(encoded) % 4)
    host = base64.b64decode(encoded).decode().rstrip('$')
    return f'https://{host}'


@lru_cache(maxsize=1)
def get_jwks_client() -> jwt.PyJWKClient:
    url = settings.CLERK_JWKS_URL
    if not url:
        if not settings.CLERK_PUBLISHABLE_KEY:
            raise exceptions.AuthenticationFailed('Clerk no está configurado en el servidor.')
        url = f'{frontend_api_from_publishable_key(settings.CLERK_PUBLISHABLE_KEY)}/.well-known/jwks.json'
    return jwt.PyJWKClient(url, cache_keys=True)


class ClerkJWTAuthentication(authentication.BaseAuthentication):
    """Verifies the Clerk session JWT sent as `Authorization: Bearer <token>`."""

    keyword = 'Bearer'

    def authenticate(self, request):
        if not settings.AUTH_ENABLED:
            return None
        header = authentication.get_authorization_header(request).decode()
        if not header.startswith(f'{self.keyword} '):
            return None
        token = header[len(self.keyword) + 1:].strip()
        try:
            signing_key = get_jwks_client().get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=['RS256'],
                leeway=10,
                options={'require': ['exp', 'iat', 'sub']},
            )
        except (jwt.PyJWTError, ValueError) as exc:
            logger.info('Rejected Clerk token: %s', exc)
            raise exceptions.AuthenticationFailed('Sesión inválida o expirada. Vuelve a iniciar sesión.')

        # Only accept tokens minted for our own frontend origins.
        azp = claims.get('azp')
        if azp and azp not in settings.CORS_ALLOWED_ORIGINS:
            raise exceptions.AuthenticationFailed('Origen del token no autorizado.')

        return ClerkUser(id=claims['sub'], claims=claims), token

    def authenticate_header(self, request):
        return self.keyword
