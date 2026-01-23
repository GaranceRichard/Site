# backend/config/settings.py
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from corsheaders.defaults import default_headers

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# -------------------------------------------------
# Environnement
# -------------------------------------------------
DJANGO_ENV = os.getenv("DJANGO_ENV", "development").lower()  # development | production
IS_PROD = DJANGO_ENV == "production"


def _csv(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [x.strip() for x in raw.split(",") if x.strip()]


# -------------------------------------------------
# Sécurité
# -------------------------------------------------
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY manquant. Définissez-le dans backend/.env.")

DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
if IS_PROD:
    DEBUG = False

# Hosts / CORS / CSRF
ALLOWED_HOSTS = (
    _csv("DJANGO_ALLOWED_HOSTS")
    if (IS_PROD or os.getenv("DJANGO_ALLOWED_HOSTS"))
    else ["127.0.0.1", "localhost"]
)

CORS_ALLOWED_ORIGINS = _csv("DJANGO_CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = _csv("DJANGO_CSRF_TRUSTED_ORIGINS")


def _validate_origins(label: str, origins: list[str], require_https: bool = False) -> None:
    if not origins:
        raise RuntimeError(f"{label} est vide. Définissez des origines explicites.")
    for o in origins:
        if o == "*" or o.endswith("://*"):
            raise RuntimeError(f"{label} ne doit pas contenir de wildcard ('*').")
        if not (o.startswith("http://") or o.startswith("https://")):
            raise RuntimeError(f"{label} contient une origine invalide: {o} (attendu http(s)://...)")
        if require_https and not o.startswith("https://"):
            raise RuntimeError(f"{label} doit être en https en production: {o}")


# CORS strict
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_HEADERS = list(default_headers)

# Option pragmatique : CORS uniquement sur l’API
CORS_URLS_REGEX = r"^/api/.*$"

# Validation CORS/CSRF
if IS_PROD:
    _validate_origins("DJANGO_CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS, require_https=True)
    _validate_origins("DJANGO_CSRF_TRUSTED_ORIGINS", CSRF_TRUSTED_ORIGINS, require_https=True)
else:
    _validate_origins("DJANGO_CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS, require_https=False)
    _validate_origins("DJANGO_CSRF_TRUSTED_ORIGINS", CSRF_TRUSTED_ORIGINS, require_https=False)

# -------------------------------------------------
# Cache (DRF throttling en dépend)
# -------------------------------------------------
# Variante recommandée : activer LocMemCache pendant les tests
if "test" in sys.argv:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
else:
    # En dev/prod, Django a déjà un cache "dummy" par défaut.
    # Vous pouvez laisser ainsi ou définir un cache explicite (Redis recommandé en prod).
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

HEALTH_THROTTLE_RATE = os.getenv("DJANGO_HEALTH_THROTTLE_RATE", "60/min")

# -------------------------------------------------
# Application definition
# -------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "contact",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"

# -------------------------------------------------
# Database
# -------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# -------------------------------------------------
# Password validation
# -------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -------------------------------------------------
# Internationalization
# -------------------------------------------------
LANGUAGE_CODE = "fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# -------------------------------------------------
# Static files
# -------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# -------------------------------------------------
# DRF (auth + rate limiting global + scopes)
# -------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    # Public par défaut (contact), les endpoints backoffice sont protégés au niveau des views
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),

    # ✅ Rate limiting global + scopes
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        # Global
        "anon": "200/day",
        "user": "2000/day",

        # Scope contact
        "contact": "10/min",
    },
}

# -------------------------------------------------
# Hardening prod (n’affecte pas le dev)
# -------------------------------------------------
if IS_PROD:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "True").lower() == "true"

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "3600"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = (
        os.getenv("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", "False").lower() == "true"
    )
    SECURE_HSTS_PRELOAD = os.getenv("DJANGO_SECURE_HSTS_PRELOAD", "False").lower() == "true"

    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "same-origin"
