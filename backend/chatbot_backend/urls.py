# chatbot_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView # Import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chatbotapi.urls')),
    
    # Add this line to redirect the root URL to /api/
    path('', RedirectView.as_view(url='/api/', permanent=False)), 
]