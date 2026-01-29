from __future__ import annotations

from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Add security headers missing from Django's built-in SecurityMiddleware.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        csp = getattr(settings, "SECURITY_CSP", "")
        if csp and "Content-Security-Policy" not in response:
            response["Content-Security-Policy"] = csp

        permissions = getattr(settings, "SECURITY_PERMISSIONS_POLICY", "")
        if permissions and "Permissions-Policy" not in response:
            response["Permissions-Policy"] = permissions

        return response
