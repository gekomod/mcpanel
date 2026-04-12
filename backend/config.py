import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Bezpieczeństwo - ZAWSZE zmieniaj w produkcji!
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-CHANGE-IN-PRODUCTION'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-CHANGE-IN-PRODUCTION'

    # Baza danych
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get('DATABASE_URL') or
        'sqlite:///' + os.path.join(basedir, '../data/app.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,         # Sprawdza połączenie przed użyciem
        'pool_recycle': 300,           # Recykling połączeń co 5 min
    }

    # JWT
    JWT_SUBJECT_CLAIM = 'sub'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # Serwery Minecraft
    SERVER_BASE_PATH = os.environ.get('SERVER_BASE_PATH') or os.path.join(basedir, '..', 'servers')
    MAX_BACKUP_COUNT = int(os.environ.get('MAX_BACKUP_COUNT', '10'))

    # Upload
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500 MB max upload

    # CORS (dodatkowe originy z env)
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '')
