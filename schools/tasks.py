from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from accounts.models import CustomUser
from schools.models import Attendance, ClassAssessment
from datetime import datetime


def send_attendance_email():
    emails = list(
        CustomUser.objects.filter(role="student").values_list("email", flat=True)
    )

    current_month = datetime.now().month
    current_year = datetime.now().year

    attendance_data = {}
    for email in emails:
        # Get student user object
        student = CustomUser.objects.get(email=email)

        # Get attendance records for current month
        monthly_attendance = Attendance.objects.filter(
            student=student, date__month=current_month, date__year=current_year
        )

        present_days = monthly_attendance.filter(status="present").count()
        total_days = monthly_attendance.count()

        context = {
            "monthName": datetime.now().strftime("%B"),
            "year": current_year,
            "studentName": student.username,
            "presentDays": present_days,
            "absentDays": total_days - present_days,
            "attendancePercentage": round(
                (present_days / total_days * 100) if total_days > 0 else 0, 2
            ),
        }

        html_content = render_to_string("mailTemplates/monthlyAttendance.html", context)
        text_content = strip_tags(html_content)

        subject = "Your Monthly Attendance Report"
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [email]

        email = EmailMultiAlternatives(
            subject, text_content, from_email, recipient_list
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
