# chatbotapi/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse

import json

from .models import Chatbot
from .serializers import ChatbotSerializer
from django.http import JsonResponse # For WelcomeView

import os
from groq import Groq


GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables.")

# Initialize the Groq client
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
                    "ai_response": "Okay, let's look into that.", # This is the bot's verbal response to the routing
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
            model="llama3-8b-8192", # This model is usually good enough for correction
            temperature=0.1,       # Keep temperature low for factual correction
            max_tokens=100,        # Keep max_tokens low for concise output
        )
        corrected_text = chat_completion.choices[0].message.content
        return {"corrected_text": corrected_text}

    except Exception as e:
        print(f"Error calling Groq API for correction: {e}")
        return {"corrected_text": text_to_correct, "error": f"Correction service error: {e}"}


@method_decorator(csrf_exempt, name='dispatch')
class AIChatbotResponseView(APIView):
    # authentication_classes = [TokenAuthentication]
    # permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        request_type = request.data.get('request_type', 'chatbot_response') # <--- NEW: Determine request type

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
            
            # The get_groq_response expects the full history with 'role' keys
            # Ensure your frontend sends conversation_history in the format:
            # [{"role": "user", "content": "hello"}, {"role": "assistant", "content": "hi!"}]
            ai_response_data = get_groq_response(conversation_history)
            return Response(ai_response_data, status=status.HTTP_200_OK)

        else:
            return Response(
                {"error": "Invalid request_type provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
@method_decorator(csrf_exempt, name='dispatch')
class ChatbotConfigView(APIView):

    """
    API endpoint to save/update (POST) or load (GET) a chatbot's configuration.
    """
    def post(self, request, *args, **kwargs):

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
            # If you decide to link chatbots to users later, you'd do:
            # chatbot = serializer.save(user=request.user)
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
            # If linking chatbots to users, you'd filter by user too:
            # chatbot = Chatbot.objects.get(name=bot_name, user=request.user)
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
    # This view doesn't need authentication if it's just a public welcome message
    def get(self, request):
        return JsonResponse({"message": "Welcome to the Chatbot Builder Backend API!"})
    

