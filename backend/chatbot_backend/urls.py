
from django.contrib import admin
from django.urls import path, include
from chatbotapi.views import WelcomeView 

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('chatbotapi.urls')),
    path('', WelcomeView.as_view(), name='welcome-root'), # <--- Add this line
    # path('ai-response/', AIChatbotResponseView.as_view(), name='ai-response'),
]

