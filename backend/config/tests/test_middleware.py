from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, override_settings

from config.middleware import SecurityHeadersMiddleware


class SecurityHeadersMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def get_response(self, request):
        return HttpResponse("ok")

    @override_settings(
        SECURITY_CSP="default-src 'self'",
        SECURITY_PERMISSIONS_POLICY="geolocation=()",
    )
    def test_adds_missing_security_headers(self):
        middleware = SecurityHeadersMiddleware(self.get_response)
        response = middleware(self.factory.get("/"))

        self.assertEqual(response["Content-Security-Policy"], "default-src 'self'")
        self.assertEqual(response["Permissions-Policy"], "geolocation=()")

    @override_settings(
        SECURITY_CSP="default-src 'self'",
        SECURITY_PERMISSIONS_POLICY="geolocation=()",
    )
    def test_does_not_override_existing_headers(self):
        def existing_headers_response(_request):
            resp = HttpResponse("ok")
            resp["Content-Security-Policy"] = "default-src 'none'"
            resp["Permissions-Policy"] = "camera=()"
            return resp

        middleware = SecurityHeadersMiddleware(existing_headers_response)
        response = middleware(self.factory.get("/"))

        self.assertEqual(response["Content-Security-Policy"], "default-src 'none'")
        self.assertEqual(response["Permissions-Policy"], "camera=()")
