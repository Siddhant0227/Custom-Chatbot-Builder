from rest_framework import generics, permissions
from .models import Chatbot
from .serializers import ChatbotSerializer

class ChatbotListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatbotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chatbot.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatbotRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ChatbotSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Chatbot.objects.filter(user=self.request.user)