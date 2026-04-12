from flask import Flask, request, current_app
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import Config
import socket
import os

db = SQLAlchemy()
jwt = JWTManager()


def get_local_ips():
    ips = ['127.0.0.1', 'localhost']
    try:
        hostname = socket.gethostname()
        ips.append(socket.gethostbyname(hostname))
        try:
            import netifaces
            for iface in netifaces.interfaces():
                addrs = netifaces.ifaddresses(iface)
                import netifaces as nf
                if nf.AF_INET in addrs:
                    for addr in addrs[nf.AF_INET]:
                        ip = addr['addr']
                        if ip not in ips:
                            ips.append(ip)
        except ImportError:
            pass
    except Exception:
        pass
    return list(set(ips))


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    Migrate(app, db)
    jwt.init_app(app)

    local_ips = get_local_ips()
    allowed_origins = set()
    for ip in local_ips:
        for port in [3000, 5000, 5173, 8080]:
            allowed_origins.add(f'http://{ip}:{port}')
    # Dodaj dodatkowe z env jeśli jest
    extra = os.environ.get('ALLOWED_ORIGINS', '')
    for o in extra.split(','):
        o = o.strip()
        if o:
            allowed_origins.add(o)

    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin', '')
        if origin in allowed_origins or not origin:
            response.headers['Access-Control-Allow-Origin'] = origin or '*'
        else:
            # Fallback dla dev: pozwól wszystkim (można wyłączyć w prod)
            response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response

    @app.before_request
    def handle_options():
        if request.method == 'OPTIONS':
            response = current_app.make_default_options_response()
            origin = request.headers.get('Origin', '')
            response.headers['Access-Control-Allow-Origin'] = origin or '*'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, PATCH, OPTIONS'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response

    from .managers import init_managers
    init_managers(app)

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .cli import register_commands
    register_commands(app)

    return app
