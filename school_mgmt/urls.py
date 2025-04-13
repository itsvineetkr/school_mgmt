from django.contrib import admin
from django.urls import path, include
from school_mgmt import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("accounts.urls")),
    path("schools/", include("schools.urls")),
    path("assessment/", include("assessment.urls")),
    path("", views.homepage, name="homepage"),
]
