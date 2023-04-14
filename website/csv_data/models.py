from django.contrib.auth import get_user_model
from django.db import models

from .choices import ColumnNames


class UserFile(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)


class Column(models.Model):
    field = models.CharField(choices=ColumnNames.choices, max_length=64)
    index = models.PositiveSmallIntegerField()
    min = models.PositiveSmallIntegerField(null=True)
    max = models.PositiveSmallIntegerField(null=True)


class DataSchema(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    columns = models.ManyToManyField(Column)
