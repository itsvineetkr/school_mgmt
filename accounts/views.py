from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import logout, authenticate, get_backends
from django.contrib.auth import login as auth_login
from django.contrib import messages
from django.utils import timezone
from accounts.backends import EmailBackend
from django.urls import reverse
from accounts.utils import *
from django.http import JsonResponse
import os
from accounts.models import CustomUser
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from django.core.cache import cache
import random
from django.core.exceptions import ValidationError
from rest_framework.throttling import AnonRateThrottle
from schools.utils import send_otp_email
from .serializers import (
    ForgotPasswordSerializer,
    OTPVerificationSerializer,
    ResetPasswordSerializer,
)
from accounts.models import CustomUser


def get_user_model():

    return CustomUser


User = get_user_model()


# Custom throttle classes
class EmailThrottle(AnonRateThrottle):
    """Limit OTP requests to 5 per hour per email"""

    rate = "5/hour"

    def get_cache_key(self, request, view):
        email = request.data.get("email", "")
        if email:
            ident = email
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class IPThrottle(AnonRateThrottle):
    """Limit requests to 20 per hour per IP"""

    rate = "20/hour"


class ForgotPasswordView(APIView):
    """
    API view to initiate the forgot password process.
    Sends an OTP to the user's email if the account exists.
    """

    throttle_classes = [EmailThrottle, IPThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]

            # Check if there have been too many recent attempts for this email
            attempts_key = f"password_reset_attempts_{email}"
            attempts = cache.get(attempts_key, 0)

            if attempts >= 5:
                return Response(
                    {
                        "message": "Too many password reset attempts. Please try again later."
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            try:
                user = User.objects.get(email=email, is_active=True)
                # Generate a 6-digit OTP
                otp = random.randint(100000, 999999)

                # Store OTP in cache with the email as key and a 10-minute expiry
                cache_key = f"password_reset_otp_{email}"
                cache.set(cache_key, otp, timeout=600)  # 10 minutes expiry

                # Increment the attempts counter
                cache.set(attempts_key, attempts + 1, timeout=3600)  # 1 hour expiry

                # Send the OTP email
                send_otp_email(email, otp, user.username or "User")

                return Response(
                    {"message": "OTP sent to your email address."},
                    status=status.HTTP_200_OK,
                )
            except User.DoesNotExist:
                # Return a generic message for security reasons
                # Still increment the attempts counter to prevent email enumeration attacks
                cache.set(attempts_key, attempts + 1, timeout=3600)

                return Response(
                    {
                        "message": "If an account with this email exists, an OTP has been sent."
                    },
                    status=status.HTTP_200_OK,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """
    API view to verify the OTP provided by the user.
    """

    throttle_classes = [IPThrottle]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]

            cache_key = f"password_reset_otp_{email}"
            cached_otp = cache.get(cache_key)

            # Track failed verification attempts
            attempts_key = f"otp_verification_attempts_{email}"
            attempts = cache.get(attempts_key, 0)

            if attempts >= 3:
                # After 3 failed attempts, invalidate the OTP
                cache.delete(cache_key)
                return Response(
                    {"message": "Too many failed attempts. Please request a new OTP."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if cached_otp and int(otp) == cached_otp:
                # Generate a secure token for password reset
                reset_token = get_random_string(64)
                cache_key_token = f"password_reset_token_{email}"

                # Store token in cache with 15-minute expiry (reduced from 30 for security)
                cache.set(cache_key_token, reset_token, timeout=900)  # 15 minutes

                # Delete the OTP from cache
                cache.delete(cache_key)

                # Reset the failed attempts counter
                cache.delete(attempts_key)

                return Response(
                    {"message": "OTP verified successfully.", "token": reset_token},
                    status=status.HTTP_200_OK,
                )

            # Increment failed attempts
            cache.set(attempts_key, attempts + 1, timeout=600)

            return Response(
                {"message": "Invalid OTP or OTP expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    """
    API view to reset the user's password after OTP verification.
    """

    throttle_classes = [IPThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            token = serializer.validated_data["token"]
            new_password = serializer.validated_data["new_password"]

            cache_key = f"password_reset_token_{email}"
            cached_token = cache.get(cache_key)

            if cached_token and token == cached_token:
                try:
                    user = User.objects.get(email=email, is_active=True)

                    # Prevent setting a previously used password (optional, requires password history)
                    # if user.check_password(new_password):
                    #     return Response({
                    #         "message": "New password cannot be the same as the old password."
                    #     }, status=status.HTTP_400_BAD_REQUEST)

                    user.set_password(new_password)
                    user.save()

                    # Delete the token from cache
                    cache.delete(cache_key)

                    # Delete any related reset attempts data
                    attempts_key = f"password_reset_attempts_{email}"
                    cache.delete(attempts_key)

                    return Response(
                        {"message": "Password has been reset successfully."},
                        status=status.HTTP_200_OK,
                    )
                except User.DoesNotExist:
                    pass
                except ValidationError as e:
                    return Response(
                        {"message": str(e)}, status=status.HTTP_400_BAD_REQUEST
                    )

            return Response(
                {"message": "Invalid token or token expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def forgot_password(request):
    return render(request, "accounts/forgotPassword.html")


def login_user(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")
        user = authenticate(request, email=email, password=password)
        if user is not None:
            auth_login(request, user, backend="accounts.backends.EmailBackend")
            return redirect("dashboard")
        else:
            messages.error(request, "Incorrect email address or password.")
            return render(request, "accounts/login.html")
    return render(request, "accounts/login.html")


def logout_user(request):
    logout(request)
    return redirect(reverse("login"))
