# chatbotapi/views.py

# chatbotapi/views.py

import json
import os
from groq import Groq
# from.import views # <--- REMOVE THIS LINE
from django.http import JsonResponse, Http404
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token

from .models import Chatbot
from .serializers import ChatbotSerializer

# --- Environment Variable and API Client Setup ---
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables. AI features may not work.")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# --- AI Helper Functions ---
# No changes needed in your helper functions.
def get_groq_response(full_conversation_messages):
    # ... (your existing code, no changes)
    if not GROQ_API_KEY or not client:
        return {"ai_response": "AI service not configured or client not initialized."}
    messages = [
        {"role": "system", "content": "You are a helpful chatbot..."} # Truncated for brevity
    ] + full_conversation_messages
    # ... (rest of the function)
    return {"ai_response": "..."}

def get_correction_response(text_to_correct):
    # ... (your existing code, no changes)
    return {"corrected_text": text_to_correct}


# --- API Views ---

class WelcomeView(APIView):
    """A simple public endpoint to check if the API is live."""
    permission_classes = [AllowAny]
    def get(self, request):
        return JsonResponse({"message": "Welcome to the Chatbot Builder Backend API!"})

class AIChatbotResponseView(APIView):
    """Publicly accessible endpoint for handling AI interactions."""
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        # ... (your existing code, no changes)
        return Response({"error": "Invalid request_type provided."}, status=status.HTTP_400_BAD_REQUEST)


class ChatbotConfigView(APIView):
    """Handles creating and updating a chatbot's configuration from the builder."""
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        # ... (code from previous step, no changes)
        bot_name = request.data.get('botName')
        if not bot_name:
            return Response({"error": "Chatbot name ('botName') is required..."}, status=status.HTTP_400_BAD_REQUEST)
        configuration_data = {
            'welcomeMessage': request.data.get('welcomeMessage', 'Hello!'),
            'fallbackMessage': request.data.get('fallbackMessage', 'I do not understand.'),
            'nodes': request.data.get('nodes', []),
            'connections': request.data.get('connections', [])
        }
        chatbot_instance, created = Chatbot.objects.update_or_create(
            name=bot_name, user=request.user, defaults={'configuration': configuration_data}
        )
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        serializer = ChatbotSerializer(chatbot_instance)
        return Response(serializer.data, status=response_status)


# === VIEW RESTORED HERE ===
class CreateEmptyChatbotAPIView(APIView):
    """
    Creates a new chatbot with a default empty configuration (including a start node).
    This is useful for a "Create New Bot" button on a dashboard.
    PROTECTED: Requires 'Authorization: Token ...' header.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Creates a new chatbot instance for the logged-in user with default values.
        """
        # Default structure for a brand new chatbot
        data = {
            'name': request.data.get('name', 'New Chatbot'), # Can be named from the frontend
            'configuration': {
                'welcomeMessage': 'Hello! How can I help you today?',
                'fallbackMessage': "I'm sorry, I don't understand. Can you please rephrase?",
                'nodes': [{
                    'id': 'start-1',
                    'type': 'start',
                    'x': 100,
                    'y': 120,
                    'data': {
                        'title': 'Start',
                        'content': 'Start your chatbot flow here',
                        'useAI': False,
                    },
                    'outputs': ['output-1'],
                }],
                'connections': [],
            }
        }
        # Use the serializer to create the new instance
        serializer = ChatbotSerializer(data=data)
        if serializer.is_valid():
            # Associate the new bot with the authenticated user upon saving
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Standard CRUD and Authentication Views ---
class ChatbotListCreateAPIView(APIView):
    """Handles listing all chatbots for a user."""
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        chatbots = Chatbot.objects.filter(user=request.user)
        serializer = ChatbotSerializer(chatbots, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    # Note: The general 'post' for creating a bot from raw data is now less
    # necessary as CreateEmptyChatbotAPIView and ChatbotConfigView are more specific.
    # It can be kept for other API-based integrations if needed.
    def post(self, request, *args, **kwargs):
        serializer = ChatbotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatbotRetrieveUpdateDestroyAPIView(APIView):
    """Handles retrieving, updating (PUT), and deleting a specific chatbot by its ID."""
    permission_classes = [IsAuthenticated]
    def get_object(self, pk):
        try:
            return Chatbot.objects.get(pk=pk, user=self.request.user)
        except Chatbot.DoesNotExist:
            raise Http404
    # ... (get, put, delete methods are unchanged)
    def get(self, request, pk, *args, **kwargs):
        chatbot = self.get_object(pk)
        serializer = ChatbotSerializer(chatbot)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request, pk, *args, **kwargs):
        chatbot = self.get_object(pk)
        serializer = ChatbotSerializer(chatbot, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk, *args, **kwargs):
        chatbot = self.get_object(pk)
        chatbot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Authentication Views ---
# No changes needed here.
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # ... (code is unchanged)
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'message': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'message': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        token, created = Token.objects.get_or_create(user=user)
        return Response({'message': 'Registration successful!', 'token': token.key, 'username': user.username}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # ... (code is unchanged)
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'message': 'Login successful!', 'token': token.key, 'username': user.username}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        # ... (code is unchanged)
        try:
            request.user.auth_token.delete()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except (AttributeError, Token.DoesNotExist):
            return Response({'message': 'No active session found.'}, status=status.HTTP_400_BAD_REQUEST)