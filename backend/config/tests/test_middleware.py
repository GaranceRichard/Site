from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, override_settings

from config.middleware import SecurityHeadersMiddleware
from config.middleware import RequestIdMiddleware
from config.request_id import clear_request_id, get_request_id


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

    @override_settings(SECURITY_CSP="", SECURITY_PERMISSIONS_POLICY="")
    def test_skips_security_headers_when_settings_are_empty(self):
        middleware = SecurityHeadersMiddleware(self.get_response)
        response = middleware(self.factory.get("/"))

        self.assertNotIn("Content-Security-Policy", response)
        self.assertNotIn("Permissions-Policy", response)

    @override_settings(
        SECURITY_CSP="default-src 'self'",
        SECURITY_PERMISSIONS_POLICY="geolocation=()",
    )
    def test_adds_only_missing_header_when_other_is_already_present(self):
        def partially_defined_response(_request):
            resp = HttpResponse("ok")
            resp["Permissions-Policy"] = "camera=()"
            return resp

        middleware = SecurityHeadersMiddleware(partially_defined_response)
        response = middleware(self.factory.get("/"))

        self.assertEqual(response["Content-Security-Policy"], "default-src 'self'")
        self.assertEqual(response["Permissions-Policy"], "camera=()")


class RequestIdMiddlewareTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def tearDown(self):
        clear_request_id()

    def test_sets_request_id_on_request_and_response_header(self):
        captured = {}

        def get_response(request):
            captured["request_id"] = request.request_id
            captured["thread_local_request_id"] = get_request_id()
            return HttpResponse("ok")

        middleware = RequestIdMiddleware(get_response)
        response = middleware(self.factory.get("/"))

        self.assertEqual(response["X-Request-ID"], captured["request_id"])
        self.assertEqual(captured["thread_local_request_id"], captured["request_id"])

    def test_clears_request_id_after_response(self):
        middleware = RequestIdMiddleware(lambda request: HttpResponse("ok"))

        middleware(self.factory.get("/"))

        self.assertIsNone(get_request_id())

    def test_preserves_existing_response_request_id_header(self):
        def get_response(_request):
            response = HttpResponse("ok")
            response["X-Request-ID"] = "upstream-id"
            return response

        middleware = RequestIdMiddleware(get_response)
        response = middleware(self.factory.get("/"))

        self.assertEqual(response["X-Request-ID"], "upstream-id")

    def test_clear_request_id_is_safe_when_no_request_id_exists(self):
        clear_request_id()

        self.assertIsNone(get_request_id())
