from django.conf import settings
from rest_framework.permissions import BasePermission


class IsAuthenticatedWhenEnabled(BasePermission):
    """Requires a Clerk session only when AUTH_ENABLED is on (read per request)."""

    def has_permission(self, request, view):
        if not settings.AUTH_ENABLED:
            return True
        return bool(request.user and request.user.is_authenticated)
