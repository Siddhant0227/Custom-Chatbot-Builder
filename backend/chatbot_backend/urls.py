
# chatbot_backend/urls.py

from django.contrib import admin
from django.urls import path, include
# WelcomeView imported here if you want a top-level welcome page for the entire Django project
from chatbotapi.views import WelcomeView # This is fine if you want WelcomeView at the root

urlpatterns = [
    path('admin/', admin.site.urls), # Django Admin panel

    # Include all URLs from your 'chatbotapi' app under the '/api/' prefix
    # So, paths like '/api/login/', '/api/chatbots/', etc., will work
    path('api/', include('chatbotapi.urls')),

    # Optional: A welcome page at the root of your Django project (e.g., http://127.0.0.1:8000/)
    path('', WelcomeView.as_view(), name='welcome_root'),
    # REMOVE THIS LINE:
    # path('save-chatbot/', views.save_chatbot, name='save-chatbot'),
]