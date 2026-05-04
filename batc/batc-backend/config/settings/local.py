from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
