from django.urls import path
from .views import ChatbotListCreateView, ChatbotRetrieveUpdateView

urlpatterns = [
    path('chatbots/', ChatbotListCreateView.as_view(), name='chatbot-list-create'),
    path('chatbots/<uuid:id>/', ChatbotRetrieveUpdateView.as_view(), name='chatbot-retrieve-update'),
]