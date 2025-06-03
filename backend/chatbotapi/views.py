# chatbotapi/views.py

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse, Http404

import json
import os
from groq import Groq

from .models import Chatbot
from .serializers import ChatbotSerializer

# Load GROQ_API_KEY from environment variables
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables.")

# Initialize Groq client only if API key is available
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# --- AI Helper Functions ---
def get_groq_response(full_conversation_messages):
    if not GROQ_API_KEY or not client:
        return {"ai_response": "AI service not configured or client not initialized."}

    messages = [
        {"role": "system", "content": "You are a helpful chatbot. Based on the user's intent, decide if you need to route them to a specific part of the conversation flow. If no clear routing is needed, provide a direct text response. If you route, use the 'route_to_node' function and provide a clear, concise 'node_keyword' from the available options. Available node keywords are: 'loan_info', 'course_details', 'support_agent', 'general_greeting', 'thank_you'."}
    ] + full_conversation_messages

    tools = [
        {
            "type": "function",
            "function": {
                "name": "route_to_node",
                "description": "Routes the conversation to a specific part of the chatbot flow based on user intent. Choose from predefined node keywords.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_keyword": {
                            "type": "string",
                            "description": "A specific keyword representing the next desired chatbot node (e.g., 'loan_info', 'course_details', 'support_agent', 'general_greeting', 'thank_you').",
                        }
                    },
                    "required": ["node_keyword"],
                },
            },
        }
    ]

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama3-8b-8192",
            tools=tools,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=250,
        )

        if chat_completion.choices[0].message.tool_calls:
            tool_call = chat_completion.choices[0].message.tool_calls[0]
            if tool_call.function.name == "route_to_node":
                args = json.loads(tool_call.function.arguments)
                next_node_keyword = args.get("node_keyword")
                print(f"AI decided to route to keyword: {next_node_keyword}")
                return {
                    "ai_response": "Okay, let's look into that.",
                    "next_node_keyword": next_node_keyword
                }

        return {"ai_response": chat_completion.choices[0].message.content}

    except Exception as e:
        print(f"Error calling Groq API for chatbot response: {e}")
        return {"ai_response": f"Sorry, I'm having trouble connecting to the AI for a response: {e}"}

def get_correction_response(text_to_correct):
    if not GROQ_API_KEY or not client:
        return {"corrected_text": text_to_correct, "error": "AI service not configured."}

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant specialized in grammar and spelling correction. Correct any grammatical errors, spelling mistakes, or awkward phrasing in the user's input. Do NOT add new information or change the meaning. Only provide the corrected text. If the text is already correct, return it as is. If the text is very short or simple, you can still return it as is without correction."},
                {"role": "user", "content": text_to_correct}
            ],
            model="llama3-8b-8192",
            temperature=0.1,
            max_tokens=100,
        )
        corrected_text = chat_completion.choices[0].message.content
        return {"corrected_text": corrected_text}

    except Exception as e:
        print(f"Error calling Groq API for correction: {e}")
        return {"corrected_text": text_to_correct, "error": f"Correction service error: {e}"}


# --- API Views ---

@method_decorator(csrf_exempt, name='dispatch')
class AIChatbotResponseView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        request_type = request.data.get('request_type', 'chatbot_response')
        if request_type == 'correct_input':
            input_text = request.data.get('input_text')
            if not input_text:
                return Response(
                    {"error": "input_text is required for correction request."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            correction_data = get_correction_response(input_text)
            return Response(correction_data, status=status.HTTP_200_OK)
        elif request_type == 'chatbot_response':
            conversation_history = request.data.get('conversation_history', [])
            if not conversation_history:
                return Response(
                    {"error": "conversation_history is required and should not be empty for chatbot_response."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ai_response_data = get_groq_response(conversation_history)
            return Response(ai_response_data, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Invalid request_type provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

@method_decorator(csrf_exempt, name='dispatch')
class ChatbotListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Lists all chatbots owned by the authenticated user.
        """
        # Filter chatbots by the currently authenticated user
        chatbots = Chatbot.objects.filter(user=request.user)
        serializer = ChatbotSerializer(chatbots, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        Creates a new chatbot, associating it with the authenticated user.
        """
        serializer = ChatbotSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically set the 'user' field to the authenticated user
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class CreateEmptyChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Creates a new chatbot with default empty configuration for nodes and connections,
        associating it with the authenticated user.
        """
        data = {
            'name': request.data.get('name', 'New Chatbot'), # Use 'name' to match model field
            'configuration': { # Store initial config in the JSONField
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
        serializer = ChatbotSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user) # Associate with the authenticated user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class ChatbotRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            # Ensure the user can only access their own chatbots
            return Chatbot.objects.get(pk=pk, user=self.request.user)
        except Chatbot.DoesNotExist:
            raise Http404

    def get(self, request, pk, *args, **kwargs):
        """
        Retrieves a single chatbot by its ID for the authenticated user.
        """
        chatbot = self.get_object(pk)
        serializer = ChatbotSerializer(chatbot)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        """
        Updates an existing chatbot by its ID for the authenticated user.
        """
        chatbot = self.get_object(pk)
        serializer = ChatbotSerializer(chatbot, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user) # Ensure user is still associated correctly
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        """
        Deletes a chatbot by its ID for the authenticated user.
        """
        chatbot = self.get_object(pk)
        chatbot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@method_decorator(csrf_exempt, name='dispatch')
class ChatbotConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        API endpoint to save/update a chatbot's configuration by name.
        Creates if not exists, updates if exists, for the authenticated user.
        """
        bot_name = request.data.get('botName') # This name is from frontend, needs to map to 'name' in model
        if not bot_name:
            return Response(
                {"error": "Chatbot name ('botName') is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prepare data for serializer, mapping 'botName' to 'name'
        data_for_serializer = request.data.copy()
        data_for_serializer['name'] = bot_name # Map frontend 'botName' to model 'name'
        if 'botName' in data_for_serializer: # Remove original botName if it conflicts with serializer
            del data_for_serializer['botName']

        try:
            chatbot_instance = Chatbot.objects.get(name=bot_name, user=request.user) # Filter by 'name' and 'user'
            serializer = ChatbotSerializer(instance=chatbot_instance, data=data_for_serializer, partial=True)
        except Chatbot.DoesNotExist:
            serializer = ChatbotSerializer(data=data_for_serializer)

        if serializer.is_valid():
            chatbot = serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED if serializer.instance._state.adding else status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, bot_name, *args, **kwargs):
        """
        Handles loading a chatbot's configuration by its name for the authenticated user.
        """
        try:
            chatbot = Chatbot.objects.get(name=bot_name, user=request.user) # Filter by 'name' and 'user'
            serializer = ChatbotSerializer(chatbot)
            return Response(serializer.data)
        except Chatbot.DoesNotExist:
            return Response(
                {"error": f"Chatbot with name '{bot_name}' not found for this user."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WelcomeView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return JsonResponse({"message": "Welcome to the Chatbot Builder Backend API!"})

# --- Authentication Views ---
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response(
                {'message': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {'message': 'Username already exists. Please choose a different one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
            return Response(
                {'message': 'Registration successful!'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'message': f'Registration failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response(
                {'message': 'Login successful!', 'username': user.username},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'message': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        logout(request)
        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK
        )