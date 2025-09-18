from flask import Flask, request, current_app
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import Config
import socket
import netifaces
import requests
import os

db = SQLAlchemy()
jwt = JWTManager()

# Globalna lista dozwolonych originów
allowed_origins = []

def get_local_ips():
    """Pobiera wszystkie lokalne adresy IP"""
    ips = []
    try:
        # Pobierz adres hosta
        hostname = socket.gethostname()
        ips.append(socket.gethostbyname(hostname))
        
        # Pobierz wszystkie interfejsy
        interfaces = netifaces.interfaces()
        for interface in interfaces:
            addrs = netifaces.ifaddresses(interface)
            if netifaces.AF_INET in addrs:
                for addr in addrs[netifaces.AF_INET]:
                    ip = addr['addr']
                    if ip not in ips:
                        ips.append(ip)
    except:
        pass
    return ips

def initialize_dynamic_origins():
    """Inicjalizuje dynamiczną listę originów"""
    global allowed_origins
    
    # Podstawowe originy
    base_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://0.0.0.0:3000',
        'http://172.17.0.2:3000',  # Docker internal IP
        'http://172.17.0.2:5000',  # Docker internal IP
    ]
    
    allowed_origins.extend(base_origins)
    
    # Pobierz lokalne IP
    try:
        local_ips = get_local_ips()
        for ip in local_ips:
            allowed_origins.extend([
                f'http://{ip}:3000',
                f'http://{ip}:5000',
                f'http://{ip}:5173',
            ])
    except Exception as e:
        print(f"Error getting local IPs: {e}")
    
    # Usuń duplikaty
    allowed_origins = list(set(allowed_origins))
    print("Initial allowed origins:", allowed_origins)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Inicjalizuj dynamiczne originy
    initialize_dynamic_origins()
    
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt.init_app(app)
    
    # PROSTE ROZWIĄZANIE - pozwól na wszystko
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, *'
        response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, PATCH, OPTIONS, *'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        return response

    @app.before_request
    def before_request():
        if request.method == 'OPTIONS':
            response = current_app.make_default_options_response()
            origin = request.headers.get('Origin')
            
            if origin:
                response.headers['Access-Control-Allow-Origin'] = origin
            else:
                response.headers['Access-Control-Allow-Origin'] = '*'
            
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, *'
            response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, PATCH, OPTIONS, *'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '3600'
            
            return response
    
    # Initialize managers
    from .managers import init_managers
    init_managers(app)
    
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    from .cli import register_commands
    register_commands(app)
    
    # Debug endpoint
    @app.route('/api/debug', methods=['GET', 'OPTIONS'])
    def debug_endpoint():
        return {
            'headers': dict(request.headers),
            'origin': request.headers.get('Origin'),
            'method': request.method,
            'message': 'CORS debug'
        }
           
    return app
