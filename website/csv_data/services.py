import csv
import json
from random import randint

from django.core.files.base import ContentFile
from django.urls import reverse_lazy
from faker import Faker

from django.http import JsonResponse

from .models import DataSchema, Column, UserFile


class DataSchemaCreateService:
    def __init__(self, request):
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
        """
        self.post_data = json.load(request)["post_data"]
        self.user = request.user

    def create_data_schema(self):
        columns = self._create_columns(self.post_data["schema"])
        data_schema = DataSchema.objects.create(
            user=self.user,
            name=self.post_data["name"],
        )
        data_schema.columns.set(columns)
        return JsonResponse(
            data={"redirectUrl": reverse_lazy("user_files")}
        )

    def _create_columns(self, schema: list) -> list:
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


class GenerateDataService:
    def __init__(self, request):
        """
        json.load(request)["post_data"] = {
            "schemaName": "schemaName",
            "number": 10,
            "filename": "filename"
        }
        """
        self.data = json.load(request)["post_data"]
        self.user = request.user

    def generate_data(self):
        try:
            # todo: add prefetch_related() to the query
            schema_record = DataSchema.objects.get(
                name=self.data["schemaName"]
            )
            self._create_csv_file(
                columns_queryset=schema_record.columns.all(),
                number_of_records=self.data["number"],
                filename=self.data["filename"],
                user=self.user,
            )
            return JsonResponse(data={
                "filename": self.data["filename"]
            })
        except DataSchema.DoesNotExist:
            return JsonResponse(data={"error": "invalid data schema"})

    def _create_csv_file(self,
                         columns_queryset,
                         number_of_records,
                         filename,
                         user):
        sorted_columns = self._sort_columns(columns_queryset)
        field_names = self._extract_fieldnames(sorted_columns)

        file = ContentFile("")
        file.name = filename

        with file.open(mode="w") as csv_file:
            writer = csv.writer(
                csv_file, quoting=csv.QUOTE_NONNUMERIC
            )
            writer.writerow(field_names)

            Faker.seed(randint(1, 999999999))
            fake = Faker()

            for i in range(number_of_records):
                self._write_csv_row(writer, sorted_columns, fake)

            UserFile.objects.create(
                user=user,
                csv_file=csv_file
            )

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
