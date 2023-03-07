import json
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import ListView, TemplateView

from .models import UserFile
from website.decorators import ajax_required


class UserFileView(LoginRequiredMixin, ListView):
    model = UserFile


class DataSchemaCreateView(LoginRequiredMixin, TemplateView):
    template_name = "csv_data/create_schema.html"


@method_decorator(ajax_required, name="dispatch")
class DataSchemaRedirectView(LoginRequiredMixin, View):

    @staticmethod
    def post(request, *args, **kwargs):
        data_schema = json.load(request)["post_data"]

        return JsonResponse(data={"redirectUrl": reverse_lazy("user_files")})
