from django.urls import path
from schools import views


urlpatterns = [
    path("api/add_principal", views.add_principal, name="add_principal"),
    path("api/fetch_class_data/", views.fetch_class_data, name="fetch_class_data"),
    path("api/change-password", views.change_password, name="change_password"),
    path("api/add_student", views.add_student, name="add_student"),
    path("api/bulk_add_student", views.bulk_add_student, name="bulk_add_student"),
    path("api/add_teacher", views.add_teacher, name="add_teacher"),
    path("api/delete_student", views.delete_student, name="delete_student"),
    path("api/delete_teacher", views.delete_teacher, name="delete_teacher"),
    path("api/update_student", views.update_student, name="update_student"),
    path("api/update_teacher", views.update_teacher, name="update_teacher"),
    path(
        "api/assign_class_to_teacher",
        views.assign_class_to_teacher,
        name="assign_class_to_teacher",
    ),
    path("api/event", views.get_events, name="events"),
    path("api/add_event", views.add_event, name="add_event"),
    path("api/delete_event", views.delete_event, name="delete_event"),
    path("api/add_attendance", views.add_attendance, name="add_attendance"),
    path("api/get_attendance", views.get_attendance, name="get_attendance"),
    path("api/get_fee_status/", views.get_fee_status, name="get_fee_status"),
    path("api/update_fee_status", views.update_fee_status, name="update_fee_status"),
    path(
        "api/assigned_classes",
        views.get_assigned_classes_to_teachers,
        name="assigned_classes",
    ),
    path(
        "api/unassign_class",
        views.unassign_class_from_teacher,
        name="unassign_class",
    ),
    path("dashboard", views.dashboard, name="dashboard"),
]
