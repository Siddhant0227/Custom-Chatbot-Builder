# chatbotapi/urls.py
from django.urls import path
from .views import ChatbotListCreateView, ChatbotRetrieveUpdateDestroyView, WelcomeAPIView # Import WelcomeAPIView

urlpatterns = [
    path('', WelcomeAPIView.as_view(), name='api-root'), # New line for the API root
    path('chatbots/', ChatbotListCreateView.as_view(), name='chatbot-list-create'),
    path('chatbots/<uuid:id>/', ChatbotRetrieveUpdateDestroyView.as_view(), name='chatbot-detail'),
]