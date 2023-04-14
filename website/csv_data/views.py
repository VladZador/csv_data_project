import csv
import json
from random import randint

from faker import Faker

from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import ListView, TemplateView
from django.conf import settings

from .models import UserFile, DataSchema, Column
from website.decorators import ajax_required


class MainView(TemplateView):
    template_name = "index.html"


class UserFileView(LoginRequiredMixin, ListView):
    model = UserFile

    def get_context_data(self, *args, object_list=None, **kwargs):
        context = super().get_context_data(object_list=None, **kwargs)
        user_files = UserFile.objects.filter(user=self.request.user)
        context.update({"object_list": user_files})
        schemas = DataSchema.objects.filter(user=self.request.user)
        context.update({"schemas": schemas})
        return context


@method_decorator(ajax_required, name="dispatch")
class GenerateDataView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        data = json.load(request)["post_data"]
        try:
            schema_record = DataSchema.objects.get(name=data["name"])
            self._create_csv_file(
                filename=settings.MEDIA_ROOT / data["filename"],
                schema=schema_record.schema,
                number=data["number"]
            )
            UserFile.objects.create(
                user=request.user,
                filename=data["filename"]
            )
            return JsonResponse(data={
                "filename": data["filename"]
            })
        except DataSchema.DoesNotExist:
            return JsonResponse(data={"error": "invalid data schema"})

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
                    a=int(schema.get("textMin") or 1),
                    b=int(schema.get("textMax") or 100)
                )
                row[field_name] = fake.paragraph(nb_sentences=num_sentences)
            elif field_name == "Integer":
                row[field_name] = randint(
                    a=int(schema.get("integerMin") or 1),
                    b=int(schema.get("integerMax") or 999999999)
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
            writer = csv.DictWriter(
                csv_file, fieldnames, quoting=csv.QUOTE_NONNUMERIC
            )
            writer.writeheader()

            for i in range(number):
                self._write_csv_row(writer, fieldnames, schema, fake)


class DataSchemaView(LoginRequiredMixin, TemplateView):
    template_name = "csv_data/create_schema.html"


@method_decorator(ajax_required, name="dispatch")
class DataSchemaCreateView(LoginRequiredMixin, View):

    def post(self, request, *args, **kwargs):
        """
        json.load(request)["post_data"] = {
            "name": "SchemaName",
            "schema": [
                {"index": 1, "name": "full-name"},
                {"index": 2, "name": "job"},
                {"index": 3, "name": "text", "min": 2, "max": 5},
                {"index": 4, "name": "address"},
                {"index": 5, "name": "text"},
                {"index": 6, "name": "integer", "min": 10}
            ]
        }
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        post_data = json.load(request)["post_data"]
        columns = self._create_columns(post_data["schema"])
        data_schema = DataSchema.objects.create(
            user=request.user,
            name=post_data["name"],
        )
        data_schema.columns.set(columns)
        return JsonResponse(
            data={"redirectUrl": reverse_lazy("user_files")}
        )

    def _create_columns(self, schema: list):
        columns = []
        for col_prototype in schema:
            col = Column.objects.create(
                field=self._edit_field_name(col_prototype["name"]),
                index=col_prototype["index"],
                min=col_prototype.get("min"),
                max=col_prototype.get("max")
            )
            columns.append(col)
        return columns

    @staticmethod
    def _edit_field_name(field_name: str) -> str:
        """
        Makes field names capitalized and more human-readable. "job", "email",
        "text", "integer", "address", "date" are only capitalized.
        "full-name" -> "Full name"
        "domain-name" -> "Domain name"
        "phone-number" -> "Phone number"
        "company-name" -> "Company name"
        """
        field_name = field_name.capitalize()
        if "-" in field_name:
            field_name = " ".join(field_name.split("-"))
        return field_name


@login_required
def download_file(request, *args, **kwargs):
    filename = kwargs["filename"]
    file_path = settings.MEDIA_ROOT / filename

    with open(file_path, 'r') as file:
        response = HttpResponse(file, content_type="text/csv")
        response['Content-Disposition'] = f"attachment; filename={filename}"
    return response
