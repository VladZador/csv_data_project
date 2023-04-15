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
            # todo: add prefetch_related() to the query
            schema_record = DataSchema.objects.get(name=data["schemaName"])
            self._create_csv_file(
                filename=settings.MEDIA_ROOT / data["filename"],
                columns_queryset=schema_record.columns.all(),
                number_of_records=data["number"]
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

    def _create_csv_file(self, filename, columns_queryset, number_of_records):
        sorted_columns = self._sort_columns(columns_queryset)
        field_names = self._extract_fieldnames(sorted_columns)

        Faker.seed(randint(1, 999999999))
        fake = Faker()

        with open(filename, mode="w") as csv_file:
            writer = csv.writer(
                csv_file, quoting=csv.QUOTE_NONNUMERIC
            )
            writer.writerow(field_names)

            for i in range(number_of_records):
                self._write_csv_row(writer, sorted_columns, fake)

    @staticmethod
    def _sort_columns(columns_queryset) -> list:

        def index_sort(elem):
            return elem["index"]

        indexed_columns = []
        for col in columns_queryset:
            indexed_columns.append({
                "index": col.index,
                "field_name": col.field,
                "min": col.min,
                "max": col.max
            })
        indexed_columns.sort(key=index_sort)
        return indexed_columns

    @staticmethod
    def _extract_fieldnames(sorted_columns: list) -> list:
        return [col["field_name"] for col in sorted_columns]

    @staticmethod
    def _write_csv_row(writer, sorted_columns, fake):
        row = []
        for column in sorted_columns:
            field_name = column["field_name"]
            if field_name == "Full name":
                row.append(fake.name())
            elif field_name == "Job":
                row.append(fake.job())
            elif field_name == "Email":
                row.append(fake.company_email())
            elif field_name == "Domain name":
                row.append(fake.domain_name())
            elif field_name == "Phone number":
                row.append(fake.phone_number())
            elif field_name == "Company name":
                row.append(fake.company())
            elif field_name == "Text":
                number_of_sentences = randint(
                    a=int(column.get("min") or 1),
                    b=int(column.get("max") or 100)
                )
                row.append(fake.paragraph(nb_sentences=number_of_sentences))
            elif field_name == "Integer":
                row.append(randint(
                    a=int(column.get("min") or 1),
                    b=int(column.get("max") or 999999999)
                ))
            elif field_name == "Address":
                row.append(fake.address())
            elif field_name == "Date":
                row.append(fake.date())
        writer.writerow(row)
        return writer


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
