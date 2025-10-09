from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, User, Server, Permission, BedrockVersion, Addon, UserSession, Agent
from .managers import server_manager, file_manager
from .bedrock_manager import BedrockAddonManager
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta
from functools import wraps
import os
import requests
import shutil
import logging
from threading import Thread
import threading
import time
import uuid
import zipfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('MCPanelRoutes')

main = Blueprint('main', __name__)

installation_progress = {}

def get_bedrock_manager():
    from flask import current_app
    return BedrockAddonManager(current_app.config['SERVER_BASE_PATH'])

def _get_agent_client(server_id=None, agent_id=None):
    """Pobiera klienta agenta dla serwera lub agenta"""
    if server_id:
        server = Server.query.get(server_id)
        if server and server.agent_id:
            agent = Agent.query.get(server.agent_id)
            if agent and agent.is_active:
                return AgentClient(agent)
    elif agent_id:
        agent = Agent.query.get(agent_id)
        if agent and agent.is_active:
            return AgentClient(agent)
    return None

class AgentClient:
    """Klient do komunikacji z agentem"""
    
    def __init__(self, agent):
        self.agent = agent
        self.base_url = agent.url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {agent.auth_token}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method, endpoint, **kwargs):
        """Wykonuje zapytanie do agenta"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.request(method, url, headers=self.headers, timeout=30, **kwargs)
            
            if response.status_code == 200:
                return True, response.json()
            else:
                error_msg = f"Agent error {response.status_code}: {response.text}"
                return False, error_msg
                
        except requests.exceptions.RequestException as e:
            return False, f"Connection error: {str(e)}"
    
    def get_status(self):
        """Pobiera status agenta"""
        return self._make_request('GET', '/status')
    
    def start_server(self, server_name, server_data):
        """Uruchamia serwer na agencie"""
        return self._make_request('POST', f'/server/{server_name}/start', json=server_data)
    
    def stop_server(self, server_name):
        """Zatrzymuje serwer na agencie"""
        return self._make_request('POST', f'/server/{server_name}/stop')
    
    def restart_server(self, server_name, server_data):
        """Restartuje serwer na agencie"""
        return self._make_request('POST', f'/server/{server_name}/restart', json=server_data)
    
    def send_command(self, server_name, command):
        """Wysyła komendę do serwera"""
        return self._make_request('POST', f'/server/{server_name}/command', json={'command': command})
    
    def get_console(self, server_name, lines=100):
        """Pobiera konsolę serwera"""
        return self._make_request('GET', f'/server/{server_name}/console?lines={lines}')
    
    def get_server_status(self, server_name):
        """Pobiera status serwera"""
        return self._make_request('GET', f'/server/{server_name}/status')
    
    def install_server(self, server_data):
        """Instaluje serwer na agencie"""
        return self._make_request('POST', '/server/install', json=server_data)
    
    def get_server_logs(self, server_name, lines=100):
        """Pobiera logi serwera"""
        return self._make_request('GET', f'/logs/server/{server_name}?lines={lines}')
        
    def check_server_files(self, server_name):
        """Sprawdza czy serwer ma pliki na agencie"""
        return self._make_request('GET', f'/server/{server_name}/files/check')
        
    def delete_server_files(self, server_name):
        """Usuwa pliki serwera na agencie"""
        return self._make_request('POST', f'/server/{server_name}/delete')

    def list_files(self, server_name, path=''):
        """Listuje pliki na agencie"""
        return self._make_request('GET', f'/server/{server_name}/files?path={path}')

    def read_file(self, server_name, file_path):
        """Czyta plik na agencie"""
        return self._make_request('GET', f'/server/{server_name}/files/read?path={file_path}')

    def write_file(self, server_name, file_path, content):
        """Zapisuje plik na agencie"""
        return self._make_request('POST', f'/server/{server_name}/files/write', json={'path': file_path, 'content': content})

    def create_directory(self, server_name, dir_path):
        """Tworzy katalog na agencie"""
        return self._make_request('POST', f'/server/{server_name}/files/mkdir', json={'path': dir_path})

    def delete_item(self, server_name, item_path, is_directory):
        """Usuwa plik/katalog na agencie"""
        return self._make_request('POST', f'/server/{server_name}/files/delete', json={'path': item_path, 'is_directory': is_directory})

    def rename_item(self, server_name, old_path, new_path):
        """Zmienia nazwę pliku/katalogu na agencie"""
        return self._make_request('POST', f'/server/{server_name}/files/rename', json={'old_path': old_path, 'new_path': new_path})

    def upload_file(self, server_name, path, file):
        """Wysyła plik na agenta"""
        files = {'file': (file.filename, file.stream, file.mimetype)}
        data = {'path': path}
        # _make_request nie jest przystosowane do multipart/form-data, więc robimy to ręcznie
        try:
            url = f"{self.base_url}/server/{server_name}/files/upload"
            response = requests.post(url, headers={'Authorization': self.headers['Authorization']}, files=files, data=data, timeout=120)

            if response.status_code == 200:
                return True, response.json()
            else:
                error_msg = f"Agent error {response.status_code}: {response.text}"
                return False, error_msg
        except requests.exceptions.RequestException as e:
            return False, f"Connection error: {str(e)}"

    def list_plugins(self, server_name):
        """Listuje pluginy na agencie."""
        return self._make_request('GET', f'/server/{server_name}/plugins')

    def install_plugin(self, server_name, plugin_url):
        """Instaluje plugin na agencie."""
        return self._make_request('POST', f'/server/{server_name}/plugins/install', json={'url': plugin_url})

    def delete_plugin(self, server_name, filename):
        """Usuwa plugin na agencie."""
        return self._make_request('POST', f'/server/{server_name}/plugins/delete', json={'filename': filename})

    def upload_plugin(self, server_name, file):
        """Wysyła plik pluginu na agenta."""
        files = {'file': (file.filename, file.stream, file.mimetype)}
        try:
            url = f"{self.base_url}/server/{server_name}/plugins/upload"
            response = requests.post(url, headers={'Authorization': self.headers['Authorization']}, files=files, timeout=120)
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, f"Agent error {response.status_code}: {response.text}"
        except requests.exceptions.RequestException as e:
            return False, f"Connection error: {str(e)}"

@main.route('/servers', methods=['GET'])
@jwt_required()
def get_servers():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role == 'admin':
        servers = Server.query.all()
    else:
        servers = Server.query.join(Permission).filter(
            Permission.user_id == current_user_id
        ).all()
    
    return jsonify([server.to_dict() for server in servers])

@main.route('/servers', methods=['POST'])
@jwt_required()
def create_server():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Only admins can create servers'}), 403
    
    data = request.get_json()
    name = data.get('name')
    server_type = data.get('type')
    version = data.get('version')
    port = data.get('port')
    implementation = data.get('implementation', 'vanilla')
    agent_id = data.get('agent_id')  # Nowe pole dla agenta
    
    if not name or not server_type or not version:
        return jsonify({'error': 'Missing required fields'}), 400

    if not port:
        if server_type == 'java':
            port = 25565
        elif server_type == 'bedrock':
            port = 19132
        else:
            port = 25565

    if Server.query.filter_by(name=name).first():
        return jsonify({'error': 'Server with this name already exists'}), 400
    
    if Server.query.filter_by(port=port).first():
        return jsonify({'error': 'Port is already in use by another server'}), 400

    # Sprawdź dostępność portu
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('127.0.0.1', port))
            if result == 0:
                return jsonify({'error': 'Port is already in use by another process'}), 400
    except Exception as e:
        return jsonify({'error': f'Error checking port: {str(e)}'}), 500

    # Sprawdź agenta jeśli podany
    agent = None
    if agent_id:
        agent = Agent.query.get(agent_id)
        if not agent:
            return jsonify({'error': 'Agent not found'}), 400
        if not agent.is_active:
            return jsonify({'error': 'Agent is not active'}), 400

    # Dla serwerów lokalnych tworzymy katalog
    server_path = None
    if not agent_id:
        server_path = os.path.join(current_app.config['SERVER_BASE_PATH'], name)
        try:
            os.makedirs(server_path, exist_ok=True)
        except Exception as e:
            return jsonify({'error': f'Failed to create server directory: {str(e)}'}), 500

    server = Server(
        name=name,
        type=server_type,
        implementation=implementation,
        version=version,
        port=port,
        path=server_path,
        status='stopped',
        agent_id=agent_id
    )
    
    db.session.add(server)
    db.session.commit()
    
    return jsonify(server.to_dict()), 201
    
@main.route('/servers/<int:server_id>', methods=['DELETE'])
@jwt_required()
def delete_server(server_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Only admins can delete servers'}), 403
    
    server = Server.query.get_or_404(server_id)
    
    try:
        # Stop server if it's running
        if server.status == 'running':
            if server.agent_id:
                # Zatrzymaj przez agenta
                agent_client = _get_agent_client(server_id=server_id)
                if agent_client:
                    agent_client.stop_server(server.name)
            else:
                # Zatrzymaj lokalnie
                server_manager.stop_server(server_id)
        
        # Usuń pliki serwera - zarówno lokalnie jak i u agenta
        if server.agent_id:
            # Usuń pliki u agenta
            agent_client = _get_agent_client(server_id=server_id)
            if agent_client:
                success, result = agent_client.delete_server_files(server.name)
                if not success:
                    logger.warning(f"Failed to delete server files on agent: {result}")
        else:
            # Usuń pliki lokalnie
            try:
                server_path = server_manager.get_server_path(server.name)
                if os.path.exists(server_path):
                    logger.info(f"Deleting local server directory: {server_path}")
                    shutil.rmtree(server_path)
            except Exception as e:
                logger.error(f"Could not delete local server directory: {e}")
        
        # Usuń uprawnienia użytkowników
        Permission.query.filter_by(server_id=server_id).delete()
        
        # Usuń serwer z bazy danych
        db.session.delete(server)
        db.session.commit()
        
        logger.info(f"Server {server.name} (ID: {server_id}) deleted successfully")
        
        return jsonify({'message': 'Server deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting server {server_id}: {e}")
        return jsonify({'error': f'Failed to delete server: {str(e)}'}), 500

@main.route('/servers/<int:server_id>', methods=['GET'])
@jwt_required()
def get_server(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(server.to_dict())

@main.route('/servers/<int:server_id>/start', methods=['POST'])
@jwt_required()
def start_server(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_start'):
        return jsonify({'error': 'Access denied'}), 403
    
    print(f"Starting server {server_id} ({server.name})")
    
    # Sprawdź czy serwer ma przypisanego agenta
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        # Przygotuj dane serwera dla agenta
        server_data = {
            'name': server.name,
            'type': server.type,
            'version': server.version,
            'implementation': server.implementation,
            'port': server.port,
            'memory': '2G'  # Domyślna pamięć
        }
        
        # Dodaj URL dla Bedrock
        if server.type == 'bedrock':
            bedrock_version = BedrockVersion.query.filter_by(
                version=server.version, 
                is_active=True
            ).first()
            if bedrock_version:
                server_data['bedrock_url'] = bedrock_version.download_url
        
        # Wyślij żądanie do agenta
        success, result = agent_client.start_server(server.name, server_data)
        
        if success:
            server.status = 'starting'
            db.session.commit()
            return jsonify({
                'message': 'Server start initiated on agent',
                'agent_response': result
            })
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        # Lokalne uruchamianie (stara metoda)
        bedrock_url = None
        if server.type == 'bedrock':
            bedrock_version = BedrockVersion.query.filter_by(
                version=server.version, 
                is_active=True
            ).first()
            if bedrock_version:
                bedrock_url = bedrock_version.download_url
        
        success, message = server_manager.start_server(server, bedrock_url)
        
        if success:
            return jsonify({'message': message})
        else:
            return jsonify({'error': message}), 500

@main.route('/servers/<int:server_id>/stop', methods=['POST'])
@jwt_required()
def stop_server(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_stop'):
        return jsonify({'error': 'Access denied'}), 403
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.stop_server(server.name)
        
        if success:
            server.status = 'stopping'
            db.session.commit()
            return jsonify({
                'message': 'Server stop initiated on agent',
                'agent_response': result
            })
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        success, message = server_manager.stop_server(server_id)
        if success:
            server.status = 'stopped'
            db.session.commit()
            return jsonify({'message': message})
        else:
            return jsonify({'error': message}), 500

@main.route('/servers/<int:server_id>/restart', methods=['POST'])
@jwt_required()
def restart_server(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_restart'):
        return jsonify({'error': 'Access denied'}), 403
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        server_data = {
            'name': server.name,
            'type': server.type,
            'memory': '2G'
        }
        
        success, result = agent_client.restart_server(server.name, server_data)
        
        if success:
            server.status = 'restarting'
            db.session.commit()
            return jsonify({
                'message': 'Server restart initiated on agent',
                'agent_response': result
            })
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        # Lokalny restart
        stop_success, stop_message = server_manager.stop_server(server_id)
        if not stop_success:
            return jsonify({'error': f"Failed to stop server: {stop_message}"}), 500
        
        start_success, start_message = server_manager.start_server(server)
        if start_success:
            server.status = 'running'
            db.session.commit()
            return jsonify({'message': 'Server restarted successfully'})
        else:
            server.status = 'stopped'
            db.session.commit()
            return jsonify({'error': f"Failed to start server: {start_message}"}), 500


@main.route('/servers/<int:server_id>/files', methods=['GET'])
@jwt_required()
def list_files(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    path = request.args.get('path', '')

    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500

        success, result = agent_client.list_files(server.name, path)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        files, error = file_manager.list_files(server.name, path)
        if error:
            return jsonify({'error': error}), 500
        return jsonify(files)

@main.route('/servers/<int:server_id>/files/read', methods=['GET'])
@jwt_required()
def read_file(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    file_path = request.args.get('path', '')

    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500

        success, result = agent_client.read_file(server.name, file_path)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        content, error = file_manager.read_file(server.name, file_path)
        if error:
            return jsonify({'error': error}), 500
        return jsonify({'content': content})

@main.route('/servers/<int:server_id>/files/write', methods=['POST'])
@jwt_required()
def write_file(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    file_path = data.get('path', '')
    content = data.get('content', '')

    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500

        success, result = agent_client.write_file(server.name, file_path, content)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        success, error = file_manager.write_file(server.name, file_path, content)
        if error:
            return jsonify({'error': error}), 500
        return jsonify({'message': 'File saved successfully'})

@main.route('/servers/<int:server_id>/files/upload', methods=['POST'])
@jwt_required()
def upload_file(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    path = request.form.get('path', '')

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.upload_file(server.name, path, file)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        try:
            success, error = file_manager.upload_file(server.name, path, file)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'message': f'File {file.filename} uploaded successfully'})
        except Exception as e:
            return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/mkdir', methods=['POST'])
@jwt_required()
def create_directory(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    dir_path = data.get('path', '')

    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not dir_path:
        return jsonify({'error': 'Path is required'}), 400

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.create_directory(server.name, dir_path)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        try:
            success, error = file_manager.create_directory(server.name, dir_path)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'message': f'Directory {dir_path} created successfully'})
        except Exception as e:
            return jsonify({'error': f'Failed to create directory: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/download', methods=['GET'])
@jwt_required()
def download_file(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    file_path = request.args.get('path', '')
    
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not file_path:
        return jsonify({'error': 'Path is required'}), 400
    
    # No agent implementation for download for now
    try:
        full_path, error = file_manager.get_full_path(server.name, file_path)
        if error:
            return jsonify({'error': error}), 500
        
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({'error': 'File not found'}), 404
        
        filename = os.path.basename(file_path)
        
        return send_file(
            full_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/octet-stream'
        )
    
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/delete', methods=['POST'])
@jwt_required()
def delete_file(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    item_path = data.get('path', '')
    is_directory = data.get('is_directory', False)

    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not item_path:
        return jsonify({'error': 'Path is required'}), 400

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.delete_item(server.name, item_path, is_directory)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        try:
            success, error = file_manager.delete_item(server.name, item_path, is_directory)
            if error:
                return jsonify({'error': error}), 500

            item_type = 'Directory' if is_directory else 'File'
            return jsonify({'message': f'{item_type} {item_path} deleted successfully'})
        except Exception as e:
            return jsonify({'error': f'Delete failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/rename', methods=['POST'])
@jwt_required()
def rename_file(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    old_path = data.get('old_path', '')
    new_path = data.get('new_path', '')

    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not old_path or not new_path:
        return jsonify({'error': 'Both old_path and new_path are required'}), 400

    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.rename_item(server.name, old_path, new_path)
        if success:
            return jsonify(result)
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        try:
            success, error = file_manager.rename_item(server.name, old_path, new_path)
            if error:
                return jsonify({'error': error}), 500

            return jsonify({'message': f'Item renamed from {old_path} to {new_path}'})
        except Exception as e:
            return jsonify({'error': f'Rename failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/copy', methods=['POST'])
@jwt_required()
def copy_file(server_id):
    """Kopiuje plik lub katalog"""
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    source_path = data.get('source_path', '')
    destination_path = data.get('destination_path', '')
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not source_path or not destination_path:
        return jsonify({'error': 'Both source_path and destination_path are required'}), 400
    
    try:
        # Użyj file_manager do kopiowania
        success, error = file_manager.copy_item(server.name, source_path, destination_path)
        if error:
            return jsonify({'error': error}), 500
        
        return jsonify({'message': f'Item copied from {source_path} to {destination_path}'})
    
    except Exception as e:
        return jsonify({'error': f'Copy failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/move', methods=['POST'])
@jwt_required()
def move_file(server_id):
    """Przenosi plik lub katalog"""
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    source_path = data.get('source_path', '')
    destination_path = data.get('destination_path', '')
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not source_path or not destination_path:
        return jsonify({'error': 'Both source_path and destination_path are required'}), 400
    
    try:
        # Użyj file_manager do przenoszenia
        success, error = file_manager.move_item(server.name, source_path, destination_path)
        if error:
            return jsonify({'error': error}), 500
        
        return jsonify({'message': f'Item moved from {source_path} to {destination_path}'})
    
    except Exception as e:
        return jsonify({'error': f'Move failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/files/info', methods=['GET'])
@jwt_required()
def get_file_info(server_id):
    """Pobiera informacje o pliku lub katalogu"""
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    file_path = request.args.get('path', '')
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not file_path:
        return jsonify({'error': 'Path is required'}), 400
    
    try:
        # Użyj file_manager do pobrania informacji
        info, error = file_manager.get_file_info(server.name, file_path)
        if error:
            return jsonify({'error': error}), 500
        
        return jsonify(info)
    
    except Exception as e:
        return jsonify({'error': f'Failed to get file info: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/properties', methods=['GET'])
@jwt_required()
def get_properties(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    properties = server_manager.get_server_properties(server.name)
    if properties is None:
        return jsonify({'error': 'Server properties not found'}), 404
    
    return jsonify(properties)

@main.route('/servers/<int:server_id>/properties', methods=['POST'])
@jwt_required()
def update_properties(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    properties = request.get_json()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    success, message = server_manager.update_server_properties(server.name, properties)
    if success:
        return jsonify({'message': message})
    else:
        return jsonify({'error': message}), 500

@main.route('/servers/<int:server_id>/users', methods=['GET'])
@jwt_required()
def get_server_users(server_id):
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_manage_users'):
        return jsonify({'error': 'Access denied'}), 403
    
    permissions = Permission.query.filter_by(server_id=server_id).all()
    users = []
    
    for perm in permissions:
        user = User.query.get(perm.user_id)
        users.append({
            'user_id': user.id,
            'username': user.username,
            'permissions': {
                'can_start': perm.can_start,
                'can_stop': perm.can_stop,
                'can_restart': perm.can_restart,
                'can_edit_files': perm.can_edit_files,
                'can_manage_users': perm.can_manage_users,
                'can_install_plugins': perm.can_install_plugins
            }
        })
    
    return jsonify(users)

@main.route('/servers/<int:server_id>/users', methods=['POST'])
@jwt_required()
def add_server_user(server_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    username = data.get('username')
    permissions = data.get('permissions', {})
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_manage_users'):
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if permission already exists
    existing_perm = Permission.query.filter_by(
        user_id=user.id, server_id=server_id
    ).first()
    
    if existing_perm:
        return jsonify({'error': 'User already has permissions for this server'}), 400
    
    # Create new permission
    new_perm = Permission(
        user_id=user.id,
        server_id=server_id,
        can_start=permissions.get('can_start', False),
        can_stop=permissions.get('can_stop', False),
        can_restart=permissions.get('can_restart', False),
        can_edit_files=permissions.get('can_edit_files', False),
        can_manage_users=permissions.get('can_manage_users', False),
        can_install_plugins=permissions.get('can_install_plugins', False)
    )
    
    db.session.add(new_perm)
    db.session.commit()
    
    return jsonify({'message': 'User added to server successfully'})

@main.route('/servers/<int:server_id>/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_server_user(server_id, user_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    permissions = data.get('permissions', {})
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_manage_users'):
        return jsonify({'error': 'Access denied'}), 403
    
    perm = Permission.query.filter_by(
        user_id=user_id, server_id=server_id
    ).first_or_404()
    
    perm.can_start = permissions.get('can_start', perm.can_start)
    perm.can_stop = permissions.get('can_stop', perm.can_stop)
    perm.can_restart = permissions.get('can_restart', perm.can_restart)
    perm.can_edit_files = permissions.get('can_edit_files', perm.can_edit_files)
    perm.can_manage_users = permissions.get('can_manage_users', perm.can_manage_users)
    perm.can_install_plugins = permissions.get('can_install_plugins', perm.can_install_plugins)
    
    db.session.commit()
    
    return jsonify({'message': 'User permissions updated successfully'})
    
@main.route('/servers/<int:server_id>/download-progress', methods=['GET'])
@jwt_required()
def get_download_progress(server_id):
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    progress = server_manager.get_download_progress(server_id)
    
    # Stop polling if progress is complete or error
    if progress['status'] in ['complete', 'error', 'idle']:
        print(f"Stopping polling for server {server_id} - status: {progress['status']}")
    
    return jsonify(progress)

@main.route('/servers/<int:server_id>/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_server_user(server_id, user_id):
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_manage_users'):
        return jsonify({'error': 'Access denied'}), 403
    
    perm = Permission.query.filter_by(
        user_id=user_id, server_id=server_id
    ).first_or_404()
    
    db.session.delete(perm)
    db.session.commit()
    
    return jsonify({'message': 'User removed from server successfully'})
    
@main.route('/servers/<int:server_id>/cancel-download', methods=['POST'])
@jwt_required()
def cancel_download(server_id):
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_start'):
        return jsonify({'error': 'Access denied'}), 403
    
    success = server_manager.cancel_download(server_id)
    if success:
        return jsonify({'message': 'Download cancelled successfully'})
    else:
        return jsonify({'error': 'No active download to cancel'}), 400
    
@main.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can see all users
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])
    
# Endpointy do zarządzania wersjami Bedrock
@main.route('/bedrock-versions', methods=['GET'])
@jwt_required()
def get_bedrock_versions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can manage bedrock versions
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    versions = BedrockVersion.query.filter_by(is_active=True).all()
    return jsonify([version.to_dict() for version in versions])

@main.route('/bedrock-versions/all', methods=['GET'])
@jwt_required()
def get_all_bedrock_versions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can manage bedrock versions
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    versions = BedrockVersion.query.all()
    return jsonify([version.to_dict() for version in versions])

@main.route('/bedrock-versions', methods=['POST'])
@jwt_required()
def add_bedrock_version():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can add bedrock versions
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    version = data.get('version')
    download_url = data.get('download_url')
    
    if not version or not download_url:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if version already exists
    if BedrockVersion.query.filter_by(version=version).first():
        return jsonify({'error': 'Version already exists'}), 400
    
    bedrock_version = BedrockVersion(
        version=version,
        download_url=download_url
    )
    
    db.session.add(bedrock_version)
    db.session.commit()
    
    return jsonify(bedrock_version.to_dict()), 201

@main.route('/bedrock-versions/<int:version_id>', methods=['PUT'])
@jwt_required()
def update_bedrock_version(version_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can update bedrock versions
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    bedrock_version = BedrockVersion.query.get_or_404(version_id)
    data = request.get_json()
    
    if 'version' in data:
        # Check if new version already exists (excluding current version)
        existing = BedrockVersion.query.filter(
            BedrockVersion.version == data['version'],
            BedrockVersion.id != version_id
        ).first()
        if existing:
            return jsonify({'error': 'Version already exists'}), 400
        bedrock_version.version = data['version']
    
    if 'download_url' in data:
        bedrock_version.download_url = data['download_url']
    
    if 'is_active' in data:
        bedrock_version.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(bedrock_version.to_dict())

@main.route('/bedrock-versions/<int:version_id>', methods=['DELETE'])
@jwt_required()
def delete_bedrock_version(version_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can delete bedrock versions
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    bedrock_version = BedrockVersion.query.get_or_404(version_id)
    
    # Check if any server is using this version
    servers_using_version = Server.query.filter_by(
        type='bedrock', 
        version=bedrock_version.version
    ).count()
    
    if servers_using_version > 0:
        return jsonify({
            'error': f'Cannot delete version. {servers_using_version} server(s) are using it.'
        }), 400
    
    db.session.delete(bedrock_version)
    db.session.commit()
    
    return jsonify({'message': 'Version deleted successfully'})
    
@main.route('/servers/<int:server_id>/real-status', methods=['GET'])
@jwt_required()
def get_real_server_status(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.get_server_status(server.name)
        
        if success:
            agent_status = result.get('status', {})
            is_running = agent_status.get('running', False)
            
            # Zaktualizuj status w bazie danych
            if is_running and server.status != 'running':
                server.status = 'running'
                server.pid = agent_status.get('pid')
                db.session.commit()
            elif not is_running and server.status != 'stopped':
                server.status = 'stopped'
                server.pid = None
                db.session.commit()
            
            return jsonify({
                'database_status': server.status,
                'real_status': agent_status,
                'is_running': is_running,
                'pid': server.pid,
                'source': 'agent'
            })
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        # Lokalny status
        real_status = server_manager.get_server_status(server_id)
        
        if real_status['running'] and server.status != 'running':
            server.status = 'running'
            if real_status.get('pid'):
                server.pid = real_status['pid']
            db.session.commit()
        elif not real_status['running'] and server.status != 'stopped':
            server.status = 'stopped'
            server.pid = None
            db.session.commit()
        
        return jsonify({
            'database_status': server.status,
            'real_status': real_status,
            'is_running': real_status['running'],
            'pid': server.pid,
            'source': 'local'
        })
    
@main.route('/servers/<int:server_id>/logs', methods=['GET'])
@jwt_required()
def get_server_logs(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    lines = request.args.get('lines', 100, type=int)
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.get_server_logs(server.name, lines)
        
        if success:
            logs = result.get('logs', [])
            return jsonify({'output': ''.join(logs)})
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        logs, error = server_manager.get_server_logs(server.name)
        if error:
            return jsonify({'error': error}), 500
        return jsonify({'output': logs})
    
@main.route('/servers/<int:server_id>/command', methods=['POST'])
@jwt_required()
def send_command(server_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    command = data.get('command', '')
    
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    server = Server.query.get_or_404(server_id)
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.send_command(server.name, command)
        
        if success:
            return jsonify({'message': 'Command sent to agent'})
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        if server.status != 'running':
            return jsonify({'error': 'Server is not running'}), 400
        
        success, message = server_manager.send_command(server_id, command)
        if success:
            return jsonify({'message': message})
        else:
            return jsonify({'error': message}), 500

@main.route('/servers/<int:server_id>/realtime-output', methods=['GET'])
@jwt_required()
def get_realtime_output(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Get real-time output from server manager
    try:
        output = server_manager.get_realtime_output(server_id)
        return jsonify({'output': output})
    except Exception as e:
        return jsonify({'error': f'Error getting output: {str(e)}'}), 500
    
# Endpointy do zarządzania addonami
@main.route('/addons', methods=['GET'])
@jwt_required()
def get_addons():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can manage addons
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    addons = Addon.query.all()
    return jsonify([addon.to_dict() for addon in addons])

@main.route('/addons', methods=['POST'])
@jwt_required()
def create_addon():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can create addons
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    required_fields = ['name', 'type', 'version', 'minecraft_version']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Nowa walidacja dla typu pliku
    pack_type = data.get('pack_type', 'separate')  # 'separate', 'combined', 'single'
    
    if data['type'] == 'addon':
        if pack_type == 'separate':
            if not data.get('behavior_pack_url') and not data.get('resource_pack_url'):
                return jsonify({'error': 'Bedrock addon requires at least one pack URL for separate packs'}), 400
        elif pack_type in ['combined', 'single']:
            if not data.get('download_url'):
                return jsonify({'error': 'Combined/single addon requires download URL'}), 400
    
    # Check if addon with same name and version already exists
    existing = Addon.query.filter_by(
        name=data['name'], 
        version=data['version']
    ).first()
    
    if existing:
        return jsonify({'error': 'Addon with this name and version already exists'}), 400
    
    addon = Addon(
        name=data['name'],
        type=data['type'],
        version=data['version'],
        minecraft_version=data['minecraft_version'],
        download_url=data.get('download_url'),
        behavior_pack_url=data.get('behavior_pack_url'),
        resource_pack_url=data.get('resource_pack_url'),
        image_url=data.get('image_url'),
        description=data.get('description'),
        author=data.get('author'),
        is_installed=False,
        pack_type=pack_type  # Nowe pole
    )
    
    db.session.add(addon)
    db.session.commit()
    
    return jsonify(addon.to_dict()), 201

@main.route('/addons/<int:addon_id>', methods=['PUT'])
@jwt_required()
def update_addon(addon_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can update addons
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    addon = Addon.query.get_or_404(addon_id)
    data = request.get_json()
    
    if 'name' in data and 'version' in data:
        # Check if new name and version already exists (excluding current addon)
        existing = Addon.query.filter(
            Addon.name == data['name'],
            Addon.version == data['version'],
            Addon.id != addon_id
        ).first()
        if existing:
            return jsonify({'error': 'Addon with this name and version already exists'}), 400
    
    # Aktualizuj pola
    update_fields = ['name', 'type', 'version', 'minecraft_version', 'download_url',
                    'behavior_pack_url', 'resource_pack_url', 'image_url', 
                    'description', 'author', 'is_active', 'is_installed']
    
    for field in update_fields:
        if field in data:
            setattr(addon, field, data[field])
    
    db.session.commit()
    
    return jsonify(addon.to_dict())
    
@main.route('/servers/<int:server_id>/installed-addons', methods=['GET'])
@jwt_required()
def get_installed_addons(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)

    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403

    # Handle agent-managed Java servers
    if server.agent_id and server.type == 'java':
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500

        success, plugins_list = agent_client.list_plugins(server.name)
        if not success:
            return jsonify({'error': f'Agent error: {plugins_list}'}), 500

        installed_plugin_files = [p['name'] for p in plugins_list]
        all_plugins = Addon.query.filter_by(type='plugin').all()
        installed_addons = []
        for plugin in all_plugins:
            if plugin.download_url and plugin.download_url.split('/')[-1] in installed_plugin_files:
                installed_addons.append(plugin)
        return jsonify([addon.to_dict() for addon in installed_addons])

    # Handle local Java servers
    if not server.agent_id and server.type == 'java':
        # Placeholder for local Java plugin management
        return jsonify([])

    # For Bedrock servers - użyj metody get_installed_servers
    try:
        all_addons = Addon.query.all()
        installed_addons = []
        
        for addon in all_addons:
            try:
                # Użyj metody get_installed_servers z modelu
                installed_servers = addon.get_installed_servers()
                if server_id in installed_servers:
                    installed_addons.append(addon)
            except Exception as e:
                print(f"Error checking addon {addon.id}: {e}")
                continue
                
        return jsonify([addon.to_dict() for addon in installed_addons])
        
    except Exception as e:
        print(f"Error in get_installed_addons: {e}")
        return jsonify([])

@main.route('/servers/<int:server_id>/addons/<int:addon_id>/install', methods=['POST'])
@jwt_required()
def install_addon(server_id, addon_id):
    current_user_id = get_jwt_identity()
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403

    addon = Addon.query.get_or_404(addon_id)
    server = Server.query.get_or_404(server_id)

    # Handle agent-managed Java servers for plugins
    if server.agent_id and server.type == 'java' and addon.type == 'plugin':
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        if not addon.download_url:
            return jsonify({'error': 'Plugin has no download URL'}), 400

        success, result = agent_client.install_plugin(server.name, addon.download_url)
        
        if success:
            return jsonify({'message': f'Plugin {addon.name} installation initiated on agent.'})
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500

    # Handle local Bedrock servers for addons/worlds
    elif server.type == 'bedrock':
        if addon.minecraft_version != server.version:
            return jsonify({'error': f'Addon is for Minecraft {addon.minecraft_version}, server is running {server.version}'}), 400

        bedrock_manager = get_bedrock_manager()
        success, result = bedrock_manager.install_addon(addon, server.name)

        if success:
            if addon.type != 'worlds' and 'pack_info' in result:
                pack_info = result['pack_info']
                if 'behavior_pack_uuid' in pack_info:
                    addon.behavior_pack_uuid = pack_info['behavior_pack_uuid']
                if 'behavior_pack_version' in pack_info:
                    addon.behavior_pack_version = pack_info['behavior_pack_version']
                if 'resource_pack_uuid' in pack_info:
                    addon.resource_pack_uuid = pack_info['resource_pack_uuid']
                if 'resource_pack_version' in pack_info:
                    addon.resource_pack_version = pack_info['resource_pack_version']

            addon.add_installed_server(server.id)
            addon.is_installed = True

            if addon.type != 'worlds':
                addon.enabled = True

            db.session.commit()

            return jsonify({
                'message': f"{addon.type.capitalize()} installed successfully",
                'details': result.get('results', {}),
                'server_added': server.id in addon.get_installed_servers()
            })
        else:
            error_message = result.get('error', result) if isinstance(result, dict) else result
            return jsonify({'error': error_message}), 500

    return jsonify({'error': 'This operation is not supported for the given server and addon type.'}), 400
        
@main.route('/admin/fix-installed-addons', methods=['POST'])
@jwt_required()
def fix_installed_addons():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can run this
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    # Pobierz wszystkie serwery
    servers = Server.query.all()
    fixed_count = 0
    
    for server in servers:
        if server.type != 'bedrock':
            continue
            
        server_path = os.path.join(current_app.config['SERVER_BASE_PATH'], server.name)
        
        # Sprawdź behavior_packs
        behavior_packs_path = os.path.join(server_path, 'behavior_packs')
        if os.path.exists(behavior_packs_path):
            for addon_name in os.listdir(behavior_packs_path):
                addon_path = os.path.join(behavior_packs_path, addon_name)
                if os.path.isdir(addon_path):
                    # Znajdź addon po nazwie
                    addon = Addon.query.filter_by(name=addon_name).first()
                    if addon:
                        # Napraw installed_on_servers
                        if addon.installed_on_servers is None:
                            addon.installed_on_servers = []
                        elif isinstance(addon.installed_on_servers, dict):
                            addon.installed_on_servers = list(addon.installed_on_servers.values())
                        
                        # Dodaj serwer do listy jeśli go nie ma
                        if server.id not in addon.installed_on_servers:
                            addon.installed_on_servers.append(server.id)
                            addon.is_installed = True
                            fixed_count += 1
                            print(f"Added server {server.id} to addon {addon.name}")
        
        # Sprawdź resource_packs
        resource_packs_path = os.path.join(server_path, 'resource_packs')
        if os.path.exists(resource_packs_path):
            for addon_name in os.listdir(resource_packs_path):
                addon_path = os.path.join(resource_packs_path, addon_name)
                if os.path.isdir(addon_path):
                    # Znajdź addon po nazwie
                    addon = Addon.query.filter_by(name=addon_name).first()
                    if addon:
                        # Napraw installed_on_servers
                        if addon.installed_on_servers is None:
                            addon.installed_on_servers = []
                        elif isinstance(addon.installed_on_servers, dict):
                            addon.installed_on_servers = list(addon.installed_on_servers.values())
                        
                        # Dodaj serwer do listy jeśli go nie ma
                        if server.id not in addon.installed_on_servers:
                            addon.installed_on_servers.append(server.id)
                            addon.is_installed = True
                            fixed_count += 1
                            print(f"Added server {server.id} to addon {addon.name}")
    
    db.session.commit()
    
    return jsonify({
        'message': f'Fixed {fixed_count} addon-server relationships'
    })

@main.route('/servers/<int:server_id>/addons/<int:addon_id>/uninstall', methods=['POST'])
@jwt_required()
def uninstall_addon(server_id, addon_id):
    current_user_id = get_jwt_identity()
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403

    addon = Addon.query.get_or_404(addon_id)
    server = Server.query.get_or_404(server_id)

    # Handle agent-managed Java servers for plugins
    if server.agent_id and server.type == 'java' and addon.type == 'plugin':
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500

        if not addon.download_url:
            return jsonify({'error': 'Cannot determine plugin filename without download URL'}), 400

        filename = addon.download_url.split('/')[-1]
        success, result = agent_client.delete_plugin(server.name, filename)
        
        if success:
            return jsonify({'message': f'Plugin {addon.name} uninstalled from agent.'})
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500

    # Handle local Bedrock servers for addons/worlds
    elif server.type == 'bedrock':
        bedrock_manager = get_bedrock_manager()
        success, result = bedrock_manager.uninstall_addon(addon, server.name)
        
        if success:
            addon.remove_installed_server(server.id)
            if not addon.get_installed_servers():
                addon.is_installed = False
                if addon.type != 'worlds':
                    addon.behavior_pack_uuid = None
                    addon.behavior_pack_version = None
                    addon.resource_pack_uuid = None
                    addon.resource_pack_version = None
            db.session.commit()

            if isinstance(result, dict) and 'message' in result:
                return jsonify({'message': result['message']})
            else:
                return jsonify({'message': result})
        else:
            error_message = result.get('error', result) if isinstance(result, dict) else result
            return jsonify({'error': error_message}), 500

    return jsonify({'error': 'This operation is not supported for the given server and addon type.'}), 400
        
@main.route('/servers/<int:server_id>/addons/<int:addon_id>/enable', methods=['POST'])
@jwt_required()
def enable_addon(server_id, addon_id):
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403
    
    addon = Addon.query.get_or_404(addon_id)
    server = Server.query.get_or_404(server_id)
    
    # Tylko dla serwerów Bedrock
    if server.type != 'bedrock':
        return jsonify({'error': 'Addons can only be enabled on Bedrock servers'}), 400
    
    # Sprawdź czy addon jest zainstalowany (UŻYJ NOWEJ METODY)
    if not addon.is_installed or server.id not in addon.get_installed_servers():
        return jsonify({'error': 'Addon is not installed on this server'}), 400
    
    # Utwórz manager
    bedrock_manager = get_bedrock_manager()
    
    # Włącz addon
    success, result = bedrock_manager.toggle_addon(server.name, addon, enable=True)
    
    if success:
        # Zapisz status enabled
        addon.enabled = True
        db.session.commit()
        
        return jsonify({
            'message': 'Addon enabled successfully',
            'details': result
        })
    else:
        return jsonify({'error': result}), 500

@main.route('/servers/<int:server_id>/addons/<int:addon_id>/disable', methods=['POST'])
@jwt_required()
def disable_addon(server_id, addon_id):
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403
    
    addon = Addon.query.get_or_404(addon_id)
    server = Server.query.get_or_404(server_id)
    
    # Tylko dla serwerów Bedrock
    if server.type != 'bedrock':
        return jsonify({'error': 'Addons can only be disabled on Bedrock servers'}), 400
    
    # Sprawdź czy addon jest zainstalowany (UŻYJ NOWEJ METODY)
    if not addon.is_installed or server.id not in addon.get_installed_servers():
        return jsonify({'error': 'Addon is not installed on this server'}), 400
    
    # Utwórz manager
    bedrock_manager = get_bedrock_manager()
    
    # Wyłącz addon
    success, result = bedrock_manager.toggle_addon(server.name, addon, enable=False)
    
    if success:
        # Zapisz status enabled
        addon.enabled = False
        db.session.commit()
        
        return jsonify({
            'message': 'Addon disabled successfully',
            'details': result
        })
    else:
        return jsonify({'error': result}), 500

@main.route('/addons/<int:addon_id>', methods=['DELETE'])
@jwt_required()
def delete_addon(addon_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can delete addons
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    addon = Addon.query.get_or_404(addon_id)
    
    db.session.delete(addon)
    db.session.commit()
    
    return jsonify({'message': 'Addon deleted successfully'})

@main.route('/addons/types', methods=['GET'])
@jwt_required()
def get_addon_types():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can access addon types
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'types': ['addon', 'plugin', 'script','worlds','textures'],
        'minecraft_versions': ['1.20.15','1.20.10','1.20.1']
    })

@main.route('/servers/<int:server_id>/performance', methods=['GET'])
@jwt_required()
def get_server_performance(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        import psutil
        import time
        
        performance_data = {
            'cpu_percent': 0.0,
            'memory_percent': 0.0,
            'tps': 20.0,  # Domyślnie maksymalne TPS
            'players_online': 0,
            'network_up': 0,
            'network_down': 0,
            'uptime': 0
        }
        
        server_pid = server.pid
        
        # Pobierz rzeczywiste statystyki jeśli serwer działa
        if server.status == 'running' and server_pid:
            try:
                process = psutil.Process(server_pid)
                
                # CPU usage
                performance_data['cpu_percent'] = round(process.cpu_percent(interval=0.1), 1)
                
                # Memory usage
                memory_info = process.memory_info()
                performance_data['memory_percent'] = round((memory_info.rss / psutil.virtual_memory().total) * 100, 1)
                
                # Uptime
                create_time = process.create_time()
                performance_data['uptime'] = int(time.time() - create_time)
                
                # Network stats (jeśli dostępne)
                try:
                    net_io = process.io_counters()
                    performance_data['network_up'] = net_io.write_bytes // 1024
                    performance_data['network_down'] = net_io.read_bytes // 1024
                except (AttributeError, psutil.AccessDenied):
                    pass
                    
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                # Proces nie istnieje lub brak uprawnień
                server.status = 'stopped'
                server.pid = None
                db.session.commit()
        
        # Pobierz liczbę graczy z server.properties (dla Minecraft)
        try:
            properties = server_manager.get_server_properties(server.name)
            if properties and 'max-players' in properties:
                # To jest uproszczenie - w rzeczywistości trzeba by parsować listę graczy
                performance_data['players_online'] = 0  # Tymczasowo 0
        except:
            pass
        
        # TPS - trudne do zmierzenia bez bezpośredniego dostępu do logów serwera
        # Można spróbować oszacować na podstawie obciążenia CPU
        if performance_data['cpu_percent'] > 90:
            performance_data['tps'] = round(20 * (1 - (performance_data['cpu_percent'] - 90) / 100), 1)
        else:
            performance_data['tps'] = 20.0
        
        return jsonify(performance_data)
        
    except Exception as e:
        return jsonify({'error': f'Error getting performance stats: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/quick-settings', methods=['GET'])
@jwt_required()
def get_quick_settings(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Pobierz ustawienia z server.properties
    properties = server_manager.get_server_properties(server.name)
    
    quick_settings = {
        'difficulty': properties.get('difficulty', 'easy'),
        'gamemode': properties.get('gamemode', 'survival'),
        'whitelist': properties.get('white-list', 'false').lower() == 'true'
    }
    
    return jsonify(quick_settings)

@main.route('/servers/<int:server_id>/quick-settings', methods=['POST'])
@jwt_required()
def update_quick_settings(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    data = request.get_json()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Pobierz aktualne properties
    properties = server_manager.get_server_properties(server.name)
    if not properties:
        return jsonify({'error': 'Could not read server properties'}), 500
    
    # Aktualizuj wybrane ustawienia
    if 'difficulty' in data:
        properties['difficulty'] = data['difficulty']
    
    if 'gamemode' in data:
        properties['gamemode'] = data['gamemode']
    
    if 'whitelist' in data:
        properties['white-list'] = 'true' if data['whitelist'] else 'false'
    
    # Zapisz zmiany
    success, message = server_manager.update_server_properties(server.name, properties)
    if success:
        return jsonify({'message': 'Quick settings updated successfully'})
    else:
        return jsonify({'error': message}), 500

@main.route('/servers/<int:server_id>/backups', methods=['GET'])
@jwt_required()
def get_server_backups(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    backups = []
    
    # Użyj ścieżki względnej z konfiguracji zamiast hardcodowanej
    backup_dir = current_app.config.get('BACKUP_PATH', os.path.join(current_app.config.get('SERVER_BASE_PATH', ''), '..', 'data', 'backups'))
    backup_dir = os.path.realpath(backup_dir)
    
    print(f"Backup directory: {backup_dir}")
    
    if os.path.exists(backup_dir):
        for file_name in os.listdir(backup_dir):
            if file_name.endswith('.zip') and server.name in file_name:
                file_path = os.path.join(backup_dir, file_name)
                try:
                    created_at = os.path.getctime(file_path)
                    backups.append({
                        'name': file_name,
                        'size': os.path.getsize(file_path),
                        'created_at': created_at,
                        'created_at_formatted': datetime.fromtimestamp(created_at).strftime('%Y-%m-%d %H:%M:%S'),
                        'status': 'completed'
                    })
                except OSError as e:
                    print(f"Error reading backup file {file_name}: {e}")
                    continue
    
    backups.sort(key=lambda x: x['created_at'], reverse=True)
    
    return jsonify({'backups': backups})

@main.route('/servers/<int:server_id>/backups', methods=['POST'])
@jwt_required()
def create_server_backup(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Sprawdź czy serwer jest wyłączony
    if server.status == 'running':
        return jsonify({'error': 'Server must be stopped to create backup'}), 400
    
    try:
        import zipfile
        from datetime import datetime
        
        # Użyj ścieżki z konfiguracji
        backup_dir = current_app.config.get('BACKUP_PATH', os.path.join(current_app.config.get('SERVER_BASE_PATH', ''), '..', 'data', 'backups'))
        backup_dir = os.path.realpath(backup_dir)
        os.makedirs(backup_dir, exist_ok=True)
        
        # Nazwa pliku backupu
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f'backup_{server.name}_{timestamp}.zip'
        backup_path = os.path.join(backup_dir, backup_name)
        
        print(f"Creating backup for server: {server.name}")
        print(f"Server path: {server.path}")
        print(f"Backup path: {backup_path}")
        
        # Sprawdź czy ścieżka serwera istnieje
        if not os.path.exists(server.path):
            return jsonify({'error': f'Server directory does not exist: {server.path}'}), 400
        
        # Utwórz backup
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            added_files = 0
            
            # Rekurencyjnie dodaj wszystkie pliki z katalogu serwera
            for root, dirs, files in os.walk(server.path):
                # Pomijaj niektóre katalogi/pliki
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['__pycache__', 'cache']]
                
                for file in files:
                    if file.startswith('.'):
                        continue
                        
                    file_path = os.path.join(root, file)
                    # Użyj ścieżki względnej od server.path
                    arcname = os.path.relpath(file_path, server.path)
                    zipf.write(file_path, arcname)
                    added_files += 1
                    
                    if added_files % 100 == 0:
                        print(f"Added {added_files} files...")
            
            print(f"Backup completed. Total files added: {added_files}")
        
        # Sprawdź rozmiar stworzonego backupu
        backup_size = os.path.getsize(backup_path) if os.path.exists(backup_path) else 0
        print(f"Backup size: {backup_size} bytes")
        
        if backup_size == 0:
            # Usuń pusty plik backupu
            if os.path.exists(backup_path):
                os.remove(backup_path)
            return jsonify({'error': 'Backup file is empty. No files were added.'}), 500
        
        return jsonify({
            'message': f'Backup created: {backup_name}',
            'backup_name': backup_name,
            'file_count': added_files,
            'size': backup_size
        })
        
    except Exception as e:
        print(f"Backup error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to create backup: {str(e)}'}), 500
        
@main.route('/servers/<int:server_id>/backups/<backup_name>', methods=['DELETE'])
@jwt_required()
def delete_server_backup(server_id, backup_name):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        backup_dir = os.path.join(os.path.realpath('../data'), 'backups')
        backup_path = os.path.join(backup_dir, backup_name)
        
        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup not found'}), 404
        
        # Usuń plik backupu
        os.remove(backup_path)
        
        return jsonify({'message': f'Backup {backup_name} deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete backup: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/backups/<backup_name>/restore', methods=['POST'])
@jwt_required()
def restore_server_backup(server_id, backup_name):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Sprawdź czy serwer jest wyłączony
    if server.status == 'running':
        return jsonify({'error': 'Server must be stopped to restore backup'}), 400
    
    try:
        import zipfile
        import shutil
        
        backup_dir = os.path.join(os.path.realpath('../data'), 'backups')
        backup_path = os.path.join(backup_dir, backup_name)
        
        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup not found'}), 404
        
        # Przywróć backup
        with zipfile.ZipFile(backup_path, 'r') as zipf:
            zipf.extractall(server.path)
        
        return jsonify({'message': f'Backup {backup_name} restored successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to restore backup: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/console', methods=['GET'])
@jwt_required()
def get_console_output(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    lines = request.args.get('lines', 100, type=int)
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        success, result = agent_client.get_console(server.name, lines)
        
        if success:
            return jsonify({'output': result.get('output', '')})
        else:
            return jsonify({'error': f'Agent error: {result}'}), 500
    else:
        try:
            output = server_manager.get_realtime_output(server_id)
            return jsonify({'output': output})
        except Exception as e:
            return jsonify({'error': f'Error getting console: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/console', methods=['POST'])
@jwt_required()
def send_console_command(server_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    command = data.get('command', '')
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'can_edit_files'):
        return jsonify({'error': 'Access denied'}), 403
    
    # Sprawdź czy serwer działa
    server = Server.query.get_or_404(server_id)
    if server.status != 'running':
        return jsonify({'error': 'Server is not running'}), 400
    
    # Wyślij komendę do serwera
    success, message = server_manager.send_command(server_id, command)
    
    if success:
        return jsonify({'message': 'Command sent successfully'})
    else:
        return jsonify({'error': message}), 500
        
@main.route('/servers/<int:server_id>/size', methods=['GET'])
@jwt_required()
def get_server_size(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        import shutil
        server_path = server_manager.get_server_path(server.name)
        
        if os.path.exists(server_path):
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(server_path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    total_size += os.path.getsize(filepath)
            
            # Convert to GB
            size_gb = total_size / (1024 ** 3)
            return jsonify({'size_gb': round(size_gb, 2)})
        else:
            return jsonify({'size_gb': 0})
            
    except Exception as e:
        return jsonify({'error': f'Error calculating size: {str(e)}'}), 500
        
@main.route('/check-port', methods=['POST'])
@jwt_required()
def check_port():
    """
    Sprawdza dostępność portu
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only admins can check ports
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    port = data.get('port')
    server_type = data.get('type', 'java')
    
    if not port:
        return jsonify({'error': 'Port is required'}), 400
    
    try:
        port = int(port)
        if port < 1 or port > 65535:
            return jsonify({'error': 'Invalid port number'}), 400
    except ValueError:
        return jsonify({'error': 'Port must be a number'}), 400
    
    # Sprawdź czy port jest już używany przez inny serwer
    existing_server = Server.query.filter_by(port=port).first()
    if existing_server:
        return jsonify({'available': False, 'reason': 'Port already used by another server'})
    
    # Sprawdź czy port jest wolny w systemie
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('127.0.0.1', port))
            available = result != 0
    except Exception as e:
        return jsonify({'error': f'Error checking port: {str(e)}'}), 500
    
    return jsonify({'available': available})
    
