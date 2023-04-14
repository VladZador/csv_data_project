from django.db import models


class ColumnNames(models.TextChoices):
    FULL_NAME = "Full name"
    JOB = "Job"
    EMAIL = "Email"
    DOMAIN_NAME = "Domain name"
    PHONE_NUMBER = "Phone number"
    COMPANY_NAME = "Company name"
    TEXT = "Text"
    INTEGER = "Integer"
    ADDRESS = "Address"
    DATE = "Date"
