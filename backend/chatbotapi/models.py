from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Chatbot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chatbots'
    )
    config = models.JSONField()
    name = models.CharField(max_length=255, default="Untitled Chatbot")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.id})"

    class Meta:
        ordering = ['-created_at']