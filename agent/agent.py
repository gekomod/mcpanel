import requests
import psutil
import time
import threading
import json
import os
import subprocess
import shutil
from datetime import datetime
from flask import Flask, request, jsonify, send_file
import logging
import glob

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('MCPanelAgent')

class MCPanelAgent:
    def __init__(self, panel_url, agent_token, agent_name, capacity=5, port=8080, base_path="./servers"):
        self.panel_url = panel_url.rstrip('/')
        self.agent_token = agent_token
        self.agent_name = agent_name
        self.capacity = capacity
        self.port = port
        self.base_path = base_path
        self.running_servers = {}
        self.status = 'online'
        
        self.headers = {
            'Authorization': f'Bearer {agent_token}',
            'Content-Type': 'application/json',
            'User-Agent': 'MCPanel-Agent/1.0'
        }
        
        os.makedirs(self.base_path, exist_ok=True)
        
        self.app = Flask(__name__)
        self.setup_cors()
        self.setup_routes()
        
    def setup_cors(self):
        """Najprostszy CORS - pozwala wszystkim"""
        
        @self.app.after_request
        def add_cors_headers(response):
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response

        @self.app.before_request
        def handle_preflight():
            if request.method == 'OPTIONS':
                response = jsonify({'status': 'ok'})
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                return response

    def setup_routes(self):
        """Konfiguruje endpointy HTTP agenta"""

        @self.app.route('/status', methods=['GET'])
        def agent_status():
            status_data = {
                'name': self.agent_name,
                'status': self.status,
                'system_status': self._get_system_status(),
                'running_servers': list(self.running_servers.keys()),
                'timestamp': datetime.now().isoformat()
            }
            return jsonify(status_data)
        
        @self.app.route('/restart', methods=['POST'])
        def restart_agent():
            logger.info("Received restart command")
            self.status = 'restarting'
            return jsonify({'message': 'Restart command received'})
        
        @self.app.route('/servers', methods=['GET'])
        def list_servers():
            servers = []
            for server_name, server_info in self.running_servers.items():
                servers.append({
                    'name': server_name,
                    'status': server_info['status'],
                    'pid': server_info['process'].pid if server_info['process'] else None,
                    'type': server_info['type'],
                    'start_time': server_info['start_time'].isoformat()
                })
            return jsonify({'servers': servers})

        @self.app.route('/logs/agent', methods=['GET'])
        def get_agent_logs():
            try:
                log_file = self._get_agent_log_file()
                if not os.path.exists(log_file):
                    return jsonify({'error': 'Log file not found'}), 404
                
                lines = request.args.get('lines', 100, type=int)
                with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                    log_lines = f.readlines()[-lines:]
                
                return jsonify({
                    'logs': log_lines,
                    'total_lines': len(log_lines),
                    'file': log_file
                })
            except Exception as e:
                logger.error(f"Error reading agent logs: {e}")
                return jsonify({'error': str(e)}), 500
        
        @self.app.route('/logs/server/<server_name>', methods=['GET'])
        def get_server_logs(server_name):
            try:
                server_path = os.path.join(self.base_path, server_name)
                if not os.path.exists(server_path):
                    return jsonify({'error': 'Server not found'}), 404
                
                log_files = []
                possible_log_paths = [
                    os.path.join(server_path, 'logs', 'latest.log'),
                    os.path.join(server_path, 'server.log'),
                    os.path.join(server_path, 'logs', '*.log'),
                    os.path.join(server_path, '*.log')
                ]
                
                for log_path in possible_log_paths:
                    if '*' in log_path:
                        log_files.extend(glob.glob(log_path))
                    elif os.path.exists(log_path):
                        log_files.append(log_path)
                
                if not log_files:
                    return jsonify({'error': 'No log files found'}), 404
                
                latest_log = max(log_files, key=os.path.getmtime)
                lines = request.args.get('lines', 100, type=int)
                
                with open(latest_log, 'r', encoding='utf-8', errors='ignore') as f:
                    log_lines = f.readlines()[-lines:]
                
                return jsonify({
                    'logs': log_lines,
                    'total_lines': len(log_lines),
                    'file': latest_log,
                    'server': server_name
                })
                
            except Exception as e:
                logger.error(f"Error reading server logs: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/', methods=['GET'])
        def root():
            return jsonify({
                'message': 'MCPanel Agent API',
                'agent_name': self.agent_name,
                'version': '2.4.1',
                'status': self.status
            })

    def _get_agent_log_file(self):
        possible_locations = [
            '/var/log/mcpanel-agent/agent.log',
            '/opt/mcpanel-agent/logs/agent.log',
            './agent.log'
        ]
        
        for location in possible_locations:
            if os.path.exists(location):
                return location
        
        default_location = './agent.log'
        with open(default_location, 'w') as f:
            f.write(f"MCPanel Agent Log File\nStarted at: {datetime.now()}\n")
        return default_location

    # ... reszta metod bez zmian (_install_bedrock_server, _install_java_server, etc.)

    def start(self):
        logger.info(f"Starting MCPanel Agent: {self.agent_name}")
        logger.info(f"Panel URL: {self.panel_url}")
        logger.info(f"Agent port: {self.port}")
        
        self.status = 'online'
        
        report_thread = threading.Thread(target=self._report_status_loop, daemon=True)
        report_thread.start()
        
        monitor_thread = threading.Thread(target=self._monitor_servers_loop, daemon=True)
        monitor_thread.start()
        
        logger.info(f"Starting agent HTTP server on port {self.port}")
        self.app.run(host='0.0.0.0', port=self.port, debug=False, use_reloader=False)

    def _report_status_loop(self):
        while self.status == 'online':
            try:
                status_data = self._get_system_status()
                response = requests.post(
                    f"{self.panel_url}/api/agent/status",
                    headers=self.headers,
                    json=status_data,
                    timeout=10
                )
                if response.status_code != 200:
                    logger.error(f"Failed to report status: {response.status_code}")
            except Exception as e:
                logger.error(f"Error reporting status: {e}")
            time.sleep(30)

    def _monitor_servers_loop(self):
        while self.status == 'online':
            try:
                response = requests.get(
                    f"{self.panel_url}/api/agent/servers",
                    headers=self.headers,
                    timeout=10
                )
                if response.status_code == 200:
                    servers = response.json()
                    self._update_server_statuses(servers)
                else:
                    logger.error(f"Failed to get server list: {response.status_code}")
            except Exception as e:
                logger.error(f"Error getting server list: {e}")
            time.sleep(15)

    def _get_system_status(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent
            disk_percent = psutil.disk_usage('/').percent
            
            return {
                'name': self.agent_name,
                'status': self.status,
                'cpu_usage': round(cpu_percent, 1),
                'memory_usage': round(memory_percent, 1),
                'disk_usage': round(disk_percent, 1),
                'running_servers': len(self.running_servers),
                'max_servers': self.capacity,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {
                'name': self.agent_name,
                'status': self.status,
                'cpu_usage': 0.0,
                'memory_usage': 0.0,
                'disk_usage': 0.0,
                'running_servers': len(self.running_servers),
                'max_servers': self.capacity,
                'timestamp': datetime.now().isoformat()
            }

    def _update_server_statuses(self, servers):
        for server in servers:
            try:
                server_id = server['id']
                server_name = server['name']
                
                is_running = server_name in self.running_servers
                status = 'running' if is_running else 'stopped'
                pid = self.running_servers[server_name]['process'].pid if is_running else None
                
                if server['status'] != status:
                    response = requests.post(
                        f"{self.panel_url}/api/agent/servers/{server_id}/status",
                        headers=self.headers,
                        json={'status': status, 'pid': pid},
                        timeout=5
                    )
                    if response.status_code == 200:
                        logger.debug(f"Server {server_name} status updated")
            except Exception as e:
                logger.error(f"Error updating server status: {e}")

def main():
    panel_url = os.environ.get('PANEL_URL')
    agent_token = os.environ.get('AGENT_TOKEN')
    agent_name = os.environ.get('AGENT_NAME', 'DefaultAgentName')
    capacity = int(os.environ.get('AGENT_CAPACITY', '5'))
    agent_port = int(os.environ.get('AGENT_PORT', '9292'))
    base_path = os.environ.get('AGENT_BASE_PATH', '/opt/mcpanel-agent/servers')

    if not panel_url or not agent_token:
        logger.critical("PANEL_URL and AGENT_TOKEN environment variables must be set.")
        return

    logger.info("--- MCPanel Agent Starting ---")
    
    agent = MCPanelAgent(
        panel_url=panel_url,
        agent_token=agent_token,
        agent_name=agent_name,
        capacity=capacity,
        port=agent_port,
        base_path=base_path
    )
    
    try:
        agent.start()
    except KeyboardInterrupt:
        logger.info("Agent shutting down")
    except Exception as e:
        logger.critical(f"Error: {e}")

if __name__ == '__main__':
    main()