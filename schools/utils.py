from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from accounts.models import CustomUser
from schools.models import Attendance, ClassAssessment
from datetime import datetime


def create_default_password(name: str, dob: str) -> str:
    """
    Generates a default password for new users.
    The password is set to 'password' by default.
    """
    name_part = name[0 : min(4, len(name))].upper()
    year_part = dob.split("-")[0]
    default_password = f"{name_part}{year_part}"

    # return default_password
    return "password"


def send_otp_email(email, otp, name):
    """
    Sends an OTP email with the provided OTP and name using the email template.

    Args:
        email (str): The recipient's email address.
        otp (int): The one-time password to send.
        name (str): The recipient's name.

    Returns: None
    """

    html_content = render_to_string(
        "mailTemplates/otpMail.html", {"otp": otp, "name": name}
    )
    text_content = strip_tags(html_content)

    subject = "Your OTP Code to change password!"
    from_email = settings.EMAIL_HOST_USER
    recipient_list = [email]

    email = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    email.attach_alternative(html_content, "text/html")
    email.send()


def send_assessment_score_email(assessmentSubmission):
    # Extract required information from assessmentSubmission
    student_name = assessmentSubmission.student.username
    assessment_name = assessmentSubmission.assessment.name
    assessment_subject = assessmentSubmission.assessment.subject
    teacher_name = assessmentSubmission.assessment.teacher.username
    submission_date = assessmentSubmission.submission_date
    marks_obtained = assessmentSubmission.obtained_score
    total_marks = assessmentSubmission.max_score
    remarks = assessmentSubmission.remark

    recipient_email = assessmentSubmission.student.email

    context = {
        "studentName": student_name,
        "assessmentName": assessment_name,
        "assessmentSubject": assessment_subject,
        "teacher": teacher_name,
        "submissionDate": submission_date,
        "marksObtained": marks_obtained,
        "totalMarks": total_marks,
        "remarks": remarks,
    }

    html_content = render_to_string("mailTemplates/assessmentScore.html", context)
    text_content = strip_tags(html_content)

    subject = "Your Assessment Score"
    from_email = settings.EMAIL_HOST_USER
    recipient_list = [recipient_email]

    email = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    email.attach_alternative(html_content, "text/html")
    email.send()


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


def send_event_email(event):
    # Extract required information from the event

    eventName = event.eventName
    venue = event.venue
    description = event.description
    date = event.date
    school = event.school

    # Get all students' emails
    student_emails = [
        i.account.email
        for i in ClassAssessment.objects.filter(role="student", school=school)
    ]

    for email in student_emails:
        context = {
            "eventName": eventName,
            "venue": venue,
            "description": description,
            "date": date,
        }

        html_content = render_to_string("mailTemplates/eventNotification.html", context)
        text_content = strip_tags(html_content)

        subject = "New Event Notification"
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [email]

        email = EmailMultiAlternatives(
            subject, text_content, from_email, recipient_list
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
