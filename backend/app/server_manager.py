import subprocess
import os
import signal
import time
import json
import threading
import requests
import zipfile
import tarfile
from flask import current_app
from pathlib import Path
from datetime import datetime

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
            
            with self.lock:
                self.download_processes[server_id] = process
            
            downloaded_size = 0
            last_update_time = time.time()
            
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                
                if output:
                    if '%' in output:
                        try:
                            parts = output.strip().split()
                            if len(parts) >= 2:
                                percentage_str = parts[0].replace('%', '')
                                progress = float(percentage_str)
                                
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
                
        except Exception as e:
            print(f"CURL download error: {e}")
            return False
        finally:
            with self.lock:
                if server_id in self.download_processes:
                    del self.download_processes[server_id]
    
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
            
            with self.lock:
                self.download_processes[server_id] = process
            
            downloaded_size = 0
            last_update_time = time.time()
            
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                
                if output:
                    if '%' in output and '[' in output and ']' in output:
                        try:
                            percentage_str = output.split('%')[0].split()[-1]
                            progress = float(percentage_str)
                            
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
                
        except Exception as e:
            print(f"WGET download error: {e}")
            return False
        finally:
            with self.lock:
                if server_id in self.download_processes:
                    del self.download_processes[server_id]
            
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
            
            curl_available = subprocess.run(['which', 'curl'], capture_output=True).returncode == 0
            wget_available = subprocess.run(['which', 'wget'], capture_output=True).returncode == 0
            
            if not curl_available and not wget_available:
                self._update_progress(server_id, 'error', 0, 'Brak curl lub wget do pobierania plików')
                return False
            
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
            
            if curl_available:
                success = self._download_with_curl(url, file_path, server_id, total_size)
            else:
                success = self._download_with_wget(url, file_path, server_id, total_size)
            
            if success and file_path.endswith('.zip'):
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
            
            server_dir = os.path.dirname(zip_path)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                file_list = zip_ref.namelist()
                total_files = len(file_list)
                
                for i, file in enumerate(file_list):
                    try:
                        zip_ref.extract(file, server_dir)
                        
                        if i % 10 == 0 or i == total_files - 1:
                            progress = 95 + (i / total_files) * 5
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
    
    def _start_server_async(self, server_id, bedrock_url=None, app_context=None):
        """Start server in a separate thread with application context"""
        try:
            # Użyj przekazanego kontekstu aplikacji
            if app_context is None:
                # Fallback: spróbuj utworzyć własny kontekst
                try:
                    from flask import current_app
                    app_context = current_app.app_context
                except:
                    # Ostateczny fallback - aktualizuj tylko progress bez bazy danych
                    app_context = None
        
            # Pobierz serwer w kontekście aplikacji
            server = None
            if app_context:
                from .models import Server
                with app_context():
                    server = Server.query.get(server_id)
                    if not server:
                        self._update_progress(server_id, 'error', 0, 'Server not found')
                        return
            else:
                # Jeśli nie ma kontekstu, użyj podstawowych danych
                self._update_progress(server_id, 'error', 0, 'No application context available')
                return

            server_path = self.get_server_path(server.name)
        
            # Initialize download progress
            self._update_progress(server_id, 'preparing', 0, 'Przygotowywanie serwera...')
            time.sleep(1)
        
            # Check if server directory exists
            if not os.path.exists(server_path):
                try:
                    os.makedirs(server_path, exist_ok=True)
                    self._update_progress(server_id, 'preparing', 10, 'Tworzenie katalogu serwera...')
                    time.sleep(0.5)
                except Exception as e:
                    self._update_progress(server_id, 'error', 0, f'Błąd tworzenia katalogu: {str(e)}')
                    return
        
            # For Bedrock servers
            if server.type == 'bedrock':
                bedrock_binary = 'bedrock_server'
                if os.name == 'nt':
                    bedrock_binary = 'bedrock_server.exe'
            
                bedrock_path = os.path.join(server_path, bedrock_binary)
            
                if not os.path.exists(bedrock_path):
                    if not bedrock_url:
                        self._update_progress(server_id, 'error', 0, 'Brak URL do pobrania serwera Bedrock')
                        return
                
                    try:
                        temp_zip_path = os.path.join(server_path, 'bedrock_server.zip')
                        success = self._download_file_with_progress(bedrock_url, temp_zip_path, server_id)
                        if not success:
                            return
                    
                        if not os.path.exists(bedrock_path):
                            self._update_progress(server_id, 'error', 0, 'Brak pliku wykonywalnego po rozpakowaniu')
                            return
                    
                        if os.name != 'nt':
                            os.chmod(bedrock_path, 0o755)
                    
                    except Exception as e:
                        self._update_progress(server_id, 'error', 0, f'Błąd pobierania serwera Bedrock: {str(e)}')
                        return
        
            # For Java servers
            if server.type == 'java':
                jar_file = None
                for file in os.listdir(server_path):
                    if file.endswith('.jar') and 'server' in file.lower():
                        jar_file = file
                        break
            
                if not jar_file:
                    try:
                        self._update_progress(server_id, 'fetching_manifest', 15, 'Pobieranie informacji o wersji...')
                    
                        version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
                        version_manifest = requests.get(version_manifest_url).json()
                    
                        version_info = None
                        for version in version_manifest['versions']:
                            if version['id'] == server.version and version['type'] == 'release':
                                version_info = requests.get(version['url']).json()
                                break
                    
                        if not version_info:
                            self._update_progress(server_id, 'error', 0, f'Wersja {server.version} nie znaleziona')
                            return
                    
                        server_jar_url = version_info['downloads']['server']['url']
                        jar_path = os.path.join(server_path, 'server.jar')
                    
                        success = self._download_file_with_progress(server_jar_url, jar_path, server_id)
                        if not success:
                            return
                    
                        jar_file = 'server.jar'
                    
                    except Exception as e:
                        self._update_progress(server_id, 'error', 0, f'Błąd pobierania server.jar: {str(e)}')
                        return
        
            # Create eula.txt for Java servers
            if server.type == 'java':
                eula_path = os.path.join(server_path, 'eula.txt')
                if not os.path.exists(eula_path):
                    try:
                        with open(eula_path, 'w') as f:
                            f.write("eula=true\n")
                        self._update_progress(server_id, 'preparing', 98, 'Tworzenie konfiguracji serwera...')
                        time.sleep(0.5)
                    except Exception as e:
                        print(f"Warning: Could not create eula.txt: {e}")
        
            # Prepare startup command
            self._update_progress(server_id, 'starting', 99, 'Uruchamianie procesu serwera...')
            time.sleep(1)
        
            if server.type == 'java':
                cmd = ['java', '-Xmx2G', '-Xms1G', '-jar', 'server.jar', 'nogui']
            else:
                if os.name == 'nt':
                    cmd = ['bedrock_server.exe']
                else:
                    cmd = ['./bedrock_server']
        
            # Start the process
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
    
            # Store process reference
            self.processes[server_id] = process
        
            # Update database with PID using application context
            if app_context:
                try:
                    from .models import db, Server
                    with app_context():
                        server_obj = Server.query.get(server_id)
                        if server_obj:
                            server_obj.pid = process.pid
                            server_obj.status = 'running'
                            db.session.commit()
                            print(f"Server {server_id} started with PID: {process.pid}")
                except Exception as e:
                    print(f"Error updating database with PID: {e}")
            else:
                print(f"Server {server_id} started with PID: {process.pid} (no database update)")
                
            # Start output listener thread
            self.output_listeners[server_id] = True
            thread = threading.Thread(target=self._capture_output, args=(server_id, process, app_context))
            thread.daemon = True
            thread.start()
        
            # Final success message
            self._update_progress(server_id, 'complete', 100, 'Serwer został pomyślnie uruchomiony!')
        
            # Clean up thread reference
            with self.lock:
                if server_id in self.download_threads:
                    del self.download_threads[server_id]
        
        except Exception as e:
            print(f"Error in _start_server_async: {e}")
            # Update progress with error
            error_message = f'Błąd uruchamiania serwera: {str(e)}'
            self._update_progress(server_id, 'error', 0, error_message)
        
            # Update database status if app context is available
            if app_context:
                try:
                    from .models import db, Server
                    with app_context():
                        server_obj = Server.query.get(server_id)
                        if server_obj:
                            server_obj.status = 'stopped'
                            server_obj.pid = None
                            db.session.commit()
                except Exception as update_error:
                    print(f"Error updating database status: {update_error}")
                
        # Clean up thread reference on error too
        with self.lock:
            if server_id in self.download_threads:
                del self.download_threads[server_id]

    def start_server(self, server, bedrock_url=None):
        """Start the server - returns immediately, actual work happens in thread"""
        # Check if server is already starting or running
        with self.lock:
            if server.id in self.download_threads and self.download_threads[server.id].is_alive():
                return False, "Server is already starting"
        
            if server.id in self.processes and self.processes[server.id].poll() is None:
                return False, "Server is already running"

            # Przekaż tylko ID serwera i kontekst aplikacji
            from flask import current_app
            app_context = current_app.app_context

            # Start the server in a separate thread - przekaż tylko ID
            thread = threading.Thread(
                target=self._start_server_async, 
                args=(server.id, bedrock_url, app_context)
            )
            thread.daemon = True
            thread.start()

            self.download_threads[server.id] = thread
    
        return True, "Server starting process initiated"
    
    def stop_server(self, server_id):
        try:
            if server_id not in self.processes:
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
                
                # Update server status in database
                from flask import current_app
                from .models import db, Server
                with current_app.app_context():
                    server_obj = Server.query.get(server_id)
                    if server_obj:
                        server_obj.status = 'stopped'
                        server_obj.pid = None
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
                if not command.endswith('\n'):
                    command += '\n'
            
                if process.poll() is not None:
                    return False, "Server process has terminated"
            
                process.stdin.write(command)
                process.stdin.flush()
                return True, "Command sent successfully"
            else:
                return False, "Cannot send command to server - stdin not available"
        except Exception as e:
           return False, f"Failed to send command: {str(e)}"
    
    def _capture_output(self, server_id, process, app_context=None):
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
            
                print(f"Server {server_id}: {line.strip()}")
            
                # Write to server log file
                try:
                    server_log_path = os.path.join(self.get_server_path_from_id(server_id), 'server.log')
                    with open(server_log_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(formatted_line)
                except Exception as e:
                    print(f"Error writing to log file: {e}")
            
            except Exception as e:
                print(f"Error reading output from server {server_id}: {e}")
                break
    
        # Clean up when done
        if app_context:
            try:
                from .models import db, Server
                with app_context():
                    server_obj = Server.query.get(server_id)
                    if server_obj:
                        server_obj.status = 'stopped'
                        server_obj.pid = None
                        db.session.commit()
                        print(f"Updated server {server_id} status to stopped in database")
            except Exception as e:
                print(f"Error updating server status in database: {e}")
        else:
            print(f"Server {server_id} stopped (no database update)")

        # Clean up references
        if server_id in self.processes:
            del self.processes[server_id]
        if server_id in self.output_listeners:
            del self.output_listeners[server_id]
        if server_id in self.server_outputs:
            del self.server_outputs[server_id]
    
    def get_server_path_from_id(self, server_id):
        try:
            from flask import current_app
            from .models import Server
            with current_app.app_context():
                server = Server.query.get(server_id)
                if server:
                    return self.get_server_path(server.name)
        except:
            pass
    
        return os.path.join(self.server_base_path, f"{server.name}")
    
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
                self._create_default_properties(server_path, server_name)
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
                comments_and_whitespace = ["#Minecraft server properties\n", "#Generated by Minecraft Server Panel\n"]
            
            for key, value in properties.items():
                existing_properties[key] = value
            
            with open(properties_file, 'w', encoding='utf-8') as f:
                for line in comments_and_whitespace:
                    if not line.strip() or line.strip().startswith('#'):
                        f.write(line)
                    else:
                        is_property = False
                        if '=' in line:
                            line_key = line.split('=')[0].strip()
                            if line_key in properties:
                                is_property = True
                        
                        if not is_property:
                            f.write(line)
                
                for key, value in existing_properties.items():
                    f.write(f"{key}={value}\n")
            
            return True, "Properties updated successfully"
        
        except Exception as e:
            return False, f"Failed to update properties: {str(e)}"
    
    def get_server_logs(self, server_name, lines=100):
        """Get the last N lines of server logs"""
        server_path = self.get_server_path(server_name)
        log_file = os.path.join(server_path, 'logs', 'latest.log')

        if not os.path.exists(log_file):
            log_file = os.path.join(server_path, 'server.log')

        try:
            if os.path.exists(log_file):
                try:
                    result = subprocess.run(
                        ['tail', '-n', str(lines), log_file],
                        capture_output=True, text=True
                    )
                    if result.returncode == 0:
                        return result.stdout, None
                except:
                    pass
            
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
        from flask import current_app
    
        if server_id in self.processes:
            process = self.processes[server_id]
            return_code = process.poll()
    
            if return_code is None:
                return {
                    'running': True,
                    'pid': process.pid,
                    'returncode': None
                }
            else:
                if server_id in self.processes:
                    del self.processes[server_id]
                if server_id in self.output_listeners:
                    self.output_listeners[server_id] = False
            
                try:
                    from .models import db, Server
                    with current_app.app_context():
                        server_obj = Server.query.get(server_id)
                        if server_obj:
                            server_obj.pid = None
                            server_obj.status = 'stopped'
                            db.session.commit()
                except Exception as e:
                    print(f"Error updating database status: {e}")
            
                return {
                    'running': False,
                    'pid': None,
                    'returncode': return_code
                }
        else:
            try:
                from .models import Server
                with current_app.app_context():
                    server = Server.query.get(server_id)
                    if server and server.pid:
                        try:
                            import psutil
                            process = psutil.Process(server.pid)
                            if process.is_running():
                                return {
                                    'running': True,
                                    'pid': server.pid,
                                    'returncode': None,
                                    'port_in_use': True
                                }
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            server.pid = None
                            server.status = 'stopped'
                            db.session.commit()
            except Exception as e:
                print(f"Error checking external process: {e}")
    
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
            os.makedirs(backup_dir, exist_ok=True)
            
            if not backup_name:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_name = f"backup_{timestamp}"
            
            backup_path = os.path.join(backup_dir, backup_name)
            
            import zipfile
            with zipfile.ZipFile(backup_path + '.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(server_path):
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

    def get_realtime_output(self, server_id, lines=100):
        """Get real-time output from server memory buffer"""
        with self.lock:
            if server_id in self.server_outputs:
                output_buffer = self.server_outputs[server_id]
                return '\n'.join(output_buffer[-lines:]) if output_buffer else ""
            return ""
            
    def install_bedrock_server(self, server, download_url):
        """
        Instalacja serwera Bedrock
        """
        try:
            server_path = self.get_server_path(server.name)
            
            # Sprawdź czy katalog serwera istnieje
            if not os.path.exists(server_path):
                os.makedirs(server_path, exist_ok=True)
            
            # Rozpocznij pobieranie
            return self._download_and_extract_bedrock(server.id, download_url, server_path)
            
        except Exception as e:
            return False, f"Bedrock installation error: {str(e)}"
    
    def install_java_server(self, server):
        """
        Instalacja serwera Java
        """
        try:
            server_path = self.get_server_path(server.name)
            
            # Sprawdź czy katalog serwera istnieje
            if not os.path.exists(server_path):
                os.makedirs(server_path, exist_ok=True)
            
            # Pobierz plik JAR serwera Minecraft
            return self._download_java_server(server.id, server.version, server_path)
            
        except Exception as e:
            return False, f"Java installation error: {str(e)}"
    
    def _download_and_extract_bedrock(self, server_id, download_url, server_path):
        """
        Pobiera i wypakowuje serwer Bedrock
        """
        try:
            import requests
            import zipfile
            
            # Rozpocznij pobieranie
            response = requests.get(download_url, stream=True)
            response.raise_for_status()
            
            # Zapisz plik tymczasowy
            temp_zip = os.path.join(server_path, 'bedrock_server.zip')
            total_size = int(response.headers.get('content-length', 0))
            
            with open(temp_zip, 'wb') as f:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Aktualizuj postęp
                        progress = (downloaded / total_size) * 100 if total_size > 0 else 0
                        self._update_download_progress(server_id, progress, downloaded, total_size)
            
            # Wypakuj plik ZIP
            with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                zip_ref.extractall(server_path)
            
            # Usuń plik ZIP
            os.remove(temp_zip)
            
            # Ustaw uprawnienia wykonania dla pliku binarnego (Linux)
            bedrock_binary = os.path.join(server_path, 'bedrock_server')
            if os.path.exists(bedrock_binary):
                os.chmod(bedrock_binary, 0o755)
            
            # Oznacz jako zakończone
            self._update_download_progress(server_id, 100, total_size, total_size, 'complete')
            
            return True, "Bedrock server installed successfully"
            
        except Exception as e:
            self._update_download_progress(server_id, 0, 0, 0, 'error', str(e))
            return False, f"Download failed: {str(e)}"
    
    def _download_java_server(self, server_id, version, server_path):
        """
        Pobiera serwer Java
        """
        try:
            import requests
            
            # URL do pobrania serwera Minecraft (można dostosować do różnych wersji)
            if version == '1.20.1':
                jar_url = "https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar"
            elif version == '1.19.4':
                jar_url = "https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar"
            else:
                # Domyślna najnowsza wersja
                jar_url = "https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar"
            
            # Rozpocznij pobieranie
            response = requests.get(jar_url, stream=True)
            response.raise_for_status()
            
            # Zapisz plik JAR
            jar_path = os.path.join(server_path, 'server.jar')
            total_size = int(response.headers.get('content-length', 0))
            
            with open(jar_path, 'wb') as f:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Aktualizuj postęp
                        progress = (downloaded / total_size) * 100 if total_size > 0 else 0
                        self._update_download_progress(server_id, progress, downloaded, total_size)
            
            # Oznacz jako zakończone
            self._update_download_progress(server_id, 100, total_size, total_size, 'complete')
            
            return True, "Java server installed successfully"
            
        except Exception as e:
            self._update_download_progress(server_id, 0, 0, 0, 'error', str(e))
            return False, f"Download failed: {str(e)}"
    
    def _update_download_progress(self, server_id, progress, downloaded, total, status='downloading', message=''):
        """
        Aktualizuje postęp pobierania w pamięci
        """
        if not hasattr(self, 'download_progress'):
            self.download_progress = {}
        
        self.download_progress[server_id] = {
            'progress': progress,
            'downloaded_size': downloaded,
            'total_size': total,
            'status': status,
            'message': message,
            'timestamp': time.time()
        }
    
    def get_installation_progress(self, server_id):
        """
        Pobiera postęp instalacji
        """
        if not hasattr(self, 'download_progress') or server_id not in self.download_progress:
            return {
                'status': 'idle',
                'progress': 0,
                'downloaded_size': 0,
                'total_size': 0,
                'message': 'No active installation'
            }
        
        return self.download_progress[server_id]
    
    def get_download_status(self, server_id):
        """
        Pobiera status pobierania (alias dla get_installation_progress)
        """
        return self.get_installation_progress(server_id)
