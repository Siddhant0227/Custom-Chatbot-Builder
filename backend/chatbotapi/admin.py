# chatbotapi/admin.py
from django.contrib import admin
from .models import Chatbot

# Define a custom Admin class for your Chatbot model
class ChatbotAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at') # Columns to display in the list view
    search_fields = ('name',) # Add a search box to search by name
    readonly_fields = ('created_at', 'updated_at',) # Make these fields non-editable in the form

    # If you want to customize how the JSONField is displayed in the form,
    # you might use a custom form or widget, but for now, the default is fine.
    # The JSONField will appear as a large text area.
    fieldsets = (
        (None, {
            'fields': ('name', 'configuration')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',) # Makes this section collapsible
        }),
    )

# Register your model with the custom Admin class
admin.site.register(Chatbot, ChatbotAdmin)