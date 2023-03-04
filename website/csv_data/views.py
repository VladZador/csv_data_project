from django.views.generic import ListView

from .models import UserFile


class UserFileView(ListView):
    model = UserFile
