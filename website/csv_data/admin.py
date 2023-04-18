from django.contrib import admin

from .models import Column, DataSchema, UserFile


admin.site.register(Column)


class ColumnInline(admin.TabularInline):
    model = DataSchema.columns.through


@admin.register(DataSchema)
class DataSchemaAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "get_columns")
    inlines = [ColumnInline]
    exclude = ["columns"]

    @admin.display(description="Columns")
    def get_columns(self, obj):
        return list(obj.columns.all())


@admin.register(UserFile)
class UserFileAdmin(admin.ModelAdmin):
    list_display = ("csv_file", "user")
