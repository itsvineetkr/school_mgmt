from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from accounts.models import CustomUser
from schools.models import ClassAssessment, AccountAffiliation, Event
from schools.validation import validate_section, validate_standard
from schools.utils import create_default_password, send_event_email
from schools.tasks import send_attendance_email
import pandas as pd
import json
from datetime import datetime
from schools.models import FeeStatus, RegisteredSchool, AccountAffiliation, Attendance
from django.db.models import F


def dashboard(request):
    if request.user.is_anonymous:
        return redirect("/")

    if request.user.role == "student":
        school = AccountAffiliation.objects.get(account=request.user).school

        if school.uniqueSchoolCode == "adminSchool":
            student = ClassAssessment.objects.get(account=request.user)
            context = {
                "student": student,
                "user": request.user,
                "school": school,
            }
            return render(request, "schools/dash-special-student.html", context=context)

    if request.user.role == "principal":
        context = {
            "user": request.user,
        }
        try:
            school = AccountAffiliation.objects.get(account=request.user).school
            context["school"] = school
        except AccountAffiliation.DoesNotExist:
            context["school"] = None
        return render(request, "schools/dash-principal.html", context)

    if request.user.role == "teacher":
        context = {}
        standards = [
            (standard.standard, standard.section)
            for standard in ClassAssessment.objects.filter(account=request.user)
        ]
        unique_standards = []
        for standard in ClassAssessment.objects.filter(account=request.user):
            if standard.standard not in unique_standards:
                unique_standards.append(standard.standard)

        user = request.user
        try:
            school = AccountAffiliation.objects.get(account=request.user).school
        except AccountAffiliation.DoesNotExist:
            school = None

        context = {
            "unique_standards": sorted(unique_standards),
            "standards": standards,
            "user": user,
            "school": school,
        }

        return render(request, "schools/dash-teacher.html", context)

    if request.user.role == "student":
        try:
            student = ClassAssessment.objects.get(account=request.user)
            context = {
                "student": student,
                "user": request.user,
                "school": student.school,
            }
        except ClassAssessment.DoesNotExist:
            context = {"error": "Student not found"}
        return render(request, "schools/dash-student.html", context=context)

    if request.user.role == "admin":
        context = {}

        # Get all principals and their schools for admin dashboard
        affiliations = AccountAffiliation.objects.filter(account__role="principal")
        principals_and_schools = []
        for affiliation in affiliations:
            no_of_students = ClassAssessment.objects.filter(
                school=affiliation.school, role="student"
            ).count()
            no_of_teachers = ClassAssessment.objects.filter(
                school=affiliation.school, role="teacher"
            ).count()
            principals_and_schools.append(
                {
                    "school_name": affiliation.school.schoolName,
                    "unique_code": affiliation.school.uniqueSchoolCode,
                    "principal_name": affiliation.account.username,
                    "email": affiliation.account.email,
                    "phone": affiliation.account.phoneno,
                    "no_of_students": no_of_students,
                    "no_of_teachers": no_of_teachers,
                }
            )
        context["schools"] = principals_and_schools

        if request.method == "POST":
            data = request.POST
            action = data.get("action")
            if action == "add":
                if "logo" in request.FILES:
                    logo = request.FILES["logo"]
                else:
                    logo = None

                principal_data = {
                    "name": data.get("name"),
                    "email": data.get("email"),
                    "phoneno": data.get("phone"),
                    "gender": data.get("gender"),
                    "dob": data.get("dob"),
                    "password": data.get("password"),
                }

                school_data = {
                    "unique_code": data.get("schoolUniqueCode"),
                    "name": data.get("schoolName"),
                    "address": data.get("address"),
                    "logo": logo,
                }

                # Create principal account
                principalAccount = CustomUser(
                    email=principal_data["email"],
                    username=principal_data["name"],
                    phoneno=principal_data["phoneno"],
                    role="principal",
                    gender=principal_data["gender"],
                    dob=principal_data["dob"],
                )
                principalAccount.set_password(principal_data["password"])
                principalAccount.save()

                # Create school
                school = RegisteredSchool(
                    uniqueSchoolCode=school_data["unique_code"],
                    schoolName=school_data["name"],
                    address=school_data["address"],
                    logo=school_data["logo"],
                )
                school.save()

                # Link principal to school
                AccountAffiliation(school=school, account=principalAccount).save()

            if action == "remove":
                school_unique_code = data.get("schoolUniqueCode")
                email = data.get("email")

                try:
                    school = RegisteredSchool.objects.get(
                        uniqueSchoolCode=school_unique_code
                    )
                    principal = CustomUser.objects.get(email=email, role="principal")
                    AccountAffiliation.objects.get(
                        school=school, account=principal
                    ).delete()
                    principal.delete()
                    school.delete()
                except (
                    RegisteredSchool.DoesNotExist,
                    CustomUser.DoesNotExist,
                    AccountAffiliation.DoesNotExist,
                ):
                    pass
        return render(request, "schools/dash-admin.html", context)