@main.route('/servers/<int:server_id>/files/check', methods=['GET'])
@jwt_required()
def check_server_files(server_id):
    """
    Sprawdza czy serwer ma zainstalowane pliki (lokalnie lub na agencie)
    """
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        # Jeśli serwer ma przypisanego agenta, sprawdź przez agenta
        if server.agent_id:
            agent_client = _get_agent_client(server_id=server_id)
            if not agent_client:
                return jsonify({'error': 'Agent not available'}), 500
            
            # Wyślij żądanie do agenta o sprawdzenie plików
            success, result = agent_client.check_server_files(server.name)
            
            if success:
                return jsonify({
                    'hasFiles': result.get('hasFiles', False),
                    'message': result.get('message', ''),
                    'fileCount': result.get('fileCount', 0),
                    'serverType': server.type,
                    'checkedVia': 'agent'
                })
            else:
                # W przypadku błędu agenta, zwróć podstawową informację
                return jsonify({
                    'hasFiles': False,
                    'message': f'Agent error: {result}',
                    'serverType': server.type,
                    'checkedVia': 'agent_error'
                })
        
        # Lokalne sprawdzanie (oryginalna logika)
        server_path = server_manager.get_server_path(server.name)
        
        # Sprawdź czy katalog serwera istnieje
        if not os.path.exists(server_path):
            return jsonify({
                'hasFiles': False, 
                'message': 'Server directory does not exist',
                'checkedVia': 'local'
            })
        
        # Sprawdź czy są jakieś pliki (ignorując ukryte pliki systemowe)
        files = [f for f in os.listdir(server_path) 
                if not f.startswith('.') and f not in ['__pycache__', '.git']]
        
        has_files = len(files) > 0
        
        # Dla serwerów Bedrock sprawdź obecność bedrock_server
        if server.type == 'bedrock':
            bedrock_binary = os.path.join(server_path, 'bedrock_server')
            bedrock_binary_exe = os.path.join(server_path, 'bedrock_server.exe')
            # Sprawdź różne możliwe nazwy plików wykonywalnych Bedrock
            possible_binaries = ['bedrock_server', 'bedrock_server.exe', 'bedrock_server_1.21.100.7']
            has_bedrock_binary = any(os.path.exists(os.path.join(server_path, binary)) for binary in possible_binaries)
            
            # Jeśli nie znaleziono standardowych nazw, sprawdź czy jest jakikolwiek plik wykonywalny
            if not has_bedrock_binary:
                for file in files:
                    file_path = os.path.join(server_path, file)
                    if os.path.isfile(file_path) and (os.access(file_path, os.X_OK) or file.endswith('.exe')):
                        has_bedrock_binary = True
                        break
            
            has_files = has_bedrock_binary  # Dla Bedrock najważniejszy jest plik wykonywalny
        
        # Dla serwerów Java sprawdź obecność pliku JAR
        elif server.type == 'java':
            jar_files = [f for f in files if f.endswith('.jar') and 'server' in f.lower()]
            has_jar = len(jar_files) > 0
            
            # Sprawdź również inne kryteria - może serwer ma już uruchomione pliki
            if not has_jar:
                # Sprawdź czy są inne ważne pliki serwera Minecraft
                important_files = ['eula.txt', 'server.properties', 'world', 'logs']
                has_important_files = any(os.path.exists(os.path.join(server_path, f)) for f in important_files)
                
                # Jeśli są ważne pliki, zakładamy że serwer jest zainstalowany
                if has_important_files and has_files:
                    has_jar = True
            
            has_files = has_jar  # Dla Java najważniejszy jest plik JAR lub ważne pliki konfiguracyjne
        
        return jsonify({
            'hasFiles': has_files,
            'fileCount': len(files),
            'serverType': server.type,
            'serverPath': server_path,
            'message': 'Server files found' if has_files else 'Server files missing',
            'checkedVia': 'local'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error checking server files: {str(e)}'}), 500
        
@main.route('/servers/<int:server_id>/install', methods=['POST'])
@jwt_required()
def install_server(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_start'):
        return jsonify({'error': 'Access denied'}), 403
    
    if server.status == 'running':
        return jsonify({'error': 'Server must be stopped to install'}), 400
    
    if server.agent_id:
        agent_client = _get_agent_client(server_id=server_id)
        if not agent_client:
            return jsonify({'error': 'Agent not available'}), 500
        
        server_data = {
            'name': server.name,
            'type': server.type,
            'implementation': server.implementation,
            'version': server.version,
            'port': server.port
        }
        
        # Dodaj URL dla Bedrock
        if server.type == 'bedrock':
            bedrock_version = BedrockVersion.query.filter_by(
                version=server.version, 
                is_active=True
            ).first()
            if bedrock_version:
                server_data['bedrock_url'] = bedrock_version.download_url
        
        success, result = agent_client.install_server(server_data)
        
        if success:
            return jsonify({
                'message': 'Server installation started on agent',
                'agent_response': result
            })
        else:
            return jsonify({'error': f'Agent installation error: {result}'}), 500
    else:
        # Lokalna instalacja
        try:
            server_path = server_manager.get_server_path(server.name)
            if os.path.exists(server_path) and len([f for f in os.listdir(server_path) if not f.startswith('.')]) > 0:
                return jsonify({'error': 'Server already has files installed'}), 400
        except Exception as e:
            print(f"Warning: Could not check server files: {e}")
        
        try:
            os.makedirs(server_path, exist_ok=True)
            
            if server.type == 'bedrock':
                return _install_bedrock_server(server)
            elif server.type == 'java':
                return _install_java_server(server)
            else:
                return jsonify({'error': f'Unsupported server type: {server.type}'}), 400
                
        except Exception as e:
            return jsonify({'error': f'Installation failed: {str(e)}'}), 500


def _install_bedrock_server(server):
    """
    Instalacja serwera Bedrock - używa istniejącej metody start_server
    """
    try:
        # Znajdź wersję Bedrock
        bedrock_version = BedrockVersion.query.filter_by(
            version=server.version, 
            is_active=True
        ).first()
        
        if not bedrock_version:
            return jsonify({'error': f'Bedrock version {server.version} not found or inactive'}), 400
        
        # Pobierz URL do pobrania
        download_url = bedrock_version.download_url
        
        # Użyj istniejącej metody start_server, która automatycznie pobiera pliki
        success, message = server_manager.start_server(server, download_url)
        
        if success:
            return jsonify({
                'message': 'Bedrock server installation started',
                'download_url': download_url,
                'version': server.version
            })
        else:
            return jsonify({'error': message}), 500
            
    except Exception as e:
        return jsonify({'error': f'Bedrock installation error: {str(e)}'}), 500

def _install_java_server(server):
    """
    Instalacja serwera Java - używa istniejącej metody start_server
    """
    try:
        # Dla serwera Java użyj standardowego start_server
        success, message = server_manager.start_server(server)
        
        if success:
            return jsonify({
                'message': 'Java server installation started',
                'version': server.version
            })
        else:
            return jsonify({'error': message}), 500
            
    except Exception as e:
        return jsonify({'error': f'Java installation error: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/installation-progress', methods=['GET'])
@jwt_required()
def get_installation_progress(server_id):
    """
    Pobiera postęp instalacji serwera - używa get_download_progress
    """
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        server = Server.query.get_or_404(server_id)
        
        # Dla agenta, sprawdź również status plików
        if server.agent_id:
            agent_client = _get_agent_client(server_id=server_id)
            if agent_client:
                # Sprawdź czy pliki już istnieją u agenta
                files_success, files_result = agent_client.check_server_files(server.name)
                if files_success and files_result.get('hasFiles', False):
                    return jsonify({
                        'status': 'complete',
                        'message': 'Server installed on agent',
                        'agent_files_check': files_result
                    })
        
        # Użyj istniejącej metody get_download_progress
        progress = server_manager.get_download_progress(server_id)
        
        return jsonify(progress)
        
    except Exception as e:
        return jsonify({'error': f'Error getting installation progress: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/clean-install', methods=['POST'])
@jwt_required()
def clean_install_server(server_id):
    """
    Czyści instalację serwera i rozpoczyna nową
    """
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    # Check permissions - tylko admin
    user = User.query.get(current_user_id)
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    # Sprawdź czy serwer jest zatrzymany
    if server.status == 'running':
        return jsonify({'error': 'Server must be stopped to reinstall'}), 400
    
    try:
        server_path = server_manager.get_server_path(server.name)
        
        # Usuń istniejące pliki serwera
        if os.path.exists(server_path):
            shutil.rmtree(server_path)
            print(f"Removed server directory: {server_path}")
        
        # Utwórz pusty katalog
        os.makedirs(server_path, exist_ok=True)
        
        # Rozpocznij nową instalację używając standardowego start_server
        if server.type == 'bedrock':
            return _install_bedrock_server(server)
        elif server.type == 'java':
            return _install_java_server(server)
        else:
            return jsonify({'error': f'Unsupported server type: {server.type}'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Clean installation failed: {str(e)}'}), 500

@main.route('/servers/<int:server_id>/download-status', methods=['GET'])
@jwt_required()
def get_download_status(server_id):
    """
    Pobiera status pobierania plików serwera - używa get_download_progress
    """
    current_user_id = get_jwt_identity()
    
    # Check permissions
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        # Użyj istniejącej metody get_download_progress
        status = server_manager.get_download_progress(server_id)
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({'error': f'Error getting download status: {str(e)}'}), 500


@main.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Pobiera profil użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    return jsonify(user.to_dict())

@main.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Aktualizuje profil użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'email' in data:
        # Sprawdź czy email nie jest już używany
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'Email jest już używany przez innego użytkownika'}), 400
        user.email = data['email']
    
    if 'username' in data:
        # Sprawdź czy nazwa użytkownika nie jest już używana
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'Nazwa użytkownika jest już używana'}), 400
        user.username = data['username']
    
    if 'language' in data:
        user.language = data['language']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Profil został zaktualizowany',
        'user': user.to_dict()
    })

@main.route('/user/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """Pobiera ustawienia powiadomień użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    notification_settings = user.get_notification_settings()
    
    return jsonify(notification_settings)

@main.route('/user/notifications', methods=['PUT'])
@jwt_required()
def update_user_notifications():
    """Aktualizuje ustawienia powiadomień użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    valid_settings = ['email_notifications', 'server_status', 'backup_notifications', 'security_alerts']
    for key in data:
        if key not in valid_settings:
            return jsonify({'error': f'Nieprawidłowe ustawienie: {key}'}), 400
    
    user.set_notification_settings(data)
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Ustawienia powiadomień zostały zaktualizowane',
        'notifications': user.get_notification_settings()
    })

@main.route('/user/change-password', methods=['POST'])
@jwt_required()
def change_user_password():
    """Zmienia hasło użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not current_password or not new_password or not confirm_password:
        return jsonify({'error': 'Wszystkie pola są wymagane'}), 400
    
    if new_password != confirm_password:
        return jsonify({'error': 'Nowe hasła nie są identyczne'}), 400
    
    success, message = user.change_password(current_password, new_password)
    
    if success:
        return jsonify({'message': message})
    else:
        return jsonify({'error': message}), 400

@main.route('/user/export-data', methods=['POST'])
@jwt_required()
def export_user_data():
    """Inicjuje eksport danych użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    # Tutaj logika eksportu danych - symulacja
    # W rzeczywistej aplikacji tutaj byłby proces eksportu do pliku
    
    return jsonify({
        'message': 'Rozpoczęto eksport danych. Link do pobrania zostanie wysłany na adres email.',
        'export_id': f'export_{user.id}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}'
    })

@main.route('/user/sessions', methods=['GET'])
@jwt_required()
def get_user_sessions():
    """Pobiera aktywne sesje użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)

    active_sessions = UserSession.query.filter_by(
        user_id=user.id, 
        is_active=True
    ).filter(UserSession.expires_at > datetime.utcnow()).all()
    
    return jsonify([session.to_dict() for session in active_sessions])

@main.route('/user/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def revoke_user_session(session_id):
    """Unieważnia sesję użytkownika"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    session = UserSession.query.filter_by(
        id=session_id, 
        user_id=user.id
    ).first_or_404()
    
    session.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Sesja została unieważniona'})

@main.route('/user/enable-2fa', methods=['POST'])
@jwt_required()
def enable_2fa():
    """Włącza uwierzytelnianie dwuskładnikowe"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    verification_code = data.get('verification_code')
    secret = data.get('secret')
    
    if not verification_code or not secret:
        return jsonify({'error': 'Brakujący kod weryfikacyjny lub sekret'}), 400
    
    # Tutaj weryfikacja kodu 2FA - symulacja
    # W rzeczywistej aplikacji użyj biblioteki do 2FA jak pyotp
    
    user.enable_two_factor(secret)
    
    return jsonify({'message': 'Uwierzytelnianie dwuskładnikowe zostało włączone'})

@main.route('/user/disable-2fa', methods=['POST'])
@jwt_required()
def disable_2fa():
    """Wyłącza uwierzytelnianie dwuskładnikowe"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    user.disable_two_factor()
    
    return jsonify({'message': 'Uwierzytelnianie dwuskładnikowe zostało wyłączone'})

@main.route('/user/generate-2fa-secret', methods=['POST'])
@jwt_required()
def generate_2fa_secret():
    """Generuje sekret 2FA"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)

    import secrets
    import base64
    
    secret = base64.b32encode(secrets.token_bytes(10)).decode('utf-8')
    
    return jsonify({
        'secret': secret,
        'qr_code_url': f'otpauth://totp/Shockbyte:{user.username}?secret={secret}&issuer=Shockbyte'
    })

def agent_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Pobierz token z nagłówka Authorization
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        agent_token = auth_header.replace('Bearer ', '').strip()
        if not agent_token:
            return jsonify({'error': 'Missing agent token'}), 401
        
        # Znajdź agenta po tokenie
        agent = Agent.query.filter_by(auth_token=agent_token).first()
        if not agent:
            return jsonify({'error': 'Invalid agent token'}), 401
        
        # Dodaj agenta do kontekstu requesta
        request.agent = agent
        return f(*args, **kwargs)
    return decorated_function
    
# Endpointy do zarządzania agentami
@main.route('/agents', methods=['GET'])
@jwt_required()
def get_agents():
    agents = Agent.query.all()
    
    current_time = datetime.utcnow()
    
    agents_data = []
    for agent in agents:
        is_online = agent.updated_at and (current_time - agent.updated_at) < timedelta(minutes=5)
        
        agents_data.append({
            'id': agent.id,
            'name': agent.name,
            'url': agent.url,
            'status': 'online' if is_online else 'offline',
            'location': agent.location,
            'cpu_usage': agent.cpu_usage,
            'memory_usage': agent.memory_usage,
            'disk_usage': agent.disk_usage,
            'max_servers': agent.max_servers,
            'running_servers': agent.running_servers,
            'last_update': agent.updated_at.isoformat() if agent.updated_at else None,
            'is_active': agent.is_active,
            'version': agent.version,
            'created_at': agent.created_at.isoformat() if agent.created_at else None,
        })
    
    return jsonify(agents_data)

@main.route('/agents', methods=['POST'])
@jwt_required()
def create_agent():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Only admins can create agents'}), 403
    
    data = request.get_json()
    
    required_fields = ['name', 'url', 'token']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    if Agent.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Agent with this name already exists'}), 400
    
    if Agent.query.filter_by(url=data['url']).first():
        return jsonify({'error': 'Agent with this URL already exists'}), 400
    
    agent = Agent(
        name=data['name'],
        url=data['url'],
        auth_token=data['token'],
        location=data.get('location', 'Unknown'),
        max_servers=data.get('capacity', 5),
        status='offline'
    )
    
    db.session.add(agent)
    db.session.commit()
    
    return jsonify(agent.to_dict()), 201

@main.route('/agents/<int:agent_id>', methods=['GET'])
@jwt_required()
def get_agent(agent_id):
    """Pobiera szczegóły agenta"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    return jsonify(agent.to_dict())

@main.route('/agents/<int:agent_id>', methods=['PUT'])
@jwt_required()
def update_agent(agent_id):
    """Aktualizuje agenta"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    data = request.get_json()
    
    # Walidacja unikalności nazwy
    if 'name' in data and data['name'] != agent.name:
        existing = Agent.query.filter_by(name=data['name']).first()
        if existing and existing.id != agent_id:
            return jsonify({'error': 'Agent with this name already exists'}), 400
        agent.name = data['name']
    
    # Walidacja unikalności URL
    if 'url' in data and data['url'] != agent.url:
        existing = Agent.query.filter_by(url=data['url']).first()
        if existing and existing.id != agent_id:
            return jsonify({'error': 'Agent with this URL already exists'}), 400
        agent.url = data['url']
    
    # Aktualizacja tokenu (tylko jeśli podany)
    if 'token' in data and data['token']:
        agent.auth_token = data['token']
    
    # Pozostałe pola
    if 'location' in data:
        agent.location = data['location']
    
    if 'capacity' in data:
        agent.max_servers = data['capacity']
    
    if 'is_active' in data:
        agent.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(agent.to_dict())

@main.route('/agents/<int:agent_id>', methods=['DELETE'])
@jwt_required()
def delete_agent(agent_id):
    """Usuwa agenta"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    
    # Sprawdź czy agent nie hostuje żadnych serwerów
    if agent.servers:
        server_names = [server.name for server in agent.servers]
        return jsonify({
            'error': 'Cannot delete agent with assigned servers',
            'servers': server_names
        }), 400
    
    db.session.delete(agent)
    db.session.commit()
    
    return jsonify({'message': 'Agent deleted successfully'})

@main.route('/agents/<int:agent_id>/restart', methods=['POST'])
@jwt_required()
def restart_agent(agent_id):
    """Wysyła komendę restartu do agenta"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    
    try:
        # Wyślij komendę restartu do agenta
        import requests
        response = requests.post(
            f"{agent.url}/restart",
            headers={'Authorization': f'Bearer {agent.token}'},
            timeout=10
        )
        
        if response.status_code == 200:
            agent.status = 'restarting'
            db.session.commit()
            return jsonify({'message': 'Restart command sent to agent'})
        else:
            return jsonify({'error': f'Agent responded with status {response.status_code}'}), 400
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to connect to agent: {str(e)}'}), 400

@main.route('/agents/<int:agent_id>/servers', methods=['GET'])
@jwt_required()
def get_agent_servers(agent_id):
    """Pobiera serwery przypisane do agenta"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    servers = Server.query.filter_by(agent_id=agent_id).all()
    
    return jsonify([server.to_dict() for server in servers])

@main.route('/servers/<int:server_id>/assign-to-agent', methods=['POST'])
@jwt_required()
def assign_server_to_agent(server_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    agent_id = data.get('agent_id')
    
    if not agent_id:
        return jsonify({'error': 'agent_id is required'}), 400
    
    server = Server.query.get_or_404(server_id)
    agent = Agent.query.get_or_404(agent_id)
    
    current_servers = Server.query.filter_by(agent_id=agent_id).count()
    if current_servers >= agent.max_servers:
        return jsonify({'error': 'Agent has reached maximum capacity'}), 400
    
    server.agent_id = agent_id
    db.session.commit()
    
    return jsonify({'message': f'Server assigned to agent {agent.name}'})

@main.route('/api/agent/status', methods=['POST'])
@agent_token_required
def report_agent_status():
    """Endpoint dla agentów do raportowania statusu"""
    try:
        data = request.get_json()
        agent = request.agent
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"Received status from agent {agent.name}: {data}")

        berlin_tz = ZoneInfo('Europe/Berlin')
        
        # Aktualizuj status agenta
        agent.status = 'online'
        agent.last_seen = datetime.now(berlin_tz)
        agent.updated_at = datetime.now(berlin_tz)
        print(f"Update Date {agent.updated_at}")

        # DEBUG: Sprawdź jakie dane przychodzą
        print(f"DEBUG - Data received: {data}")
        
        # Aktualizuj metryki (upewnij się, że klucze się zgadzają)
        if 'cpu_usage' in data:
            agent.cpu_usage = float(data['cpu_usage'])
            print(f"DEBUG - Updated CPU: {agent.cpu_usage}%")
        
        if 'memory_usage' in data:
            agent.memory_usage = float(data['memory_usage'])
            print(f"DEBUG - Updated Memory: {agent.memory_usage}%")
        
        if 'disk_usage' in data:
            agent.disk_usage = float(data['disk_usage'])
            print(f"DEBUG - Updated Disk: {agent.disk_usage}%")
        
        if 'running_servers' in data:
            agent.running_servers = int(data['running_servers'])
            print(f"DEBUG - Updated running servers: {agent.running_servers}")
        
        db.session.commit()
        
        # Sprawdź czy dane zostały zapisane
        db.session.refresh(agent)
        print(f"DEBUG - After commit - CPU: {agent.cpu_usage}%, Memory: {agent.memory_usage}%, Disk: {agent.disk_usage}%")
        
        print(f"Agent {agent.name} status updated successfully")
        return jsonify({
            'message': 'Status received', 
            'agent_id': agent.id,
            'agent_name': agent.name,
            'updated_metrics': {
                'cpu': agent.cpu_usage,
                'memory': agent.memory_usage,
                'disk': agent.disk_usage
            }
        })
        
    except Exception as e:
        print(f"Error in report_agent_status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@main.route('/api/agent/servers', methods=['GET'])
@agent_token_required
def get_agent_servers_api():
    try:
        agent = request.agent
        print(f"Getting servers for agent: {agent.name}")
        
        servers = Server.query.filter_by(agent_id=agent.id).all()
        
        server_list = []
        for server in servers:
            server_list.append({
                'id': server.id,
                'name': server.name,
                'type': server.type,
                'version': server.version,
                'status': server.status,
                'path': server.path,
                'port': server.port
            })
        
        print(f"Returning {len(server_list)} servers for agent {agent.name}")
        return jsonify(server_list)
        
    except Exception as e:
        print(f"Error in get_agent_servers_api: {e}")
        return jsonify({'error': str(e)}), 500

@main.route('/api/agent/servers/<int:server_id>/status', methods=['POST'])
@agent_token_required
def update_server_status(server_id):
    try:
        agent = request.agent
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        status = data.get('status')
        pid = data.get('pid')
        
        if status not in ['running', 'stopped', 'starting', 'stopping']:
            return jsonify({'error': 'Invalid status'}), 400
        
        server = Server.query.get(server_id)
        if not server:
            return jsonify({'error': 'Server not found'}), 404
        
        if server.agent_id != agent.id:
            return jsonify({'error': 'Server not assigned to this agent'}), 403
        
        print(f"Updating server {server.name} status to {status} (PID: {pid})")
        
        server.status = status
        if pid is not None:
            server.pid = pid
        server.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Status updated'})
        
    except Exception as e:
        print(f"Error in update_server_status: {e}")
        return jsonify({'error': str(e)}), 500

# Endpoint do pobierania szczegółów serwera (dla agenta)
@main.route('/api/agent/servers/<int:server_id>', methods=['GET'])
@agent_token_required
def get_server_details(server_id):
    """Pobiera szczegóły serwera dla agenta"""
    try:
        agent = request.agent
        
        server = Server.query.get(server_id)
        if not server:
            return jsonify({'error': 'Server not found'}), 404
        
        if server.agent_id != agent.id:
            return jsonify({'error': 'Server not assigned to this agent'}), 403
        
        return jsonify(server.to_dict())
        
    except Exception as e:
        print(f"Error in get_server_details: {e}")
        return jsonify({'error': str(e)}), 500

# Endpoint do testowania połączenia z agentem (dla panelu)
@main.route('/agents/<int:agent_id>/ping', methods=['POST'])
@jwt_required()
def ping_agent(agent_id):
    """Testuje połączenie z agentem (dla panelu)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    
    try:
        response = requests.get(
            f"{agent.url}/status",
            headers={'Authorization': f'Bearer {agent.token}'},
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Agent is responding',
                'agent_status': response.json()
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Agent responded with status {response.status_code}'
            }), 400
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'message': f'Failed to connect to agent: {str(e)}'
        }), 400

