from django.conf import settings
from rest_framework.permissions import BasePermission


class IsAuthenticatedWhenEnabled(BasePermission):
    """AUTH_ENABLED is read per request so it can be toggled without reloading DRF settings."""

    def has_permission(self, request, view):
        if not settings.AUTH_ENABLED:
            return True
        return bool(request.user and request.user.is_authenticated)
