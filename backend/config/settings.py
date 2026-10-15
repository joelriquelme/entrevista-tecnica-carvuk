"""
Django settings for Carrito Feliz.

Every environment-specific value is read from environment variables
(loaded from backend/.env in local development). See .env.example.
"""

import os
import sys
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')


def env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in ('1', 'true', 'yes', 'on')


def env_list(name, default=''):
    return [item.strip() for item in os.environ.get(name, default).split(',') if item.strip()]


SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-local-dev-only')

DEBUG = env_bool('DEBUG', False)

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', 'localhost,127.0.0.1')
if DEBUG:
    # Allow local tunnels (ngrok / cloudflared) used to receive the SII webhook.
    ALLOWED_HOSTS += ['.ngrok-free.app', '.ngrok.app', '.trycloudflare.com']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'store',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database: Supabase Postgres through DATABASE_URL, SQLite as a local fallback.

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=60,
        conn_health_checks=True,
    )
}

# Tests always run on SQLite (in memory) so they never touch Supabase.
TESTING = sys.argv[1:2] == ['test']
if TESTING:
    DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
TEST_RUNNER = 'config.test_runner.IsolatedTestRunner'


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization

LANGUAGE_CODE = 'es-cl'

TIME_ZONE = 'America/Santiago'

USE_I18N = True

USE_TZ = True


# Static files

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Behind a TLS-terminating proxy (Render) in production.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS')


# Authentication (Clerk)

AUTH_ENABLED = env_bool('AUTH_ENABLED', False)
CLERK_PUBLISHABLE_KEY = os.environ.get('CLERK_PUBLISHABLE_KEY', '')
CLERK_JWKS_URL = os.environ.get('CLERK_JWKS_URL', '')


# Django REST Framework

REST_FRAMEWORK = {
    # Clerk auth is always wired; AUTH_ENABLED switches it on/off per request.
    'DEFAULT_AUTHENTICATION_CLASSES': ['store.authentication.ClerkJWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['store.permissions.IsAuthenticatedWhenEnabled'],
    'UNAUTHENTICATED_USER': None,
    'DEFAULT_RENDERER_CLASSES': (
        ['rest_framework.renderers.JSONRenderer', 'rest_framework.renderers.BrowsableAPIRenderer']
        if DEBUG else ['rest_framework.renderers.JSONRenderer']
    ),
}


# CORS: the React frontend origins

CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')


# SII mock integration (Pipedream) and webhook

SII_API_URL = os.environ.get('SII_API_URL', '')
SII_TIMEOUT_SECONDS = 10
# Public URL where this backend is reachable (tunnel or production). Used to build the callbackUrl.
PUBLIC_BASE_URL = os.environ.get('PUBLIC_BASE_URL', '').rstrip('/')
# Shared secret sent as a query param in the callbackUrl and checked by the webhook.
SII_WEBHOOK_TOKEN = os.environ.get('SII_WEBHOOK_TOKEN', '')


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'loggers': {'store': {'handlers': ['console'], 'level': 'INFO'}},
}
