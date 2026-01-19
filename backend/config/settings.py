import os
from dotenv import load_dotenv
from pathlib import Path

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
# Sécurité minimale (dev vs prod)
# -------------------------------------------------
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "")

if IS_PROD:
    if not SECRET_KEY or SECRET_KEY in ("unsafe-default", "dev-secret-key"):
        raise RuntimeError("DJANGO_SECRET_KEY manquant ou trop faible pour la production.")
    DEBUG = False
else:
    # En dev, on accepte une clé faible si besoin (mais vous pouvez aussi l’exiger)
    if not SECRET_KEY:
        SECRET_KEY = "dev-secret-key"
    DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = _csv("DJANGO_ALLOWED_HOSTS") if (IS_PROD or os.getenv("DJANGO_ALLOWED_HOSTS")) else ["127.0.0.1", "localhost"]
CORS_ALLOWED_ORIGINS = _csv("DJANGO_CORS_ALLOWED_ORIGINS")

# Très utile dès que vous avez un domaine en HTTPS (prod)
CSRF_TRUSTED_ORIGINS = _csv("DJANGO_CSRF_TRUSTED_ORIGINS")

# -------------------------------------------------
# Hardening prod (n’affecte pas le dev)
# -------------------------------------------------
if IS_PROD:
    # Si vous êtes derrière un proxy / load balancer (Nginx, Vercel, etc.)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Redirection HTTPS
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "True").lower() == "true"

    # Cookies sécurisés
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HSTS (commencez bas, puis montez)
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "3600"))  # 1h
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", "False").lower() == "true"
    SECURE_HSTS_PRELOAD = os.getenv("DJANGO_SECURE_HSTS_PRELOAD", "False").lower() == "true"

    # Headers
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "same-origin"
