from django.urls import path

from .views import UserFileView, DataSchemaView, DataSchemaCreateView, \
    GenerateDataView, MainView

urlpatterns = [
    path('', MainView.as_view(), name="main"),
    path('csv-files/', UserFileView.as_view(), name="user_files"),
    path('csv-files/generate-data/',
         GenerateDataView.as_view(),
         name="generate_data"),
    path('create-schema/',
         DataSchemaView.as_view(),
         name="create_schema"),
    path("create-schema/confirm/",
         DataSchemaCreateView.as_view(),
         name="confirm_schema_creation"),
]
