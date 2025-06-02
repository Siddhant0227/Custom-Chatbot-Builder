from django.urls import path
from .views import ChatbotConfigView, WelcomeView


urlpatterns = [
    path('chatbot/<str:bot_name>/', ChatbotConfigView.as_view(), name='chatbot-detail'),
    path('save-chatbot/', ChatbotConfigView.as_view(), name='save-chatbot'),
    path('welcome/', WelcomeView.as_view(), name='welcome'),
   

]
