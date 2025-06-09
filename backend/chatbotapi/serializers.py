# chatbotapi/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User # Make sure User is imported
from .models import Chatbot # Make sure Chatbot model is imported

class ChatbotSerializer(serializers.ModelSerializer):
    # CRUCIAL: Make the 'user' field read-only.
    # This tells DRF that this field is for output (serialization) only,
    # and it should NOT expect this field in the incoming JSON data for creation/update.
    # 'source='user.username' ensures it displays the username when serialized.
    user = serializers.ReadOnlyField(source='user.username') # <--- THIS IS THE KEY LINE

    class Meta:
        model = Chatbot
        # '__all__' is fine here, because 'user' is now explicitly defined as read-only above.
        # This means DRF will handle 'user' from the ReadOnlyField, and other fields via __all__.
        fields = '__all__'
        # You can optionally list fields explicitly if you prefer, but 'user' must still be handled by ReadOnlyField.
        # read_only_fields are for fields that are part of the model but should NEVER be changed via API input
        # (like 'id', 'created_at', 'updated_at'). 'user' is special because it's set by the backend.
        read_only_fields = ['id', 'created_at', 'updated_at']

