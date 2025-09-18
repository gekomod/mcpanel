from . import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(32), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }

class Server(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    type = db.Column(db.String(32))  # java or bedrock
    path = db.Column(db.String(256))
    version = db.Column(db.String(32))
    port = db.Column(db.Integer)
    status = db.Column(db.String(32), default='stopped')
    pid = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_started = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'path': self.path,
            'version': self.version,
            'port': self.port,
            'status': self.status,
            'pid': self.pid,
            'created_at': self.created_at.isoformat(),
            'last_started': self.last_started.isoformat() if self.last_started else None
        }

class Permission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    server_id = db.Column(db.Integer, db.ForeignKey('server.id'))
    can_start = db.Column(db.Boolean, default=False)
    can_stop = db.Column(db.Boolean, default=False)
    can_restart = db.Column(db.Boolean, default=False)
    can_edit_files = db.Column(db.Boolean, default=False)
    can_manage_users = db.Column(db.Boolean, default=False)
    can_install_plugins = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref=db.backref('permissions', lazy=True))
    server = db.relationship('Server', backref=db.backref('permissions', lazy=True))

# Dodaj model dla wersji Bedrock
class BedrockVersion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    version = db.Column(db.String(32), unique=True, nullable=False)
    download_url = db.Column(db.String(500), nullable=False)
    release_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'version': self.version,
            'download_url': self.download_url,
            'release_date': self.release_date.isoformat(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Addon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    version = db.Column(db.String(32), nullable=False)
    minecraft_version = db.Column(db.String(32), nullable=False)
    download_url = db.Column(db.String(500), nullable=True)
    behavior_pack_url = db.Column(db.String(500), nullable=True)
    resource_pack_url = db.Column(db.String(500), nullable=True)
    image_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    author = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    is_installed = db.Column(db.Boolean, default=False)
    behavior_pack_uuid = db.Column(db.String(36), nullable=True)
    behavior_pack_version = db.Column(db.String(20), nullable=True)
    resource_pack_uuid = db.Column(db.String(36), nullable=True)
    resource_pack_version = db.Column(db.String(20), nullable=True)
    installed_on_servers = db.Column(db.Text, default='[]')  # ZMIENIONE: db.Text zamiast db.JSON
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Zapewnij, że installed_on_servers zawsze jest poprawną listą
        self._ensure_installed_servers_list()
    
    def _ensure_installed_servers_list(self):
        """Zapewnia, że installed_on_servers jest poprawną listą"""
        if not self.installed_on_servers or self.installed_on_servers.strip() == '':
            self.installed_on_servers = '[]'
        elif isinstance(self.installed_on_servers, list):
            # Jeśli to lista, serializuj do JSON
            self.installed_on_servers = json.dumps(self.installed_on_servers)
        elif isinstance(self.installed_on_servers, dict):
            # Jeśli to słownik, konwertuj wartości na listę i serializuj
            self.installed_on_servers = json.dumps(list(self.installed_on_servers.values()))
    
    def get_installed_servers(self):
        """Zwraca listę ID serwerów gdzie addon jest zainstalowany"""
        try:
            if not self.installed_on_servers or self.installed_on_servers.strip() == '':
                return []
            return json.loads(self.installed_on_servers)
        except (json.JSONDecodeError, TypeError):
            return []
    
    def set_installed_servers(self, server_ids):
        """Ustawia listę ID serwerów gdzie addon jest zainstalowany"""
        if not isinstance(server_ids, list):
            server_ids = []
        self.installed_on_servers = json.dumps(server_ids)
    
    def add_installed_server(self, server_id):
        """Dodaje serwer do listy zainstalowanych"""
        servers = self.get_installed_servers()
        if server_id not in servers:
            servers.append(server_id)
            self.set_installed_servers(servers)
    
    def remove_installed_server(self, server_id):
        """Usuwa serwer z listy zainstalowanych"""
        servers = self.get_installed_servers()
        if server_id in servers:
            servers.remove(server_id)
            self.set_installed_servers(servers)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'version': self.version,
            'minecraft_version': self.minecraft_version,
            'download_url': self.download_url,
            'behavior_pack_url': self.behavior_pack_url,
            'resource_pack_url': self.resource_pack_url,
            'image_url': self.image_url,
            'description': self.description,
            'author': self.author,
            'is_active': self.is_active,
            'is_installed': self.is_installed,
            'behavior_pack_uuid': self.behavior_pack_uuid,
            'behavior_pack_version': self.behavior_pack_version,
            'resource_pack_uuid': self.resource_pack_uuid,
            'resource_pack_version': self.resource_pack_version,
            'installed_on_servers': self.get_installed_servers(),  # Użyj metody getter
            'enabled': self.enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
