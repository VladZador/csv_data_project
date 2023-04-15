from django.contrib.auth import get_user_model
from django.db import models

from .choices import ColumnNames


class UserFile(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.user} | {self.filename}"


class Column(models.Model):
    field = models.CharField(choices=ColumnNames.choices, max_length=64)
    index = models.PositiveSmallIntegerField()
    min = models.PositiveSmallIntegerField(null=True)
    max = models.PositiveSmallIntegerField(null=True)

    def __str__(self):
        string = f"{self.index}. {self.field}"
        if self.min:
            string += f" | min={self.min}"
        if self.max:
            string += f" | max={self.max}"
        return string


class DataSchema(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    columns = models.ManyToManyField(Column)

    def __str__(self):
        columns = ', '.join(str(col) for col in self.columns.all())
        return f"{self.user} | {self.name} | {columns}"
