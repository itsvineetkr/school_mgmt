from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from accounts.models import CustomUser as User


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(max_length=64)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Check if passwords match
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords don't match")

        # Validate password strength
        try:
            validate_password(data["new_password"])
        except Exception as e:
            raise serializers.ValidationError({"new_password": list(e)})

        return data
