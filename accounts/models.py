from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import MaxValueValidator, MinValueValidator
from django.utils import timezone
from django.core.validators import EmailValidator
from accounts.constants import ROLE_CHOICES, GENDER_CHOICES


class CustomUserManager(BaseUserManager):
    def create_user(self, email, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")

        password = extra_fields.pop("password", None)
        username = extra_fields.pop("username", None)
        phoneno = extra_fields.pop("phoneno", None)
        role = extra_fields.pop("role", None)
        gender = extra_fields.pop("gender", None)
        is_staff = extra_fields.pop("is_staff", False)


        if not username or not phoneno or not role or not password or not email:
            raise ValueError(
                f"Username, phoneno, role, password and school must be set!"
            )

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username,
            phoneno=phoneno,
            role=role,
            is_staff=is_staff,
            gender=gender,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("username", "Admin")
        extra_fields.setdefault("phoneno", 6000000000)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("dob", timezone.now())
        extra_fields.setdefault("gender", "m")
        extra_fields.setdefault("password", password)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        unique=True, primary_key=True, validators=[EmailValidator()]
    )
    username = models.CharField(max_length=100, blank=True)
    phoneno = models.IntegerField()
    role = models.CharField(choices=ROLE_CHOICES, max_length=10)
    gender = models.CharField(choices=GENDER_CHOICES, max_length=1)
    dob = models.DateField()
    date_joined = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
