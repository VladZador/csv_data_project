import json
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import ListView, TemplateView
from django.contrib import messages

from .models import UserFile, DataSchema
from website.decorators import ajax_required


class UserFileView(LoginRequiredMixin, ListView):
    model = UserFile


class DataSchemaCreateView(LoginRequiredMixin, TemplateView):
    template_name = "csv_data/create_schema.html"


@method_decorator(ajax_required, name="dispatch")
class DataSchemaRedirectView(LoginRequiredMixin, View):

    @staticmethod
    def post(request, *args, **kwargs):
        """
        :param request: json.load(request)["post_data"] = {
            "name": "SchemaName",
            "schema": {
                "numberedList": [
                    "1. fullName",
                    "2. job"
                ],
                "textMin": 2,
                "textMax": 5
            }
        }
        :param args:
        :param kwargs:
        :return:
        """
        data_schema = json.load(request)["post_data"]
        schema, created = DataSchema.objects.get_or_create(
            user=request.user,
            schema=data_schema["schema"],
            defaults={"name": data_schema["name"]}
        )
        if not created:
            messages.success(request,
                             "You already have this schema, its name is " +
                             data_schema["name"])
        return JsonResponse(
            data={"redirectUrl": reverse_lazy("user_files")}
        )
