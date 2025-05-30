# File: /Users/hrishitasandeeppatni/Documents/GitHub/Custom-Chatbot-Builder/backend/chatbotapi/urls.py

from django.urls import path
from .views import ChatbotConfigView, WelcomeView # <-- This import IS correct here!

urlpatterns = [
    path('chatbot/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot-detail'),
    path('save-chatbot/', ChatbotConfigView.as_view(), name='save-chatbot'),
    path('welcome/', WelcomeView.as_view(), name='welcome'),
]