# Endpoint do pobierania plików serwera (dla agenta)
@main.route('/api/agent/servers/<int:server_id>/download', methods=['GET'])
@agent_token_required
def download_server_files(server_id):
    """Pobiera pliki serwera (jeśli potrzebne dla agenta)"""
    agent = request.agent
    
    server = Server.query.get(server_id)
    if not server:
        return jsonify({'error': 'Server not found'}), 404
    
    if server.agent_id != agent.id:
        return jsonify({'error': 'Server not assigned to this agent'}), 403
    
    # Tutaj logika zwracania plików serwera
    # Na razie zwracamy tylko informacje
    return jsonify({
        'server': server.to_dict(),
        'files_available': True
    })

@main.route('/agents/<int:agent_id>/deploy-server', methods=['POST'])
@jwt_required()
def deploy_server_to_agent(agent_id):
    """Wdraża serwer na agencie"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    data = request.get_json()
    server_id = data.get('server_id')
    
    if not server_id:
        return jsonify({'error': 'server_id is required'}), 400
    
    server = Server.query.get_or_404(server_id)
    
    try:
        # Wyślij komendę wdrożenia do agenta
        import requests
        response = requests.post(
            f"{agent.url}/servers/deploy",
            headers={'Authorization': f'Bearer {agent.token}'},
            json=server.to_dict(),
            timeout=30
        )
        
        if response.status_code == 200:
            # Przypisz serwer do agenta
            server.agent_id = agent_id
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Server deployment command sent to agent',
                'response': response.json()
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Agent deployment failed: {response.status_code}'
            }), 400
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'message': f'Failed to deploy to agent: {str(e)}'
        }), 400
        
@main.route('/agents/<int:agent_id>/test', methods=['GET'])
@jwt_required()
def test_agent_connection(agent_id):
    """Testuje połączenie z agentem"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    agent = Agent.query.get_or_404(agent_id)
    
    try:
        response = requests.get(
            f"{agent.url}/status",
            headers={'Authorization': f'Bearer {agent.auth_token}'},
            timeout=10
        )
        
        if response.status_code == 200:
            return jsonify({
                'status': 'success',
                'message': 'Agent is responding',
                'agent_status': response.json()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Agent responded with status {response.status_code}'
            }), 400
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to connect to agent: {str(e)}'
        }), 400

