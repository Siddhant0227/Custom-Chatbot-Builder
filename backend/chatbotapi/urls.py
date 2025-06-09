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
    WelcomeView,
)

urlpatterns = [
    path('', WelcomeView.as_view(), name='welcome_api'),

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('chatbots/config/', ChatbotConfigView.as_view(), name='chatbot_config_post'),
    path('chatbots/config/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot_config_get'),
    path('chatbots/create_empty/', CreateEmptyChatbotAPIView.as_view(), name='chatbot_create_empty'),
    path('chatbots/', ChatbotListCreateAPIView.as_view(), name='chatbot_list_create'),
    path('chatbots/<str:pk>/', ChatbotRetrieveUpdateDestroyAPIView.as_view(), name='chatbot_detail'),
    path('ai/response/', AIChatbotResponseView.as_view(), name='ai_chatbot_response'),
]
