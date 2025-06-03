# chatbotapi/urls.py

from django.urls import path
from .views import (
    ChatbotConfigView,
    WelcomeView,
    ChatbotListCreateAPIView,
    CreateEmptyChatbotAPIView,
    ChatbotRetrieveUpdateDestroyAPIView,
    # Import the new authentication views
    RegisterView,
    LoginView,
    LogoutView,
)

urlpatterns = [
    # Chatbot Management Endpoints (Your existing ones)
    path('chatbots/', ChatbotListCreateAPIView.as_view(), name='chatbot-list-create'),
    path('chatbots/create_empty/', CreateEmptyChatbotAPIView.as_view(), name='create-empty-chatbot'),
    path('chatbots/<str:pk>/', ChatbotRetrieveUpdateDestroyAPIView.as_view(), name='chatbot-detail'),
    path('save-chatbot/', ChatbotConfigView.as_view(), name='save-chatbot'),
    path('welcome/', WelcomeView.as_view(), name='welcome'),

    # New Authentication Endpoints
    path('register/', RegisterView.as_view(), name='register'), # Maps to /api/register/
    path('login/', LoginView.as_view(), name='login'),         # Maps to /api/login/
    path('logout/', LogoutView.as_view(), name='logout'),       # Maps to /api/logout/
]