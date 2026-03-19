from __future__ import annotations

from uuid import uuid4

from django.conf import settings

from .request_id import clear_request_id, set_request_id


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


class RequestIdMiddleware:
    """
    Attach a per-request UUID to thread-local storage for log correlation.
    """

    header_name = "X-Request-ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid4())
        request.request_id = request_id
        set_request_id(request_id)

        try:
            response = self.get_response(request)
        finally:
            clear_request_id()

        response.setdefault(self.header_name, request_id)
        return response
