from django.urls import path

from .views import UserFileView, DataSchemaCreateView, DataSchemaRedirectView

urlpatterns = [
    path('', UserFileView.as_view(), name="user_files"),
    path('create-schema/',
         DataSchemaCreateView.as_view(),
         name="create_schema"
         ),
    path("create-schema/confirm/",
         DataSchemaRedirectView.as_view(),
         name="confirm_schema_creation"),
]
