from django.urls import path

from .views import UserFileView

urlpatterns = [
    path('', UserFileView.as_view(), name="user_files")
]