@main.route('/servers/<int:server_id>/modpacks', methods=['GET'])
@jwt_required()
def get_available_modpacks(server_id):
    """Pobiera modpacki z lokalnego katalogu servers/modpacks/"""
    current_user_id = get_jwt_identity()
    
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(_get_local_modpacks())

def _get_local_modpacks():
    """Zwraca modpacki z lokalnego katalogu"""
    import os
    import glob
    
    # Ścieżka do katalogu z modpackami
    modpacks_dir = os.path.join(current_app.config['SERVER_BASE_PATH'], '..', 'modpacks')
    modpacks_dir = os.path.abspath(modpacks_dir)
    
    print(f"📁 Looking for modpacks in: {modpacks_dir}")
    
    # Utwórz katalog jeśli nie istnieje
    os.makedirs(modpacks_dir, exist_ok=True)
    
    modpacks = []
    
    # Szukaj plików .zip i .mrpack
    zip_files = glob.glob(os.path.join(modpacks_dir, "*.zip"))
    mrpack_files = glob.glob(os.path.join(modpacks_dir, "*.mrpack"))
    
    all_files = zip_files + mrpack_files
    print(f"📦 Found {len(all_files)} modpack files")
    
    for file_path in all_files:
        try:
            filename = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            file_size_mb = file_size / 1024 / 1024
            
            # Wyodrębnij nazwę modpacka z nazwy pliku
            name = os.path.splitext(filename)[0]
            name = name.replace('_', ' ').replace('-', ' ').title()
            
            # Spróbuj wykryć wersję Minecrafta z nazwy
            minecraft_version = '1.20.1'  # domyślna
            if '1.20' in filename:
                minecraft_version = '1.20.1'
            elif '1.19' in filename:
                minecraft_version = '1.19.2'
            elif '1.18' in filename:
                minecraft_version = '1.18.2'
            elif '1.17' in filename:
                minecraft_version = '1.17.1'
            elif '1.16' in filename:
                minecraft_version = '1.16.5'
            elif '1.15' in filename:
                minecraft_version = '1.15.2'
            elif '1.14' in filename:
                minecraft_version = '1.14.4'
            elif '1.13' in filename:
                minecraft_version = '1.13.2'
            elif '1.12' in filename:
                minecraft_version = '1.12.2'
            
            # Wykryj loader
            loader = 'forge'  # domyślny
            if 'fabric' in filename.lower():
                loader = 'fabric'
            elif 'quilt' in filename.lower():
                loader = 'quilt'
            elif 'forge' in filename.lower():
                loader = 'forge'
            
            modpack_data = {
                'id': filename,
                'name': name,
                'description': f'Local modpack: {filename}',
                'versions': ['1.0'],
                'minecraft': minecraft_version,
                'loader': loader,
                'author': 'Local',
                'modCount': 0,
                'fileSize': f"{file_size_mb:.1f} MB",
                'downloadUrl': f"/servers/modpacks/download/{filename}",
                'filename': filename,  # ← WAŻNE: to pole musi być!
                'filePath': file_path,
                'installed': False,
                'source': 'local'
            }
            
            # Dla debugowania - wypisz dane modpacka
            print(f"✅ Local modpack: {modpack_data}")
            
            modpacks.append(modpack_data)
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            continue
    
    # Jeśli nie ma lokalnych modpacków, pokaż przykładowe
    if not modpacks:
        modpacks = _get_sample_modpacks_info()
    
    return modpacks