@api_view(["POST"])
def add_principal(request):
    """
    In a json give the following details:

    {
        "name": "Vineet Kumar",
        "email": "vineet@gmail.com",
        "phoneno": "9555648766",
        "gender": "m",
        "dob": "2004-12-10",
        "password": "7686"
    }
    """
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if not request.user.is_superuser:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    try:
        data = request.data
        name = data.get("name")
        email = data.get("email")
        phoneno = data.get("phoneno")
        gender = data.get("gender")
        dob = data.get("dob")
        password = data.get("password")
    except json.JSONDecodeError:
        return Response({"status": 400, "message": "Invalid JSON format"}, status=400)
    except KeyError:
        return Response(
            {"status": 400, "message": "Missing required fields"}, status=400
        )

    principalAccount = CustomUser(
        email=email,
        username=name,
        phoneno=phoneno,
        role="principal",
        gender=gender,
        dob=dob,
    )
    principalAccount.set_password(password)
    principalAccount.save()

    return Response({"status": 200, "message": "Principal added successfully"})


@api_view(["POST"])
def fetch_class_data(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    try:
        standard = int(request.data.get("standard"))
        section = str(request.data.get("section")).lower()
    except:
        return Response({"status": 400, "message": "Invalid input"}, status=400)

    if not validate_standard(standard) or not validate_section(section):
        return Response(
            {"status": 400, "message": "Invalid standard or section"}, status=400
        )
    try:
        school = AccountAffiliation.objects.get(account=request.user).school
        students = ClassAssessment.objects.filter(
            school=school, standard=standard, section=section, role="student"
        )
        students = students.annotate(username=F("account__username"))
    except AccountAffiliation.DoesNotExist:
        return Response({"status": 404, "message": "School not found"}, status=404)
    except ClassAssessment.DoesNotExist:
        return Response({"status": 404, "message": "Students not found"}, status=404)

    return Response({"status": 200, "data": list(students.values())})


@api_view(["POST"])
def add_student(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data

    try:
        standard = int(data.get("standard"))
        section = str(data.get("section")).lower()
        name = data.get("name")
        phoneno = int(data.get("phoneno"))
        gender = data.get("gender")
        email = data.get("email")
        dob = data.get("dob")
    except:
        return Response(
            {"status": 400, "message": "Missing required fields in request body"},
            status=400,
        )

    if not validate_standard(standard) or not validate_section(section):
        return Response(
            {"status": 400, "message": "Invalid standard or section"}, status=400
        )

    school = AccountAffiliation.objects.get(account=request.user).school

    # Check if the student already exists
    if CustomUser.objects.filter(email=email, role="student").exists():
        return Response(
            {"status": 400, "message": "Student with this email already exists"},
            status=400,
        )

    studentAccount = CustomUser(
        email=email,
        username=name,
        phoneno=phoneno,
        role="student",
        gender=gender,
        dob=dob,
    )

    # Create password from first four letters of name (capitalized) + year of birth
    password = create_default_password(name, dob)
    studentAccount.set_password(password)

    studentAccount.save()

    AccountAffiliation(school=school, account=studentAccount).save()

    # Create a ClassAssessment entry for the student
    # Check if the class assessment already exists
    if ClassAssessment.objects.filter(
        account=studentAccount,  # Use the studentAccount object
        school=school,
        standard=standard,
        section=section,
        role="student",
    ).exists():
        return Response(
            {"status": 400, "message": "Class assessment already exists"}, status=400
        )

    ClassAssessment(
        school=school,
        standard=standard,
        role="student",
        account=studentAccount,
        section=section,
    ).save()

    return Response({"status": 200, "message": "Student added successfully"})


@api_view(["POST"])
def add_teacher(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data

    try:
        name = data.get("name")
        phoneno = int(data.get("phoneno"))
        gender = data.get("gender")
        email = data.get("email")
        dob = data.get("dob")
    except:
        return Response(
            {"status": 400, "message": "Missing required fields in request body"},
            status=400,
        )

    school = AccountAffiliation.objects.get(account=request.user).school
    teacherAccount = CustomUser(
        email=email,
        username=name,
        phoneno=phoneno,
        role="teacher",
        gender=gender,
        dob=dob,
    )
    # Create password from first four letters of name (capitalized) + year of birth
    print(dob)
    password = create_default_password(name, dob)

    teacherAccount.set_password(password)
    teacherAccount.save()
    AccountAffiliation(school=school, account=teacherAccount).save()

    return Response({"status": 200, "message": "Teacher added successfully"})


@api_view(["DELETE"])
def delete_student(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data

    try:
        name = data.get("name")
        email = data.get("email")
    except:
        return Response(
            {"status": 400, "message": "Missing required fields in request body"},
            status=400,
        )

    studentAccount = CustomUser(email=email, username=name, role="student")
    studentAccount.delete()

    return Response({"status": 200, "message": "Student record deleted successfully"})


@api_view(["DELETE"])
def delete_teacher(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data
    try:
        name = data.get("name")
        email = data.get("email")
    except:
        return Response(
            {"status": 400, "message": "Missing required fields in response body"},
            status=400,
        )

    teacherAccount = CustomUser(email=email, username=name, role="teacher")
    teacherAccount.delete()

    return Response({"status": 200, "message": "Teacher record deleted successfully"})


@api_view(["PUT"])
def update_student(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data

    try:
        email = data.get("email")
        updates = data.get("updates")
    except:
        return Response(
            {"status": 400, "message": "Missing required fields in response body"},
            status=400,
        )

    try:
        studentAccount = CustomUser.objects.get(email=email, role="student")
        classAssessment = ClassAssessment.objects.get(
            account=studentAccount, role="student"
        )
        for key, value in updates.items():
            if key == "phoneno":
                value = int(value)
                setattr(studentAccount, key, value)
            if key == "standard":
                if not validate_standard(int(value)):
                    return Response(
                        {"status": 400, "message": "Enter valid standard value"},
                        status=400,
                    )
                value = int(value)
                setattr(classAssessment, key, value)
            if key == "section":
                if not validate_section(value):
                    return Response(
                        {"status": 400, "message": "Enter valid section value"},
                        status=400,
                    )
                value = value.lower()
                setattr(classAssessment, key, value)
            if key == "dob":
                try:
                    value = datetime.strptime(value, "%Y-%m-%d").date()
                    setattr(studentAccount, key, value)
                except ValueError:
                    return Response(
                        {
                            "status": 400,
                            "message": "Invalid date format. Use YYYY-MM-DD.",
                        },
                        status=400,
                    )
            if key == "username":
                if not value:
                    return Response(
                        {"status": 400, "message": "Username cannot be empty"},
                        status=400,
                    )
                setattr(studentAccount, key, value)
            if key == "gender":
                if value not in ["m", "f", "p", "o"]:
                    return Response(
                        {
                            "status": 400,
                            "message": "Gender can only be 'm' or 'f' or 'p' or 'o'",
                        },
                        status=400,
                    )
                setattr(studentAccount, key, value)

        studentAccount.save()
        classAssessment.save()
    except CustomUser.DoesNotExist:
        return Response({"status": 404, "message": "Student not found"}, status=404)
    except ClassAssessment.DoesNotExist:
        return Response(
            {"status": 404, "message": "Class assessment not found"}, status=404
        )
    except Exception as e:
        return Response(
            {"status": 400, "message": f"Error updating student: {str(e)}"},
            status=400,
        )

    return Response({"status": 200, "message": "Student record updated successfully"})


@api_view(["PUT"])
def update_teacher(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data

    try:
        email = data.get("email")
        updates = data.get("updates")
    except:
        return Response(
            {"status": 400, "message": "Missing required fields in response body"},
            status=400,
        )

    try:
        teacherAccount = CustomUser.objects.get(email=email, role="teacher")
        for key, value in updates.items():
            if key == "phoneno":
                value = int(value)
            if key == "username":
                if not value:
                    return Response(
                        {"status": 400, "message": "Username cannot be empty"},
                        status=400,
                    )
            if key == "gender":
                if value not in ["m", "f", "p", "o"]:
                    return Response(
                        {
                            "status": 400,
                            "message": "Gender can only be 'm' or 'f' or 'p' or 'o'",
                        },
                        status=400,
                    )
            if key == "dob":
                try:
                    value = datetime.strptime(value, "%Y-%m-%d").date()
                except ValueError:
                    return Response(
                        {
                            "status": 400,
                            "message": "Invalid date format. Use YYYY-MM-DD.",
                        },
                        status=400,
                    )
            setattr(teacherAccount, key, value)
        teacherAccount.save()
    except CustomUser.DoesNotExist:
        return Response({"status": 404, "message": "Teacher not found"}, status=404)

    return Response({"status": 200, "message": "Teacher record updated successfully"})


@api_view(["POST"])
def bulk_add_student(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if "file" not in request.FILES:
        return Response({"status": 400, "message": "No file uploaded"}, status=400)

    file = request.FILES["file"]

    try:
        if file.name.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.name.endswith(".xlsx"):
            df = pd.read_excel(file)
        elif file.name.endswith(".json"):
            df = pd.read_json(file)
        else:
            return Response(
                {"status": 400, "message": "Unsupported file format"}, status=400
            )
    except Exception as e:
        return Response({"status": 400, "message": "Error reading file"}, status=400)

    required_columns = {
        "name",
        "phoneno",
        "gender",
        "email",
        "dob",
        "standard",
        "section",
    }
    if not required_columns.issubset(df.columns):
        return Response(
            {"status": 400, "message": "Missing required columns in file"}, status=400
        )

    data = df.to_dict(orient="records")

    school = AccountAffiliation.objects.get(account=request.user).school

    for student in data:
        try:
            # Check if the student already exists
            if CustomUser.objects.filter(
                email=student["email"], role="student"
            ).exists():
                return Response(
                    {
                        "status": 400,
                        "message": f"Student with email {student['email']} already exists",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            studentAccount = CustomUser(
                email=student["email"],
                username=student["name"],
                phoneno=int(student["phoneno"]),
                role="student",
                gender=student["gender"],
                dob=student["dob"],
            )
            # Create password from first four letters of name (capitalized) + year of birth
            password = create_default_password(student["name"], student["dob"])
            studentAccount.set_password(password)
            studentAccount.save()

            AccountAffiliation(school=school, account=studentAccount).save()
            # Check if the class assessment already exists
            if ClassAssessment.objects.filter(
                school=school,
                standard=int(student["standard"]),
                section=str(student["section"]).lower(),
                role="student",
            ).exists():
                return Response(
                    {
                        "status": 400,
                        "message": f"Class assessment for {student['name']} already exists",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Create a ClassAssessment entry for the student
            ClassAssessment(
                school=school,
                standard=int(student["standard"]),
                role="student",
                account=studentAccount,
                section=str(student["section"]).lower(),
            ).save()
        except Exception as e:
            return Response(
                {"status": 400, "message": f"Error adding student: {student['name']}"},
                status=400,
            )

    return Response({"status": 200, "data": data})


@api_view(["POST"])
def assign_class_to_teacher(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.data

    try:
        email = data.get("email")
        standard = int(data.get("standard"))
        section = str(data.get("section")).lower()

    except:
        return Response(
            {
                "status": 400,
                "message": "Missing required fields in response body or invaild data input.",
            },
            status=400,
        )

    if not validate_standard(standard) or not validate_section(section):
        return Response(
            {"status": 400, "message": "Invalid standard or section"}, status=400
        )

    try:
        teacherAccount = CustomUser.objects.get(email=email, role="teacher")
        school = AccountAffiliation.objects.get(account=request.user).school
        ClassAssessment(
            school=school,
            standard=standard,
            role="teacher",
            account=teacherAccount,
            section=section,
        ).save()
    except CustomUser.DoesNotExist:
        return Response({"status": 404, "message": "Teacher not found"}, status=404)

    return Response({"status": 200, "message": "Teacher record updated successfully"})


@api_view(["DELETE"])
def unassign_class_from_teacher(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if not request.user.role == "principal":
        return Response({"status": 401, "message": "Action not allowed!"}, status=401)

    data = request.data

    try:
        email = data.get("email")
        standard = int(data.get("standard"))
        section = str(data.get("section")).lower()
        print(email, standard, section)
    except:
        return Response(
            {
                "status": 400,
                "message": "Missing required fields in response body or invaild data input.",
            },
            status=400,
        )

    if not validate_standard(standard) or not validate_section(section):
        return Response(
            {"status": 400, "message": "Invalid standard or section"}, status=400
        )

    try:
        teacherAccount = CustomUser.objects.get(email=email, role="teacher")
        school = AccountAffiliation.objects.get(account=request.user).school
        ClassAssessment.objects.filter(
            school=school,
            standard=standard,
            role="teacher",
            account=teacherAccount,
            section=section,
        ).delete()
    except CustomUser.DoesNotExist:
        return Response({"status": 404, "message": "Teacher not found"}, status=404)

    return Response({"status": 200, "message": "Teacher record updated successfully"})


@api_view(["GET"])
def get_assigned_classes_to_teachers(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if request.user.role in ["student", "teacher"]:
        return Response({"status": 401, "message": "Not Allowed!"}, status=401)

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
        assignments = ClassAssessment.objects.filter(role="teacher", school=school)
        result = {}
        for assignment in assignments:
            teacher_email = str(assignment.account.email)
            teacher_username = assignment.account.username
            teacher = f"{teacher_username}~{teacher_email}"
            if teacher not in result:
                result[teacher] = []
            result[teacher].append(f"{assignment.standard}-{assignment.section}")

    except ClassAssessment.DoesNotExist:
        return Response({"status": 404, "message": "No assignments found"}, status=404)
    return Response({"status": 200, "data": result}, status=200)


@api_view(["POST"])
def add_event(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if not request.user.role == "principal" and not request.user.role == "teacher":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    try:
        data = request.data
        eventName = data.get("eventName")
        venue = data.get("venue")
        description = data.get("description")
        date = data.get("date")
    except json.JSONDecodeError:
        return Response({"status": 400, "message": "Invalid JSON format"}, status=400)
    except KeyError:
        return Response(
            {"status": 400, "message": "Missing required fields"}, status=400
        )

    date = datetime.strptime(date, "%Y-%m-%d").date()

    school = AccountAffiliation.objects.get(account=request.user).school
    event = Event(
        school=school,
        eventName=eventName,
        venue=venue,
        description=description,
        date=date,
    )
    event.save()

    send_event_email(event)

    return Response({"status": 200, "message": "Event added successfully"})


@api_view(["GET"])
def get_events(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    school = AccountAffiliation.objects.get(account=request.user).school
    events = Event.objects.filter(school=school)

    return Response({"status": 200, "data": list(events.values())})


@api_view(["DELETE"])
def delete_event(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if not request.user.role == "principal" and not request.user.role == "teacher":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    try:
        data = request.body
        data = json.loads(data)
        event_id = data.get("event_id")
    except json.JSONDecodeError:
        return Response({"status": 400, "message": "Invalid JSON format"}, status=400)
    except KeyError:
        return Response(
            {"status": 400, "message": "Missing required fields"}, status=400
        )

    try:
        event = Event.objects.get(id=event_id)
        event.delete()
    except Event.DoesNotExist:
        return Response({"status": 404, "message": "Event not found"}, status=404)

    return Response({"status": 200, "message": "Event deleted successfully"})


@api_view(["POST"])
def update_fee_status(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if request.user.role not in ["teacher", "principal"]:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    data = request.data
    try:
        student_email = data.get("student_email")
        fee_amount = data.get("fee_amount")
        due_date = data.get("due_date")
        payment_date = data.get("payment_date")  # optional
        status_value = data.get("status")
        if not (student_email and fee_amount and due_date and status_value):
            return Response(
                {"status": 400, "message": "Missing required fields"}, status=400
            )
    except Exception as e:
        return Response({"status": 400, "message": "Invalid input"}, status=400)

    try:
        student = CustomUser.objects.get(email=student_email, role="student")
    except CustomUser.DoesNotExist:
        return Response({"status": 404, "message": "Student not found"}, status=404)

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
    except AccountAffiliation.DoesNotExist:
        return Response({"status": 404, "message": "School not found"}, status=404)

    try:
        due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
    except ValueError:
        return Response(
            {"status": 400, "message": "Invalid due_date format. Use YYYY-MM-DD."},
            status=400,
        )

    # Check for an existing fee entry for same student, school, and same due_date month/year
    existing_fee = FeeStatus.objects.filter(
        student=student,
        school=school,
        due_date__year=due_date_obj.year,
        due_date__month=due_date_obj.month,
    ).first()

    if existing_fee:
        # Update record if it exists
        existing_fee.fee_amount = fee_amount
        existing_fee.due_date = due_date_obj
        if payment_date:
            try:
                payment_date_obj = datetime.strptime(payment_date, "%Y-%m-%d").date()
                existing_fee.payment_date = payment_date_obj
            except ValueError:
                return Response(
                    {
                        "status": 400,
                        "message": "Invalid payment_date format. Use YYYY-MM-DD.",
                    },
                    status=400,
                )
        else:
            existing_fee.payment_date = None
        existing_fee.status = status_value
        existing_fee.save()
        return Response(
            {"status": 200, "message": "FeeStatus updated successfully"}, status=200
        )
    else:
        # Create new fee record
        fee_data = {
            "school": school,
            "student": student,
            "fee_amount": fee_amount,
            "due_date": due_date_obj,
            "status": status_value,
        }
        if payment_date:
            try:
                payment_date_obj = datetime.strptime(payment_date, "%Y-%m-%d").date()
                fee_data["payment_date"] = payment_date_obj
            except ValueError:
                return Response(
                    {
                        "status": 400,
                        "message": "Invalid payment_date format. Use YYYY-MM-DD.",
                    },
                    status=400,
                )
        fee_record = FeeStatus.objects.create(**fee_data)
        return Response(
            {
                "status": 200,
                "message": "FeeStatus created successfully",
                "id": fee_record.id,
            },
            status=200,
        )


@api_view(["POST"])
def get_fee_status(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    if request.user.role in ["teacher", "principal"]:
        # Expecting 'standard' and 'section' in the request body.
        data = request.data
        try:
            standard = int(data.get("standard"))
            section = str(data.get("section")).lower()
        except Exception:
            return Response(
                {"status": 400, "message": "Invalid class or section input"}, status=400
            )

        try:
            school = AccountAffiliation.objects.get(account=request.user).school
        except AccountAffiliation.DoesNotExist:
            return Response({"status": 404, "message": "School not found"}, status=404)

        # Get all students from the specified class.
        students_qs = ClassAssessment.objects.filter(
            school=school, standard=standard, section=section, role="student"
        )
        if not students_qs.exists():
            return Response(
                {"status": 404, "message": "No students found for the given class"},
                status=404,
            )

        result = []
        for assessment in students_qs:
            student = assessment.account
            last_fee = (
                FeeStatus.objects.filter(student=student, payment_date__isnull=False)
                .order_by("-payment_date")
                .first()
            )
            if last_fee:
                fee_data = {
                    "student": student.username,
                    "email": student.email,
                    "fee_amount": last_fee.fee_amount,
                    "due_date": last_fee.due_date,
                    "payment_date": last_fee.payment_date,
                    "status": last_fee.status,
                }
            else:
                fee_data = {
                    "student": student.username,
                    "email": student.email,
                    "message": "No fee payment found",
                }
            result.append(fee_data)
        return Response({"status": 200, "data": result}, status=200)

    elif request.user.role == "student":
        try:
            last_paid_fee = (
                FeeStatus.objects.filter(
                    student=request.user, payment_date__isnull=False
                )
                .order_by("-payment_date")
                .first()
            )
            if not last_paid_fee:
                return Response(
                    {"status": 404, "message": "No fee payment found"}, status=404
                )
            fee_data = {
                "fee_amount": last_paid_fee.fee_amount,
                "due_date": last_paid_fee.due_date,
                "payment_date": last_paid_fee.payment_date,
                "status": last_paid_fee.status,
            }
            return Response({"status": 200, "data": fee_data}, status=200)
        except Exception:
            return Response(
                {"status": 400, "message": "Error retrieving fee status"}, status=400
            )
    else:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)


@api_view(["POST"])
def add_attendance(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if request.user.role not in ["teacher", "principal"]:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    try:
        attendance_records = request.data
        if not isinstance(attendance_records, dict):
            return Response(
                {
                    "status": 400,
                    "message": "Expected an object with attendance records",
                },
                status=400,
            )
    except Exception:
        return Response({"status": 400, "message": "Invalid input"}, status=400)

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
    except AccountAffiliation.DoesNotExist:
        return Response({"status": 404, "message": "School not found"}, status=404)

    for student_email, status_value in attendance_records.items():
        if status_value not in ["P", "A"]:
            return Response(
                {
                    "status": 400,
                    "message": f"Invalid attendance status for {student_email}: {status_value}",
                },
                status=400,
            )
        try:
            student = CustomUser.objects.get(email=student_email, role="student")
        except CustomUser.DoesNotExist:
            return Response(
                {
                    "status": 404,
                    "message": f"Student with email {student_email} not found",
                },
                status=404,
            )
        Attendance(school=school, student=student, status=status_value).save()

    return Response(
        {"status": 200, "message": "Attendance records added successfully"}, status=200
    )


@api_view(["POST"])
def change_password(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    try:
        data = request.data
        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"status": 400, "message": "Missing password fields"}, status=400
            )

        user = request.user
        if not user.check_password(old_password):
            return Response(
                {"status": 400, "message": "Invalid old password"}, status=400
            )

        user.set_password(new_password)
        user.save()
        return Response({"status": 200, "message": "Password updated successfully"})

    except Exception as e:
        return Response({"status": 400, "message": str(e)}, status=400)


@api_view(["GET"])
def get_attendance(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    data = request.GET
    try:
        month = int(data.get("month"))
        if month < 1 or month > 12:
            return Response({"status": 400, "message": "Invalid month"}, status=400)
    except:
        return Response(
            {"status": 400, "message": "Month parameter required"}, status=400
        )

    if request.user.role in ["teacher", "principal"]:
        try:
            standard = int(data.get("standard"))
            section = str(data.get("section")).lower()
        except:
            return Response(
                {"status": 400, "message": "Standard and section required"}, status=400
            )

        try:
            school = AccountAffiliation.objects.get(account=request.user).school
            # Get all students in the specified class
            students = ClassAssessment.objects.filter(
                school=school, standard=standard, section=section, role="student"
            ).values_list("account", flat=True)

            result = []
            for student_email in students:
                student = CustomUser.objects.get(email=student_email)
                present_count = Attendance.objects.filter(
                    school=school, student=student, date__month=month, status="P"
                ).count()

                absent_count = Attendance.objects.filter(
                    school=school, student=student, date__month=month, status="A"
                ).count()

                result.append(
                    {
                        "student_name": student.username,
                        "email": student.email,
                        "present_days": present_count,
                        "absent_days": absent_count,
                    }
                )

            return Response({"status": 200, "data": result})

        except AccountAffiliation.DoesNotExist:
            return Response({"status": 404, "message": "School not found"}, status=404)

    elif request.user.role == "student":
        try:
            present_count = Attendance.objects.filter(
                student=request.user, date__month=month, status="P"
            ).count()

            absent_count = Attendance.objects.filter(
                student=request.user, date__month=month, status="A"
            ).count()

            return Response(
                {
                    "status": 200,
                    "data": {
                        "present_days": present_count,
                        "absent_days": absent_count,
                        "month": month,
                    },
                }
            )

        except Exception as e:
            return Response({"status": 400, "message": str(e)}, status=400)

    return Response({"status": 401, "message": "Unauthorized role"}, status=401)


@api_view(["GET"])
def get_all_students(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if request.user.role != "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    try:
        school = AccountAffiliation.objects.get(account=request.user).school

        # Get optional filter params
        standard = request.GET.get("standard")
        section = request.GET.get("section")

        # Build base query
        students = ClassAssessment.objects.filter(school=school, role="student")

        # Apply optional filters
        if standard:
            try:
                standard = int(standard)
                students = students.filter(standard=standard)
            except ValueError:
                return Response(
                    {"status": 400, "message": "Invalid standard parameter"}, status=400
                )

        if section:
            section = section.lower()
            students = students.filter(section=section)

        # Annotate with all required fields
        students = students.annotate(
            username=F("account__username"),
            email=F("account__email"),
            phoneno=F("account__phoneno"),
            gender=F("account__gender"),
            dob=F("account__dob"),
        )

        return Response(
            {
                "status": 200,
                "data": list(
                    students.values(
                        "username",
                        "email",
                        "phoneno",
                        "gender",
                        "dob",
                        "standard",
                        "section",
                    )
                ),
            }
        )

    except AccountAffiliation.DoesNotExist:
        return Response({"status": 404, "message": "School not found"}, status=404)


@api_view(["GET"])
def get_all_teachers(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if request.user.role != "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
        teachers = AccountAffiliation.objects.filter(
            school=school, account__role="teacher"
        ).annotate(
            username=F("account__username"),
            email=F("account__email"),
            phoneno=F("account__phoneno"),
            gender=F("account__gender"),
            dob=F("account__dob"),
        )
        # Get all class assignments for each teacher
        teacher_data = []
        for teacher in teachers:
            classes = ClassAssessment.objects.filter(
                school=school, account=teacher.account, role="teacher"
            ).values_list("standard", "section")

            # Format classes as "standard-section"
            classes_formatted = [f"{c[0]}-{c[1]}" for c in classes]

            teacher_dict = {
                "username": teacher.username,
                "email": teacher.email,
                "phoneno": teacher.phoneno,
                "gender": teacher.gender,
                "dob": teacher.dob,
                "assigned_classes": classes_formatted,
            }

            print(classes_formatted)
            teacher_data.append(teacher_dict)

        return Response({"status": 200, "data": teacher_data})

    except AccountAffiliation.DoesNotExist:
        return Response({"status": 404, "message": "School not found"}, status=404)


@api_view(["POST"])
def send_montly_attendance_mail(request):
    if request.user.is_anonymous:
        return Response({"status": 401, "message": "Unauthorized"}, status=401)

    if request.user.role != "principal":
        return Response({"status": 401, "message": "Unauthorized"}, status=401)
    try:
        send_attendance_email()
    except Exception as e:
        return Response(
            {"status": 500, "message": f"Error sending email: {str(e)}"}, status=500
        )
    return Response(
        {"status": 200, "message": "Monthly attendance email sent successfully"}
    )
