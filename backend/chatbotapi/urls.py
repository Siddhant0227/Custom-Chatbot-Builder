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
    WelcomeView, # Needed for the initial GET request from frontend to get CSRF token
)

urlpatterns = [
    # This endpoint is primarily used by the frontend to fetch the CSRF token
    # (e.g., by hitting http://127.0.0.1:8000/api/)
    path('', WelcomeView.as_view(), name='welcome_api'),

    # Authentication Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Chatbot Management Endpoints
    # Lists all chatbots for the authenticated user and allows creating new ones
    path('chatbots/', ChatbotListCreateAPIView.as_view(), name='chatbot_list_create'),

    # Creates a new empty chatbot for the authenticated user
    path('chatbots/create_empty/', CreateEmptyChatbotAPIView.as_view(), name='chatbot_create_empty'),

    # Retrieves, Updates, or Deletes a specific chatbot by its ID
    path('chatbots/<str:pk>/', ChatbotRetrieveUpdateDestroyAPIView.as_view(), name='chatbot_detail'),

    # Saves/Updates a chatbot's configuration (POST request)
    path('chatbots/config/', ChatbotConfigView.as_view(), name='chatbot_config_post'),
    # Retrieves a chatbot's configuration by name (GET request)
    path('chatbots/config/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot_config_get'),

    # AI Response Endpoint
    path('ai/response/', AIChatbotResponseView.as_view(), name='ai_chatbot_response'),
]