def _get_sample_modpacks_info():
    """Przykładowe informacje jak dodać modpacki"""
    return [
        {
            'id': 'sample-info',
            'name': 'How to Add Modpacks',
            'description': 'Place .zip or .mrpack files in servers/modpacks/ directory',
            'versions': ['1.0'],
            'minecraft': '1.20.1',
            'loader': 'forge',
            'author': 'System',
            'modCount': 0,
            'fileSize': '0 MB',
            'downloadUrl': '',
            'filename': 'README.txt',
            'installed': False,
            'source': 'info'
        }
    ]

@main.route('/servers/modpacks/download/<filename>', methods=['GET'])
@jwt_required()
def download_local_modpack(filename):
    """Pobiera lokalny modpack"""
    try:
        import os
        from flask import send_file
        
        # Bezpieczna ścieżka - zapobiegaj directory traversal
        safe_filename = os.path.basename(filename)
        modpacks_dir = os.path.join(current_app.config['SERVER_BASE_PATH'], '..', 'modpacks')
        modpacks_dir = os.path.abspath(modpacks_dir)
        file_path = os.path.join(modpacks_dir, safe_filename)
        
        print(f"📥 Download request: {safe_filename}")
        print(f"📁 File path: {file_path}")
        
        # Sprawdź czy plik istnieje
        if not os.path.exists(file_path):
            return jsonify({'error': 'Modpack file not found'}), 404
        
        # Sprawdź czy jest w katalogu modpacks
        if not file_path.startswith(modpacks_dir):
            return jsonify({'error': 'Invalid file path'}), 403
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=safe_filename,
            mimetype='application/zip'
        )
        
    except Exception as e:
        print(f"❌ Download error: {e}")
        return jsonify({'error': str(e)}), 500

