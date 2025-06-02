# chatbotapi/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated # You'll need this for authentication
# from rest_framework.authentication import TokenAuthentication # If you are using TokenAuthentication
from django.contrib.auth import authenticate # Keep if you use it for login, though DRF Simple JWT often handles this
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse, Http404 # Import Http404 for handling object not found

import json
import os
from groq import Groq

from .models import Chatbot
from .serializers import ChatbotSerializer

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables.")

client = Groq(api_key=GROQ_API_KEY)


# --- Existing get_groq_response for Chatbot Replies (Scenario B) ---
def get_groq_response(full_conversation_messages):
    if not GROQ_API_KEY:
        return {"ai_response": "AI service not configured (API key missing)."}
    if not client:
        return {"ai_response": "AI service client not initialized properly."}

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

# --- NEW: get_correction_response for Input Correction (Scenario A) ---
def get_correction_response(text_to_correct):
    if not GROQ_API_KEY:
        return {"corrected_text": text_to_correct, "error": "AI service not configured."}
    if not client:
        return {"corrected_text": text_to_correct, "error": "AI service client not initialized."}

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


@method_decorator(csrf_exempt, name='dispatch')
class AIChatbotResponseView(APIView):
    # Consider adding permission_classes=[IsAuthenticated]
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

# --- NEW: View for Listing and Creating Chatbots (GET /api/chatbots/, POST /api/chatbots/) ---
@method_decorator(csrf_exempt, name='dispatch')
class ChatbotListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated] # Add this for authentication

    def get(self, request, *args, **kwargs):
        """
        Lists all chatbots owned by the authenticated user.
        """
        chatbots = Chatbot.objects.filter(user=request.user) # Filter by current user
        serializer = ChatbotSerializer(chatbots, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        Creates a new chatbot (can be used for general creation if needed,
        though frontend uses create_empty for a specific flow).
        """
        # Frontend is sending { name: "New Chatbot X" } to create_empty, but this view
        # is for a general list/create. If you want this endpoint to create,
        # it should accept the full chatbot config, not just a name.
        # For now, let's keep it simple and assume `create_empty` handles default creation.
        # If your frontend tries to POST full config to /api/chatbots/, this is where it goes.
        # For simplicity, if this is only for listing, you can remove the `post` method here.
        # Or you can make it accept full config:
        serializer = ChatbotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- NEW: View for Creating an Empty Chatbot (POST /api/chatbots/create_empty/) ---
@method_decorator(csrf_exempt, name='dispatch')
class CreateEmptyChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Creates a new chatbot with default empty configuration for nodes and connections.
        """
        # Default data for a new chatbot
        data = {
            'botName': request.data.get('name', 'New Chatbot'), # Use name from frontend if provided, else default
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
            # 'user' will be set by serializer.save()
        }
        serializer = ChatbotSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user) # Associate with the authenticated user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- NEW: View for Retrieve, Update, Destroy (GET/PUT/DELETE /api/chatbots/<pk>/) ---
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
        Retrieves a single chatbot by its ID.
        """
        chatbot = self.get_object(pk)
        serializer = ChatbotSerializer(chatbot)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        """
        Updates an existing chatbot by its ID.
        """
        chatbot = self.get_object(pk)
        # Ensure that the 'user' field is not updated by the client and
        # any other read-only fields are handled by the serializer's meta options.
        serializer = ChatbotSerializer(chatbot, data=request.data, partial=True) # Use partial=True for partial updates
        if serializer.is_valid():
            serializer.save(user=request.user) # Re-associate with user in case of partial or full update
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        """
        Deletes a chatbot by its ID.
        """
        chatbot = self.get_object(pk)
        chatbot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Original ChatbotConfigView (Review its purpose) ---
# If this is still used for POST to /api/save-chatbot/ or GET to /api/chatbot/<bot_name>/
# it can remain, but its functionality might now overlap with ChatbotListCreateAPIView and
# ChatbotRetrieveUpdateDestroyAPIView.
# The frontend uses /api/chatbots/ for list/create and /api/chatbots/<id>/ for detail.
# So, the 'save-chatbot' and 'chatbot/<bot_name>' paths likely need adjustment or removal.
@method_decorator(csrf_exempt, name='dispatch')
class ChatbotConfigView(APIView):
    permission_classes = [IsAuthenticated] # Add authentication here too if used

    def post(self, request, *args, **kwargs):
        """
        API endpoint to save/update a chatbot's configuration by name.
        This endpoint might be redundant if /api/chatbots/<id>/ (PUT) is used for updates.
        """
        bot_name = request.data.get('botName')
        if not bot_name:
            return Response(
                {"error": "Chatbot name ('botName') is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In your serializer, ensure 'name' maps to 'botName' if needed.
        # Assuming request.data contains all fields for the serializer
        data_for_serializer = request.data.copy() # Use .copy() to modify request.data
        data_for_serializer['botName'] = bot_name # Ensure botName is correctly mapped

        try:
            # If using ID for lookup, retrieve by ID, not name
            # Assuming you want to look up by name for this specific view
            chatbot_instance = Chatbot.objects.get(botName=bot_name, user=request.user)
            serializer = ChatbotSerializer(instance=chatbot_instance, data=data_for_serializer, partial=False)
        except Chatbot.DoesNotExist:
            serializer = ChatbotSerializer(data=data_for_serializer)

        if serializer.is_valid():
            chatbot = serializer.save(user=request.user) # Link to current user
            return Response(serializer.data, status=status.HTTP_201_CREATED if serializer.instance._state.adding else status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, bot_name, *args, **kwargs):
        """
        Handles loading a chatbot's configuration by its name.
        This endpoint might be redundant if /api/chatbots/<id>/ (GET) is used for retrieval.
        """
        permission_classes = [IsAuthenticated]
        try:
            chatbot = Chatbot.objects.get(botName=bot_name, user=request.user) # Filter by user
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
    # This view doesn't need authentication if it's just a public welcome message
    def get(self, request):
        return JsonResponse({"message": "Welcome to the Chatbot Builder Backend API!"})