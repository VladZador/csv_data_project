from django.contrib.auth import get_user_model
from django.db import models


class UserFile(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)


class DataSchema(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    schema = models.JSONField()
