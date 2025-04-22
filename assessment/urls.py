from django.urls import path
from assessment import views


urlpatterns = [
    path("api/generate", views.generate_assessment, name="generate"),
    path("api/save", views.save_assessment, name="save"),
    path("api/get_assessment", views.get_assessments, name="get_assessment"),
    path("api/delete_assessment", views.delete_assessment, name="delete_assessment"),
    path("api/submit_assessment", views.submit_assessment, name="submit_assessment"),
    path(
        "api/get_assessment_submissions",
        views.get_assessment_submissions,
        name="get_assessment_submissions",
    ),
    path(
        "api/get_assessment_list",
        views.get_assessment_list,
        name="get_assessment_list",
    ),
    path(
        "take-assessment/<int:assessment_id>/",
        views.take_assessment,
        name="take_assessment",
    ),
    path(
        "api/save_assessment_student",
        views.save_assessment_student,
        name="save_assessment_student",
    ),
    path(
        "api/generate_assessment_student",
        views.generate_assessment_student,
        name="generate_assessment_student",
    ),
    path(
        "api/delete_assessment_student",
        views.delete_assessment_student,
        name="delete_assessment_student",
    ),
    path(
        "api/get_assessments_student",
        views.get_assessments_student,
        name="get_assessments_student",
    ),
]
