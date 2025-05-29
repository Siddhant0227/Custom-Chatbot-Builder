from rest_framework import serializers
from .models import Chatbot

class ChatbotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chatbot
        fields = ['id', 'name', 'config', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at'] # These are managed by Django
