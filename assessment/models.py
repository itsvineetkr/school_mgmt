from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class AssessmentStore(models.Model):
    """
    Model representing an assessment.
    """

    name = models.CharField(max_length=255)
    description = models.TextField()
    standard = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(12)],
    )
    section = models.CharField(max_length=1)
    teacher = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE, null=False, blank=False
    )
    assessment = models.JSONField(null=False, blank=False)
    due_date = models.DateField()
    duration = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Duration in minutes",
    )
    school = models.ForeignKey(
        "schools.RegisteredSchool", on_delete=models.CASCADE, null=False, blank=False
    )
    # created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name + f" - {self.standard} - {self.section}"


class AssessmentSubmission(models.Model):
    """
    Model representing a submission for an assessment.
    """

    assessment = models.ForeignKey(AssessmentStore, on_delete=models.CASCADE)
    student = models.ForeignKey("accounts.CustomUser", on_delete=models.CASCADE)
    standard = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(12)],
    )
    section = models.CharField(max_length=1)
    submission_date = models.DateTimeField(auto_now_add=True)
    max_score = models.IntegerField(null=True, blank=True)
    obtained_score = models.IntegerField(null=True, blank=True)
    remark = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.username} - {self.assessment.name}"
