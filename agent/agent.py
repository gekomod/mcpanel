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
import zipfile
import tarfile
import signal
from werkzeug.utils import secure_filename
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('MCPanelAgent')

class ServerManager:
    """Klasa do zarządzania serwerami Minecraft - zintegrowana z agentem"""
    
    def __init__(self, base_path):
        self.base_path = base_path
        self.processes = {}
        self.server_info = {}
        self.lock = threading.Lock()
        
    def get_server_path(self, server_name):
        return os.path.join(self.base_path, server_name)
        
    def check_server_files(self, server_name):
        """Sprawdza czy serwer ma pliki na agencie"""
        server_path = self.get_server_path(server_name)
        
        try:
            # Sprawdź czy katalog serwera istnieje
            if not os.path.exists(server_path):
                return {
                    'hasFiles': False, 
                    'message': 'Server directory does not exist',
                    'fileCount': 0,
                    'serverPath': server_path
                }
            
            # Sprawdź czy są jakieś pliki (ignorując ukryte pliki systemowe)
            files = [f for f in os.listdir(server_path) 
                    if not f.startswith('.') and f not in ['__pycache__', '.git']]
            
            has_files = len(files) > 0
            file_count = len(files)
            
            # Dla serwerów Bedrock sprawdź obecność bedrock_server
            # Pobierz typ serwera z istniejących danych
            server_type = self._detect_server_type(server_path)
            
            if server_type == 'bedrock':
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
            elif server_type == 'java':
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
            
            return {
                'hasFiles': has_files,
                'fileCount': file_count,
                'serverType': server_type,
                'serverPath': server_path,
                'message': 'Server files found' if has_files else 'Server files missing',
                'files': files[:10]  # Zwróć pierwsze 10 plików dla debugowania
            }
            
        except Exception as e:
            logger.error(f"Error checking server files for {server_name}: {e}")
            return {
                'hasFiles': False,
                'message': f'Error checking files: {str(e)}',
                'fileCount': 0,
                'serverPath': server_path
            }
    
    def _detect_server_type(self, server_path):
        """Wykrywa typ serwera na podstawie plików"""
        try:
            # Sprawdź pliki Bedrock
            bedrock_files = ['bedrock_server', 'bedrock_server.exe', 'server.properties']
            for file in bedrock_files:
                if os.path.exists(os.path.join(server_path, file)):
                    return 'bedrock'
            
            # Sprawdź pliki Java
            jar_files = [f for f in os.listdir(server_path) if f.endswith('.jar')]
            if jar_files:
                return 'java'
            
            # Sprawdź inne wskaźniki
            if os.path.exists(os.path.join(server_path, 'eula.txt')):
                return 'java'
            if os.path.exists(os.path.join(server_path, 'logs')):
                return 'java'
            
            return 'unknown'
        except:
            return 'unknown'
    
    def install_server(self, server_data):
        """Instalacja serwera Minecraft"""
        server_name = server_data['name']
        server_type = server_data['type']
        server_path = self.get_server_path(server_name)
        
        try:
            os.makedirs(server_path, exist_ok=True)
            
            if server_type == 'java':
                return self._install_java_server(server_data, server_path)
            elif server_type == 'bedrock':
                return self._install_bedrock_server(server_data, server_path)
            else:
                return False, f"Unknown server type: {server_type}"
                
        except Exception as e:
            return False, f"Installation error: {str(e)}"
            
    def delete_server_files(self, server_name):
        """Usuwa pliki serwera z agenta"""
        server_path = self.get_server_path(server_name)
        
        try:
            # Zatrzymaj serwer jeśli działa
            if server_name in self.processes:
                self.stop_server(server_name)
                time.sleep(2)  # Poczekaj na zatrzymanie
            
            # Sprawdź czy katalog istnieje
            if not os.path.exists(server_path):
                return True, "Server directory does not exist"
            
            # Usuń katalog serwera
            logger.info(f"Deleting server directory: {server_path}")
            shutil.rmtree(server_path)
            
            # Wyczyść z pamięci
            with self.lock:
                if server_name in self.processes:
                    del self.processes[server_name]
                if server_name in self.server_info:
                    del self.server_info[server_name]
            
            logger.info(f"Server files deleted successfully: {server_name}")
            return True, f"Server files deleted: {server_name}"
            
        except Exception as e:
            logger.error(f"Error deleting server files for {server_name}: {e}")
            return False, f"Error deleting server files: {str(e)}"
    
    def _install_java_server(self, server_data, server_path):
        """Installs a Java server, delegating to the correct method."""
        try:
            implementation = server_data.get('implementation', 'vanilla')
            version = server_data['version']
            
            # Create eula.txt first, as it's needed by all Java servers
            eula_path = os.path.join(server_path, 'eula.txt')
            with open(eula_path, 'w') as f:
                f.write("eula=true\n")

            # Handle installer-based implementations
            if implementation == 'fabric':
                return self._install_fabric_server(server_path, version)
            if implementation == 'forge':
                return self._install_forge_server(server_path, version)
            if implementation == 'neoforge':
                return self._install_neoforge_server(server_path, version)

            # Handle direct download implementations
            jar_url = self._get_java_server_url(implementation, version)
            if not jar_url:
                return False, f"Could not find server URL for {implementation} {version}"
            
            if implementation == 'paper':
                jar_filename = jar_url.split('/')[-1]
            elif implementation == 'purpur':
                jar_filename = f"purpur-{version}.jar"
            else: # vanilla
                jar_filename = f"vanilla-{version}.jar"
            
            jar_path = os.path.join(server_path, jar_filename)
            
            if not self._download_file(jar_url, jar_path):
                return False, "Failed to download server JAR"
            
            return True, f"Java server installed successfully: {jar_filename}"
            
        except Exception as e:
            logger.error(f"Java server installation error: {e}")
            return False, f"Java server installation error: {str(e)}"
    
    def _install_bedrock_server(self, server_data, server_path):
        """Instalacja serwera Bedrock"""
        try:
            version = server_data['version']
            platform = server_data.get('platform', 'linux')
            
            # Pobierz URL dla Bedrock servera
            bedrock_url = self._get_bedrock_server_url(version, platform)
            if not bedrock_url:
                return False, f"Could not find Bedrock server URL for {platform}"
            
            # Pobierz i wypakuj
            temp_zip = os.path.join(server_path, 'bedrock_temp.zip')
            success = self._download_file(bedrock_url, temp_zip)
            if not success:
                return False, "Failed to download Bedrock server"
            
            # Wypakuj
            with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                zip_ref.extractall(server_path)
            
            # Usuń tymczasowy plik
            os.remove(temp_zip)
            
            # Ustaw uprawnienia wykonania
            if platform == 'linux':
                bedrock_binary = os.path.join(server_path, 'bedrock_server')
                if os.path.exists(bedrock_binary):
                    os.chmod(bedrock_binary, 0o755)
            
            return True, "Bedrock server installed successfully"
            
        except Exception as e:
            return False, f"Bedrock server installation error: {str(e)}"
    
    def _get_java_server_url(self, implementation, version):
        """Get download URL for Java server based on implementation and version"""
        if implementation == 'vanilla':
            version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
            try:
                version_manifest = requests.get(version_manifest_url).json()
                for v in version_manifest['versions']:
                    if v['id'] == version and v['type'] == 'release':
                        version_info = requests.get(v['url']).json()
                        return version_info['downloads']['server']['url']
            except Exception as e:
                logger.error(f"Could not fetch vanilla manifest: {e}")
                # Fallback for popular versions
                fallback_urls = {
                    '1.20.1': 'https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar',
                    '1.19.4': 'https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar',
                }
                return fallback_urls.get(version)

        elif implementation == 'paper':
            build_data = self._get_latest_paper_build(version)
            if build_data:
                return f"https://api.papermc.io/v2/projects/paper/versions/{version}/builds/{build_data['build']}/downloads/{build_data['download']}"

        elif implementation == 'purpur':
            return f"https://api.purpurmc.org/v2/purpur/{version}/latest/download"

        elif implementation == 'fabric':
            return self._get_fabric_installer_url(version)

        elif implementation == 'forge':
            return self._get_forge_installer_url(version)

        elif implementation == 'neoforge':
            return self._get_neoforge_installer_url(version)

        return None

    def _get_forge_installer_url(self, version):
        """Scrape the Forge website to get the installer URL"""
        try:
            url = f"https://files.minecraftforge.net/net/minecraftforge/forge/index_{version}.html"
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            download_link = soup.find('div', {'class': 'download'}).find('a', href=True)
            if download_link and 'installer' in download_link['href']:
                redirect_url = download_link['href']
                final_url = requests.head(redirect_url, allow_redirects=True).url
                return final_url
        except Exception as e:
            logger.error(f"Error getting Forge URL: {e}")
        return None

    def _get_neoforge_installer_url(self, version):
        """Get the NeoForge installer URL from their API"""
        try:
            api_url = f"https://api.neoforged.net/v1/versions/minecraft/{version}"
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()
            if data and len(data) > 0:
                latest_version = data[0]
                return f"https://maven.neoforged.net/net/neoforged/neoforge/{latest_version}/neoforge-{latest_version}-installer.jar"
        except Exception as e:
            logger.error(f"Error getting NeoForge URL: {e}")
        return None

    def _get_fabric_installer_url(self, version):
        """Get Fabric installer URL from their API"""
        try:
            fabric_versions_url = "https://meta.fabricmc.net/v2/versions"
            response = requests.get(fabric_versions_url)
            if response.status_code == 200:
                data = response.json()
                installer_version = next((i['version'] for i in data.get('installer', []) if i['stable']), None)
                if installer_version:
                    return f"https://meta.fabricmc.net/v2/versions/loader/{version}/{data['loader'][0]['version']}/{installer_version}/server/jar"
        except Exception as e:
            logger.error(f"Error getting Fabric URL: {e}")
        return f"https://meta.fabricmc.net/v2/versions/loader/{version}/latest/stable/server/jar"
    
    def _get_bedrock_server_url(self, version, platform):
        """Get Bedrock server URL (placeholder)"""
        return None
    
    def _get_latest_paper_build(self, version):
        """Get latest Paper build for a version"""
        try:
            url = f"https://api.papermc.io/v2/projects/paper/versions/{version}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                builds = data.get('builds', [])
                if builds:
                    latest_build = max(builds)
                    build_info_url = f"https://api.papermc.io/v2/projects/paper/versions/{version}/builds/{latest_build}"
                    build_info = requests.get(build_info_url).json()
                    download_name = build_info['downloads']['application']['name']
                    return {'build': latest_build, 'download': download_name}
        except Exception as e:
            logger.error(f"Error getting Paper build: {e}")
        return None
    
    def _run_installer_and_cleanup(self, server_path, installer_jar, implementation_name):
        """Helper function to run a server installer and handle cleanup."""
        logger.info(f'Running {implementation_name.capitalize()} installer...')

        install_cmd = ['java', '-jar', installer_jar]
        if implementation_name in ['forge', 'neoforge']:
            install_cmd.append('--installServer')
        elif implementation_name == 'fabric':
            install_cmd.extend(['server', '-downloadMinecraft'])

        process = subprocess.Popen(install_cmd, cwd=server_path, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

        try:
            process.wait(timeout=300) # 5-minute timeout
        except subprocess.TimeoutExpired:
            process.kill()
            logger.error(f"{implementation_name.capitalize()} installer timed out.")
            return False, f"{implementation_name.capitalize()} installer timed out."

        # Verify installation
        success = False
        message = ""
        run_script = 'run.sh' if os.name != 'nt' else 'run.bat'
        fabric_launcher = os.path.join(server_path, 'fabric-server-launch.jar')

        if implementation_name in ['forge', 'neoforge'] and os.path.exists(os.path.join(server_path, run_script)):
            success = True
        elif implementation_name == 'fabric' and os.path.exists(fabric_launcher):
            server_jar = os.path.join(server_path, 'server.jar')
            if os.path.exists(server_jar):
                os.remove(server_jar)
            os.rename(fabric_launcher, server_jar)
            success = True

        if os.path.exists(installer_jar):
            os.remove(installer_jar)

        if success:
            return True, f"{implementation_name.capitalize()} server installed successfully."
        else:
            return False, f"{implementation_name.capitalize()} installation failed."

    def _install_forge_server(self, server_path, version):
        """Special installation for Forge"""
        try:
            logger.info('Downloading Forge installer...')
            forge_url = self._get_forge_installer_url(version)
            if not forge_url:
                return False, 'Could not find Forge installer URL.'

            forge_installer_jar = os.path.join(server_path, 'forge-installer.jar')
            if not self._download_file(forge_url, forge_installer_jar):
                return False, "Failed to download Forge installer"

            return self._run_installer_and_cleanup(server_path, forge_installer_jar, 'forge')
        except Exception as e:
            logger.error(f"Forge installation error: {e}")
            return False, f'An unexpected error occurred: {e}'

    def _install_neoforge_server(self, server_path, version):
        """Special installation for NeoForge"""
        try:
            logger.info('Downloading NeoForge installer...')
            neoforge_url = self._get_neoforge_installer_url(version)
            if not neoforge_url:
                return False, 'Could not find NeoForge installer URL.'

            neoforge_installer_jar = os.path.join(server_path, 'neoforge-installer.jar')
            if not self._download_file(neoforge_url, neoforge_installer_jar):
                return False, "Failed to download NeoForge installer"
            
            return self._run_installer_and_cleanup(server_path, neoforge_installer_jar, 'neoforge')
        except Exception as e:
            logger.error(f"NeoForge installation error: {e}")
            return False, f'An unexpected error occurred: {e}'

    def _install_fabric_server(self, server_path, version):
        """Special installation for Fabric"""
        try:
            logger.info("Downloading Fabric installer...")
            fabric_url = self._get_fabric_installer_url(version)
            if not fabric_url:
                return False, "Could not find Fabric installer URL."

            fabric_installer_jar = os.path.join(server_path, 'fabric-installer.jar')
            if not self._download_file(fabric_url, fabric_installer_jar):
                return False, "Failed to download Fabric installer"

            return self._run_installer_and_cleanup(server_path, fabric_installer_jar, 'fabric')
        except Exception as e:
            logger.error(f"Fabric installation error: {e}")
            return False, f"Fabric installation error: {str(e)}"
    
    def _download_file(self, url, file_path):
        """Pobierz plik"""
        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            return os.path.exists(file_path) and os.path.getsize(file_path) > 0
            
        except Exception as e:
            logger.error(f"Download error: {e}")
            return False
    
    def start_server(self, server_name, server_data):
        """Uruchom serwer"""
        server_path = self.get_server_path(server_name)
        
        if not os.path.exists(server_path):
            return False, "Server directory not found"
        
        try:
            if server_data['type'] == 'java':
                cmd = self._get_java_start_command(server_path, server_data)
            else:  # bedrock
                cmd = self._get_bedrock_start_command(server_path, server_data)
            
            # Uruchom proces
            process = subprocess.Popen(
                cmd,
                cwd=server_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Zapisz informacje o procesie
            with self.lock:
                self.processes[server_name] = process
                self.server_info[server_name] = {
                    'process': process,
                    'status': 'running',
                    'type': server_data['type'],
                    'start_time': datetime.now(),
                    'output_buffer': []
                }
            
            # Uruchom wątek do przechwytywania outputu
            thread = threading.Thread(
                target=self._capture_output, 
                args=(server_name, process),
                daemon=True
            )
            thread.start()
            
            return True, f"Server {server_name} started with PID: {process.pid}"
            
        except Exception as e:
            return False, f"Failed to start server: {str(e)}"
    
    def _get_java_start_command(self, server_path, server_data):
        """Prepares the start command for a Java server, handling different implementations."""
        implementation = server_data.get('implementation', 'vanilla')
        run_script_path = os.path.join(server_path, 'run.sh')

        # For Forge/NeoForge, use the generated run script
        if implementation in ['forge', 'neoforge'] and os.path.exists(run_script_path):
            os.chmod(run_script_path, 0o755)
            return [run_script_path, 'nogui']

        # For other types, find the JAR file and build a java command
        jar_file = None
        # Prioritize specific server jars
        for file in os.listdir(server_path):
            if file.endswith('.jar') and ('server' in file or 'fabric' in file or 'paper' in file or 'purpur' in file or 'vanilla' in file):
                jar_file = file
                break

        # If no specific jar found, find any jar
        if not jar_file:
            for file in os.listdir(server_path):
                if file.endswith('.jar'):
                    jar_file = file
                    break

        if not jar_file:
            raise FileNotFoundError("Could not find a runnable JAR file in the server directory.")

        try:
            available_memory = psutil.virtual_memory().available / (1024 * 1024 * 1024)  # GB
            if available_memory >= 8: default_memory = '4G'
            elif available_memory >= 4: default_memory = '2G'
            elif available_memory >= 2: default_memory = '1G'
            else: default_memory = '512M'
        except:
            default_memory = '1G'

        memory = server_data.get('memory', default_memory)
        logger.info(f"Memory settings - Using: {memory}")

        jvm_args = [
            f'-Xmx{memory}', f'-Xms{memory}',
            '-XX:+UseG1GC', '-XX:+UnlockExperimentalVMOptions', '-XX:MaxGCPauseMillis=100',
            '-jar', jar_file, 'nogui'
        ]

        # Simple check for smaller memory sizes
        is_small_memory = 'M' in memory.upper() or ('G' in memory.upper() and float(memory.upper().replace('G', '')) < 2)
        if is_small_memory:
            jvm_args.extend([
                '-XX:+DisableExplicitGC', '-XX:G1NewSizePercent=30', '-XX:G1MaxNewSizePercent=40',
                '-XX:G1HeapRegionSize=8M', '-XX:G1ReservePercent=20', '-XX:InitiatingHeapOccupancyPercent=15'
            ])

        return ['java'] + jvm_args
    
    def _get_bedrock_start_command(self, server_path, server_data):
        """Przygotuj komendę startową dla Bedrock"""
        if os.name == 'nt':  # Windows
            return ['bedrock_server.exe']
        else:  # Linux
            return ['./bedrock_server']
    
    def stop_server(self, server_name):
        """Zatrzymaj serwer"""
        with self.lock:
            if server_name not in self.processes:
                return False, "Server not running"
            
            process = self.processes[server_name]
            server_info = self.server_info.get(server_name, {})
        
        try:
            # Wyślij komendę stop
            if process.stdin and not process.stdin.closed:
                process.stdin.write('stop\n')
                process.stdin.flush()
            
            # Czekaj na zamknięcie
            for _ in range(30):  # 30 sekund timeout
                if process.poll() is not None:
                    break
                time.sleep(1)
            
            # Jeśli nadal działa, wymuś zamknięcie
            if process.poll() is None:
                process.terminate()
                time.sleep(5)
                if process.poll() is None:
                    process.kill()
            
            # Wyczyść
            with self.lock:
                if server_name in self.processes:
                    del self.processes[server_name]
                if server_name in self.server_info:
                    self.server_info[server_name]['status'] = 'stopped'
            
            return True, f"Server {server_name} stopped"
            
        except Exception as e:
            return False, f"Error stopping server: {str(e)}"
    
    def restart_server(self, server_name, server_data):
        """Restartuj serwer"""
        # Najpierw zatrzymaj
        success, message = self.stop_server(server_name)
        if not success:
            return False, f"Failed to stop server: {message}"
        
        # Poczekaj chwilę
        time.sleep(3)
        
        # Uruchom ponownie
        return self.start_server(server_name, server_data)
    
    def send_command(self, server_name, command):
        """Wyślij komendę do serwera"""
        with self.lock:
            if server_name not in self.processes:
                return False, "Server not running"
            
            process = self.processes[server_name]
        
        try:
            if process.stdin and not process.stdin.closed:
                if not command.endswith('\n'):
                    command += '\n'
                
                process.stdin.write(command)
                process.stdin.flush()
                return True, f"Command sent: {command.strip()}"
            else:
                return False, "Cannot send command - stdin not available"
                
        except Exception as e:
            return False, f"Error sending command: {str(e)}"
    
    def _capture_output(self, server_name, process):
        """Przechwytuj output serwera"""
        output_buffer = []
        
        while True:
            try:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                
                if line:
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    formatted_line = f"[{timestamp}] {line.strip()}\n"
                    output_buffer.append(formatted_line)
                    
                    # Ogranicz bufor do 1000 linii
                    if len(output_buffer) > 1000:
                        output_buffer.pop(0)
                    
                    # Zapisz w pamięci
                    with self.lock:
                        if server_name in self.server_info:
                            self.server_info[server_name]['output_buffer'] = output_buffer
                    
                    # Zapisz do pliku
                    self._write_to_log_file(server_name, formatted_line)
                    
            except Exception as e:
                logger.error(f"Error capturing output for {server_name}: {e}")
                break
        
        # Serwer się zakończył
        with self.lock:
            if server_name in self.server_info:
                self.server_info[server_name]['status'] = 'stopped'
    
    def _write_to_log_file(self, server_name, line):
        """Zapisz linię do pliku logu"""
        try:
            server_path = self.get_server_path(server_name)
            logs_dir = os.path.join(server_path, 'logs')
            os.makedirs(logs_dir, exist_ok=True)
            
            log_file = os.path.join(logs_dir, 'latest.log')
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(line)
        except Exception as e:
            logger.error(f"Error writing to log file: {e}")
    
    def get_server_output(self, server_name, lines=100):
        """Pobierz output serwera"""
        with self.lock:
            if server_name in self.server_info:
                output_buffer = self.server_info[server_name].get('output_buffer', [])
                recent_lines = output_buffer[-lines:] if len(output_buffer) > lines else output_buffer
                return ''.join(recent_lines)
        return ""
    
    def get_server_status(self, server_name):
        """Pobierz status serwera"""
        with self.lock:
            if server_name in self.processes:
                process = self.processes[server_name]
                return_code = process.poll()
                
                if return_code is None:
                    return {
                        'running': True,
                        'pid': process.pid,
                        'status': 'running'
                    }
                else:
                    # Proces zakończony
                    if server_name in self.processes:
                        del self.processes[server_name]
                    if server_name in self.server_info:
                        self.server_info[server_name]['status'] = 'stopped'
                    
                    return {
                        'running': False,
                        'pid': None,
                        'status': 'stopped',
                        'returncode': return_code
                    }
            else:
                return {
                    'running': False,
                    'pid': None,
                    'status': 'stopped'
                }

    def _secure_path(self, server_name, path=''):
        """Zabezpiecza ścieżkę, aby uniknąć path traversal."""
        server_path = self.get_server_path(server_name)

        if not os.path.exists(server_path):
            os.makedirs(server_path)

        # Normalizuj ścieżkę, aby usunąć '..' i inne
        safe_path = os.path.normpath(os.path.join(server_path, path))

        # Sprawdź, czy znormalizowana ścieżka nadal jest w katalogu serwera
        if os.path.commonprefix((safe_path, server_path)) != server_path:
            raise ValueError("Path traversal attempt detected")

        return safe_path

    def list_files(self, server_name, path=''):
        """Listuje pliki i katalogi w podanej ścieżce."""
        try:
            full_path = self._secure_path(server_name, path)
            if not os.path.exists(full_path) or not os.path.isdir(full_path):
                return [], "Path not found or is not a directory"

            items = []
            for item in os.listdir(full_path):
                item_path = os.path.join(full_path, item)
                stat = os.stat(item_path)
                items.append({
                    'name': item,
                    'is_dir': os.path.isdir(item_path),
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })
            return items, None
        except Exception as e:
            return [], str(e)

    def read_file(self, server_name, file_path):
        """Czyta zawartość pliku."""
        try:
            full_path = self._secure_path(server_name, file_path)
            if not os.path.isfile(full_path):
                return None, "File not found"

            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return content, None
        except Exception as e:
            return None, str(e)

    def write_file(self, server_name, file_path, content):
        """Zapisuje zawartość do pliku."""
        try:
            full_path = self._secure_path(server_name, file_path)

            # Utwórz katalogi, jeśli nie istnieją
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, None
        except Exception as e:
            return False, str(e)

    def create_directory(self, server_name, dir_path):
        """Tworzy nowy katalog."""
        try:
            full_path = self._secure_path(server_name, dir_path)
            os.makedirs(full_path, exist_ok=True)
            return True, None
        except Exception as e:
            return False, str(e)

    def delete_item(self, server_name, item_path, is_directory):
        """Usuwa plik lub katalog."""
        try:
            full_path = self._secure_path(server_name, item_path)
            if not os.path.exists(full_path):
                return False, "Item not found"

            if is_directory:
                shutil.rmtree(full_path)
            else:
                os.remove(full_path)
            return True, None
        except Exception as e:
            return False, str(e)

    def rename_item(self, server_name, old_path, new_path):
        """Zmienia nazwę pliku lub katalogu."""
        try:
            full_old_path = self._secure_path(server_name, old_path)
            full_new_path = self._secure_path(server_name, new_path)

            if not os.path.exists(full_old_path):
                return False, "Source item not found"

            os.rename(full_old_path, full_new_path)
            return True, None
        except Exception as e:
            return False, str(e)

    def upload_file(self, server_name, path, file_storage):
        """Obsługuje upload plików."""
        try:
            filename = secure_filename(file_storage.filename)
            upload_path = self._secure_path(server_name, os.path.join(path, filename))

            os.makedirs(os.path.dirname(upload_path), exist_ok=True)
            file_storage.save(upload_path)

            return True, None
        except Exception as e:
            return False, str(e)

    def list_plugins(self, server_name):
        """Listuje pluginy (pliki .jar) w katalogu plugins."""
        try:
            plugins_path = self._secure_path(server_name, 'plugins')
            if not os.path.isdir(plugins_path):
                return [], None

            plugins = []
            for item in os.listdir(plugins_path):
                if item.endswith('.jar'):
                    item_path = os.path.join(plugins_path, item)
                    stat = os.stat(item_path)
                    plugins.append({
                        'name': item,
                        'size': stat.st_size,
                        'modified': stat.st_mtime
                    })
            return plugins, None
        except Exception as e:
            return [], str(e)

    def install_plugin(self, server_name, plugin_url):
        """Instaluje plugin z URL."""
        try:
            plugins_path = self._secure_path(server_name, 'plugins')
            os.makedirs(plugins_path, exist_ok=True)

            filename = plugin_url.split('/')[-1]
            if not filename.endswith('.jar'):
                return False, "Invalid plugin URL (must end with .jar)"

            plugin_path = os.path.join(plugins_path, secure_filename(filename))

            success = self._download_file(plugin_url, plugin_path)
            if not success:
                return False, "Failed to download plugin"

            return True, None
        except Exception as e:
            return False, str(e)

    def delete_plugin(self, server_name, plugin_filename):
        """Usuwa plik pluginu."""
        try:
            plugin_path = self._secure_path(server_name, os.path.join('plugins', plugin_filename))

            if not os.path.isfile(plugin_path) or not plugin_path.endswith('.jar'):
                 return False, "Plugin not found or invalid filename"

            os.remove(plugin_path)
            return True, None
        except Exception as e:
            return False, str(e)


class MCPanelAgent:
    def __init__(self, panel_url, agent_token, agent_name, capacity=5, port=8080, base_path="./servers"):
        self.panel_url = panel_url.rstrip('/')
        self.agent_token = agent_token
        self.agent_name = agent_name
        self.capacity = capacity
        self.port = port
        self.base_path = base_path
        self.status = 'online'
        
        # Inicjalizuj menedżer serwerów
        self.server_manager = ServerManager(base_path)
        
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
        """Konfiguracja CORS"""
        
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
                'running_servers': list(self.server_manager.processes.keys()),
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
            for server_name in self.server_manager.processes.keys():
                status = self.server_manager.get_server_status(server_name)
                servers.append({
                    'name': server_name,
                    'status': status['status'],
                    'pid': status['pid'],
                    'running': status['running']
                })
            return jsonify({'servers': servers})

        @self.app.route('/server/install', methods=['POST'])
        def install_server():
            """Endpoint do instalacji serwera"""
            try:
                server_data = request.json
                server_name = server_data.get('name')
                
                if not server_name:
                    return jsonify({'error': 'Server name is required'}), 400
                
                success, message = self.server_manager.install_server(server_data)
                
                if success:
                    return jsonify({
                        'success': True,
                        'message': message,
                        'server': server_name
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': message
                    }), 500
                    
            except Exception as e:
                logger.error(f"Installation error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/start', methods=['POST'])
        def start_server(server_name):
            """Endpoint do uruchamiania serwera"""
            try:
                server_data = request.json or {}
                
                success, message = self.server_manager.start_server(server_name, server_data)
                
                if success:
                    return jsonify({
                        'success': True,
                        'message': message,
                        'server': server_name
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': message
                    }), 500
                    
            except Exception as e:
                logger.error(f"Start error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/stop', methods=['POST'])
        def stop_server(server_name):
            """Endpoint do zatrzymywania serwera"""
            try:
                success, message = self.server_manager.stop_server(server_name)
                
                if success:
                    return jsonify({
                        'success': True,
                        'message': message,
                        'server': server_name
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': message
                    }), 500
                    
            except Exception as e:
                logger.error(f"Stop error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/restart', methods=['POST'])
        def restart_server(server_name):
            """Endpoint do restartowania serwera"""
            try:
                server_data = request.json or {}
                
                success, message = self.server_manager.restart_server(server_name, server_data)
                
                if success:
                    return jsonify({
                        'success': True,
                        'message': message,
                        'server': server_name
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': message
                    }), 500
                    
            except Exception as e:
                logger.error(f"Restart error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/command', methods=['POST'])
        def send_command(server_name):
            """Endpoint do wysyłania komend do serwera"""
            try:
                data = request.json
                command = data.get('command')
                
                if not command:
                    return jsonify({'error': 'Command is required'}), 400
                
                success, message = self.server_manager.send_command(server_name, command)
                
                if success:
                    return jsonify({
                        'success': True,
                        'message': message
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': message
                    }), 500
                    
            except Exception as e:
                logger.error(f"Command error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/console', methods=['GET'])
        def get_console(server_name):
            """Endpoint do pobierania konsoli serwera"""
            try:
                lines = request.args.get('lines', 100, type=int)
                output = self.server_manager.get_server_output(server_name, lines)
                
                return jsonify({
                    'server': server_name,
                    'output': output,
                    'lines': len(output.split('\n')) if output else 0
                })
                
            except Exception as e:
                logger.error(f"Console error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/status', methods=['GET'])
        def get_server_status(server_name):
            """Endpoint do pobierania statusu serwera"""
            try:
                status = self.server_manager.get_server_status(server_name)
                return jsonify({
                    'server': server_name,
                    'status': status
                })
                
            except Exception as e:
                logger.error(f"Status error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/server/<server_name>/delete', methods=['POST'])
        def delete_server_files(server_name):
            """Endpoint do usuwania plików serwera na agencie"""
            try:
                success, message = self.server_manager.delete_server_files(server_name)
            
                if success:
                    return jsonify({
                        'success': True,
                        'message': message,
                        'server': server_name
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': message
                    }), 500
                
            except Exception as e:
                logger.error(f"Delete files error: {e}")
                return jsonify({'error': str(e)}), 500

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
                server_path = self.server_manager.get_server_path(server_name)
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
                'version': '3.0.0',
                'status': self.status,
                'endpoints': {
                    'agent_status': '/status',
                    'list_servers': '/servers',
                    'install_server': '/server/install (POST)',
                    'start_server': '/server/<name>/start (POST)',
                    'stop_server': '/server/<name>/stop (POST)',
                    'restart_server': '/server/<name>/restart (POST)',
                    'delete_server': '/server/<name>/delete (POST)',
                    'send_command': '/server/<name>/command (POST)',
                    'get_console': '/server/<name>/console (GET)',
                    'get_status': '/server/<name>/status (GET)',
                    'files_check': '/server/<name>/files/check (GET)',
                    'agent_logs': '/logs/agent (GET)',
                    'server_logs': '/logs/server/<name> (GET)',
                    'system_check': '/system/check (GET)',
                    'list_files': '/server/<name>/files (GET)',
                    'read_file': '/server/<name>/files/read (GET)',
                    'write_file': '/server/<name>/files/write (POST)',
                    'mkdir': '/server/<name>/files/mkdir (POST)',
                    'delete_item': '/server/<name>/files/delete (POST)',
                    'rename_item': '/server/<name>/files/rename (POST)',
                    'upload_file': '/server/<name>/files/upload (POST)',
                    'list_plugins': '/server/<name>/plugins (GET)',
                    'install_plugin': '/server/<name>/plugins/install (POST)',
                    'delete_plugin': '/server/<name>/plugins/delete (POST)',
                    'upload_plugin': '/server/<name>/plugins/upload (POST)'
                }
            })
            
        @self.app.route('/server/<server_name>/files/check', methods=['GET'])
        def check_server_files(server_name):
            """Endpoint do sprawdzania plików serwera na agencie"""
            try:
                result = self.server_manager.check_server_files(server_name)
                return jsonify(result)
            except Exception as e:
                logger.error(f"Error checking server files: {e}")
                return jsonify({
                    'hasFiles': False,
                    'message': f'Error: {str(e)}',
                    'fileCount': 0,
                    'serverType': 'unknown'
                }), 500

        @self.app.route('/server/<server_name>/files', methods=['GET'])
        def list_files(server_name):
            path = request.args.get('path', '')
            files, error = self.server_manager.list_files(server_name, path)
            if error:
                return jsonify({'error': error}), 500
            return jsonify(files)

        @self.app.route('/server/<server_name>/files/read', methods=['GET'])
        def read_file(server_name):
            file_path = request.args.get('path', '')
            content, error = self.server_manager.read_file(server_name, file_path)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'content': content})

        @self.app.route('/server/<server_name>/files/write', methods=['POST'])
        def write_file(server_name):
            data = request.get_json()
            file_path = data.get('path')
            content = data.get('content')
            success, error = self.server_manager.write_file(server_name, file_path, content)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/files/mkdir', methods=['POST'])
        def create_directory(server_name):
            data = request.get_json()
            dir_path = data.get('path')
            success, error = self.server_manager.create_directory(server_name, dir_path)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/files/delete', methods=['POST'])
        def delete_item(server_name):
            data = request.get_json()
            item_path = data.get('path')
            is_directory = data.get('is_directory', False)
            success, error = self.server_manager.delete_item(server_name, item_path, is_directory)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/files/rename', methods=['POST'])
        def rename_item(server_name):
            data = request.get_json()
            old_path = data.get('old_path')
            new_path = data.get('new_path')
            success, error = self.server_manager.rename_item(server_name, old_path, new_path)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/files/upload', methods=['POST'])
        def upload_file(server_name):
            if 'file' not in request.files:
                return jsonify({'error': 'No file part'}), 400

            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400

            path = request.form.get('path', '')
            success, error = self.server_manager.upload_file(server_name, path, file)

            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/plugins', methods=['GET'])
        def list_plugins(server_name):
            plugins, error = self.server_manager.list_plugins(server_name)
            if error:
                return jsonify({'error': error}), 500
            return jsonify(plugins)

        @self.app.route('/server/<server_name>/plugins/install', methods=['POST'])
        def install_plugin(server_name):
            data = request.get_json()
            plugin_url = data.get('url')
            if not plugin_url:
                return jsonify({'error': 'Plugin URL is required'}), 400

            success, error = self.server_manager.install_plugin(server_name, plugin_url)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/plugins/delete', methods=['POST'])
        def delete_plugin(server_name):
            data = request.get_json()
            filename = data.get('filename')
            if not filename:
                return jsonify({'error': 'Plugin filename is required'}), 400

            success, error = self.server_manager.delete_plugin(server_name, filename)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success})

        @self.app.route('/server/<server_name>/plugins/upload', methods=['POST'])
        def upload_plugin(server_name):
            if 'file' not in request.files:
                return jsonify({'error': 'No file part'}), 400

            file = request.files['file']
            if file.filename == '' or not file.filename.endswith('.jar'):
                return jsonify({'error': 'No selected file or invalid file type (must be .jar)'}), 400

            # For plugins, the path is always 'plugins'
            success, error = self.server_manager.upload_file(server_name, 'plugins', file)

            if error:
                return jsonify({'error': error}), 500
            return jsonify({'success': success, 'message': f'Plugin {file.filename} uploaded successfully.'})

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

    def start(self):
        logger.info(f"Starting MCPanel Agent: {self.agent_name}")
        logger.info(f"Panel URL: {self.panel_url}")
        logger.info(f"Agent port: {self.port}")
        logger.info(f"Base path: {self.base_path}")
        
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
                'running_servers': len(self.server_manager.processes),
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
                'running_servers': len(self.server_manager.processes),
                'max_servers': self.capacity,
                'timestamp': datetime.now().isoformat()
            }

    def _update_server_statuses(self, servers):
        for server in servers:
            try:
                server_id = server['id']
                server_name = server['name']
                
                status = self.server_manager.get_server_status(server_name)
                current_status = 'running' if status['running'] else 'stopped'
                
                if server['status'] != current_status:
                    response = requests.post(
                        f"{self.panel_url}/api/agent/servers/{server_id}/status",
                        headers=self.headers,
                        json={'status': current_status, 'pid': status['pid']},
                        timeout=5
                    )
                    if response.status_code == 200:
                        logger.debug(f"Server {server_name} status updated to {current_status}")
            except Exception as e:
                logger.error(f"Error updating server status: {e}")

def main():
    panel_url = os.environ.get('PANEL_URL')
    agent_token = os.environ.get('AGENT_TOKEN')
    agent_name = os.environ.get('AGENT_NAME', 'DefaultAgent')
    capacity = int(os.environ.get('AGENT_CAPACITY', '5'))
    agent_port = int(os.environ.get('AGENT_PORT', '9292'))
    base_path = os.environ.get('AGENT_BASE_PATH', '/opt/mcpanel-agent/servers')

    if not panel_url or not agent_token:
        logger.critical("PANEL_URL and AGENT_TOKEN environment variables must be set.")
        return

    logger.info("--- MCPanel Agent v3.0 Starting ---")
    
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
