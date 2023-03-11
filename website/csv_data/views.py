import csv
import json
from random import randint

from faker import Faker

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import ListView, TemplateView, DetailView
from django.contrib import messages

from .models import UserFile, DataSchema
from website.decorators import ajax_required


class UserFileView(LoginRequiredMixin, ListView):
    model = UserFile

    def get_context_data(self, *args, object_list=None, **kwargs):
        context = super().get_context_data(object_list=None, **kwargs)
        schemas = DataSchema.objects.filter(user=self.request.user)
        context.update({"schemas": schemas})
        return context


@method_decorator(ajax_required, name="dispatch")
class GenerateDataView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        data = json.load(request)["post_data"]
        try:
            schema = DataSchema.objects.get(name=data["name"])
            response_data = self._create_csv_file(
                filename=data["filename"],
                schema=schema,
                number=data["number"]
            )
            return JsonResponse(data={"data": response_data})
        except DataSchema.DoesNotExist:
            # todo: think about proper response
            return False

    @staticmethod
    def _extract_fieldnames(fieldnames: list) -> list:
        """
        Keeps the order of the list. Makes field names more human-readable.
        "Full-name" -> "Full name"
        "Domain-name" -> "Domain name"
        "Phone-number" -> "Phone number"
        "Company-name" -> "Company name"
        "Job", "Email", "Text", "Integer", "Address", "Date" stay the same.
        :param fieldnames:
        :return:
        """
        for i in range(len(fieldnames)):
            if "-" in fieldnames[i]:
                fieldnames[i] = " ".join(fieldnames[i].split("-"))
        return fieldnames

    @staticmethod
    def _write_csv_row(writer, fieldnames, schema, fake):
        row = {}
        for field_name in fieldnames:
            if field_name == "Full name":
                row[field_name] = fake.name()
            elif field_name == "Job":
                row[field_name] = fake.job()
            elif field_name == "Email":
                row[field_name] = fake.company_email()
            elif field_name == "Domain name":
                row[field_name] = fake.domain_name()
            elif field_name == "Phone number":
                row[field_name] = fake.phone_number()
            elif field_name == "Company name":
                row[field_name] = fake.company()
            elif field_name == "Text":
                num_sentences = randint(
                    a=int(schema.get("textMin")) or 1,
                    b=int(schema.get("textMax")) or 100
                )
                row[field_name] = fake.paragraph(nb_sentences=num_sentences)
            elif field_name == "Integer":
                row[field_name] = randint(
                    a=int(schema.get("integerMin")) or 1,
                    b=int(schema.get("integerMax")) or 9999
                )
            elif field_name == "Address":
                row[field_name] = fake.address()
            elif field_name == "Date":
                row[field_name] = fake.date()
        writer.writerow(row)
        return writer

    def _create_csv_file(self, filename, schema, number):
        fieldnames = self._extract_fieldnames(schema["orderedList"])

        Faker.seed(randint(1, 999999999))
        fake = Faker()

        with open(filename, mode="w") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames)
            writer.writeheader()

            for i in range(number):
                self._write_csv_row(writer, fieldnames, schema, fake)
            return csv_file


class DataSchemaView(LoginRequiredMixin, TemplateView):
    template_name = "csv_data/create_schema.html"


@method_decorator(ajax_required, name="dispatch")
class DataSchemaCreateView(LoginRequiredMixin, View):

    @staticmethod
    def post(request, *args, **kwargs):
        """
        :param request: json.load(request)["post_data"] = {
            "name": "SchemaName",
            "schema": {
                "orderedList": ["fullName", "job"],
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
            name=data_schema["name"]
        )
        if not created:
            messages.success(request, "You already have this schema")
        return JsonResponse(
            data={"redirectUrl": reverse_lazy("user_files")}
        )
