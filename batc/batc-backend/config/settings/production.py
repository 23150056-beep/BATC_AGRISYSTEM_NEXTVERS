from .base import *  # noqa

DEBUG = False

# Render (and most PaaS) terminates TLS at the load balancer and forwards
# plain HTTP internally.  Setting SECURE_SSL_REDIRECT=True here would cause
# an infinite redirect loop.  Instead, trust the X-Forwarded-Proto header
# that Render injects so Django knows the original request was HTTPS.
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"

MIDDLEWARE = ["whitenoise.middleware.WhiteNoiseMiddleware"] + MIDDLEWARE  # noqa

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
