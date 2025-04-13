from django.conf.urls import static
from django.conf import settings
from accounts import views
from django.urls import path

urlpatterns = [
    path("login/", views.login_user, name='login'),
    path("logout/", views.logout_user, name='logout'),
]
