from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('<str:reg_id>/',views.registrar_dashboard,name="registrar_dashboard"),
]
