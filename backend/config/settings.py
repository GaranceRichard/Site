# backend/config/settings.py
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

# -------------------------------------------------
# Base
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DJANGO_ENV = os.getenv("DJANGO_ENV", "development").strip().lower()
IS_PROD = DJANGO_ENV == "production"
IS_TEST = "test" in sys.argv

logger = logging.getLogger(__name__)


def _csv(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [x.strip() for x in raw.split(",") if x.strip()]


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "y", "on")


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)).strip())
    except ValueError:
        return default


# -------------------------------------------------
# Sécurité de base
# -------------------------------------------------
ALLOW_INSECURE_SECRET_KEY = _bool("DJANGO_ALLOW_INSECURE_SECRET_KEY", default=False)

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "").strip()
if not SECRET_KEY:
    if IS_PROD or not (IS_TEST or ALLOW_INSECURE_SECRET_KEY):
        raise RuntimeError(
            "DJANGO_SECRET_KEY manquant. En dev uniquement, "
            "vous pouvez deroger avec DJANGO_ALLOW_INSECURE_SECRET_KEY=True."
        )
    SECRET_KEY = "dev-insecure-secret-key"

DEBUG = _bool("DJANGO_DEBUG", default=not IS_PROD)
if IS_PROD and DEBUG:
    raise RuntimeError("DJANGO_DEBUG ne peut pas être True en production.")


# -------------------------------------------------
# Hosts / CORS / CSRF
# -------------------------------------------------
ALLOWED_HOSTS = _csv("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    if IS_PROD:
        raise RuntimeError("DJANGO_ALLOWED_HOSTS requis en production.")
    ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

DEV_LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOWED_ORIGINS = _csv("DJANGO_CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = _csv("DJANGO_CSRF_TRUSTED_ORIGINS")

if not IS_PROD:
    if not CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS = DEV_LOCAL_ORIGINS.copy()
    if not CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS = DEV_LOCAL_ORIGINS.copy()


def _validate_origins(label: str, origins: list[str], require_https: bool) -> None:
    if not origins:
        if IS_PROD:
            raise RuntimeError(f"{label} vide en production.")
        return
    for o in origins:
        if o == "*" or o.endswith("://*"):
            raise RuntimeError(f"{label} ne doit pas contenir de wildcard. Valeur: {o}")
        if not (o.startswith("http://") or o.startswith("https://")):
            raise RuntimeError(f"{label} invalide: {o} (attendu http:// ou https://)")
        if require_https and not o.startswith("https://"):
            raise RuntimeError(f"{label} doit être en HTTPS en production: {o}")


def _validate_dev_local_origins(label: str, origins: list[str]) -> None:
    """
    En developpement, on restreint par defaut aux origines locales.
    Un override explicite est possible via DJANGO_ALLOW_DEV_NONLOCAL_ORIGINS.
    """
    if IS_PROD or _bool("DJANGO_ALLOW_DEV_NONLOCAL_ORIGINS", default=False):
        return

    local_hosts = {"localhost", "127.0.0.1", "::1"}
    for o in origins:
        host = urlparse(o).hostname or ""
        if host not in local_hosts:
            raise RuntimeError(
                f"{label} contient une origine non locale en dev: {o}. "
                "Utiliser DJANGO_ALLOW_DEV_NONLOCAL_ORIGINS=True pour deroger."
            )


_validate_origins("DJANGO_CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS, require_https=IS_PROD)
_validate_origins("DJANGO_CSRF_TRUSTED_ORIGINS", CSRF_TRUSTED_ORIGINS, require_https=IS_PROD)
_validate_dev_local_origins("DJANGO_CORS_ALLOWED_ORIGINS", CORS_ALLOWED_ORIGINS)
_validate_dev_local_origins("DJANGO_CSRF_TRUSTED_ORIGINS", CSRF_TRUSTED_ORIGINS)

CORS_URLS_REGEX = r"^/api/.*$"
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "origin",
    "x-requested-with",
]


# -------------------------------------------------
# Applications
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
WSGI_APPLICATION = "config.wsgi.application"

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


# -------------------------------------------------
# Base de données
# -------------------------------------------------
def _sqlite_name_from_url(u) -> str:
    # sqlite:///relative.db  -> u.path="/relative.db"  => BASE_DIR/relative.db
    # sqlite:////abs/path.db -> u.path="//abs/path.db" => /abs/path.db
    p = u.path or ""
    if p.startswith("//"):  # absolu
        return "/" + p.lstrip("/")
    # relatif
    return str(BASE_DIR / p.lstrip("/"))


def _db_from_database_url(db_url: str) -> dict:
    u = urlparse(db_url)
    scheme = (u.scheme or "").lower()

    if scheme in ("postgres", "postgresql"):
        name = (u.path or "").lstrip("/")
        if not (u.hostname and name and u.username):
            raise RuntimeError(
                f"DATABASE_URL PostgreSQL incomplet: {db_url}\n"
                "Requis: postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
            )
        cfg = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": name,
            "USER": u.username,
            "PASSWORD": u.password or "",
            "HOST": u.hostname,
            "PORT": u.port or 5432,
            "CONN_MAX_AGE": _int("DJANGO_DB_CONN_MAX_AGE", 600),
        }
        if _bool("DJANGO_DB_SSL_REQUIRE", default=IS_PROD):
            cfg.setdefault("OPTIONS", {})["sslmode"] = "require"
        return cfg

    if scheme == "sqlite":
        return {"ENGINE": "django.db.backends.sqlite3", "NAME": _sqlite_name_from_url(u)}

    raise RuntimeError(
        f"DATABASE_URL non supporté: {db_url}\n"
        "Formats acceptés: postgresql://... ou sqlite:///"
    )


if IS_PROD:
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL requis en production.")

    try:
        import dj_database_url  # type: ignore
    except ImportError:
        logger.info("dj-database-url non installé, utilisation du parser minimaliste")
        DATABASES = {"default": _db_from_database_url(DATABASE_URL)}
    else:
        DATABASES = {
            "default": dj_database_url.parse(
                DATABASE_URL,
                conn_max_age=_int("DJANGO_DB_CONN_MAX_AGE", 600),
                ssl_require=_bool("DJANGO_DB_SSL_REQUIRE", default=True),
            )
        }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}


