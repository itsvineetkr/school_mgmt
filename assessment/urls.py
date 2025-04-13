from django.urls import path
from assessment import views


urlpatterns = [
    path("api/generate", views.generate_assessment, name="generate"),
    path("api/save", views.save_assessment, name="save"),
    path("api/get_assessment", views.get_assessments, name="get_assessment"),
    path("api/delete_assessment", views.delete_assessment, name="delete_assessment"),
    path("api/submit_assessment", views.submit_assessment, name="submit_assessment"),
    path(
        "take-assessment/<int:assessment_id>/",
        views.take_assessment,
        name="take_assessment",
    ),
]
