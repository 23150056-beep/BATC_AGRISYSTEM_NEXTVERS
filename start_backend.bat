@echo off
cd /d C:\Users\User\Desktop\agri_sys_next_ver\batc\batc-backend
call venv\Scripts\activate.bat
python manage.py runserver 8000