def _detect_mod_loader(game_versions):
    """Detect mod loader from game versions"""
    versions = [v.lower() for v in game_versions]
    if any('fabric' in v for v in versions):
        return 'fabric'
    elif any('forge' in v for v in versions):
        return 'forge'
    elif any('quilt' in v for v in versions):
        return 'quilt'
    elif any('neoforge' in v for v in versions):
        return 'neoforge'
    return 'forge'

@main.route('/servers/<int:server_id>/modpacks/install', methods=['POST'])
@jwt_required()
def install_modpack(server_id):
    current_user_id = get_jwt_identity()
    server = Server.query.get_or_404(server_id)
    
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403
    
    if server.status == 'running':
        return jsonify({'error': 'Server must be stopped to install modpack'}), 400
    
    data = request.get_json()
    modpack_name = data.get('name')
    download_url = data.get('downloadUrl')
    filename = data.get('filename')
    source = data.get('source', 'local')
    
    if not modpack_name:
        return jsonify({'error': 'Modpack name is required'}), 400
    
    # Generate installation ID
    installation_id = str(uuid.uuid4())
    
    # Store installation info
    installation_info = {
        'server_id': server_id,
        'modpack_name': modpack_name,
        'download_url': download_url,
        'filename': filename,
        'source': source,
        'status': 'running',
        'progress': 0,
        'message': 'Starting installation...',
        'started_at': datetime.utcnow().isoformat()
    }
    
    # Store in global dict
    if not hasattr(current_app, 'modpack_installations'):
        current_app.modpack_installations = {}
    current_app.modpack_installations[installation_id] = installation_info
    
    # Start async installation
    thread = Thread(target=_async_install_modpack, args=(current_app._get_current_object(), installation_id, installation_info))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'installation_id': installation_id,
        'message': 'Modpack installation started',
        'status': 'running'
    })

