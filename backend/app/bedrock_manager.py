import os
import json
import requests
import zipfile
import shutil
from pathlib import Path

class BedrockAddonManager:
    def __init__(self, server_base_path):
        self.server_base_path = server_base_path
    
    def install_addon(self, addon, server_name, world_name=None):
        """Instaluje addon na serwerze z obsługą różnych typów pakietów"""
        try:
            if addon.type == 'worlds':
                return self.install_world(addon, server_name)
            
            server_path = os.path.join(self.server_base_path, server_name)
            
            # Sprawdź czy serwer istnieje
            if not os.path.exists(server_path):
                return False, "Server directory not found"
            
            # Pobierz typ pakietu z addona
            pack_type = getattr(addon, 'type_specific', 'separate')
            print(f"Installing addon {addon.name} with pack type: {pack_type}")
            
            if pack_type == 'combined':
                # Obsługa połączonego pliku .mcaddon
                return self._install_combined_addon(addon, server_name, world_name)
            elif pack_type == 'single':
                # Obsługa pojedynczego pakietu .mcpack
                return self._install_single_pack(addon, server_name, world_name)
            else:
                # Domyślnie: oddzielne pakiety (separate)
                return self._install_separate_packs(addon, server_name, world_name)
            
        except Exception as e:
            return False, f"Installation failed: {str(e)}"
    
    def _install_separate_packs(self, addon, server_name, world_name):
        """Instaluje oddzielne pakiety behavior i resource"""
        results = {}
        pack_info = {}
        server_path = os.path.join(self.server_base_path, server_name)
        
        print(f"Installing separate packs for {addon.name}")
        
        # Przetwórz behavior pack
        if addon.behavior_pack_url:
            print(f"Downloading behavior pack from: {addon.behavior_pack_url}")
            success, message = self._download_and_process_pack(
                addon.behavior_pack_url, 'behavior', addon.name, server_name
            )
            if success:
                print(f"Behavior pack processed: {message}")
                uuid, version = self.read_manifest_info(message)
                if uuid and version:
                    pack_info['behavior_pack_uuid'] = uuid
                    pack_info['behavior_pack_version'] = version
                    # Aktualizuj plik świata
                    self.update_world_packs(server_name, world_name, 'behavior', uuid, version)
                    results['behavior_pack'] = 'Installed successfully'
                else:
                    results['behavior_pack'] = 'Installed but failed to read manifest'
            else:
                results['behavior_pack'] = f'Failed: {message}'
        
        # Przetwórz resource pack
        if addon.resource_pack_url:
            print(f"Downloading resource pack from: {addon.resource_pack_url}")
            success, message = self._download_and_process_pack(
                addon.resource_pack_url, 'resource', addon.name, server_name
            )
            if success:
                print(f"Resource pack processed: {message}")
                uuid, version = self.read_manifest_info(message)
                if uuid and version:
                    pack_info['resource_pack_uuid'] = uuid
                    pack_info['resource_pack_version'] = version
                    # Aktualizuj plik świata
                    self.update_world_packs(server_name, world_name, 'resource', uuid, version)
                    results['resource_pack'] = 'Installed successfully'
                else:
                    results['resource_pack'] = 'Installed but failed to read manifest'
            else:
                results['resource_pack'] = f'Failed: {message}'
        
        return True, {
            'results': results,
            'pack_info': pack_info
        }
    
    def _install_combined_addon(self, addon, server_name, world_name):
        """Instaluje połączony addon .mcaddon który zawiera bezpośrednio katalogi z pakietami"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
        
            if not addon.download_url:
                return False, "No download URL provided for combined addon"
        
            print(f"Downloading combined addon from: {addon.download_url}")
        
            # Utwórz główny katalog tymczasowy w katalogu serwera
            temp_dir = os.path.join(server_path, f"temp_{addon.name}")
            os.makedirs(temp_dir, exist_ok=True)
        
            # Pobierz plik .mcaddon
            response = requests.get(addon.download_url, stream=True)
            if response.status_code != 200:
                return False, "Failed to download combined addon"
        
            temp_mcaddon = os.path.join(temp_dir, f"{addon.name}.mcaddon")
            with open(temp_mcaddon, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        
            print(f"Extracting .mcaddon file: {temp_mcaddon}")
        
            # Rozpakuj .mcaddon (to jest zip)
            with zipfile.ZipFile(temp_mcaddon, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
        
            print(f"Contents of extracted .mcaddon:")
            for root, dirs, files in os.walk(temp_dir):
                level = root.replace(temp_dir, '').count(os.sep)
                indent = ' ' * 2 * level
                print(f"{indent}{os.path.basename(root)}/")
                subindent = ' ' * 2 * (level + 1)
                for file in files:
                    print(f"{subindent}{file}")
        
            results = {}
            pack_info = {}
        
            # Przeszukaj rozpakowane katalogi w poszukiwaniu pakietów
            for root, dirs, files in os.walk(temp_dir):
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                
                    # Sprawdź czy katalog zawiera manifest.json (czy to jest pakiet)
                    manifest_path = os.path.join(dir_path, 'manifest.json')
                    if os.path.exists(manifest_path):
                        print(f"Found pack directory with manifest: {dir_name}")
                    
                        # Określ typ pakietu na podstawie manifestu
                        pack_type = self._detect_pack_type_by_manifest(manifest_path)
                        if not pack_type:
                            # Jeśli nie udało się określić z manifestu, spróbuj po nazwie
                            pack_type = self._detect_pack_type_by_name(dir_name)
                    
                        print(f"Detected pack type: {pack_type} for directory: {dir_name}")
                    
                        # Przenieś pakiet do właściwego katalogu
                        success, final_path = self._move_pack_directory(dir_path, pack_type, dir_name, server_name)
                    
                        if success:
                            uuid, version = self.read_manifest_info(final_path)
                            if uuid and version:
                                if pack_type == 'behavior':
                                    pack_info['behavior_pack_uuid'] = uuid
                                    pack_info['behavior_pack_version'] = version
                                    self.update_world_packs(server_name, world_name, 'behavior', uuid, version)
                                    results['behavior_pack'] = 'Installed successfully'
                                    print(f"Behavior pack installed: {dir_name}")
                                else:
                                    pack_info['resource_pack_uuid'] = uuid
                                    pack_info['resource_pack_version'] = version
                                    self.update_world_packs(server_name, world_name, 'resource', uuid, version)
                                    results['resource_pack'] = 'Installed successfully'
                                    print(f"Resource pack installed: {dir_name}")
        
            # Jeśli nie znaleziono pakietów w podkatalogach, sprawdź główny katalog
            if not results:
                print("No packs found in subdirectories, checking root directory...")
                for item in os.listdir(temp_dir):
                    item_path = os.path.join(temp_dir, item)
                    if os.path.isdir(item_path):
                        manifest_path = os.path.join(item_path, 'manifest.json')
                        if os.path.exists(manifest_path):
                            print(f"Found pack in root directory: {item}")
                        
                            pack_type = self._detect_pack_type_by_manifest(manifest_path)
                            if not pack_type:
                                pack_type = self._detect_pack_type_by_name(item)
                        
                            print(f"Detected pack type: {pack_type} for directory: {item}")
                        
                            success, final_path = self._move_pack_directory(item_path, pack_type, item, server_name)
                        
                            if success:
                                uuid, version = self.read_manifest_info(final_path)
                                if uuid and version:
                                    if pack_type == 'behavior':
                                        pack_info['behavior_pack_uuid'] = uuid
                                        pack_info['behavior_pack_version'] = version
                                        self.update_world_packs(server_name, world_name, 'behavior', uuid, version)
                                        results['behavior_pack'] = 'Installed successfully'
                                    else:
                                        pack_info['resource_pack_uuid'] = uuid
                                        pack_info['resource_pack_version'] = version
                                        self.update_world_packs(server_name, world_name, 'resource', uuid, version)
                                        results['resource_pack'] = 'Installed successfully'
        
            # Sprzątanie
            shutil.rmtree(temp_dir)
        
            if not results:
                return False, "No valid packs found in the .mcaddon file"
        
            return True, {
                'results': results,
                'pack_info': pack_info
            }
        
        except Exception as e:
            # Sprzątanie w przypadku błędu
            if 'temp_dir' in locals() and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return False, f"Failed to install combined addon: {str(e)}"
            
    def _move_pack_directory(self, source_dir, pack_type, dir_name, server_name):
        """Przenosi katalog pakietu do właściwego katalogu"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
        
            # Określ docelowy katalog
            if pack_type == 'behavior':
                target_base_dir = os.path.join(server_path, 'behavior_packs')
            else:
                target_base_dir = os.path.join(server_path, 'resource_packs')
        
            os.makedirs(target_base_dir, exist_ok=True)
        
            target_dir = os.path.join(target_base_dir, dir_name)
        
            # Usuń istniejący katalog jeśli istnieje
            if os.path.exists(target_dir):
                print(f"Removing existing directory: {target_dir}")
                shutil.rmtree(target_dir)
        
            print(f"Moving pack directory from {source_dir} to {target_dir}")
            shutil.move(source_dir, target_dir)
        
            print(f"Pack successfully moved to: {target_dir}")
            return True, target_dir
        
        except Exception as e:
            return False, f"Error moving pack directory: {str(e)}"
    
    def _install_single_pack(self, addon, server_name, world_name):
        """Instaluje pojedynczy pakiet .mcpack"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            
            if not addon.download_url:
                return False, "No download URL provided for single pack"
            
            print(f"Downloading single pack from: {addon.download_url}")
            
            # Określ typ pakietu na podstawie URL
            pack_type = self._detect_pack_type_by_name(addon.download_url)
            print(f"Detected pack type: {pack_type}")
            
            results = {}
            pack_info = {}
            
            # Pobierz i przetwórz pakiet
            success, final_path = self._download_and_process_pack(
                addon.download_url, pack_type, addon.name, server_name
            )
            
            if success:
                uuid, version = self.read_manifest_info(final_path)
                if uuid and version:
                    if pack_type == 'behavior':
                        pack_info['behavior_pack_uuid'] = uuid
                        pack_info['behavior_pack_version'] = version
                        self.update_world_packs(server_name, world_name, 'behavior', uuid, version)
                        results['behavior_pack'] = 'Installed successfully'
                    else:
                        pack_info['resource_pack_uuid'] = uuid
                        pack_info['resource_pack_version'] = version
                        self.update_world_packs(server_name, world_name, 'resource', uuid, version)
                        results['resource_pack'] = 'Installed successfully'
            else:
                return False, f"Failed to process pack: {final_path}"
            
            return True, {
                'results': results,
                'pack_info': pack_info
            }
            
        except Exception as e:
            return False, f"Failed to install single pack: {str(e)}"
    
    def _download_and_process_pack(self, url, pack_type, addon_name, server_name):
        """Pobiera i przetwarza pakiet - główna metoda"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            
            # Utwórz katalog tymczasowy w katalogu serwera
            temp_dir = os.path.join(server_path, f"temp_{addon_name}")
            os.makedirs(temp_dir, exist_ok=True)
            
            print(f"Downloading pack from: {url}")
            
            # Pobierz plik
            response = requests.get(url, stream=True)
            if response.status_code != 200:
                return False, f"Failed to download {pack_type} pack"
            
            # Zapisz plik tymczasowy
            temp_file = os.path.join(temp_dir, "downloaded_pack.mcpack")
            with open(temp_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"File downloaded to: {temp_file}")
            
            # Przetwórz .mcpack
            success, final_path = self._process_mcpack_file(temp_file, pack_type, addon_name, server_name)
            
            # Sprzątanie
            shutil.rmtree(temp_dir)
            
            return success, final_path
            
        except Exception as e:
            # Sprzątanie w przypadku błędu
            if 'temp_dir' in locals() and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return False, f"Error processing {pack_type} pack: {str(e)}"
    
    def _process_mcpack_file(self, mcpack_path, pack_type, addon_name, server_name):
        """Przetwarza plik .mcpack - rozpakowuje i przenosi do właściwego katalogu"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            
            print(f"Processing .mcpack file: {mcpack_path}")
            
            # Utwórz tymczasowy katalog do rozpakowania
            extract_temp_dir = f"{mcpack_path}_extract"
            os.makedirs(extract_temp_dir, exist_ok=True)
            
            # Rozpakuj .mcpack (to jest zip)
            with zipfile.ZipFile(mcpack_path, 'r') as zip_ref:
                zip_ref.extractall(extract_temp_dir)
            
            print(f"Extracted to: {extract_temp_dir}")
            
            # Szukaj katalogów z BP lub RP w nazwie
            pack_folders = self._find_pack_folders(extract_temp_dir)
            print(f"Found pack folders: {pack_folders}")
            
            # Określ docelowy katalog
            if pack_type == 'behavior':
                target_base_dir = os.path.join(server_path, 'behavior_packs')
            else:
                target_base_dir = os.path.join(server_path, 'resource_packs')
            
            os.makedirs(target_base_dir, exist_ok=True)
            
            final_path = None
            
            # Przenieś znalezione katalogi
            for folder_name, folder_path in pack_folders.items():
                target_dir = os.path.join(target_base_dir, folder_name)
                
                # Usuń istniejący katalog jeśli istnieje
                if os.path.exists(target_dir):
                    shutil.rmtree(target_dir)
                
                print(f"Moving {folder_path} to {target_dir}")
                shutil.move(folder_path, target_dir)
                final_path = target_dir
            
            # Jeśli nie znaleziono katalogów z BP/RP, przenieś cały rozpakowany katalog
            if not pack_folders:
                target_dir = os.path.join(target_base_dir, addon_name)
                
                # Usuń istniejący katalog jeśli istnieje
                if os.path.exists(target_dir):
                    shutil.rmtree(target_dir)
                
                print(f"No specific pack folders found, moving entire content to {target_dir}")
                shutil.move(extract_temp_dir, target_dir)
                final_path = target_dir
            else:
                # Usuń tymczasowy katalog rozpakowania
                shutil.rmtree(extract_temp_dir)
            
            print(f"Pack successfully installed to: {final_path}")
            return True, final_path
            
        except Exception as e:
            # Sprzątanie w przypadku błędu
            if 'extract_temp_dir' in locals() and os.path.exists(extract_temp_dir):
                shutil.rmtree(extract_temp_dir)
            return False, f"Error processing .mcpack file: {str(e)}"
    
    def _find_pack_folders(self, directory):
        """Znajduje katalogi z BP lub RP w nazwie"""
        pack_folders = {}
        
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            
            if os.path.isdir(item_path):
                item_lower = item.lower()
                
                # Sprawdź czy katalog zawiera BP lub RP w nazwie
                if 'bp' in item_lower or 'behavior' in item_lower:
                    pack_folders[item] = item_path
                    print(f"Found behavior pack folder: {item}")
                elif 'rp' in item_lower or 'resource' in item_lower or 'texture' in item_lower:
                    pack_folders[item] = item_path
                    print(f"Found resource pack folder: {item}")
                else:
                    # Sprawdź czy katalog zawiera manifest.json (może to być pakiet)
                    manifest_path = os.path.join(item_path, 'manifest.json')
                    if os.path.exists(manifest_path):
                        print(f"Found folder with manifest: {item}")
                        # Spróbuj określić typ z manifestu
                        pack_type = self._detect_pack_type_by_manifest(manifest_path)
                        if pack_type:
                            pack_folders[item] = item_path
                            print(f"Folder {item} detected as {pack_type} pack by manifest")
        
        return pack_folders
    
    def _detect_pack_type_by_name(self, filename):
        """Wykrywa typ pakietu na podstawie nazwy pliku"""
        filename_lower = filename.lower()
        
        if 'behavior' in filename_lower or 'bp' in filename_lower:
            return 'behavior'
        elif 'resource' in filename_lower or 'rp' in filename_lower or 'texture' in filename_lower:
            return 'resource'
        else:
            # Domyślnie behavior pack
            return 'behavior'
    
    def _detect_pack_type_by_manifest(self, manifest_path):
        """Wykrywa typ pakietu na podstawie manifest.json z obsługą komentarzy"""
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read()
        
            # Usuń komentarze z pliku JSON
            cleaned_content = self._remove_json_comments(content)
        
            manifest = json.loads(cleaned_content)
        
            modules = manifest.get('modules', [])
            for module in modules:
                module_type = module.get('type', '').lower()
                print(f"Module type in manifest: {module_type}")
            
                if any(t in module_type for t in ['data', 'script', 'game', 'javascript', 'client_data']):
                    return 'behavior'
                elif any(t in module_type for t in ['resources', 'client_resources', 'ui', 'textures']):
                    return 'resource'
        
            # Sprawdź też wersję manifestu
            manifest_version = manifest.get('format_version', 0)
            print(f"Manifest format version: {manifest_version}")
        
            # Domyślnie behavior pack
            return 'behavior'
        except Exception as e:
            print(f"Error reading manifest for type detection: {e}")
            return None


    def _remove_json_comments(self, json_string):
        """Usuwa komentarze z ciągu JSON - użyj zaawansowanej wersji"""
        return self._remove_json_comments_advanced(json_string)

    def _remove_json_comments_advanced(self, json_string):
        """Zaawansowane usuwanie komentarzy z JSON"""
        # Usuń komentarze wielolinijkowe
        while '/*' in json_string and '*/' in json_string:
            start = json_string.find('/*')
            end = json_string.find('*/', start) + 2
            json_string = json_string[:start] + json_string[end:]
    
        # Usuń komentarze jednolinijkowe
        lines = json_string.split('\n')
        cleaned_lines = []
        in_multiline_comment = False
    
        for line in lines:
            # Sprawdź czy jesteśmy w komentarzu wielolinijkowym
            if in_multiline_comment:
                if '*/' in line:
                    in_multiline_comment = False
                    line = line.split('*/', 1)[1]
                else:
                    continue
        
            # Sprawdź początek komentarza wielolinijkowego
            if '/*' in line:
                in_multiline_comment = True
                before_comment = line.split('/*')[0]
                if '*/' in line:
                    # Komentarz zaczyna się i kończy w tej samej linii
                    after_comment = line.split('*/', 1)[1]
                    line = before_comment + after_comment
                    in_multiline_comment = False
                else:
                    line = before_comment
            else:
                # Usuń komentarze jednolinijkowe
                if '//' in line:
                    line = line.split('//')[0]
        
            # Dodaj linię tylko jeśli nie jest pusta
            if line.strip():
                cleaned_lines.append(line)
    
        return '\n'.join(cleaned_lines)

    def read_manifest_info(self, pack_path):
        """Odczytuje UUID i wersję z manifest.json z obsługą komentarzy"""
        try:
            manifest_path = os.path.join(pack_path, 'manifest.json')
            if not os.path.exists(manifest_path):
                return None, None
        
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read()
        
            # Usuń komentarze z pliku JSON
            cleaned_content = self._remove_json_comments(content)
        
            manifest = json.loads(cleaned_content)
        
            header = manifest.get('header', {})
            uuid = header.get('uuid', '')
            version = header.get('version', [0, 0, 0])
        
            # Konwertuj wersję do stringa jeśli to lista
            if isinstance(version, list):
                version = '.'.join(map(str, version))
        
            print(f"Read manifest - UUID: {uuid}, Version: {version}")
            return uuid, str(version)
        
        except Exception as e:
            print(f"Error reading manifest: {e}")
            return None, None
    
    def update_world_packs(self, server_name, world_name, pack_type, pack_uuid, pack_version):
        """Aktualizuje pliki world_*_packs.json świata"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            worlds_path = os.path.join(server_path, 'worlds')
            
            if not os.path.exists(worlds_path):
                return False, "Worlds directory not found"
            
            # Znajdź świat (zakładamy że serwer ma jeden aktywny świat)
            world_dirs = [d for d in os.listdir(worlds_path) if os.path.isdir(os.path.join(worlds_path, d))]
            if not world_dirs:
                return False, "No worlds found"
            
            # Użyj podanego świata lub pierwszego znalezionego
            target_world = world_name if world_name else world_dirs[0]
            world_path = os.path.join(worlds_path, target_world)
            
            # Plik konfiguracyjny
            if pack_type == 'behavior':
                config_file = os.path.join(world_path, 'world_behavior_packs.json')
            else:
                config_file = os.path.join(world_path, 'world_resource_packs.json')
            
            # Odczytaj istniejącą konfigurację lub stwórz nową
            packs = []
            if os.path.exists(config_file):
                with open(config_file, 'r', encoding='utf-8') as f:
                    packs = json.load(f)
            
            # Sprawdź czy pack już istnieje
            pack_exists = False
            for pack in packs:
                if pack.get('pack_id') == pack_uuid:
                    pack['version'] = [int(v) for v in pack_version.split('.')]
                    pack_exists = True
                    break
            
            # Dodaj nowy pack jeśli nie istnieje
            if not pack_exists:
                packs.append({
                    "pack_id": pack_uuid,
                    "version": [int(v) for v in pack_version.split('.')]
                })
            
            # Zapisz konfigurację
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(packs, f, indent=2)
            
            print(f"Updated {pack_type} packs for world {target_world}")
            return True, f"Updated {pack_type} packs for world {target_world}"
            
        except Exception as e:
            print(f"Error updating world packs: {str(e)}")
            return False, f"Error updating world packs: {str(e)}"

    def uninstall_addon(self, addon, server_name):
        """Odinstalowuje addon z serwera - usuwa katalogi i wpisy z plików świata"""
        try:
            if addon.type == 'worlds':
                return self.uninstall_world(addon, server_name)
        
            server_path = os.path.join(self.server_base_path, server_name)
        
            # Ścieżki do katalogów packs
            behavior_path = os.path.join(server_path, 'behavior_packs', addon.name)
            resource_path = os.path.join(server_path, 'resource_packs', addon.name)
        
            # Odczytaj UUID packów z manifestów przed usunięciem katalogów
            behavior_uuid = None
            resource_uuid = None
        
            if os.path.exists(behavior_path):
                behavior_uuid, _ = self.read_manifest_info(behavior_path)
        
            if os.path.exists(resource_path):
                resource_uuid, _ = self.read_manifest_info(resource_path)
        
            # Usuń katalogi packs
            if os.path.exists(behavior_path):
                shutil.rmtree(behavior_path)
        
            if os.path.exists(resource_path):
                shutil.rmtree(resource_path)
        
            # Usuń wpisy z plików world_*_packs.json
            if behavior_uuid:
                self.remove_from_world_packs(server_name, 'behavior', behavior_uuid)
        
            if resource_uuid:
                self.remove_from_world_packs(server_name, 'resource', resource_uuid)
        
            return True, "Addon uninstalled successfully"
        
        except Exception as e:
            return False, f"Uninstall failed: {str(e)}"
            
    def remove_from_world_packs(self, server_name, pack_type, pack_uuid):
        """Usuwa wpis packa z plików konfiguracyjnych świata"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            worlds_path = os.path.join(server_path, 'worlds')
        
            if not os.path.exists(worlds_path):
                return False, "Worlds directory not found"
        
            # Znajdź wszystkie światy
            world_dirs = [d for d in os.listdir(worlds_path) 
                         if os.path.isdir(os.path.join(worlds_path, d))]
        
            if not world_dirs:
                return False, "No worlds found"
        
            # Przejdź przez wszystkie światy i usuń wpisy
            for world_name in world_dirs:
                world_path = os.path.join(worlds_path, world_name)
            
                # Plik konfiguracyjny
                if pack_type == 'behavior':
                    config_file = os.path.join(world_path, 'world_behavior_packs.json')
                else:
                    config_file = os.path.join(world_path, 'world_resource_packs.json')
            
                # Odczytaj istniejącą konfigurację jeśli plik istnieje
                packs = []
                if os.path.exists(config_file):
                    with open(config_file, 'r', encoding='utf-8') as f:
                        packs = json.load(f)
                
                    # Usuń pack o podanym UUID
                    original_count = len(packs)
                    packs = [pack for pack in packs if pack.get('pack_id') != pack_uuid]
                
                    # Zapisz tylko jeśli były zmiany
                    if len(packs) != original_count:
                        with open(config_file, 'w', encoding='utf-8') as f:
                            json.dump(packs, f, indent=2)
                    
                        print(f"Removed {pack_type} pack {pack_uuid} from world {world_name}")
        
            return True, f"Removed {pack_type} pack from world files"
        
        except Exception as e:
            print(f"Error removing {pack_type} pack from world files: {str(e)}")
            return False, f"Error removing {pack_type} pack: {str(e)}"
            
    def get_pack_uuids_from_db(self, addon):
        """Pobiera UUID packów z bazy danych addona"""
        behavior_uuid = None
        resource_uuid = None
    
        # Jeśli addon ma zapisane UUID w bazie, użyj ich
        if hasattr(addon, 'behavior_pack_uuid') and addon.behavior_pack_uuid:
            behavior_uuid = addon.behavior_pack_uuid
    
        if hasattr(addon, 'resource_pack_uuid') and addon.resource_pack_uuid:
            resource_uuid = addon.resource_pack_uuid
    
        return behavior_uuid, resource_uuid
        
    def toggle_addon(self, server_name, addon, enable=True):
        """Włącza lub wyłącza addon poprzez modyfikację plików world_*_packs.json"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
        
            # Pobierz UUID packów z bazy lub manifestów
            behavior_uuid = addon.behavior_pack_uuid
            resource_uuid = addon.resource_pack_uuid
        
            # Jeśli UUID nie ma w bazie, spróbuj odczytać z manifestów
            if not behavior_uuid:
                behavior_path = os.path.join(server_path, 'behavior_packs', addon.name)
                if os.path.exists(behavior_path):
                    behavior_uuid, _ = self.read_manifest_info(behavior_path)
        
            if not resource_uuid:
                resource_path = os.path.join(server_path, 'resource_packs', addon.name)
                if os.path.exists(resource_path):
                    resource_uuid, _ = self.read_manifest_info(resource_path)
        
            results = {}
        
            # Przetwórz behavior pack
            if behavior_uuid:
                if enable:
                    success, message = self.add_to_world_packs(server_name, 'behavior', behavior_uuid, addon.behavior_pack_version)
                else:
                    success, message = self.remove_from_world_packs(server_name, 'behavior', behavior_uuid)
                results['behavior_pack'] = {'success': success, 'message': message}
        
            # Przetwórz resource pack
            if resource_uuid:
                if enable:
                    success, message = self.add_to_world_packs(server_name, 'resource', resource_uuid, addon.resource_pack_version)
                else:
                    success, message = self.remove_from_world_packs(server_name, 'resource', resource_uuid)
                results['resource_pack'] = {'success': success, 'message': message}
        
            return True, results
        
        except Exception as e:
            return False, f"Toggle addon failed: {str(e)}"

    def add_to_world_packs(self, server_name, pack_type, pack_uuid, pack_version):
        """Dodaje wpis packa do plików konfiguracyjnych świata"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            worlds_path = os.path.join(server_path, 'worlds')
        
            if not os.path.exists(worlds_path):
                return False, "Worlds directory not found"
        
            # Znajdź wszystkie światy
            world_dirs = [d for d in os.listdir(worlds_path) 
                         if os.path.isdir(os.path.join(worlds_path, d))]
        
            if not world_dirs:
                return False, "No worlds found"
        
            added_to_worlds = []
        
            # Przejdź przez wszystkie światy i dodaj/aktualizuj wpisy
            for world_name in world_dirs:
                world_path = os.path.join(worlds_path, world_name)
            
                # Plik konfiguracyjny
                if pack_type == 'behavior':
                    config_file = os.path.join(world_path, 'world_behavior_packs.json')
                else:
                    config_file = os.path.join(world_path, 'world_resource_packs.json')
            
                # Odczytaj istniejącą konfigurację lub stwórz nową
                packs = []
                if os.path.exists(config_file):
                    with open(config_file, 'r', encoding='utf-8') as f:
                        packs = json.load(f)
            
                # Przygotuj wersję (konwertuj string na listę jeśli potrzeba)
                if isinstance(pack_version, str):
                    version_list = [int(v) for v in pack_version.split('.')]
                else:
                    version_list = pack_version
            
                # Sprawdź czy pack już istnieje
                pack_exists = False
                for pack in packs:
                    if pack.get('pack_id') == pack_uuid:
                        pack['version'] = version_list
                        pack_exists = True
                        break
            
                # Dodaj nowy pack jeśli nie istnieje
                if not pack_exists:
                    packs.append({
                        "pack_id": pack_uuid,
                        "version": version_list
                    })
            
                # Zapisz konfigurację
                with open(config_file, 'w', encoding='utf-8') as f:
                    json.dump(packs, f, indent=2)
                
                added_to_worlds.append(world_name)
        
            if added_to_worlds:
                return True, f"Added {pack_type} pack to worlds: {', '.join(added_to_worlds)}"
            else:
                return True, f"No worlds processed for {pack_type} pack"
        
        except Exception as e:
            error_msg = f"Error adding {pack_type} pack to world files: {str(e)}"
            print(error_msg)
            return False, error_msg
            
    def install_world(self, addon, server_name):
        """Instaluje świat na serwerze Bedrock"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
        
            # Sprawdź czy serwer istnieje
            if not os.path.exists(server_path):
                return False, {"error": "Server directory not found"}
        
            # Ścieżka do katalogu worlds
            worlds_path = os.path.join(server_path, 'worlds')
            os.makedirs(worlds_path, exist_ok=True)
        
            # Ścieżka docelowa świata
            world_path = os.path.join(worlds_path, addon.name)
        
            # Pobierz i rozpakuj świat
            if addon.download_url:
                success, message = self.download_and_extract_world(
                    addon.download_url, addon.name, server_name
                )
                if not success:
                    return False, {"error": message}
            else:
                return False, {"error": "No download URL provided for world"}
        
            return True, {
                "message": f"World '{addon.name}' installed successfully",
                "results": {"world": "Installed successfully"}
            }
        
        except Exception as e:
            return False, {"error": f"World installation failed: {str(e)}"}

    def download_and_extract_world(self, url, world_name, server_name):
        """Pobiera i rozpakowuje świat"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            worlds_path = os.path.join(server_path, 'worlds')
            world_path = os.path.join(worlds_path, world_name)
        
            # Utwórz katalog jeśli nie istnieje
            os.makedirs(world_path, exist_ok=True)
        
            # Pobierz plik
            response = requests.get(url, stream=True)
            if response.status_code != 200:
                return False, f"Failed to download world"
        
            # Zapisz plik tymczasowy
            temp_zip = os.path.join(world_path, 'temp_world.mcworld')
            with open(temp_zip, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        
            # Rozpakuj (mcworld to zip)
            with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                zip_ref.extractall(world_path)
        
            # Usuń tymczasowy zip
            os.remove(temp_zip)
        
            return True, world_path
        
        except Exception as e:
            return False, f"Error processing world: {str(e)}"

    def uninstall_world(self, addon, server_name):
        """Odinstalowuje świat z serwera"""
        try:
            server_path = os.path.join(self.server_base_path, server_name)
            world_path = os.path.join(server_path, 'worlds', addon.name)
        
            if os.path.exists(world_path):
                shutil.rmtree(world_path)
                return True, {
                    "message": f"World '{addon.name}' uninstalled successfully",
                    "results": {"world": "Uninstalled successfully"}
                }
            else:
                return False, {"error": "World not found"}
            
        except Exception as e:
            return False, {"error": f"World uninstall failed: {str(e)}"}
