from . import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(32), default='user')
    full_name = db.Column(db.String(100), nullable=True)
    language = db.Column(db.String(10), default='pl')
    avatar_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(32), nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    preferences = db.Column(db.Text, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._ensure_preferences_dict()
    
    def _ensure_preferences_dict(self):
        """Zapewnia, że preferences jest poprawnym słownikiem JSON"""
        if not self.preferences or self.preferences.strip() == '':
            self.preferences = '{}'
        elif isinstance(self.preferences, dict):
            self.preferences = json.dumps(self.preferences)
    
    def get_preferences(self):
        """Zwraca słownik preferencji użytkownika"""
        try:
            if not self.preferences or self.preferences.strip() == '':
                return {}
            return json.loads(self.preferences)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_preferences(self, preferences_dict):
        """Ustawia preferencje użytkownika"""
        if not isinstance(preferences_dict, dict):
            preferences_dict = {}
        self.preferences = json.dumps(preferences_dict)
    
    def update_preference(self, key, value):
        """Aktualizuje pojedynczą preferencję"""
        preferences = self.get_preferences()
        preferences[key] = value
        self.set_preferences(preferences)
    
    def get_notification_settings(self):
        """Zwraca ustawienia powiadomień użytkownika"""
        preferences = self.get_preferences()
        return preferences.get('notifications', {
            'email_notifications': True,
            'server_status': True,
            'backup_notifications': False,
            'security_alerts': True
        })
    
    def set_notification_settings(self, settings):
        """Ustawia ustawienia powiadomień użytkownika"""
        preferences = self.get_preferences()
        preferences['notifications'] = settings
        self.set_preferences(preferences)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def change_password(self, current_password, new_password):
        """
        Zmienia hasło użytkownika po weryfikacji obecnego hasła
        """
        if not self.check_password(current_password):
            return False, "Obecne hasło jest nieprawidłowe"
        
        if len(new_password) < 6:
            return False, "Nowe hasło musi mieć co najmniej 6 znaków"
        
        self.set_password(new_password)
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return True, "Hasło zostało pomyślnie zmienione"
    
    def enable_two_factor(self, secret):
        """Włącza uwierzytelnianie dwuskładnikowe"""
        self.two_factor_enabled = True
        self.two_factor_secret = secret
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def disable_two_factor(self):
        """Wyłącza uwierzytelnianie dwuskładnikowe"""
        self.two_factor_enabled = False
        self.two_factor_secret = None
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def record_login(self):
        """Rejestruje udane logowanie"""
        self.last_login = datetime.utcnow()
        self.login_attempts = 0
        self.locked_until = None
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def record_failed_login(self):
        """Rejestruje nieudane logowanie i blokuje konto po 5 próbach"""
        self.login_attempts += 1
        if self.login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def is_account_locked(self):
        """Sprawdza czy konto jest zablokowane"""
        if self.locked_until and datetime.utcnow() < self.locked_until:
            return True
        return False
    
    def unlock_account(self):
        """Odblokowuje konto użytkownika"""
        self.login_attempts = 0
        self.locked_until = None
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'language': self.language,
            'avatar_url': self.avatar_url,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'two_factor_enabled': self.two_factor_enabled,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'preferences': self.get_preferences(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_public_dict(self):
        """Zwraca publiczne informacje o użytkowniku (bez wrażliwych danych)"""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'full_name': self.full_name,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat()
        }

class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    url = db.Column(db.String(500), nullable=False)
    auth_token = db.Column(db.String(128), nullable=False)
    status = db.Column(db.String(20), default='offline')  # online, offline, starting, error
    location = db.Column(db.String(100), nullable=True)
    cpu_usage = db.Column(db.Float, default=0.0)
    memory_usage = db.Column(db.Float, default=0.0)
    disk_usage = db.Column(db.Float, default=0.0)
    max_servers = db.Column(db.Integer, default=5)
    running_servers = db.Column(db.Integer, default=0)
    last_heartbeat = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    version = db.Column(db.String(32), nullable=True)
    capabilities = db.Column(db.Text, default='{}')  # JSON z możliwościami agenta
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._ensure_capabilities_dict()
    
    def _ensure_capabilities_dict(self):
        """Zapewnia, że capabilities jest poprawnym słownikiem JSON"""
        if not self.capabilities or self.capabilities.strip() == '':
            self.capabilities = '{}'
        elif isinstance(self.capabilities, dict):
            self.capabilities = json.dumps(self.capabilities)
    
    def get_capabilities(self):
        """Zwraca słownik możliwości agenta"""
        try:
            if not self.capabilities or self.capabilities.strip() == '':
                return {}
            return json.loads(self.capabilities)
        except (json.JSONDecodeError, TypeError):
            return {}
    
    def set_capabilities(self, capabilities_dict):
        """Ustawia możliwości agenta"""
        if not isinstance(capabilities_dict, dict):
            capabilities_dict = {}
        self.capabilities = json.dumps(capabilities_dict)
    
    def update_heartbeat(self, metrics=None):
        """Aktualizuje heartbeat agenta z metrykami"""
        self.last_heartbeat = datetime.utcnow()
        self.status = 'online'
        
        if metrics:
            self.cpu_usage = metrics.get('cpu_usage', self.cpu_usage)
            self.memory_usage = metrics.get('memory_usage', self.memory_usage)
            self.disk_usage = metrics.get('disk_usage', self.disk_usage)
            self.running_servers = metrics.get('running_servers', self.running_servers)
            self.version = metrics.get('version', self.version)
            
            if 'capabilities' in metrics:
                self.set_capabilities(metrics['capabilities'])
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def mark_offline(self):
        """Oznacza agenta jako offline"""
        self.status = 'offline'
        self.cpu_usage = 0.0
        self.memory_usage = 0.0
        self.running_servers = 0
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def is_online(self):
        """Sprawdza czy agent jest online (ostatni heartbeat w ciągu 2 minut)"""
        if not self.last_heartbeat:
            return False
        return (datetime.utcnow() - self.last_heartbeat) < timedelta(minutes=2)
    
    def can_host_more_servers(self):
        """Sprawdza czy agent może hostować więcej serwerów"""
        return self.running_servers < self.max_servers and self.is_online()
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'status': self.status,
            'location': self.location,
            'cpu_usage': self.cpu_usage,
            'memory_usage': self.memory_usage,
            'disk_usage': self.disk_usage,
            'max_servers': self.max_servers,
            'running_servers': self.running_servers,
            'last_heartbeat': self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            'is_active': self.is_active,
            'version': self.version,
            'capabilities': self.get_capabilities(),
            'is_online': self.is_online(),
            'can_host_more': self.can_host_more_servers(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Server(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    type = db.Column(db.String(32))  # java or bedrock
    implementation = db.Column(db.String(32), default='vanilla')  # DODAJ TE LINIĘ: vanilla, paper, purpur, fabric
    path = db.Column(db.String(256))
    version = db.Column(db.String(32))
    port = db.Column(db.Integer)
    status = db.Column(db.String(32), default='stopped')  # stopped, starting, running, stopping, error
    pid = db.Column(db.Integer, nullable=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('agent.id'), nullable=True)
    address = db.Column(db.String(100), nullable=True)
    player_count = db.Column(db.Integer, default=0)
    max_players = db.Column(db.Integer, default=20)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_started = db.Column(db.DateTime, nullable=True)
    
    agent = db.relationship('Agent', backref=db.backref('servers', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'implementation': self.implementation,
            'path': self.path,
            'version': self.version,
            'port': self.port,
            'status': self.status,
            'pid': self.pid,
            'agent_id': self.agent_id,
            'address': self.address,
            'player_count': self.player_count,
            'max_players': self.max_players,
            'agent': self.agent.to_dict() if self.agent else None,
            'created_at': self.created_at.isoformat(),
            'last_started': self.last_started.isoformat() if self.last_started else None
        }
    
    def update_real_status(self, status_data):
        """Aktualizuje rzeczywisty status serwera z danych z agenta"""
        self.status = status_data.get('status', self.status)
        self.player_count = status_data.get('player_count', self.player_count)
        self.pid = status_data.get('pid', self.pid)
        
        if status_data.get('status') == 'running' and not self.last_started:
            self.last_started = datetime.utcnow()
        
        db.session.commit()

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
    installed_on_servers = db.Column(db.Text, default='[]')
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._ensure_installed_servers_list()
    
    def _ensure_installed_servers_list(self):
        """Zapewnia, że installed_on_servers jest poprawną listą"""
        if not self.installed_on_servers or self.installed_on_servers.strip() == '':
            self.installed_on_servers = '[]'
        elif isinstance(self.installed_on_servers, list):
            self.installed_on_servers = json.dumps(self.installed_on_servers)
        elif isinstance(self.installed_on_servers, dict):
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
            'installed_on_servers': self.get_installed_servers(),
            'enabled': self.enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(64), unique=True, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))
    
    def is_expired(self):
        """Sprawdza czy sesja wygasła"""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_used': self.last_used.isoformat() if self.last_used else None
        }

class AgentHeartbeat(db.Model):
    """Model do przechowywania historii heartbeatów agentów"""
    id = db.Column(db.Integer, primary_key=True)
    agent_id = db.Column(db.Integer, db.ForeignKey('agent.id'), nullable=False)
    cpu_usage = db.Column(db.Float)
    memory_usage = db.Column(db.Float)
    disk_usage = db.Column(db.Float)
    running_servers = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    agent = db.relationship('Agent', backref=db.backref('heartbeats', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'cpu_usage': self.cpu_usage,
            'memory_usage': self.memory_usage,
            'disk_usage': self.disk_usage,
            'running_servers': self.running_servers,
            'timestamp': self.timestamp.isoformat()
        }
