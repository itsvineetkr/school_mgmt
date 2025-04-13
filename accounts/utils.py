from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.contrib import messages
from accounts.models import CustomUser


def password_validator(password):
    """
    Validates the password to ensure it has at least 8 characters, including digits and letters.

    Args: password (str): The password to validate.
    Returns: bool: True if the password meets the criteria, False otherwise.
    """

    length = 0
    specialChar = False
    numeric = False
    alpha = False
    for i in password:
        length += 1
        if i.isnumeric():
            numeric = True
            continue
        if i.isalpha():
            alpha = True
            continue
        specialChar = True

    if length >= 8 and numeric and alpha:
        return True
    return False


def phoneno_validator(phoneno):
    """
    Validates the phone number.

    Args: phoneno (int): The phone number to validate.
    Returns: bool: True if the phone number is valid, False otherwise.
    """

    return phoneno < 9999999999 and phoneno > 5000000000


def email_validator(email):
    """
    Validates the email format using Django's EmailValidator.

    Args: email (str): The email to validate.
    Returns: bool: True if the email format is valid, False otherwise.
    """

    email_validator = EmailValidator()
    try:
        email_validator(email)
        return True
    except ValidationError:
        return False


def signup_user(request):
    """
    Handles user signup by validating email, phoneno, and password.
    Saves the user if all fields are valid.

    Args: request (HttpRequest): The HTTP request containing POST data.
    Returns: CustomUser: The created user object, or None if validation fails.
    """
    email = request.POST.get("email")
    first_name = request.POST.get("first_name")
    second_name = request.POST.get("second_name")
    username = first_name + " " + second_name
    phoneno = int(request.POST.get("phoneno"))
    role = request.POST.get("role")
    gender = request.POST.get("gender")
    password = request.POST.get("password")

    if not password_validator(password):
        messages.error(
            request,
            "Enter valid password! It must contain at least 8 characters including digits and alphabets.",
        )
        return None
    
    elif not email_validator(email):
        messages.error(request, "Enter valid email!")
        return None
    
    elif not phoneno_validator(phoneno):
        messages.error(request, "Enter valid phone number!")
        return None

    user = CustomUser(
        email=email,
        username=username,
        phoneno=phoneno,
        role=role,
        gender=gender,
    )

    user.set_password(password)
    user.save()

    return user