def _async_install_modpack(app, installation_id, installation_info):
    """Async function to install modpack with application context - ADD files instead of replacing"""
    with app.app_context():
        try:
            server_id = installation_info['server_id']
            modpack_name = installation_info['modpack_name']
            download_url = installation_info['download_url']
            filename = installation_info['filename']
            source = installation_info['source']
            
            server = Server.query.get(server_id)
            if not server:
                installation_info['status'] = 'error'
                installation_info['message'] = 'Server not found'
                return
            
            server_path = server_manager.get_server_path(server.name)
            
            # Update progress
            installation_info['progress'] = 10
            installation_info['message'] = 'Preparing installation...'
            
            # Stop server if running
            if server.status == 'running':
                installation_info['message'] = 'Stopping server...'
                server_manager.stop_server(server_id)
                time.sleep(5)
            
            # Download modpack
            installation_info['progress'] = 20
            installation_info['message'] = 'Downloading modpack...'
            
            modpack_path = None
            if source == 'local' and filename:
                # Use local modpack file
                modpacks_dir = current_app.config.get('MODPACKS_PATH', os.path.join(current_app.config['SERVER_BASE_PATH'], '..', 'data', 'modpacks'))
                modpack_path = os.path.join(modpacks_dir, filename)
                
                if not os.path.exists(modpack_path):
                    installation_info['status'] = 'error'
                    installation_info['message'] = f'Modpack file not found: {filename}'
                    return
            elif download_url:
                # Download modpack
                try:
                    modpacks_dir = current_app.config.get('MODPACKS_PATH', os.path.join(current_app.config['SERVER_BASE_PATH'], '..', 'data', 'modpacks'))
                    os.makedirs(modpacks_dir, exist_ok=True)
                    
                    # Generate filename if not provided
                    if not filename:
                        filename = f"modpack_{installation_id}.zip"
                    
                    modpack_path = os.path.join(modpacks_dir, filename)
                    
                    # Download file
                    response = requests.get(download_url, stream=True)
                    response.raise_for_status()
                    
                    total_size = int(response.headers.get('content-length', 0))
                    downloaded_size = 0
                    
                    with open(modpack_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                downloaded_size += len(chunk)
                                
                                # Update progress
                                if total_size > 0:
                                    progress = 20 + (downloaded_size / total_size) * 50
                                    installation_info['progress'] = min(progress, 70)
                                    installation_info['message'] = f'Downloading: {downloaded_size/(1024*1024):.1f}MB / {total_size/(1024*1024):.1f}MB'
                    
                except Exception as e:
                    installation_info['status'] = 'error'
                    installation_info['message'] = f'Download failed: {str(e)}'
                    return
            else:
                installation_info['status'] = 'error'
                installation_info['message'] = 'No download URL or filename provided'
                return
            
            # Extract modpack - ADD files instead of replacing
            installation_info['progress'] = 70
            installation_info['message'] = 'Extracting modpack files...'
            
            try:
                with zipfile.ZipFile(modpack_path, 'r') as zip_ref:
                    # Get list of all files in zip
                    file_list = zip_ref.namelist()
                    
                    # Extract files one by one to handle conflicts
                    extracted_count = 0
                    total_files = len(file_list)
                    
                    for i, file_name in enumerate(file_list):
                        # Skip directory entries
                        if file_name.endswith('/'):
                            continue
                            
                        # Calculate target path
                        target_path = os.path.join(server_path, file_name)
                        
                        # Create directory if needed
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                        
                        # Extract file
                        with zip_ref.open(file_name) as source_file:
                            with open(target_path, 'wb') as target_file:
                                target_file.write(source_file.read())
                        
                        extracted_count += 1
                        
                        # Update progress
                        if i % 10 == 0:  # Update every 10 files to avoid too many updates
                            progress = 70 + (i / total_files) * 25
                            installation_info['progress'] = min(progress, 95)
                            installation_info['message'] = f'Extracted {i}/{total_files} files...'
                
                installation_info['progress'] = 95
                installation_info['message'] = f'Modpack extracted successfully ({extracted_count} files)'
                
            except Exception as e:
                installation_info['status'] = 'error'
                installation_info['message'] = f'Extraction failed: {str(e)}'
                return
            
            # Update server properties with modpack info
            installation_info['progress'] = 100
            installation_info['message'] = 'Finalizing installation...'
            
            try:
                properties = server_manager.get_server_properties(server.name) or {}
                properties['modpack-name'] = modpack_name
                properties['modpack-installed'] = 'true'
                properties['modpack-install-date'] = datetime.utcnow().isoformat()
                
                # If this is a Forge modpack, update server type
                if 'forge' in modpack_name.lower():
                    properties['modpack-loader'] = 'forge'
                elif 'fabric' in modpack_name.lower():
                    properties['modpack-loader'] = 'fabric'
                
                server_manager.update_server_properties(server.name, properties)
                
                # Also update the server implementation if needed
                if server.implementation == 'vanilla' and ('forge' in modpack_name.lower() or 'fabric' in modpack_name.lower()):
                    server.implementation = 'modded'
                    db.session.commit()
                    
            except Exception as e:
                logger.warning(f"Could not update server properties: {e}")
            
            # Mark installation as complete
            installation_info['status'] = 'completed'
            installation_info['message'] = f'Modpack {modpack_name} installed successfully - files added to server'
            installation_info['completed_at'] = datetime.utcnow().isoformat()
            
            logger.info(f"Modpack {modpack_name} installed successfully on server {server.name} - {extracted_count} files added")
            
        except Exception as e:
            installation_info['status'] = 'error'
            installation_info['message'] = f'Installation failed: {str(e)}'
            logger.error(f"Modpack installation error: {e}")
            import traceback
            traceback.print_exc()

@main.route('/servers/<int:server_id>/modpacks/install/progress/<installation_id>', methods=['GET'])
@jwt_required()
def get_modpack_installation_progress(server_id, installation_id):
    current_user_id = get_jwt_identity()
    
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403
    
    if not hasattr(current_app, 'modpack_installations'):
        return jsonify({'error': 'No installations found'}), 404
    
    installation_info = current_app.modpack_installations.get(installation_id)
    if not installation_info:
        return jsonify({'error': 'Installation not found'}), 404
    
    return jsonify({
        'installation_id': installation_id,
        'status': installation_info.get('status', 'unknown'),
        'progress': installation_info.get('progress', 0),
        'message': installation_info.get('message', ''),
        'modpack_name': installation_info.get('modpack_name'),
        'started_at': installation_info.get('started_at')
    })

def _install_from_local_file(server, modpack_path, modpack_name, modpack_filename):
    """Instaluje modpack z lokalnego pliku"""
    import zipfile
    import os
    import shutil
    
    # Sprawdź czy to ZIP
    try:
        with zipfile.ZipFile(modpack_path, 'r') as test_zip:
            file_list = test_zip.namelist()
            print(f"📦 ZIP contains {len(file_list)} files")
    except zipfile.BadZipFile:
        return jsonify({'error': 'File is not a valid ZIP archive'}), 400
    
    # Przygotuj ścieżkę serwera
    server_path = server_manager.get_server_path(server.name)
    print(f"📂 Server path: {server_path}")
    
    # Utwórz backup
    if os.path.exists(server_path) and any(f for f in os.listdir(server_path) if not f.startswith('.')):
        backup_path = f"{server_path}_backup_{int(datetime.utcnow().timestamp())}"
        shutil.copytree(server_path, backup_path)
        print(f"💾 Backup created: {backup_path}")
    
    # Wyczyść katalog serwera (zachowaj backups)
    if os.path.exists(server_path):
        for item in os.listdir(server_path):
            if item == 'backups': 
                continue
            item_path = os.path.join(server_path, item)
            if os.path.isfile(item_path):
                os.unlink(item_path)
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)
    
    # Wypakuj modpack
    extracted_count = 0
    with zipfile.ZipFile(modpack_path, 'r') as zip_ref:
        # Sprawdź strukturę archiwum
        file_list = zip_ref.namelist()
        
        # Sprawdź czy ma jeden główny katalog
        root_dirs = [f for f in file_list if f.count('/') == 1 and f.endswith('/')]
        
        if root_dirs and len(root_dirs) == 1:
            # Wypakuj zawartość głównego katalogu (bez katalogu głównego)
            root_dir = root_dirs[0]
            
            for file in file_list:
                if file.startswith(root_dir) and not file.endswith('/'):
                    relative_path = file[len(root_dir):]
                    if relative_path:
                        full_path = os.path.join(server_path, relative_path)
                        os.makedirs(os.path.dirname(full_path), exist_ok=True)
                        
                        with zip_ref.open(file) as source, open(full_path, 'wb') as target:
                            target.write(source.read())
                        extracted_count += 1
            
            print(f"✅ Extracted {extracted_count} files from {root_dir}")
        else:
            # Wypakuj bezpośrednio
            zip_ref.extractall(server_path)
            extracted_count = len([f for f in file_list if not f.endswith('/')])
            print(f"✅ Extracted {extracted_count} files directly")
    
    # Zaktualizuj properties serwera
    properties = server_manager.get_server_properties(server.name) or {}
    properties['modpack-name'] = modpack_name
    properties['modpack-filename'] = modpack_filename
    properties['modpack-source'] = 'local'
    
    server_manager.update_server_properties(server.name, properties)
    
    print(f"🎉 Successfully installed: {modpack_name}")
    
    return jsonify({
        'message': f'Modpack {modpack_name} installed successfully!',
        'files_extracted': extracted_count,
        'source': 'local'
    })

