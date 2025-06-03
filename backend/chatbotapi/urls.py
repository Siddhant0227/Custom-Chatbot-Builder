
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

    # New Authentication Endpoints

    path('register/', RegisterView.as_view(), name='register'), 
    path('login/', LoginView.as_view(), name='login'),        
    path('logout/', LogoutView.as_view(), name='logout'), 
    path('save-chatbot/', ChatbotConfigView.as_view(), name='save-chatbot'),
    path('chatbot/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot-config-detail'), # For GET by name

]
