from django.urls import path

from .views import UserFileView, DataSchemaView, DataSchemaCreateView, \
    GenerateDataView

urlpatterns = [
    path('', UserFileView.as_view(), name="user_files"),
    path('generate-data/',
         GenerateDataView.as_view(),
         name="generate_data"),
    path('create-schema/',
         DataSchemaView.as_view(),
         name="create_schema"),
    path("create-schema/confirm/",
         DataSchemaCreateView.as_view(),
         name="confirm_schema_creation"),
]
