
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
    path('register/', RegisterView.as_view(), name='register'), # Maps to /api/register/
    path('login/', LoginView.as_view(), name='login'),         # Maps to /api/login/
    path('logout/', LogoutView.as_view(), name='logout'),       # Maps to /api/logout/
]