# -------------------------------------------------
# Cache (utile pour throttling)
# -------------------------------------------------
def _locmem_cache() -> dict:
    return {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}


if IS_TEST:
    CACHES = _locmem_cache()
else:
    REDIS_URL = os.getenv("REDIS_URL", "").strip()
    ALLOW_LOC_MEM_CACHE_IN_PROD = _bool("DJANGO_ALLOW_LOC_MEM_CACHE_IN_PROD", default=False)

    if IS_PROD and not REDIS_URL and not ALLOW_LOC_MEM_CACHE_IN_PROD:
        raise RuntimeError(
            "REDIS_URL requis en production pour un throttling global coherent. "
            "Sinon, deroger explicitement via DJANGO_ALLOW_LOC_MEM_CACHE_IN_PROD=True."
        )

    if REDIS_URL:
        try:
            import django_redis  # noqa: F401
        except ImportError:
            if IS_PROD and not ALLOW_LOC_MEM_CACHE_IN_PROD:
                raise RuntimeError(
                    "django-redis requis quand REDIS_URL est defini en production."
                )
            logger.warning("django-redis non installé, LocMemCache en prod (non recommandé)")
            CACHES = _locmem_cache()
        else:
            CACHES = {
                "default": {
                    "BACKEND": "django_redis.cache.RedisCache",
                    "LOCATION": REDIS_URL,
                    "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
                }
            }
    else:
        CACHES = _locmem_cache()


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
# Internationalisation
# -------------------------------------------------
LANGUAGE_CODE = os.getenv("DJANGO_LANGUAGE_CODE", "fr")
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True


# -------------------------------------------------
# Static files
# -------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

if IS_PROD:
    try:
        import whitenoise  # noqa: F401
    except ImportError:
        pass
    else:
        if "whitenoise.middleware.WhiteNoiseMiddleware" not in MIDDLEWARE:
            MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
        STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# -------------------------------------------------
