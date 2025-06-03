
from django.urls import path
# Make sure these views are imported from your views.py
# You might need to create new views if ChatbotConfigView doesn't handle these specific functionalities
from .views import ChatbotConfigView, WelcomeView, ChatbotListCreateAPIView, CreateEmptyChatbotAPIView, ChatbotRetrieveUpdateDestroyAPIView


urlpatterns = [
    # 1. Endpoint for fetching ALL chatbots (GET)
    # This directly matches frontend's `http://localhost:8000/api/chatbots/`
    path('chatbots/', ChatbotListCreateAPIView.as_view(), name='chatbot-list-create'),

    # 2. Endpoint for creating a NEW, EMPTY chatbot (POST)
    # This directly matches frontend's `http://localhost:8000/api/chatbots/create_empty/`
    path('chatbots/create_empty/', CreateEmptyChatbotAPIView.as_view(), name='create-empty-chatbot'),

    # 3. Endpoint for detailed operations (GET, PUT, DELETE) on a specific chatbot by ID
    # Frontend will use `/build/<chatbotId>` which maps to `/api/chatbots/<id>/`
    # Note: I'm changing 'bot_name' to 'pk' to match common DRF patterns for primary keys (IDs)
    path('chatbots/<str:pk>/', ChatbotRetrieveUpdateDestroyAPIView.as_view(), name='chatbot-detail'),


    # Keep your existing welcome and save endpoints if they serve other purposes
    # If ChatbotConfigView was meant for detail view, consider renaming for clarity or using it here
    # path('chatbot/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot-detail-by-name'), # If you still need name-based lookup
    path('save-chatbot/', ChatbotConfigView.as_view(), name='save-chatbot'), # If this is a general save (e.g., PUT existing)
    path('welcome/', WelcomeView.as_view(), name='welcome'),
]
