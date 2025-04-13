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


# forgot password
