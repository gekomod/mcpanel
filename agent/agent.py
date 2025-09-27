import requests
import psutil
import time
import threading
import json
import os
import subprocess
import shutil
from datetime import datetime
from flask import Flask, request, jsonify
import logging

# Configure logging to output to stdout for systemd journaling
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
        
        # Utwórz katalog bazowy
        os.makedirs(self.base_path, exist_ok=True)
        
        # Flask app dla endpointów agenta
        self.app = Flask(__name__)
        self.setup_routes()
        
    def setup_routes(self):
        """Konfiguruje endpointy HTTP agenta"""
        
        @self.app.route('/status', methods=['GET'])
        def agent_status():
            """Zwraca status agenta"""
            status_data = {
                'name': self.agent_name,
                'status': self.status,
                'system_status': self._get_system_status(),
                'running_servers': list(self.running_servers.keys()),
                'timestamp': datetime.now().isoformat()
            }
            logger.debug(f"Returning status: {status_data}")
            return jsonify(status_data)
        
        @self.app.route('/restart', methods=['POST'])
        def restart_agent():
            """Restartuje agenta"""
            logger.info("Received restart command")
            self.status = 'restarting'
            return jsonify({'message': 'Restart command received'})
        
        @self.app.route('/servers', methods=['GET'])
        def list_servers():
            """Zwraca listę serwerów na tym agencie"""
            servers = []
            for server_name, server_info in self.running_servers.items():
                servers.append({
                    'name': server_name,
                    'status': server_info['status'],
                    'pid': server_info['process'].pid if server_info['process'] else None,
                    'type': server_info['type'],
                    'start_time': server_info['start_time'].isoformat()
                })
            logger.debug(f"Returning {len(servers)} servers")
            return jsonify({'servers': servers})
        
        @self.app.route('/servers/deploy', methods=['POST'])
        def deploy_server():
            """Wdraża serwer na agencie"""
            try:
                data = request.get_json()
                logger.debug(f"Deploy request: {data}")
                
                if not data:
                    return jsonify({'error': 'No data provided'}), 400
                
                server_name = data.get('name')
                server_type = data.get('type')
                server_version = data.get('version')
                server_port = data.get('port')
                
                if not all([server_name, server_type, server_version, server_port]):
                    return jsonify({'error': 'Missing required fields'}), 400
                
                # Sprawdź czy serwer już istnieje
                server_path = os.path.join(self.base_path, server_name)
                if os.path.exists(server_path):
                    return jsonify({'error': 'Server already exists'}), 400
                
                # Utwórz katalog serwera
                os.makedirs(server_path, exist_ok=True)
                logger.info(f"Created server directory: {server_path}")
                
                # Zainstaluj serwer
                if server_type == 'bedrock':
                    success, message = self._install_bedrock_server(server_name, server_version, server_port)
                elif server_type == 'java':
                    success, message = self._install_java_server(server_name, server_version, server_port)
                else:
                    return jsonify({'error': f'Unsupported server type: {server_type}'}), 400
                
                if success:
                    logger.info(f"Server {server_name} deployed successfully")
                    return jsonify({'message': f'Server {server_name} deployed successfully'})
                else:
                    shutil.rmtree(server_path, ignore_errors=True)
                    return jsonify({'error': message}), 500
                    
            except Exception as e:
                logger.error(f"Error deploying server: {e}")
                return jsonify({'error': str(e)}), 500

    def _install_bedrock_server(self, server_name, version, port):
        """Instaluje serwer Bedrock (symulacja)"""
        try:
            server_path = os.path.join(self.base_path, server_name)
            
            # Utwórz podstawowe pliki
            properties_file = os.path.join(server_path, 'server.properties')
            with open(properties_file, 'w') as f:
                f.write(f"server-port={port}\n")
                f.write("gamemode=survival\n")
                f.write("difficulty=easy\n")
                f.write("max-players=20\n")
                f.write("online-mode=true\n")
            
            # Symulacja pliku wykonywalnego
            bedrock_binary = os.path.join(server_path, 'bedrock_server')
            with open(bedrock_binary, 'w') as f:
                f.write("#!/bin/bash\necho 'Bedrock Server Simulation'\nwhile true; do sleep 10; done\n")
            os.chmod(bedrock_binary, 0o755)
            
            logger.info(f"Installed Bedrock server {server_name}")
            return True, "Bedrock server installed"
        except Exception as e:
            logger.error(f"Error installing Bedrock server: {e}")
            return False, str(e)
    
    def _install_java_server(self, server_name, version, port):
        """Instaluje serwer Java (symulacja)"""
        try:
            server_path = os.path.join(self.base_path, server_name)
            
            # Utwórz prosty plik JAR (symulacja)
            jar_path = os.path.join(server_path, f"server_{version}.jar")
            with open(jar_path, 'w') as f:
                f.write("#!/bin/bash\necho 'Minecraft Java Server Simulation'\nwhile true; do sleep 10; done\n")
            os.chmod(jar_path, 0o755)
            
            # Utwórz server.properties
            properties_file = os.path.join(server_path, 'server.properties')
            with open(properties_file, 'w') as f:
                f.write(f"server-port={port}\n")
                f.write("gamemode=survival\n")
                f.write("difficulty=easy\n")
                f.write("max-players=20\n")
                f.write("online-mode=true\n")
                f.write("eula=true\n")
            
            logger.info(f"Installed Java server {server_name}")
            return True, "Java server installed"
        except Exception as e:
            logger.error(f"Error installing Java server: {e}")
            return False, str(e)

    def _start_server_process(self, server_name, server_path, server_type):
        """Uruchamia proces serwera"""
        try:
            if server_type == 'bedrock':
                cmd = ['./bedrock_server']
            elif server_type == 'java':
                cmd = ['java', '-jar', 'server_1.0.0.jar', 'nogui']  # Symulacja
            else:
                return False, f"Unsupported server type: {server_type}"
            
            process = subprocess.Popen(
                cmd,
                cwd=server_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                text=True
            )
            
            self.running_servers[server_name] = {
                'process': process,
                'type': server_type,
                'status': 'running',
                'start_time': datetime.now()
            }
            
            logger.info(f"Started server {server_name} with PID {process.pid}")
            return True, process.pid
            
        except Exception as e:
            logger.error(f"Error starting server {server_name}: {e}")
            return False, str(e)

    def start(self):
        """Uruchamia agenta"""
        logger.info(f"Starting MCPanel Agent: {self.agent_name}")
        logger.info(f"Panel URL: {self.panel_url}")
        logger.info(f"Agent port: {self.port}")
        logger.info(f"Servers path: {self.base_path}")
        logger.info(f"Agent token: {self.agent_token[:10]}...")  # Loguj tylko początek tokena
        
        self.status = 'online'
        
        # Wątek do okresowego raportowania statusu
        report_thread = threading.Thread(target=self._report_status_loop, daemon=True)
        report_thread.start()
        
        # Wątek do monitorowania serwerów
        monitor_thread = threading.Thread(target=self._monitor_servers_loop, daemon=True)
        monitor_thread.start()
        
        logger.info(f"Starting agent HTTP server on port {self.port}")
        
        # Uruchom serwer Flask
        self.app.run(host='0.0.0.0', port=self.port, debug=False, use_reloader=False)
    
    def _report_status_loop(self):
        """Okresowo raportuje status agenta do panelu"""
        while self.status == 'online':
            try:
                status_data = self._get_system_status()
                logger.debug(f"Sending status to panel: {status_data}")
                
                response = requests.post(
                    f"{self.panel_url}/api/agent/status",
                    headers=self.headers,
                    json=status_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    logger.debug(f"Status reported successfully")
                else:
                    logger.error(f"Failed to report status: {response.status_code} - {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Network error reporting status: {e}")
            except Exception as e:
                logger.error(f"Unexpected error reporting status: {e}")
            
            time.sleep(30)
    
    def _monitor_servers_loop(self):
        """Monitoruje uruchomione serwery"""
        while self.status == 'online':
            try:
                logger.debug("Requesting server list from panel")
                response = requests.get(
                    f"{self.panel_url}/api/agent/servers",
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    servers = response.json()
                    logger.debug(f"Received {len(servers)} servers from panel")
                    self._update_server_statuses(servers)
                else:
                    logger.error(f"Failed to get server list: {response.status_code} - {response.text}")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Network error getting server list: {e}")
            except Exception as e:
                logger.error(f"Unexpected error getting server list: {e}")
            
            time.sleep(15)
    
    def _get_system_status(self):
        """Pobiera status systemu"""
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
        """Aktualizuje statusy serwerów w panelu"""
        for server in servers:
            try:
                server_id = server['id']
                server_name = server['name']
                
                is_running = server_name in self.running_servers
                status = 'running' if is_running else 'stopped'
                pid = self.running_servers[server_name]['process'].pid if is_running else None
                
                if server['status'] != status:
                    logger.debug(f"Updating server {server_name} status to {status}")
                    response = requests.post(
                        f"{self.panel_url}/api/agent/servers/{server_id}/status",
                        headers=self.headers,
                        json={'status': status, 'pid': pid},
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        logger.debug(f"Server {server_name} status updated successfully")
                    else:
                        logger.error(f"Failed to update server status: {response.status_code}")
                        
            except Exception as e:
                logger.error(f"Error updating server status: {e}")

def main():
    """Main function to start the agent."""
    # Load configuration from environment variables
    panel_url = os.environ.get('PANEL_URL')
    agent_token = os.environ.get('AGENT_TOKEN')
    agent_name = os.environ.get('AGENT_NAME', 'DefaultAgentName')
    capacity = int(os.environ.get('AGENT_CAPACITY', '5'))
    agent_port = int(os.environ.get('AGENT_PORT', '9292'))
    base_path = os.environ.get('AGENT_BASE_PATH', '/opt/mcpanel-agent/servers')

    # Ensure required environment variables are set
    if not panel_url or not agent_token:
        logger.critical("PANEL_URL and AGENT_TOKEN environment variables must be set.")
        return

    logger.info("--- MCPanel Agent Initializing ---")
    logger.info(f"Agent Name: {agent_name}")
    logger.info(f"Panel URL: {panel_url}")
    logger.info(f"Listening on Port: {agent_port}")
    logger.info(f"Server Capacity: {capacity}")
    logger.info(f"Servers Base Path: {base_path}")
    logger.info("---------------------------------")
    
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
        logger.info("Agent shutting down due to keyboard interrupt.")
    except Exception as e:
        logger.critical(f"A critical error occurred: {e}", exc_info=True)

if __name__ == '__main__':
    main()