from django.views import View
from django.views.generic import ListView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, Http404
from django.utils.decorators import method_decorator

from .models import UserFile, DataSchema
from website.decorators import ajax_required

from .services import DataSchemaCreateService, GenerateDataService


class MainView(TemplateView):
    template_name = "index.html"


class DataSchemaView(LoginRequiredMixin, TemplateView):
    template_name = "csv_data/create_schema.html"


@method_decorator(ajax_required, name="dispatch")
class DataSchemaCreateView(LoginRequiredMixin, View):

    @staticmethod
    def post(request, *args, **kwargs):
        data_schema = DataSchemaCreateService(request)
        return data_schema.create_data_schema()


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

    @staticmethod
    def post(request, *args, **kwargs):
        data = GenerateDataService(request)
        response = data.generate_data()
        return response


@login_required
def download_file(request, *args, **kwargs):
    filename = kwargs["filename"]
    try:
        csv_file_instance = UserFile.objects.get(
            user=request.user,
            csv_file=filename
        )

        with csv_file_instance.csv_file.open(mode="r") as csv_file:
            response = HttpResponse(csv_file, content_type="text/csv")
            response['Content-Disposition'] = f"attachment; filename={filename}"
        return response
    except UserFile.DoesNotExist:
        raise Http404(f'File "{filename}" does not exist')
