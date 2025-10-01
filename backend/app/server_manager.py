import subprocess
import os
import signal
import time
import json
import threading
import requests
import zipfile
import tarfile
from bs4 import BeautifulSoup
from .models import db, Server
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
                'message': 'Server is ready',
                'total_size': 0,
                'downloaded_size': 0,
                'timestamp': datetime.now().isoformat()
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
    
    def _get_java_server_url(self, implementation, version):
        """Get download URL for Java server based on implementation and version"""
        if implementation == 'vanilla':
            # Pobierz URL z manifestu Mojang
            version_manifest_url = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
            try:
                version_manifest = requests.get(version_manifest_url).json()
            
                for v in version_manifest['versions']:
                    if v['id'] == version and v['type'] == 'release':
                        version_info = requests.get(v['url']).json()
                        return version_info['downloads']['server']['url']
            except:
                pass
        
            # Fallback dla popularnych wersji
            fallback_urls = {
                '1.20.1': 'https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar',
                '1.19.4': 'https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar',
                '1.18.2': 'https://piston-data.mojang.com/v1/objects/c8f83c5655308435b3dcf03c06d9fe8740a77469/server.jar'
            }
            return fallback_urls.get(version, fallback_urls['1.20.1'])
    
        elif implementation == 'paper':
            # API PaperMC v2
            build_data = self._get_latest_paper_build(version)
            if build_data:
                return f"https://api.papermc.io/v2/projects/paper/versions/{version}/builds/{build_data['build']}/downloads/{build_data['download']}"
    
        elif implementation == 'purpur':
            # API PurpurMC
            return f"https://api.purpurmc.org/v2/purpur/{version}/latest/download"
    
        elif implementation == 'fabric':
            # Fabric używa specjalnego instalatora
            return self._get_fabric_installer_url(version)
    
        elif implementation == 'forge':
            return self._get_forge_installer_url(version)

        elif implementation == 'neoforge':
            return self._get_neoforge_installer_url(version)

        return None
    
    def _get_forge_installer_url(self, version):
        """Scrape the Forge website to get the installer URL"""
        try:
            # Forge has a consistent URL pattern for their download pages
            url = f"https://files.minecraftforge.net/net/minecraftforge/forge/index_{version}.html"
            response = requests.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Find the download link for the installer
            # This is brittle and might break if they change their website structure
            download_link = soup.find('div', {'class': 'download'}).find('a', href=True)

            if download_link and 'installer' in download_link['href']:
                # The link is often a redirect, so we need to follow it
                redirect_url = download_link['href']
                final_url = requests.head(redirect_url, allow_redirects=True).url
                return final_url
        except Exception as e:
            print(f"Error getting Forge URL: {e}")
            # Fallback for a popular version if scraping fails
            if version == '1.20.1':
                return "https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.2.0/forge-1.20.1-47.2.0-installer.jar"
        return None

    def _get_neoforge_installer_url(self, version):
        """Get the NeoForge installer URL"""
        try:
            # NeoForge has a public Maven repository, making it easier
            # We need to find the latest version of NeoForge for the given Minecraft version
            api_url = f"https://api.neoforged.net/v1/versions/minecraft/{version}"
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()
            if data and len(data) > 0:
                # Get the latest version
                latest_version = data[0]
                return f"https://maven.neoforged.net/net/neoforged/neoforge/{latest_version}/neoforge-{latest_version}-installer.jar"
        except Exception as e:
            print(f"Error getting NeoForge URL: {e}")
        return None

    def _get_fabric_installer_url(self, version):
        """Pobierz URL instalatora Fabric"""
        try:
            # Pobierz listę wersji Fabric
            fabric_versions_url = "https://meta.fabricmc.net/v2/versions"
            response = requests.get(fabric_versions_url)
        
            if response.status_code == 200:
                data = response.json()
            
                # Znajdź installer
                installer_version = None
                for installer in data['installer']:
                    if installer['stable']:
                        installer_version = installer['version']
                        break
            
                if installer_version:
                    # Pobierz loader version dla danej wersji Minecraft
                    loader_version = None
                    for loader in data['loader']:
                        if loader['version'] == version or loader['version'].startswith(version):
                            loader_version = loader['version']
                            break
                
                    if not loader_version:
                        # Użyj najnowszego loadera
                        loader_version = data['loader'][0]['version']
                
                    return f"https://meta.fabricmc.net/v2/versions/loader/{version}/{loader_version}/{installer_version}/server/jar"
                
        except Exception as e:
            print(f"Error getting Fabric URL: {e}")
    
        # Fallback URL
        return f"https://meta.fabricmc.net/v2/versions/loader/{version}/latest/stable/server/jar"
        
    def _install_fabric_server(self, server_path, version, server_id):
        """Specjalna instalacja dla Fabric"""
        try:
            self._update_progress(server_id, 'installing_fabric', 50, 'Instalowanie Fabric server...')
        
            # Pobierz instalator Fabric
            fabric_url = self._get_fabric_installer_url(version)
            fabric_jar = os.path.join(server_path, 'fabric-server.jar')
        
            success = self._download_file_with_progress(fabric_url, fabric_jar, server_id)
            if not success:
                return False
        
            # Uruchom instalator Fabric
            self._update_progress(server_id, 'installing_fabric', 80, 'Uruchamianie instalatora Fabric...')
        
            install_cmd = ['java', '-jar', 'fabric-server.jar', 'nogui']
            process = subprocess.Popen(
                install_cmd,
                cwd=server_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
        
            # Poczekaj na zakończenie instalacji
            timeout = 120  # 2 minuty timeout
            start_time = time.time()
        
            while process.poll() is None:
                if time.time() - start_time > timeout:
                    process.kill()
                    return False
                time.sleep(1)
        
            # Sprawdź czy instalacja się powiodła (szukamy pliku fabric-server-launcher.jar)
            fabric_launcher = os.path.join(server_path, 'fabric-server-launcher.jar')
            if os.path.exists(fabric_launcher):
                # Zmień nazwę na server.jar dla zgodności
                server_jar = os.path.join(server_path, 'server.jar')
                if os.path.exists(server_jar):
                    os.remove(server_jar)
                os.rename(fabric_launcher, server_jar)
            
                # Usuń instalator
                if os.path.exists(fabric_jar):
                    os.remove(fabric_jar)
                
                return True
            else:
                return False
            
        except Exception as e:
            print(f"Fabric installation error: {e}")
            return False
    
    def _run_installer_and_cleanup(self, server_path, installer_jar, server_id, implementation_name):
        """Helper function to run a server installer and handle cleanup."""
        self._update_progress(server_id, f'installing_{implementation_name}', 80, f'Running {implementation_name.capitalize()} installer...')

        install_cmd = ['java', '-jar', installer_jar, '--installServer']
        process = subprocess.Popen(
            install_cmd,
            cwd=server_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        # It can take a while to download the vanilla jar and apply patches
        timeout = 300  # 5 minutes timeout
        start_time = time.time()

        while process.poll() is None:
            if time.time() - start_time > timeout:
                process.kill()
                self._update_progress(server_id, 'error', 0, f'{implementation_name.capitalize()} installer timed out.')
                return False

            # Optionally, you can log installer output here for debugging
            # line = process.stdout.readline()
            # if line:
            #     print(f"[{implementation_name} Installer]: {line.strip()}")

            time.sleep(1)

        # Verify installation by checking for the run script
        run_script = 'run.sh' if os.name != 'nt' else 'run.bat'
        run_script_path = os.path.join(server_path, run_script)

        if not os.path.exists(run_script_path):
            self._update_progress(server_id, 'error', 0, f'Installation failed: {run_script} not found.')
            return False

        # Cleanup the installer
        if os.path.exists(installer_jar):
            os.remove(installer_jar)

        return True

    def _install_forge_server(self, server_path, version, server_id):
        """Special installation for Forge"""
        try:
            self._update_progress(server_id, 'installing_forge', 50, 'Downloading Forge installer...')
            forge_url = self._get_forge_installer_url(version)
            if not forge_url:
                self._update_progress(server_id, 'error', 0, 'Could not find Forge installer URL.')
                return False

            forge_installer_jar = os.path.join(server_path, 'forge-installer.jar')
            if not self._download_file_with_progress(forge_url, forge_installer_jar, server_id):
                return False

            return self._run_installer_and_cleanup(server_path, forge_installer_jar, server_id, 'forge')

        except Exception as e:
            print(f"Forge installation error: {e}")
            self._update_progress(server_id, 'error', 0, f'An unexpected error occurred: {e}')
            return False

    def _install_neoforge_server(self, server_path, version, server_id):
        """Special installation for NeoForge"""
        try:
            self._update_progress(server_id, 'installing_neoforge', 50, 'Downloading NeoForge installer...')
            neoforge_url = self._get_neoforge_installer_url(version)
            if not neoforge_url:
                self._update_progress(server_id, 'error', 0, 'Could not find NeoForge installer URL.')
                return False

            neoforge_installer_jar = os.path.join(server_path, 'neoforge-installer.jar')
            if not self._download_file_with_progress(neoforge_url, neoforge_installer_jar, server_id):
                return False

            return self._run_installer_and_cleanup(server_path, neoforge_installer_jar, server_id, 'neoforge')

        except Exception as e:
            print(f"NeoForge installation error: {e}")
            self._update_progress(server_id, 'error', 0, f'An unexpected error occurred: {e}')
            return False

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
            print(f"Error getting Paper build: {e}")
        return None
    
    def _get_latest_purpur_build(self, version):
        """Get latest Purpur build for a version"""
        try:
            url = f"https://api.purpurmc.org/v2/purpur/{version}"
            response = requests.get(url)
            if response.status_code == 200:
                return {'build': 'latest', 'download': f"purpur-{version}.jar"}
        except Exception as e:
            print(f"Error getting Purpur build: {e}")
        return None
    
    def _download_with_curl(self, url, file_path, server_id, total_size):
        """Download using curl with progress tracking"""
        try:
            cmd = [
                'curl', '-L', '--progress-bar',
                '--retry', '3',  # Dodaj ponowne próby
                '--retry-delay', '2',  # Opóźnienie między próbami
                '--connect-timeout', '30',  # Timeout połączenia
                '--max-time', '300',  # Maksymalny czas pobierania
                '--user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',  # User-Agent
                '--insecure',  # Ignoruj błędy SSL (ważne dla niektórych serwerów)
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
                    # Debugowanie - wypisz output curl
                    print(f"CURL output: {output.strip()}")
                
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
                        except Exception as e:
                            print(f"Error parsing curl progress: {e}")
        
            return_code = process.poll()
            print(f"CURL process finished with return code: {return_code}")
        
            if return_code == 0:
                # Sprawdź czy plik został pobrany
                if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
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
                        'Plik został pobrany, ale jest pusty lub nie istnieje'
                    )
                    return False
            else:
                # Spróbuj pobrać za pomocą requests jako fallback
                print("CURL failed, trying requests fallback...")
                return self._download_with_requests_fallback(url, file_path, server_id, total_size)
            
        except Exception as e:
            print(f"CURL download error: {e}")
            # Fallback do requests
            return self._download_with_requests_fallback(url, file_path, server_id, total_size)
        finally:
            with self.lock:
                if server_id in self.download_processes:
                    del self.download_processes[server_id]
                    
    def _download_with_requests_fallback(self, url, file_path, server_id, total_size):
        """Fallback download using requests library"""
        try:
            self._update_progress(
                server_id,
                'downloading',
                10,
                'Używanie alternatywnej metody pobierania...',
                total_size,
                0
            )
        
            headers = {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        
            response = requests.get(url, headers=headers, stream=True, timeout=30)
            response.raise_for_status()
        
            # Pobierz rozmiar jeśli nie podano
            if total_size == 0:
                total_size = int(response.headers.get('content-length', 0))
        
            downloaded = 0
            chunk_size = 8192
        
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                    
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            self._update_progress(
                                server_id,
                                'downloading',
                                progress,
                                f'Pobieranie: {downloaded/(1024*1024):.1f}MB / {total_size/(1024*1024):.1f}MB',
                                total_size,
                                downloaded
                            )
        
            self._update_progress(
                server_id,
                'extracting',
                95,
                'Pobieranie zakończone, przygotowywanie serwera...',
                total_size,
                total_size
            )
            return True
        
        except Exception as e:
            print(f"Requests fallback error: {e}")
            self._update_progress(
                server_id,
                'error',
                0,
                f'Błąd pobierania: {str(e)}'
            )
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
        
            # Sprawdź dostępność narzędzi
            curl_available = subprocess.run(['which', 'curl'], capture_output=True).returncode == 0
            wget_available = subprocess.run(['which', 'wget'], capture_output=True).returncode == 0
        
            self._update_progress(
                server_id, 
                'preparing', 
                5, 
                'Sprawdzanie dostępnych narzędzi...',
                0,
                0
            )
        
            # Spróbuj najpierw pobrać rozmiar pliku
            total_size = 0
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
                }
                response = requests.head(url, headers=headers, allow_redirects=True, timeout=10)
                if response.status_code == 200:
                    total_size = int(response.headers.get('content-length', 0))
                    print(f"Total size detected: {total_size} bytes")
            except Exception as e:
                print(f"Could not determine file size: {e}")
        
            self._update_progress(
                server_id, 
                'downloading', 
                5, 
                'Rozpoczynanie pobierania...',
                total_size,
                0
            )
        
            # Priorytet: curl -> wget -> requests fallback
            success = False
            if curl_available:
                print("Using CURL for download")
                success = self._download_with_curl(url, file_path, server_id, total_size)
            elif wget_available:
                print("Using WGET for download")
                success = self._download_with_wget(url, file_path, server_id, total_size)
            else:
                print("Using requests fallback")
                success = self._download_with_requests_fallback(url, file_path, server_id, total_size)
        
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
    
    def _start_server_async(self, server_id, bedrock_url=None, app_context=None):
        """Start server in a separate thread with application context"""
        try:
            # Użyj przekazanego kontekstu aplikacji
            if app_context is None:
                try:
                    from flask import current_app
                    app_context = current_app.app_context
                except:
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
                    
                        # Wypakuj plik ZIP
                        if success and temp_zip_path.endswith('.zip'):
                            self._extract_zip_file(temp_zip_path, server_id, 0)
                    
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
                jar_path = None
            
                # Sprawdź czy istnieje już plik JAR
                for file in os.listdir(server_path):
                    if file.endswith('.jar') and 'server' in file.lower():
                        jar_file = file
                        jar_path = os.path.join(server_path, file)
                        break
        
                if not jar_file:
                    try:
                        self._update_progress(server_id, 'fetching_manifest', 15, 'Pobieranie informacji o wersji...')
                    
                        # Pobierz URL serwera na podstawie implementacji
                        jar_url = self._get_java_server_url(server.implementation, server.version)
                    
                        if not jar_url:
                            self._update_progress(server_id, 'error', 0, f'Nie można znaleźć URL dla {server.implementation} {server.version}')
                            return
                    
                        # Specjalna obsługa Fabric / Forge / NeoForge
                        if server.implementation == 'fabric':
                            success = self._install_fabric_server(server_path, server.version, server_id)
                            if not success:
                                self._update_progress(server_id, 'error', 0, 'Błąd instalacji Fabric')
                                return
                            jar_filename = "server.jar"
                        elif server.implementation == 'forge':
                            success = self._install_forge_server(server_path, server.version, server_id)
                            if not success:
                                self._update_progress(server_id, 'error', 0, 'Błąd instalacji Forge')
                                return
                            # Forge uses a startup script, we will handle this later
                            jar_filename = None
                        elif server.implementation == 'neoforge':
                            success = self._install_neoforge_server(server_path, server.version, server_id)
                            if not success:
                                self._update_progress(server_id, 'error', 0, 'Błąd instalacji NeoForge')
                                return
                            # NeoForge also uses a startup script
                            jar_filename = None
                        else:
                            # Określ nazwę pliku JAR dla innych implementacji
                            if server.implementation == 'paper':
                                jar_filename = f"paper-{server.version}.jar"
                            elif server.implementation == 'purpur':
                                jar_filename = f"purpur-{server.version}.jar"
                            else:  # vanilla
                                jar_filename = f"server_{server.version}.jar"
                        
                            jar_path = os.path.join(server_path, jar_filename)
                            success = self._download_file_with_progress(jar_url, jar_path, server_id)
                            if not success:
                                return
                    
                        jar_file = jar_filename
                
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
                run_script_path = os.path.join(server_path, 'run.sh')
                if os.path.exists(run_script_path) and server.implementation in ['forge', 'neoforge']:
                    os.chmod(run_script_path, 0o755)
                    cmd = [run_script_path, 'nogui']
                else:
                    cmd = ['java',
                           '-Xmx6G', '-Xms3G',
                           '-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled', '-XX:MaxGCPauseMillis=200',
                           '-XX:+UnlockExperimentalVMOptions', '-XX:+DisableExplicitGC',
                           '-XX:G1NewSizePercent=30', '-XX:G1MaxNewSizePercent=40',
                           '-XX:G1HeapRegionSize=8M', '-XX:G1ReservePercent=20',
                           '-jar', jar_file, 'nogui']
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
            thread = threading.Thread(target=self._capture_output, args=(server_id, process))
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
            error_message = f'Błąd uruchamiania serwera: {str(e)}'
            self._update_progress(server_id, 'error', 0, error_message)
        
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
                
        with self.lock:
            if server_id in self.download_threads:
                del self.download_threads[server_id]

    def start_server(self, server, bedrock_url=None):
        """Start the server - returns immediately, actual work happens in thread"""
        with self.lock:
            if server.id in self.download_threads and self.download_threads[server.id].is_alive():
                return False, "Server is already starting"
        
            if server.id in self.processes and self.processes[server.id].poll() is None:
                return False, "Server is already running"

            from flask import current_app
            app_context = current_app.app_context

            thread = threading.Thread(
                target=self._start_server_async, 
                args=(server.id, bedrock_url, app_context)
            )
            thread.daemon = True
            thread.start()

            self.download_threads[server.id] = thread
    
        return True, "Server starting process initiated"
    
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

    # Pozostałe metody bez zmian (stop_server, send_command, etc.)
    def stop_server(self, server_id):
        try:
            if server_id not in self.processes:
                if server_id in self.download_progress:
                    del self.download_progress[server_id]
                return False, "Server not running"
            
            process = self.processes[server_id]
            
            try:
                if process.stdin:
                    process.stdin.write('stop\n')
                    process.stdin.flush()
                
                for _ in range(30):
                    if process.poll() is not None:
                        break
                    time.sleep(1)
                
                if process.poll() is None:
                    process.terminate()
                    time.sleep(5)
                    if process.poll() is None:
                        process.kill()
                
                if server_id in self.processes:
                    del self.processes[server_id]
                if server_id in self.output_listeners:
                    self.output_listeners[server_id] = False
                if server_id in self.download_progress:
                    del self.download_progress[server_id]
                
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
    
    def _capture_output(self, server_id, process):
        """Capture server output in real-time"""
        output_buffer = []
    
        # Pobierz ścieżkę serwera RAZ na początku (bez kontekstu aplikacji)
        server_path = None
        try:
            server = self._get_server_from_db(server_id)
            if server:
                server_path = self.get_server_path(server.name)
        except Exception as e:
            print(f"Error getting server path at start: {e}")
    
        while server_id in self.output_listeners and self.output_listeners[server_id]:
            try:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                    
                if "Applying patches" in line:
                    print(f"Server {server_id}: Paper server is applying patches - this is normal")
                elif "Downloading mojang" in line:
                    print(f"Server {server_id}: Paper is downloading Minecraft vanilla jar - this is normal")
                elif "Done" in line and "For help, type" in line:
                    print(f"Server {server_id}: Paper server started successfully!")
            
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                formatted_line = f"[{timestamp}] {line.strip()}\n"
                output_buffer.append(formatted_line)
            
                if len(output_buffer) > 1000:
                    output_buffer.pop(0)
            
                with self.lock:
                    self.server_outputs[server_id] = output_buffer
            
                print(f"Server {server_id}: {line.strip()}")
            
                # Zapisz do pliku logu (tylko jeśli mamy ścieżkę)
                if server_path:
                    try:
                        logs_dir = os.path.join(server_path, 'logs')
                        os.makedirs(logs_dir, exist_ok=True)
                    
                        server_log_path = os.path.join(logs_dir, 'latest.log')
                        with open(server_log_path, 'a', encoding='utf-8') as log_file:
                            log_file.write(formatted_line)
                    except Exception as e:
                        print(f"Error writing to log file: {e}")
            
            except Exception as e:
                print(f"Error reading output from server {server_id}: {e}")
                break
    
        # Update database when server stops
        self._update_server_in_db(server_id, {
            'status': 'stopped',
            'pid': None
        })
    
        print(f"Server {server_id} output capture stopped")
    
        # Cleanup
        if server_id in self.processes:
            del self.processes[server_id]
        if server_id in self.output_listeners:
            del self.output_listeners[server_id]
        if server_id in self.server_outputs:
            del self.server_outputs[server_id]
    
    def _get_server_from_db(self, server_id):
        """Pobierz serwer z bazy danych z kontekstem aplikacji"""
        try:
            # Import wewnątrz metody aby uniknąć cyklicznych importów
            from flask import current_app
            if current_app:
                with current_app.app_context():
                    from .models import Server
                    return Server.query.get(server_id)
            else:
                # Fallback jeśli nie ma current_app (np. podczas testów)
                from . import create_app
                from .models import Server
                app = create_app()
                with app.app_context():
                    return Server.query.get(server_id)
        except Exception as e:
            print(f"Error getting server from DB: {e}")
            return None
    
    def _update_server_in_db(self, server_id, updates):
        """Update server in database with application context"""
        try:
            from flask import current_app
            if current_app:
                with current_app.app_context():
                    from .models import db, Server
                    server_obj = Server.query.get(server_id)
                    if server_obj:
                        for key, value in updates.items():
                            setattr(server_obj, key, value)
                        db.session.commit()
                        print(f"Server {server_id} updated in database: {updates}")
            else:
                # Fallback if no current_app
                from . import create_app
                from .models import db, Server
                app = create_app()
                with app.app_context():
                    server_obj = Server.query.get(server_id)
                    if server_obj:
                        for key, value in updates.items():
                            setattr(server_obj, key, value)
                        db.session.commit()
                        print(f"Server {server_id} updated in database: {updates}")
        except Exception as e:
            print(f"Error updating server in database: {e}")
    
    def get_server_path_from_id(self, server_id):
        try:
            from flask import current_app
            from .models import Server
            with current_app.app_context():
                server = Server.query.get(server_id)
                if server:
                    return self.get_server_path(server.name)
        except Exception as e:
            print(f"Error getting server path from ID: {e}")
        return None

    # Pozostałe metody (get_server_properties, update_server_properties, etc.)
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
    
    def get_server_properties(self, server_name):
        server_path = self.get_server_path(server_name)
        if not server_path:
            return None
            
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
        
        except Exception as e:
            print(f"Error reading server properties: {e}")
            return None
        
        return properties
    
    def _create_default_properties(self, server_path, server_name):
        properties_file = os.path.join(server_path, 'server.properties')
        try:
            with open(properties_file, 'w', encoding='utf-8') as f:
                f.write("#Minecraft server properties\n")
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
                f.write("level-type=minecraft\\:normal\n")
                f.write("spawn-monsters=true\n")
                f.write("enforce-whitelist=false\n")
                f.write("spawn-protection=16\n")
                f.write("max-world-size=29999984\n")
        except Exception as e:
            print(f"Error creating default server properties: {e}")
    
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
        """Pobierz output serwera w czasie rzeczywistym"""
        with self.lock:
            if server_id in self.server_outputs:
                output_buffer = self.server_outputs[server_id]
                # Zwróć ostatnie 'lines' linii
                recent_output = output_buffer[-lines:] if len(output_buffer) > lines else output_buffer
                return '\n'.join(recent_output) if recent_output else ""
            return "Brak danych wyjściowych"
