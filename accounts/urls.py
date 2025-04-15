from django.conf.urls import static
from django.conf import settings
from accounts import views
from django.urls import path

urlpatterns = [
    path("login/", views.login_user, name="login"),
    path("logout/", views.logout_user, name="logout"),
    path(
        "api/forgot-password/",
        views.ForgotPasswordView.as_view(),
        name="forgot_password",
    ),
    path("api/verify-otp/", views.VerifyOTPView.as_view(), name="verify_otp"),
    path(
        "api/reset-password/", views.ResetPasswordView.as_view(), name="reset_password"
    ),
    path("forgot-password/", views.forgot_password, name="forgot_assword"),
]
