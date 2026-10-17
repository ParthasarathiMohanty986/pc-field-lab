from django.urls import path
from lab.views import dashboard
urlpatterns = [path('', dashboard, name='dashboard')]
