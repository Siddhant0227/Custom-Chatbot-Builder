# chatbotapi/urls.py

from django.urls import path
from .views import (
    AIChatbotResponseView,
    ChatbotListCreateAPIView,
    CreateEmptyChatbotAPIView,
    ChatbotRetrieveUpdateDestroyAPIView,
    ChatbotConfigView,
    RegisterView,
    LoginView,
    LogoutView,
    WelcomeView, # Still useful for a simple API status check if needed
)

urlpatterns = [
    # This endpoint is generally not used for authentication in Token Auth
    # but can serve as a simple API endpoint for status checks or initial setup.
    path('', WelcomeView.as_view(), name='welcome_api'),

    # Authentication Endpoints - These return/consume tokens
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Chatbot Management Endpoints - These require an authentication token
    # Lists all chatbots for the authenticated user and allows creating new ones (POST)
    path('chatbots/', ChatbotListCreateAPIView.as_view(), name='chatbot_list_create'),

    # Creates a new empty chatbot for the authenticated user (POST)
    # This is the specific URL that was causing the 400 or 500 error,
    # ensure it's correctly mapped to CreateEmptyChatbotAPIView
    path('chatbots/create_empty/', CreateEmptyChatbotAPIView.as_view(), name='chatbot_create_empty'),

    # Retrieves, Updates, or Deletes a specific chatbot by its ID
    path('chatbots/<str:pk>/', ChatbotRetrieveUpdateDestroyAPIView.as_view(), name='chatbot_detail'),

    # Saves/Updates a chatbot's configuration (POST request)
    path('chatbots/config/', ChatbotConfigView.as_view(), name='chatbot_config_post'),
    # Retrieves a chatbot's configuration by name (GET request)
    path('chatbots/config/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot_config_get'),

    # AI Response Endpoint - Does not require authentication by default
    path('ai/response/', AIChatbotResponseView.as_view(), name='ai_chatbot_response'),
]