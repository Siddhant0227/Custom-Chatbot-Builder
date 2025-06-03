
from django.db import models
from django.conf import settings

class Chatbot(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="The unique name of the chatbot.")
    configuration = models.JSONField(help_text="The JSON configuration of the chatbot flow.")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chatbots'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Chatbot Configuration"
        verbose_name_plural = "Chatbot Configurations"

