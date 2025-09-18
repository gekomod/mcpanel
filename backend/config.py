import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SERVER_BASE_PATH = os.path.join(basedir, '..', 'servers')
    MAX_BACKUP_COUNT = 10
    
    # Ustawienia CORS
    CORS_ORIGINS = ["http://0.0.0.0:3000"]
    CORS_SUPPORTS_CREDENTIALS = True
