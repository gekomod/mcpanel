import subprocess
import os
import signal
import time
import json
import threading
import requests
import zipfile  # Dodaj import dla obsługi ZIP
import tarfile  # Dodaj import dla obsługi TAR (jeśli potrzebne)
from pathlib import Path
from datetime import datetime
from flask import current_app 

class ServerManager:
    def __init__(self, server_base_path):
        self.server_base_path = server_base_path
        self.processes = {}
        self.output_listeners = {}
        self.download_progress = {}
        self.download_threads = {}
        self.download_processes = {} 
        self.server_outputs = {} 
        self.lock = threading.Lock()
    
    def get_server_path(self, server_name):
        return os.path.join(self.server_base_path, server_name)
    
    def get_download_progress(self, server_id):
        """Get download progress for a server"""
        with self.lock:
            return self.download_progress.get(server_id, {
                'status': 'idle',
                'progress': 0,
                'message': 'Server is ready'
            })
    
    def _update_progress(self, server_id, status, progress, message, total_size=0, downloaded_size=0):
        """Update progress for a server"""
        with self.lock:
            self.download_progress[server_id] = {
                'status': status,
                'progress': progress,
                'message': message,
                'total_size': total_size,
                'downloaded_size': downloaded_size,
                'timestamp': datetime.now().isoformat()
            }
        print(f"Progress update for server {server_id}: {status} - {progress}% - {message}")
     
    def _download_with_curl(self, url, file_path, server_id, total_size):
        """Download using curl with progress tracking"""
        try:
            # Użyj curl z opcją progress bar
            cmd = [
                'curl', '-L', '--progress-bar', 
                '--output', file_path, url
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            # Zapisz proces do możliwości anulowania
            with self.lock:
                self.download_processes[server_id] = process
            
            downloaded_size = 0
            last_update_time = time.time()
            
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                
                if output:
                    # Parsuj output curl progress bar
                    if '%' in output:
                        try:
                            # Format: [percentage]% [downloaded]/[total]
                            parts = output.strip().split()
                            if len(parts) >= 2:
                                percentage_str = parts[0].replace('%', '')
                                progress = float(percentage_str)
                                
                                # Aktualizuj co 0.5 sekundy lub gdy postęp się zmienia
                                current_time = time.time()
                                if current_time - last_update_time > 0.5 or progress > downloaded_size:
                                    downloaded_bytes = (progress / 100) * total_size if total_size > 0 else 0
                                    
                                    self._update_progress(
                                        server_id,
                                        'downloading',
                                        progress,
                                        f'Pobieranie: {downloaded_bytes/(1024*1024):.1f}MB / {total_size/(1024*1024):.1f}MB',
                                        total_size,
                                        downloaded_bytes
                                    )
                                    
                                    last_update_time = current_time
                                    downloaded_size = progress
                        except:
                            pass
            
            # Sprawdź czy pobieranie zakończone sukcesem
            if process.returncode == 0:
                self._update_progress(
                    server_id,
                    'extracting',
                    95,
                    'Pobieranie zakończone, przygotowywanie serwera...',
                    total_size,
                    total_size
                )
                return True
            else:
                self._update_progress(
                    server_id,
                    'error',
                    0,
                    'Błąd podczas pobierania pliku'
                )
                return False
                
            with self.lock:
                if server_id in self.download_processes:
                    del self.download_processes[server_id]        
                
        except Exception as e:
            print(f"CURL download error: {e}")
            return False
    
    def _download_with_wget(self, url, file_path, server_id, total_size):
        """Download using wget with progress tracking"""
        try:
            cmd = [
                'wget', '-O', file_path, url
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            # Zapisz proces do możliwości anulowania
            with self.lock:
                self.download_processes[server_id] = process
            
            downloaded_size = 0
            last_update_time = time.time()
            
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                
                if output:
                    # Parsuj output wget
                    if '%' in output and '[' in output and ']' in output:
                        try:
                            # Format: [percentage]% [downloaded] [speed]
                            percentage_str = output.split('%')[0].split()[-1]
                            progress = float(percentage_str)
                            
                            # Aktualizuj co 0.5 sekundy
                            current_time = time.time()
                            if current_time - last_update_time > 0.5:
                                downloaded_bytes = (progress / 100) * total_size if total_size > 0 else 0
                                
                                self._update_progress(
                                    server_id,
                                    'downloading',
                                    progress,
                                    f'Pobieranie: {downloaded_bytes/(1024*1024):.1f}MB / {total_size/(1024*1024):.1f}MB',
                                    total_size,
                                    downloaded_bytes
                                )
                                
                                last_update_time = current_time
                        except:
                            pass
            
            # Sprawdź czy pobieranie zakończone sukcesem
            if process.returncode == 0:
                self._update_progress(
                    server_id,
                    'extracting',
                    95,
                    'Pobieranie zakończone, przygotowywanie serwera...',
                    total_size,
                    total_size
                )
                return True
            else:
                self._update_progress(
                    server_id,
                    'error',
                    0,
                    'Błąd podczas pobierania pliku'
                )
                return False
                
            with self.lock:
                if server_id in self.download_processes:
                    del self.download_processes[server_id]        

        except Exception as e:
            print(f"WGET download error: {e}")
            return False
            
# Dodaj metodę do anulowania pobierania
    def cancel_download(self, server_id):
        """Cancel ongoing download for a server"""
        with self.lock:
            if server_id in self.download_processes:
                process = self.download_processes[server_id]
                try:
                    process.terminate()
                    time.sleep(1)
                    if process.poll() is None:
                        process.kill()
                except:
                    pass
            
                # Clean up
                if server_id in self.download_processes:
                    del self.download_processes[server_id]
                if server_id in self.download_progress:
                    del self.download_progress[server_id]
            
                return True
        return False
    
    def _download_file_with_progress(self, url, file_path, server_id):
        """Download file with progress tracking using curl or wget"""
        try:
            print(f"Starting download from {url} to {file_path}")
            
            # Sprawdź, które narzędzie jest dostępne
            curl_available = 0
            wget_available = subprocess.run(['which', 'wget'], capture_output=True).returncode == 0
            
            if not curl_available and not wget_available:
                self._update_progress(server_id, 'error', 0, 'Brak curl lub wget do pobierania plików')
                return False
            
            # Pobierz rozmiar pliku najpierw
            try:
                head_response = subprocess.run([
                    'curl', '-s', '-I', '-L', url
                ], capture_output=True, text=True)
                
                total_size = 0
                for line in head_response.stdout.split('\n'):
                    if line.lower().startswith('content-length:'):
                        total_size = int(line.split(':')[1].strip())
                        break
            except:
                total_size = 0
            
            self._update_progress(
                server_id, 
                'downloading', 
                5, 
                'Rozpoczynanie pobierania...',
                total_size,
                0
            )
            
            # Użyj curl jeśli dostępne (lepsze wsparcie dla progress bar)
            if curl_available:
                success = self._download_with_curl(url, file_path, server_id, total_size)
            else:
                success = self._download_with_wget(url, file_path, server_id, total_size)
            
            if success and file_path.endswith('.zip'):
                # Jeśli to plik ZIP, rozpakuj go
                return self._extract_zip_file(file_path, server_id, total_size)
            
            return success
            
        except Exception as e:
            print(f"Download error: {e}")
            self._update_progress(
                server_id,
                'error',
                0,
                f'Błąd pobierania: {str(e)}'
            )
            return False
    
    def _extract_zip_file(self, zip_path, server_id, total_size):
        """Extract ZIP file with progress tracking"""
        try:
            self._update_progress(
                server_id,
                'extracting',
                95,
                'Rozpakowywanie pliku...',
                total_size,
                total_size
            )
            
            # Pobierz ścieżkę do katalogu serwera
            server_dir = os.path.dirname(zip_path)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Pobierz listę plików i całkowity rozmiar
                file_list = zip_ref.namelist()
                total_files = len(file_list)
                
                # Rozpakuj pliki z progresem
                for i, file in enumerate(file_list):
                    try:
                        zip_ref.extract(file, server_dir)
                        
                        # Aktualizuj postęp co 10 plików lub dla dużych plików
                        if i % 10 == 0 or i == total_files - 1:
                            progress = 95 + (i / total_files) * 5  # 95-100%
                            self._update_progress(
                                server_id,
                                'extracting',
                                progress,
                                f'Rozpakowywanie: {i+1}/{total_files} plików...',
                                total_size,
                                total_size
                            )
                            
                    except Exception as e:
                        print(f"Error extracting {file}: {e}")
                        continue
            
            # Usuń plik ZIP po rozpakowaniu
            try:
                os.remove(zip_path)
            except:
                pass
            
            self._update_progress(
                server_id,
                'starting',
                100,
                'Rozpakowywanie zakończone, uruchamianie serwera...',
                total_size,
                total_size
            )
            
            return True
            
        except Exception as e:
            print(f"Extraction error: {e}")
            self._update_progress(
                server_id,
                'error',
                0,
                f'Błąd rozpakowywania: {str(e)}'
            )
            return False
    
    def _start_server_async(self, server, bedrock_url=None):
        """Start server in a separate thread"""
        try:
            server_path = self.get_server_path(server.name)
            
            # Initialize download progress
            self._update_progress(server.id, 'preparing', 0, 'Przygotowywanie serwera...')
            time.sleep(1)
            
            # Check if server directory exists
            if not os.path.exists(server_path):
                try:
                    os.makedirs(server_path, exist_ok=True)
                    self._update_progress(server.id, 'preparing', 10, 'Tworzenie katalogu serwera...')
                    time.sleep(0.5)
                except Exception as e:
                    self._update_progress(server.id, 'error', 0, f'Błąd tworzenia katalogu: {str(e)}')
                    return
            
            # For Bedrock servers - pobierz i rozpakuj
            if server.type == 'bedrock':
                bedrock_binary = 'bedrock_server'
                if os.name == 'nt':  # Windows
                    bedrock_binary = 'bedrock_server.exe'
                
                bedrock_path = os.path.join(server_path, bedrock_binary)
                
                if not os.path.exists(bedrock_path):
                    if not bedrock_url:
                        self._update_progress(server.id, 'error', 0, 'Brak URL do pobrania serwera Bedrock')
                        return
                    
                    try:
                        # Pobierz do tymczasowego pliku ZIP
                        temp_zip_path = os.path.join(server_path, 'bedrock_server.zip')
                        
                        # Download with progress - funkcja teraz sama obsłuży rozpakowywanie
                        success = self._download_file_with_progress(bedrock_url, temp_zip_path, server.id)
                        if not success:
                            return
                        
                        # Sprawdź czy plik wykonywalny istnieje po rozpakowaniu
                        if not os.path.exists(bedrock_path):
                            self._update_progress(server.id, 'error', 0, 'Brak pliku wykonywalnego po rozpakowaniu')
                            return
                        
                        # Make executable on Linux
                        if os.name != 'nt':
                            os.chmod(bedrock_path, 0o755)
                        
                    except Exception as e:
                        self._update_progress(server.id, 'error', 0, f'Błąd pobierania serwera Bedrock: {str(e)}')
                        return
            
            # Dla Java servers - pozostały kod bez zmian
            if server.type == 'java':
                jar_file = None
                for file in os.listdir(server_path):
                    if file.endswith('.jar') and 'server' in file.lower():
                        jar_file = file
                        break
                
                if not jar_file:
                    # Try to download server.jar
                    try:
                        self._update_progress(server.id, 'fetching_manifest', 15, 'Pobieranie informacji o wersji...')
                        
                        # Get the specific version manifest
                        version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
                        version_manifest = requests.get(version_manifest_url).json()
                        
                        # Find the specific version
                        version_info = None
                        for version in version_manifest['versions']:
                            if version['id'] == server.version and version['type'] == 'release':
                                version_info = requests.get(version['url']).json()
                                break
                        
                        if not version_info:
                            self._update_progress(server.id, 'error', 0, f'Wersja {server.version} nie znaleziona')
                            return
                        
                        # Get server jar download URL
                        server_jar_url = version_info['downloads']['server']['url']
                        jar_path = os.path.join(server_path, 'server.jar')
                        
                        # Download with progress
                        success = self._download_file_with_progress(server_jar_url, jar_path, server.id)
                        if not success:
                            return
                        
                        jar_file = 'server.jar'
                        
                    except Exception as e:
                        self._update_progress(server.id, 'error', 0, f'Błąd pobierania server.jar: {str(e)}')
                        return
            
            # Create eula.txt for Java servers - bez zmian
            if server.type == 'java':
                eula_path = os.path.join(server_path, 'eula.txt')
                if not os.path.exists(eula_path):
                    try:
                        with open(eula_path, 'w') as f:
                            f.write("eula=true\n")
                        self._update_progress(server.id, 'preparing', 98, 'Tworzenie konfiguracji serwera...')
                        time.sleep(0.5)
                    except Exception as e:
                        print(f"Warning: Could not create eula.txt: {e}")
            
            # Prepare startup command - bez zmian
            self._update_progress(server.id, 'starting', 99, 'Uruchamianie procesu serwera...')
            time.sleep(1)
            
            if server.type == 'java':
                cmd = ['java', '-Xmx2G', '-Xms1G', '-jar', 'server.jar', 'nogui']
            else:
                if os.name == 'nt':  # Windows
                    cmd = ['bedrock_server.exe']
                else:  # Linux
                    cmd = ['./bedrock_server']
            
            # Start the process - bez zmian
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
        
            # Store process reference and update database
            self.processes[server.id] = process
                    
            # Start output listener thread - bez zmian
            self.output_listeners[server.id] = True
            thread = threading.Thread(target=self._capture_output, args=(server.id, process))
            thread.daemon = True
            thread.start()
            
            # Final success message - bez zmian
            self._update_progress(server.id, 'complete', 100, 'Serwer został pomyślnie uruchomiony!')
            
            # Clean up thread reference - bez zmian
            with self.lock:
                if server.id in self.download_threads:
                    del self.download_threads[server.id]
            
        except Exception as e:
            self._update_progress(server.id, 'error', 0, f'Błąd uruchamiania serwera: {str(e)}')
            # Clean up thread reference on error too
            with self.lock:
                if server.id in self.download_threads:
                    del self.download_threads[server.id]
    
    def start_server(self, server, bedrock_url=None):
        """Start the server - returns immediately, actual work happens in thread"""
        # Check if server is already starting or running
        with self.lock:
            if server.id in self.download_threads and self.download_threads[server.id].is_alive():
                return False, "Server is already starting"
            
            if server.id in self.processes and self.processes[server.id].poll() is None:
                return False, "Server is already running"

            # Start the server in a separate thread
            thread = threading.Thread(target=self._start_server_async, args=(server, bedrock_url))
            thread.daemon = True
            thread.start()

            self.download_threads[server.id] = thread
        
        return True, "Server starting process initiated"
    
    def stop_server(self, server_id):
        # DODAJ current_app.context() WEWNĄTRZ METODY
        try:
            if server_id not in self.processes:
                # Clear progress if exists
                if server_id in self.download_progress:
                    del self.download_progress[server_id]
                return False, "Server not running"
            
            process = self.processes[server_id]
            
            try:
                # Send stop command to the server
                if process.stdin:
                    process.stdin.write('stop\n')
                    process.stdin.flush()
                
                # Wait for process to terminate
                for _ in range(30):
                    if process.poll() is not None:
                        break
                    time.sleep(1)
                
                # If still running, force kill
                if process.poll() is None:
                    process.terminate()
                    time.sleep(5)
                    if process.poll() is None:
                        process.kill()
                
                # Clean up
                if server_id in self.processes:
                    del self.processes[server_id]
                if server_id in self.output_listeners:
                    self.output_listeners[server_id] = False
                if server_id in self.download_progress:
                    del self.download_progress[server_id]
                
                # Update server status in database - UŻYJ current_app
                from .models import db, Server
                with current_app.app_context():  # DODAJ KONTEKST APLIKACJI
                    server_obj = Server.query.get(server_id)
                    if server_obj:
                        server_obj.status = 'stopped'
                        db.session.commit()

                return True, "Server stopped successfully"
            
            except Exception as e:
                return False, f"Failed to stop server: {str(e)}"
        
        except Exception as e:
            return False, f"Failed to stop server: {str(e)}"
    
    def send_command(self, server_id, command):
        if server_id not in self.processes:
            return False, "Server not running"
    
        process = self.processes[server_id]
    
        try:
            if process.stdin and not process.stdin.closed:
                # Upewnij się, że komenda ma nową linię
                if not command.endswith('\n'):
                    command += '\n'
            
                # Sprawdź czy proces nadal działa
                if process.poll() is not None:
                    return False, "Server process has terminated"
            
                process.stdin.write(command)
                process.stdin.flush()
                return True, "Command sent successfully"
            else:
                return False, "Cannot send command to server - stdin not available"
        except Exception as e:
           return False, f"Failed to send command: {str(e)}"
    
    def _capture_output(self, server_id, process):
        while server_id in self.output_listeners and self.output_listeners[server_id]:
            try:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
            
                # Here you would typically send the output to connected clients via WebSocket
                print(f"Server {server_id}: {line.strip()}")
            
                # Write to server log file
                try:
                    server_log_path = os.path.join(self.get_server_path_from_id(server_id), 'server.log')
                    with open(server_log_path, 'a', encoding='utf-8') as log_file:
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        log_file.write(f"[{timestamp}] {line}")
                except Exception as e:
                    print(f"Error writing to log file: {e}")
            
            except Exception as e:
                print(f"Error reading output from server {server_id}: {e}")
                break
    
        # Clean up when done - DODAJ AKTUALIZACJĘ STATUSU W BAZIE DANYCH
        try:
            from .models import db, Server
            from flask import current_app
        
            with current_app.app_context():
                server_obj = Server.query.get(server_id)
                if server_obj:
                    server_obj.status = 'stopped'
                    db.session.commit()
                    print(f"Updated server {server_id} status to stopped in database")
        except Exception as e:
            print(f"Error updating server status in database: {e}")
    
        # Clean up references
        if server_id in self.processes:
            del self.processes[server_id]
        if server_id in self.output_listeners:
            del self.output_listeners[server_id]
    
    def get_server_path_from_id(self, server_id):
        # This method should query the database to get server name from ID
        # For now, we'll use a placeholder - in real implementation, you'd import db and Server model
        try:
            from .models import Server
            from flask import current_app
            
            with current_app.app_context():
                server = Server.query.get(server_id)
                if server:
                    return self.get_server_path(server.name)
        except:
            pass
    
        # Fallback if database query fails
        return os.path.join(self.server_base_path, f"server-{server_id}")
    
    def get_server_properties(self, server_name):
        server_path = self.get_server_path(server_name)
        properties_file = os.path.join(server_path, 'server.properties')
        
        properties = {}
        try:
            if os.path.exists(properties_file):
                with open(properties_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            if '=' in line:
                                key, value = line.split('=', 1)
                                properties[key.strip()] = value.strip()
            else:
                # Create default properties if file doesn't exist
                self._create_default_properties(server_path, server_name)
                # Read the newly created file
                with open(properties_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            if '=' in line:
                                key, value = line.split('=', 1)
                                properties[key.strip()] = value.strip()
        
        except FileNotFoundError:
            return None
        except Exception as e:
            print(f"Error reading server properties: {e}")
            return None
        
        return properties
    
    def _create_default_properties(self, server_path, server_name):
        """Create default server.properties file"""
        properties_file = os.path.join(server_path, 'server.properties')
        try:
            with open(properties_file, 'w', encoding='utf-8') as f:
                f.write("#Minecraft server properties\n")
                f.write("#Generated by Minecraft Server Panel\n")
                f.write("enable-jmx-monitoring=false\n")
                f.write("rcon.port=25575\n")
                f.write("level-seed=\n")
                f.write("gamemode=survival\n")
                f.write("enable-command-block=false\n")
                f.write("enable-query=false\n")
                f.write("generator-settings=\n")
                f.write("level-name=world\n")
                f.write("motd=A Minecraft Server\n")
                f.write("query.port=25565\n")
                f.write("pvp=true\n")
                f.write("generate-structures=true\n")
                f.write("max-chained-neighbor-updates=1000000\n")
                f.write("difficulty=easy\n")
                f.write("network-compression-threshold=256\n")
                f.write("max-tick-time=60000\n")
                f.write("require-resource-pack=false\n")
                f.write("use-native-transport=true\n")
                f.write("max-players=20\n")
                f.write("online-mode=true\n")
                f.write("enable-status=true\n")
                f.write("allow-flight=false\n")
                f.write("broadcast-rcon-to-ops=true\n")
                f.write("view-distance=10\n")
                f.write("server-ip=\n")
                f.write("resource-pack-prompt=\n")
                f.write("allow-nether=true\n")
                f.write("server-port=25565\n")
                f.write("enable-rcon=false\n")
                f.write("sync-chunk-writes=true\n")
                f.write("op-permission-level=4\n")
                f.write("prevent-proxy-connections=false\n")
                f.write("hide-online-players=false\n")
                f.write("resource-pack=\n")
                f.write("entity-broadcast-range-percentage=100\n")
                f.write("simulation-distance=10\n")
                f.write("rcon.password=\n")
                f.write("player-idle-timeout=0\n")
                f.write("force-gamemode=false\n")
                f.write("rate-limit=0\n")
                f.write("hardcore=false\n")
                f.write("white-list=false\n")
                f.write("broadcast-console-to-ops=true\n")
                f.write("spawn-npcs=true\n")
                f.write("spawn-animals=true\n")
                f.write("log-ips=true\n")
                f.write("function-permission-level=2\n")
                f.write("initial-disabled-packs=\n")
                f.write("primary-resource-pack=\n")
                f.write("level-type=minecraft\\:normal\n")
                f.write("spawn-monsters=true\n")
                f.write("enforce-whitelist=false\n")
                f.write("spawn-protection=16\n")
                f.write("resource-pack-sha1=\n")
                f.write("max-world-size=29999984\n")
                f.write("max-build-height=256\n")
        except Exception as e:
            print(f"Error creating default server properties: {e}")
    
    def update_server_properties(self, server_name, properties):
        server_path = self.get_server_path(server_name)
        properties_file = os.path.join(server_path, 'server.properties')
        
        try:
            # Read existing properties and comments
            existing_properties = {}
            comments_and_whitespace = []
            
            if os.path.exists(properties_file):
                with open(properties_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            if '=' in line:
                                key, value = line.split('=', 1)
                                existing_properties[key.strip()] = value.strip()
                                comments_and_whitespace.append(line + '\n')
                            else:
                                comments_and_whitespace.append(line + '\n')
                        else:
                            comments_and_whitespace.append(line + '\n')
            else:
                # Create file if it doesn't exist
                comments_and_whitespace = ["#Minecraft server properties\n", "#Generated by Minecraft Server Panel\n"]
            
            # Update with new values
            for key, value in properties.items():
                existing_properties[key] = value
            
            # Write back to file
            with open(properties_file, 'w', encoding='utf-8') as f:
                # Write comments and whitespace
                for line in comments_and_whitespace:
                    if not line.strip() or line.strip().startswith('#'):
                        f.write(line)
                    else:
                        # Check if this line is a property that we're updating
                        is_property = False
                        if '=' in line:
                            line_key = line.split('=')[0].strip()
                            if line_key in properties:
                                is_property = True
                        
                        if not is_property:
                            f.write(line)
                
                # Write all properties
                for key, value in existing_properties.items():
                    f.write(f"{key}={value}\n")
            
            return True, "Properties updated successfully"
        
        except Exception as e:
            return False, f"Failed to update properties: {str(e)}"
    
    def get_server_logs(self, server_name, lines=100):
        """Get the last N lines of server logs"""
        server_path = self.get_server_path(server_name)
        log_file = os.path.join(server_path, 'logs', 'latest.log')  # Standardowa ścieżka logów Minecraft
    
        # Sprawdź również starsze lokalizacje logów
        if not os.path.exists(log_file):
            log_file = os.path.join(server_path, 'server.log')  # Alternatywna lokalizacja
    
        try:
            if os.path.exists(log_file):
                # Użyj tail do efektywnego odczytu ostatnich linii
                try:
                    result = subprocess.run(
                        ['tail', '-n', str(lines), log_file],
                        capture_output=True, text=True
                    )
                    if result.returncode == 0:
                        return result.stdout, None
                except:
                    # Fallback: czytaj cały plik jeśli tail nie działa
                    pass
            
                # Czytaj cały plik i weź ostatnie linie
                with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                    all_lines = f.readlines()
                    last_lines = ''.join(all_lines[-lines:])
                    return last_lines, None
            else:
                return "", "No log file found"
        except Exception as e:
            return "", f"Error reading log file: {str(e)}"
    
    def get_server_status(self, server_id):
        """Get detailed status of a server"""
        if server_id in self.processes:
            process = self.processes[server_id]
            return_code = process.poll()
        
            # If process is still running
            if return_code is None:
                return {
                    'running': True,
                    'pid': process.pid,
                    'returncode': None
                }
            # If process has ended
            else:
                # Clean up the process reference
                if server_id in self.processes:
                    del self.processes[server_id]
                if server_id in self.output_listeners:
                    self.output_listeners[server_id] = False
            
                return {
                    'running': False,
                    'pid': None,
                    'returncode': return_code
                }
        else:
            # Check if process might be running outside our management
            try:
                from .models import Server
                from flask import current_app
            
                with current_app.app_context():
                    server = Server.query.get(server_id)
                    if server:
                        # Check if server port is in use (simple heuristic)
                        import socket
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        result = sock.connect_ex(('127.0.0.1', server.port))
                        sock.close()
                    
                        if result == 0:
                            return {
                                'running': True,
                                'pid': None,
                                'returncode': None,
                                'port_in_use': True
                            }
            except:
                pass
        
            return {
                'running': False,
                'pid': None,
                'returncode': None
            }
    
    def backup_server(self, server_name, backup_name=None):
        """Create a backup of the server"""
        server_path = self.get_server_path(server_name)
        backup_dir = os.path.join(self.server_base_path, 'backups', server_name)
        
        try:
            # Create backup directory if it doesn't exist
            os.makedirs(backup_dir, exist_ok=True)
            
            # Generate backup name if not provided
            if not backup_name:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_name = f"backup_{timestamp}"
            
            backup_path = os.path.join(backup_dir, backup_name)
            
            # Create zip archive of the server directory (excluding logs and cache)
            import zipfile
            with zipfile.ZipFile(backup_path + '.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(server_path):
                    # Skip logs and cache directories
                    if 'logs' in dirs:
                        dirs.remove('logs')
                    if 'cache' in dirs:
                        dirs.remove('cache')
                    
                    for file in files:
                        if file.endswith('.log') or file.endswith('.tmp'):
                            continue
                        
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, server_path)
                        zipf.write(file_path, arcname)
            
            return True, f"Backup created successfully: {backup_name}"
        
        except Exception as e:
            return False, f"Failed to create backup: {str(e)}"
            
    def _capture_output(self, server_id, process):
        """Capture server output in real-time and store it"""
        output_buffer = []
    
        while server_id in self.output_listeners and self.output_listeners[server_id]:
            try:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
            
                # Store the output line with timestamp
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                formatted_line = f"[{timestamp}] {line.strip()}\n"
                output_buffer.append(formatted_line)
            
                # Keep only last 1000 lines to prevent memory issues
                if len(output_buffer) > 1000:
                    output_buffer.pop(0)
            
                # Store in memory for real-time access
                with self.lock:
                    self.server_outputs[server_id] = output_buffer
            
                # Here you would typically send the output to connected clients via WebSocket
                print(f"Server {server_id}: {line.strip()}")
            
            except Exception as e:
                print(f"Error reading output from server {server_id}: {e}")
                break
    
        # Clean up when done
        try:
            from .models import db, Server
            from flask import current_app
        
            with current_app.app_context():
                server_obj = Server.query.get(server_id)
                if server_obj:
                    server_obj.status = 'stopped'
                    db.session.commit()
                    print(f"Updated server {server_id} status to stopped in database")
        except Exception as e:
            print(f"Error updating server status in database: {e}")
    
        # Clean up references
        if server_id in self.processes:
            del self.processes[server_id]
        if server_id in self.output_listeners:
            del self.output_listeners[server_id]
        if server_id in self.server_outputs:
            del self.server_outputs[server_id]

    def get_realtime_output(self, server_id, lines=100):
        """Get real-time output from server memory buffer"""
        with self.lock:
            if server_id in self.server_outputs:
                output_buffer = self.server_outputs[server_id]
                return '\n'.join(output_buffer[-lines:]) if output_buffer else ""
            return ""
