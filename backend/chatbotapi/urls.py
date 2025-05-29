# chatbots/urls.py
from django.urls import path
from .views import ChatbotConfigView # Import the renamed view

urlpatterns = [
    # URL for saving/updating a chatbot (POST requests)
    path('save-chatbot/', ChatbotConfigView.as_view(), name='save_chatbot'),

    # NEW URL for loading a chatbot by name (GET requests)
    # The <str:bot_name> part captures the bot's name from the URL
    path('chatbot/<str:bot_name>/', ChatbotConfigView.as_view(), name='load_chatbot'),
]