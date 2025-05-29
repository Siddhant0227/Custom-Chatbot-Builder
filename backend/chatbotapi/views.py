
# chatbots/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator # Import this for @method_decorator
from django.http import JsonResponse

from .models import Chatbot
from .serializers import ChatbotSerializer

# Apply csrf_exempt directly to the class using method_decorator for simplicity in development
# REMINDER: Remove @csrf_exempt in production and handle CSRF properly!
@method_decorator(csrf_exempt, name='dispatch')
class ChatbotConfigView(APIView):
    """
    API endpoint to save/update (POST) or load (GET) a chatbot's configuration.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles saving or updating a chatbot's configuration.
        """
        chatbot_name = request.data.get('botName')
        if not chatbot_name:
            return Response(
                {"error": "Chatbot name ('botName') is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data_for_serializer = {
            'name': chatbot_name,
            'configuration': request.data
        }

        try:
            chatbot_instance = Chatbot.objects.get(name=chatbot_name)
            serializer = ChatbotSerializer(instance=chatbot_instance, data=data_for_serializer, partial=False)
        except Chatbot.DoesNotExist:
            serializer = ChatbotSerializer(data=data_for_serializer)

        if serializer.is_valid():
            chatbot = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED if serializer.instance._state.adding else status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, bot_name, *args, **kwargs):
        """
        Handles loading a chatbot's configuration by its name.
        Expected URL: /api/chatbot/<str:bot_name>/
        """
        try:
            chatbot = Chatbot.objects.get(name=bot_name)
            serializer = ChatbotSerializer(chatbot)
            return Response(serializer.data)
        except Chatbot.DoesNotExist:
            return Response(
                {"error": f"Chatbot with name '{bot_name}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class WelcomeView(APIView):
    def get(self, request):
        return JsonResponse({"message": "Welcome to the Chatbot Builder Backend API!"})

