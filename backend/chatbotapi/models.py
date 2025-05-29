
# chatbots/models.py
from django.db import models

class Chatbot(models.Model):
    # 'name' field will store the botName from your React frontend.
    # 'unique=True' ensures that each chatbot has a distinct name.
    name = models.CharField(max_length=255, unique=True, help_text="The unique name of the chatbot.")

    # 'configuration' will store the entire JSON object from your React app.
    # Django's JSONField handles serialization to/from database strings for SQLite automatically.
    configuration = models.JSONField(help_text="The JSON configuration of the chatbot flow.")

    created_at = models.DateTimeField(auto_now_add=True) # Automatically set when created
    updated_at = models.DateTimeField(auto_now=True)     # Automatically updated on each save

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Chatbot Configuration"
        verbose_name_plural = "Chatbot Configurations"
        ordering = ['name'] # Order chatbots by name by default