@main.route('/servers/modpacks/upload', methods=['POST'])
@jwt_required()
def upload_modpack():
    """Uploaduje nowy modpack do katalogu lokalnego"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Only admins can upload modpacks'}), 403
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Sprawdź rozszerzenie
        if not (file.filename.endswith('.zip') or file.filename.endswith('.mrpack')):
            return jsonify({'error': 'Only .zip and .mrpack files are allowed'}), 400
        
        # Utwórz katalog modpacks
        modpacks_dir = os.path.join(current_app.config['SERVER_BASE_PATH'], '..', 'modpacks')
        os.makedirs(modpacks_dir, exist_ok=True)
        
        # Zapisz plik
        file_path = os.path.join(modpacks_dir, file.filename)
        file.save(file_path)
        
        print(f"✅ Uploaded modpack: {file.filename}")
        
        return jsonify({
            'message': f'Modpack {file.filename} uploaded successfully!',
            'filename': file.filename,
            'size': f"{os.path.getsize(file_path) / 1024 / 1024:.2f} MB"
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/servers/modpacks/list', methods=['GET'])
@jwt_required()
def list_local_modpacks():
    """Listuje wszystkie lokalne modpacki"""
    try:
        import os
        import glob
        
        modpacks_dir = os.path.join(current_app.config['SERVER_BASE_PATH'], '..', 'modpacks')
        os.makedirs(modpacks_dir, exist_ok=True)
        
        zip_files = glob.glob(os.path.join(modpacks_dir, "*.zip"))
        mrpack_files = glob.glob(os.path.join(modpacks_dir, "*.mrpack"))
        
        modpacks = []
        for file_path in zip_files + mrpack_files:
            filename = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            
            modpacks.append({
                'filename': filename,
                'size': file_size,
                'size_mb': f"{file_size / 1024 / 1024:.2f} MB",
                'modified': os.path.getmtime(file_path)
            })
        
        return jsonify({'modpacks': modpacks})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/servers/<int:server_id>/modpacks/custom', methods=['POST'])
@jwt_required()
def create_custom_modpack(server_id):
    """Tworzy custom modpack z listy modów"""
    current_user_id = get_jwt_identity()
    
    if not _check_permission(current_user_id, server_id, 'can_install_plugins'):
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    modpack_name = data.get('name')
    mods_list = data.get('mods', [])
    minecraft_version = data.get('minecraft_version', '1.20.1')
    loader = data.get('loader', 'fabric')
    
    try:
        server = Server.query.get_or_404(server_id)
        
        if server.status == 'running':
            return jsonify({'error': 'Server must be stopped'}), 400
        
        # Stwórz podstawową strukturę serwera
        server_path = server_manager.get_server_path(server.name)
        
        # Pobierz server.jar dla danej wersji
        success = _download_server_jar(server_path, minecraft_version, loader)
        
        if success:
            # Zaktualizuj properties
            properties = server_manager.get_server_properties(server.name) or {}
            properties['modpack-name'] = modpack_name
            properties['minecraft-version'] = minecraft_version
            properties['modpack-loader'] = loader
            properties['modpack-custom'] = 'true'
            
            server_manager.update_server_properties(server.name, properties)
            
            return jsonify({
                'message': f'Custom modpack {modpack_name} created!',
                'minecraft_version': minecraft_version,
                'loader': loader
            })
        else:
            return jsonify({'error': 'Failed to create modpack'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _download_server_jar(server_path, minecraft_version, loader):
    """Pobiera server.jar dla danej wersji"""
    try:
        import requests
        
        if loader == 'fabric':
            # Fabric installer
            url = f"https://maven.fabricmc.net/net/fabricmc/fabric-installer/0.11.2/fabric-installer-0.11.2.jar"
        elif loader == 'forge':
            # Forge installer  
            url = f"https://files.minecraftforge.net/net/minecraftforge/forge/{minecraft_version}-latest/forge-{minecraft_version}-latest-installer.jar"
        else:
            # Vanilla
            url = f"https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar"
        
        response = requests.get(url, stream=True, timeout=60)
        
        if response.status_code == 200:
            jar_path = os.path.join(server_path, 'server.jar')
            with open(jar_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
        
        return False
        
    except Exception as e:
        print(f"Error downloading server jar: {e}")
        return False

def _auto_detect_modpack_properties(server_path, properties):
    """Automatycznie wykrywa właściwości modpacka"""
    if not os.path.exists(server_path):
        return
    
    # Wykryj loader
    for file in os.listdir(server_path):
        if file.endswith('.jar'):
            file_lower = file.lower()
            if 'fabric' in file_lower:
                properties['modpack-loader'] = 'fabric'
            elif 'forge' in file_lower:
                properties['modpack-loader'] = 'forge'
            elif 'quilt' in file_lower:
                properties['modpack-loader'] = 'quilt'
            elif 'neoforge' in file_lower:
                properties['modpack-loader'] = 'neoforge'
            
            # Wykryj wersję Minecrafta
            for mc_ver in ['1.20', '1.19', '1.18', '1.17', '1.16', '1.15', '1.14', '1.13', '1.12']:
                if mc_ver in file:
                    properties['minecraft-version'] = mc_ver
                    break

@main.route('/servers/<int:server_id>/modpacks/current', methods=['GET'])
@jwt_required()
def get_current_modpack(server_id):
    """Pobiera informacje o aktualnie zainstalowanym modpacku"""
    current_user_id = get_jwt_identity()
    
    if not _check_permission(current_user_id, server_id, 'view'):
        return jsonify({'error': 'Access denied'}), 403
    
    server = Server.query.get_or_404(server_id)
    
    try:
        properties = server_manager.get_server_properties(server.name)
        if not properties:
            return jsonify({'modpack': None})
        
        modpack_name = properties.get('modpack-name')
        modpack_version = properties.get('modpack-version')
        
        if not modpack_name:
            return jsonify({'modpack': None})
        
        return jsonify({
            'modpack': {
                'name': modpack_name,
                'version': modpack_version,
                'minecraft-version': properties.get('minecraft-version'),
                'modpack-loader': properties.get('modpack-loader'),
                'description': properties.get('modpack-description', '')
            }
        })
    except Exception as e:
        print(f"Error getting current modpack: {e}")
        return jsonify({'modpack': None})

def _check_permission(user_id, server_id, permission):
    user = User.query.get(user_id)
    if user.role == 'admin':
        return True
    
    perm = Permission.query.filter_by(
        user_id=user_id, server_id=server_id
    ).first()
    
    if not perm:
        return False
    
    if permission == 'view':
        return True
    elif permission == 'can_start':
        return perm.can_start
    elif permission == 'can_stop':
        return perm.can_stop
    elif permission == 'can_restart':
        return perm.can_restart
    elif permission == 'can_edit_files':
        return perm.can_edit_files
    elif permission == 'can_manage_users':
        return perm.can_manage_users
    elif permission == 'can_install_plugins':
        return perm.can_install_plugins
    
    return False
