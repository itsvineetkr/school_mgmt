from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from schools.constants import (
    ROLE_CHOICES,
    ATTENDANCE_STATUS_CHOICES,
    FEE_STATUS_CHOICES,
)
from django.utils import timezone
from datetime import timedelta


class RegisteredSchool(models.Model):
    uniqueSchoolCode = models.CharField(max_length=100, unique=True, null=False)
    schoolName = models.CharField(max_length=200, null=False)
    address = models.CharField(max_length=500, null=False)
    logo = models.ImageField(upload_to="school_logos")

    def __str__(self):
        return self.schoolName


class AccountAffiliation(models.Model):
    school = models.ForeignKey(
        RegisteredSchool, on_delete=models.CASCADE, null=False, blank=False
    )
    account = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE, null=False, blank=False
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.school.uniqueSchoolCode} - {self.account.username}"


class ClassAssessment(models.Model):
    school = models.ForeignKey(RegisteredSchool, on_delete=models.CASCADE)
    standard = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(12)],
    )
    section = models.CharField(max_length=1)
    role = models.CharField(choices=ROLE_CHOICES, max_length=10)
    account = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE, null=False, blank=False
    )

    def __str__(self):
        return f"{self.standard} - {self.account.username}"


class Attendance(models.Model):
    school = models.ForeignKey(RegisteredSchool, on_delete=models.CASCADE)
    student = models.ForeignKey("accounts.CustomUser", on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    status = models.CharField(choices=ATTENDANCE_STATUS_CHOICES, max_length=20)

    def __str__(self):
        return f"{self.student.username} - {self.date} - {self.status}"


class Event(models.Model):
    school = models.ForeignKey(RegisteredSchool, on_delete=models.CASCADE)
    eventName = models.CharField(max_length=200, null=False)
    venue = models.CharField(max_length=500, null=False)
    description = models.TextField(null=False)
    date = models.DateField(null=False)

    def __str__(self):
        return self.eventName


class FeeStatus(models.Model):
    school = models.ForeignKey(RegisteredSchool, on_delete=models.CASCADE)
    student = models.ForeignKey("accounts.CustomUser", on_delete=models.CASCADE)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    payment_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=FEE_STATUS_CHOICES)

    def __str__(self):
        return f"{self.student.username} - {self.due_date} - {self.status}"


class UserOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(minutes=10)
