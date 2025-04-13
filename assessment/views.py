from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from assessment.models import AssessmentStore, AssessmentSubmission
from schools.models import RegisteredSchool, AccountAffiliation
from datetime import datetime
from rest_framework import status
from assessment.utils import AssessmentGenerator
from schools.models import RegisteredSchool, AccountAffiliation, ClassAssessment
from django.http import HttpResponse
import json


@api_view(["POST"])
def generate_assessment(request):
    if request.user.is_anonymous or not request.user.role == "teacher":
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    data = request.data
    required_fields = [
        "assessment_name",
        "assessment_description",
        "question_types",
        "standard",
        "num_questions",
        "duration",
    ]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return Response(
            {"error": f"Missing fields: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    assessment_name = data.get("assessment_name")
    assessment_description = data.get("assessment_description")
    question_types = data.get("question_types")
    standard = data.get("standard")
    num_questions = data.get("num_questions", 5)
    duration = data.get("duration")

    details = {
        "assessment_name": assessment_name,
        "assessment_description": assessment_description,
        "question_types": question_types,
        "standard": standard,
        "num_questions": num_questions,
        "duration": duration,
    }

    try:
        generator = AssessmentGenerator()
        assessment = generator.generate_assessment(
            assessment_name,
            assessment_description,
            question_types,
            standard,
            num_questions,
        )
        return Response(
            {"assessment": assessment, "details": details}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def save_assessment(request):
    if request.user.is_anonymous or not request.user.role == "teacher":
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    data = request.data
    required_fields = [
        "assessment_name",
        "assessment_description",
        "standard",
        "section",
        "assessment",
        "due_date",
        "duration",
    ]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return Response(
            {"error": f"Missing fields: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    assessment_name = data.get("assessment_name")
    assessment_description = data.get("assessment_description")
    standard = data.get("standard")
    section = data.get("section")
    assessment = data.get("assessment")
    due_date_str = data.get("due_date")
    duration = data.get("duration")

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
    except AccountAffiliation.DoesNotExist:
        return Response(
            {"error": "School affiliation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        # Parse due_date (expecting format YYYY-MM-DD)
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response(
            {"error": "Invalid due_date format. Expected YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        assessment = AssessmentStore.objects.create(
            name=assessment_name,
            description=assessment_description,
            standard=standard,
            section=section,
            assessment=assessment,
            due_date=due_date,
            school=school,
            duration=duration,
            teacher=request.user,
        )
        return Response(
            {
                "message": "Assessment saved successfully",
                "assessment_id": assessment.id,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        print("Error saving assessment:", e)
        return Response(
            {"error": e},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_assessments(request):
    if request.user.is_anonymous:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    data = request.data

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
    except AccountAffiliation.DoesNotExist:
        return Response(
            {"error": "School affiliation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.user.role == "teacher":
        assessments = AssessmentStore.objects.filter(
            school=school, teacher=request.user
        ).values()
        return Response(assessments, status=status.HTTP_200_OK)

    if request.user.role == "student":
        classAssessment = ClassAssessment.objects.get(
            account=request.user, school=school
        )
        standard = classAssessment.standard
        section = classAssessment.section
        submitted_assessments = AssessmentSubmission.objects.filter(
            student=request.user
        )

        assessments = AssessmentStore.objects.filter(
            school=school, standard=standard, section=section
        )

        assessments_list = []

        for assessment in assessments:
            for submission in submitted_assessments:
                if submission.assessment == assessment:
                    assessments_list.append(
                        {
                            "id": assessment.id,
                            "name": assessment.name,
                            "assessment": assessment.assessment,
                            "description": assessment.description,
                            "standard": assessment.standard,
                            "section": assessment.section,
                            "due_date": assessment.due_date,
                            "duration": assessment.duration,
                            "teacher": assessment.teacher.username,
                            "status": "submitted",
                            "max_score": submission.max_score,
                            "obtained_score": submission.obtained_score,
                            "remark": submission.remark,
                        }
                    )
                    break
            else:
                assessments_list.append(
                    {
                        "id": assessment.id,
                        "name": assessment.name,
                        "assessment": assessment.assessment,
                        "description": assessment.description,
                        "standard": assessment.standard,
                        "section": assessment.section,
                        "due_date": assessment.due_date,
                        "duration": assessment.duration,
                        "teacher": assessment.teacher.username,
                        "status": "not_submitted",
                        "max_score": None,
                        "obtained_score": None,
                        "remark": None,
                    }
                )

        return Response(assessments_list, status=status.HTTP_200_OK)

    if request.user.role == "principal":
        assessments = AssessmentStore.objects.filter(school=school).values()
        return Response(assessments, status=status.HTTP_200_OK)

    return Response(
        {"error": "User not identified as teacher, student, or principal."},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
def delete_assessment(request):
    if request.user.is_anonymous or request.user.role != "teacher":
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    assessment_id = request.data.get("id")
    if not assessment_id:
        return Response(
            {"error": "Missing field: id"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
    except AccountAffiliation.DoesNotExist:
        return Response(
            {"error": "School affiliation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        assessment = AssessmentStore.objects.get(
            id=assessment_id, teacher=request.user, school=school
        )
    except AssessmentStore.DoesNotExist:
        return Response(
            {"error": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
        )

    try:
        assessment.delete()
        return Response(
            {"message": "Assessment deleted successfully"},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def take_assessment(request, assessment_id):
    if request.user.is_anonymous or request.user.role != "student":
        return render(request, "error.html", {"message": "Authentication required."})

    try:
        school = AccountAffiliation.objects.get(account=request.user).school
    except AccountAffiliation.DoesNotExist:
        return HttpResponse("School affiliation not found.", status=404)

    try:
        assessment = AssessmentStore.objects.get(id=assessment_id, school=school)
        print("Assessment details:", assessment.assessment)
        assessment.assessment = json.dumps(assessment.assessment)
    except AssessmentStore.DoesNotExist:
        return HttpResponse("No such assessment found!", status=404)

    # Render the assessment taking page with the assessment details
    return render(
        request,
        "assessment/take_assessment.html",
        {"assessment": assessment, "student": request.user},
    )


@api_view(["POST"])
def submit_assessment(request):
    if request.user.is_anonymous or request.user.role != "student":
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    data = request.data

    required_fields = ["assessment_id", "assessment"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return Response(
            {"error": f"Missing fields: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    assessment_id = data.get("assessment_id")
    assessment = data.get("assessment")

    print(assessment)

    try:
        classAssessment = ClassAssessment.objects.get(account=request.user)
    except ClassAssessment.DoesNotExist:
        return Response(
            {"error": "Class assessment not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    school = classAssessment.school
    standard = classAssessment.standard
    section = classAssessment.section

    try:
        assessment = AssessmentStore.objects.get(id=assessment_id, school=school)
    except AssessmentStore.DoesNotExist:
        return Response(
            {"error": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND
        )

    # calculate score and remark
    remark = None
    max_score = 0
    obtained_score = 0

    try:
        submission = AssessmentSubmission.objects.create(
            assessment=assessment,
            student=request.user,
            standard=standard,
            section=section,
            max_score=None,
            obtained_score=None,
            remark=remark if remark else "No remarks",
        )
        return Response(
            {"message": "Assessment submitted successfully"},
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
