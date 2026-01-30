from pathlib import Path
import os
import sys
import subprocess

from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
class SecurityBootTests(APITestCase):
    def test_django_refuses_to_start_without_secret_key(self):
        """
        Smoke test A :
        settings.py doit refuser de démarrer si DJANGO_SECRET_KEY est vide.
        """
        backend_dir = Path(__file__).resolve().parents[2]  # .../backend

        code = (
            "import os\n"
            "os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')\n"
            "import django\n"
            "django.setup()\n"
            "print('BOOT_OK')\n"
        )

        env = os.environ.copy()
        env["DJANGO_SECRET_KEY"] = ""
        env["DJANGO_ENV"] = "production"
        env["DJANGO_DEBUG"] = "False"

        p = subprocess.run(
            [sys.executable, "-c", code],
            cwd=str(backend_dir),
            env=env,
            capture_output=True,
            text=True,
        )

        self.assertNotEqual(p.returncode, 0)
        combined = (p.stdout or "") + "\n" + (p.stderr or "")
        self.assertIn("DJANGO_SECRET_KEY manquant", combined)

    def test_django_allows_insecure_origins_in_prod_when_explicit(self):
        """
        Smoke test A2 :
        En production, on peut autoriser des origins HTTP uniquement si
        DJANGO_ALLOW_INSECURE_ORIGINS_IN_PROD=True.
        """
        backend_dir = Path(__file__).resolve().parents[2]  # .../backend

        code = (
            "import os\n"
            "os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')\n"
            "import django\n"
            "django.setup()\n"
            "print('BOOT_OK')\n"
        )

        env = os.environ.copy()
        env["DJANGO_SECRET_KEY"] = "ci-secret-key"
        env["DJANGO_ENV"] = "production"
        env["DJANGO_DEBUG"] = "False"
        env["DJANGO_ALLOWED_HOSTS"] = "example.com"
        env["DJANGO_ALLOW_INSECURE_ORIGINS_IN_PROD"] = "True"
        env["DJANGO_CORS_ALLOWED_ORIGINS"] = "http://localhost:3000"
        env["DJANGO_CSRF_TRUSTED_ORIGINS"] = "http://localhost:3000"
        env["DATABASE_URL"] = "sqlite:///test.db"
        env["DJANGO_ALLOW_LOC_MEM_CACHE_IN_PROD"] = "True"

        p = subprocess.run(
            [sys.executable, "-c", code],
            cwd=str(backend_dir),
            env=env,
            capture_output=True,
            text=True,
        )

        self.assertEqual(p.returncode, 0)
        self.assertIn("BOOT_OK", p.stdout or "")
class SecurityCorsTests(APITestCase):
    def test_cors_preflight_on_jwt_token_endpoint(self):
        """
        Smoke test B :
        Préflight CORS (OPTIONS) sur /api/auth/token/ doit renvoyer
        Access-Control-Allow-Origin pour une origine autorisée.
        """
        origin = "http://localhost:3000"
        res = self.client.options(
            "/api/auth/token/",
            HTTP_ORIGIN=origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type",
        )

        # Selon versions/config, OPTIONS peut répondre 200 ou 204
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

        allow_origin = res.headers.get("Access-Control-Allow-Origin") or res.get(
            "Access-Control-Allow-Origin"
        )
        self.assertEqual(allow_origin, origin)
class SecurityHeadersTests(APITestCase):
    @override_settings(
        SECURITY_CSP="default-src 'self'",
        SECURITY_PERMISSIONS_POLICY="geolocation=()",
        SECURE_HSTS_SECONDS=31536000,
        SECURE_HSTS_INCLUDE_SUBDOMAINS=False,
        SECURE_HSTS_PRELOAD=False,
        SECURE_CONTENT_TYPE_NOSNIFF=True,
        X_FRAME_OPTIONS="DENY",
        SECURE_REFERRER_POLICY="same-origin",
    )
    def test_security_headers_present(self):
        res = self.client.get("/api/health/live", secure=True)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Security-Policy"], "default-src 'self'")
        self.assertEqual(res["Permissions-Policy"], "geolocation=()")
        self.assertIn("max-age=31536000", res["Strict-Transport-Security"])
        self.assertEqual(res["X-Content-Type-Options"], "nosniff")
        self.assertEqual(res["X-Frame-Options"], "DENY")
        self.assertEqual(res["Referrer-Policy"], "same-origin")