# DRF : throttling + auth
# -------------------------------------------------
GLOBAL_ANON_THROTTLE_RATE = os.getenv("DJANGO_GLOBAL_ANON_THROTTLE_RATE", "120/min")
GLOBAL_USER_THROTTLE_RATE = os.getenv("DJANGO_GLOBAL_USER_THROTTLE_RATE", "600/min")

CONTACT_THROTTLE_RATE = os.getenv("DJANGO_CONTACT_THROTTLE_RATE", "10/min")
HEALTH_THROTTLE_RATE = os.getenv("DJANGO_HEALTH_THROTTLE_RATE", "60/min")
ANON_THROTTLE_RATE = os.getenv("DJANGO_ANON_THROTTLE_RATE", "600/hour")
USER_THROTTLE_RATE = os.getenv("DJANGO_USER_THROTTLE_RATE", "2400/hour")

# JWT : off par défaut, on l’active quand il y a un vrai besoin
ENABLE_JWT = _bool("DJANGO_ENABLE_JWT", default=False)
auth_classes: tuple[str, ...] = ()
if ENABLE_JWT:
    try:
        import rest_framework_simplejwt  # noqa: F401
    except ImportError:
        raise RuntimeError("DJANGO_ENABLE_JWT=True mais djangorestframework-simplejwt non installé.")
    auth_classes = ("rest_framework_simplejwt.authentication.JWTAuthentication",)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": auth_classes,
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_THROTTLE_CLASSES": (
        "config.throttling.GlobalAnonRateThrottle",
        "config.throttling.GlobalUserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "global_anon": GLOBAL_ANON_THROTTLE_RATE,
        "global_user": GLOBAL_USER_THROTTLE_RATE,
        "anon": ANON_THROTTLE_RATE,
        "user": USER_THROTTLE_RATE,
        "contact": CONTACT_THROTTLE_RATE,
        "health": HEALTH_THROTTLE_RATE,
    },
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        *(() if IS_PROD else ("rest_framework.renderers.BrowsableAPIRenderer",)),
    ),
}


# -------------------------------------------------
# Hardening production
# -------------------------------------------------
if IS_PROD:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = _bool("DJANGO_SECURE_SSL_REDIRECT", default=True)

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

    SESSION_COOKIE_SAMESITE = os.getenv("DJANGO_SESSION_COOKIE_SAMESITE", "Lax")
    CSRF_COOKIE_SAMESITE = os.getenv("DJANGO_CSRF_COOKIE_SAMESITE", "Lax")

    SECURE_HSTS_SECONDS = _int("DJANGO_SECURE_HSTS_SECONDS", 31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = _bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", default=False)
    SECURE_HSTS_PRELOAD = _bool("DJANGO_SECURE_HSTS_PRELOAD", default=False)

    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "same-origin"


# -------------------------------------------------
# Logging
# -------------------------------------------------
LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO" if IS_PROD else "DEBUG").upper()

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"default": {"format": "{levelname} {asctime} {name} {message}", "style": "{"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "default"}},
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}


# -------------------------------------------------
# Monitoring (Sentry)
# -------------------------------------------------
SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
if IS_PROD and SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
    except ImportError:
        logger.warning("sentry-sdk non installé, monitoring désactivé")
    else:
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            environment=DJANGO_ENV,
            integrations=[DjangoIntegration()],
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            send_default_pii=False,
        )


# -------------------------------------------------
# Startup banner
# -------------------------------------------------
if not IS_TEST and _bool("DJANGO_STARTUP_BANNER", default=not IS_PROD):
    db_engine = DATABASES["default"]["ENGINE"].split(".")[-1]
    cache_backend = CACHES["default"]["BACKEND"].split(".")[-1]
    logger.info(
        "Django %s | DEBUG=%s | DB=%s | Cache=%s | JWT=%s",
        DJANGO_ENV.upper(),
        DEBUG,
        db_engine,
        cache_backend,
        "✓" if auth_classes else "✗",
    )
