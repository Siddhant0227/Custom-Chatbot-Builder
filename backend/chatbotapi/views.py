from rest_framework import generics, status
from rest_framework.response import Response
from .models import Chatbot
from .serializers import ChatbotSerializer

from rest_framework import generics, status
from rest_framework.response import Response
from .models import Chatbot
from .serializers import ChatbotSerializer

class ChatbotListCreateView(generics.ListCreateAPIView):
    queryset = Chatbot.objects.all()
    serializer_class = ChatbotSerializer

    def perform_create(self, serializer):
        # Optional user association (uncomment if you want user support)
        # if self.request.user.is_authenticated:
        #     serializer.save(user=self.request.user)
        # else:
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        chatbot_id = serializer.data['id']
        frontend_url = f"http://localhost:3000/chatbot/{chatbot_id}"  # Adjust this URL if needed

        response_data = {
            "message": "Chatbot saved successfully!",
            "id": chatbot_id,
            "frontend_url": frontend_url,
            "chatbot_data": serializer.data
        }
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


class ChatbotRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Chatbot.objects.all()
    serializer_class = ChatbotSerializer
    lookup_field = 'id' # Use the UUID field for lookup

    # Optional: Restrict update/destroy to owner if authentication is used
    # def get_queryset(self):
    #     if self.request.user.is_authenticated:
    #         return Chatbot.objects.filter(user=self.request.user)
    #     return Chatbot.objects.none() # Or raise permission denied

# chatbotapi/views.py (add this at the top or bottom)
from rest_framework.views import APIView
from rest_framework.response import Response

class WelcomeAPIView(APIView):
    def get(self, request):
        return Response({"message": "Welcome to the Chatbot API!"})