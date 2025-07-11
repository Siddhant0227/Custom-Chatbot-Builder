"""
Django settings for chatbot_backend project.

Generated by 'django-admin startproject' using Django 5.2.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

from pathlib import Path
from dotenv import load_dotenv
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env')) # Loads environment variables from .env file

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-muaftkoj_gzw=q(^%*e%2t+#l(*ha(__1286s0k&q19=qnt8#w'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',        # Django REST Framework
    'chatbotapi',            # Your application
    'corsheaders',           # For handling Cross-Origin Resource Sharing
    'rest_framework.authtoken', # <--- NEW: Enable Django REST Framework's Token Authentication
]


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Keep this high
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', # Keep this for forms/template-based CSRF if any, but less critical for token auth
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'chatbot_backend.urls'

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

WSGI_APPLICATION = 'chatbot_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'customchatbotdb',  # Name of the database you created
        'USER': 'siddhant',      # User you created
        'PASSWORD': '*#227#0226',  # Password for the user
        'HOST': 'localhost',          # Or the IP address if PostgreSQL is on a different server
        'PORT': '5432',               # Default PostgreSQL port
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS Settings ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True # Still important for preflight and if any cookies are sent (e.g. session for browsable API)

# --- CSRF Trusted Origins for Django 4.0+ ---
# With Token Auth, these are less critical for API authentication but still needed for the browsable API
# or any form submissions.
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# --- Session & CSRF Cookie Settings (less critical for pure token auth, but keep for browsable API) ---
SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False

# --- Django REST Framework (DRF) Settings ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication', # <--- NEW: Primary authentication scheme
        'rest_framework.authentication.SessionAuthentication', # Keep for browsable API
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', # Only authenticated users can access by default
    ]
}