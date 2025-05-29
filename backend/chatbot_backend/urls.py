# chatbot_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView # Import RedirectView
from chatbotapi.views import WelcomeView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chatbotapi.urls')), # This line remains unchanged
    path('', WelcomeView.as_view(), name='welcome'),
]