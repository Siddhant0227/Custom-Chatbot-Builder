# chatbot_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from chatbotapi.views import WelcomeView 

urlpatterns = [
    path('admin/', admin.site.urls), # Django Admin panel

    path('api/', include('chatbotapi.urls')),

    path('', WelcomeView.as_view(), name='welcome_root'),

]