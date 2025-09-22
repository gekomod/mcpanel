import os
import json
import requests
import zipfile
import shutil
from pathlib import Path

class BedrockAddonManager:
    def __init__(self, server_base_path):
        self.server_base_path = server_base_path
    
    def download_and_extract_pack(self, url, pack_type, addon_name, server_name):
        """Pobiera i rozpakowuje pack do odpowiedniego katalogu"""
        try:
            # Ścieżki docelowe
            server_path = os.path.join(self.server_base_path, server_name)
            
            # Określ docelowy katalog na podstawie typu addona
            if pack_type == 'behavior' or pack_type == 'script':
                extract_path = os.path.join(server_path, 'behavior_packs', addon_name)
            elif pack_type == 'textures':
                extract_path = os.path.join(server_path, 'resource_packs', addon_name)
            else:
                extract_path = os.path.join(server_path, pack_type + '_packs', addon_name)
            
            # Utwórz katalog jeśli nie istnieje
            os.makedirs(extract_path, exist_ok=True)
            
            # Pobierz plik
            response = requests.get(url, stream=True)
            if response.status_code != 200:
                return False, f"Failed to download {pack_type} pack"
            
            # Zapisz plik tymczasowy
            temp_zip = os.path.join(extract_path, 'temp_pack.zip')
            with open(temp_zip, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Rozpakuj
            success = self._extract_and_fix_nested(temp_zip, extract_path)
            if not success:
                return False, "Failed to extract pack"
            
            # Usuń tymczasowy zip
            try:
                os.remove(temp_zip)
            except:
                pass
            
            return True, extract_path
            
        except Exception as e:
            return False, f"Error processing {pack_type} pack: {str(e)}"
            
    def _extract_and_fix_nested(self, zip_path, target_path):
        """Extract zip and fix nested directory structure with deep checking"""
        try:
            # Create temporary extraction directory
            temp_extract = f"{target_path}_temp"
            os.makedirs(temp_extract, exist_ok=True)
        
            # Extract zip
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_extract)
        
            # Funkcja do sprawdzania czy katalog zawiera pliki Minecraft
            def is_minecraft_directory(path):
                minecraft_files = ['manifest.json', 'pack_icon.png', 'behavior_pack', 'resource_pack']
                for item in os.listdir(path):
                    if any(mc_file in item.lower() for mc_file in minecraft_files):
                        return True
                    item_path = os.path.join(path, item)
                    if os.path.isdir(item_path) and is_minecraft_directory(item_path):
                        return True
                return False
        
            # Funkcja do znajdowania najbardziej zagnieżdżonego katalogu z plikami Minecraft
            def find_minecraft_root(path, current_depth=0, max_depth=3):
                if current_depth >= max_depth:
                    return path
                
                items = os.listdir(path)
                if len(items) == 1:
                    single_item = os.path.join(path, items[0])
                    if os.path.isdir(single_item) and is_minecraft_directory(single_item):
                        return find_minecraft_root(single_item, current_depth + 1, max_depth)
            
                return path
        
            # Znajdź właściwy katalog z plikami Minecraft
            minecraft_root = find_minecraft_root(temp_extract)
        
            # Jeśli znaleźliśmy głębiej zagnieżdżony katalog, przenieś jego zawartość
            if minecraft_root != temp_extract:
                print(f"Found Minecraft files at: {minecraft_root}")
                self._move_contents(minecraft_root, target_path)
            else:
                # Przenieś wszystko z tymczasowego katalogu
                self._move_contents(temp_extract, target_path)
        
            # Clean up
            shutil.rmtree(temp_extract)
            return True
        
        except Exception as e:
            print(f"Extraction error: {e}")
            return False


    def _move_contents(self, source_dir, target_dir):
        """Move all contents from source to target directory"""
        os.makedirs(target_dir, exist_ok=True)
    
        for item in os.listdir(source_dir):
            source_item = os.path.join(source_dir, item)
            target_item = os.path.join(target_dir, item)
        
            # Usuń istniejący element jeśli istnieje
            if os.path.exists(target_item):
                if os.path.isdir(target_item):
                    shutil.rmtree(target_item)
                else:
                    os.remove(target_item)
        
            # Przenieś nowy element
            shutil.move(source_item, target_dir)
            
    def _move_contents(self, source_dir, target_dir):
        """Move all contents from source to target directory"""
        os.makedirs(target_dir, exist_ok=True)
        
        for item in os.listdir(source_dir):
            source_item = os.path.join(source_dir, item)
            target_item = os.path.join(target_dir, item)
            
            if os.path.exists(target_item):
                if os.path.isdir(target_item):
                    shutil.rmtree(target_item)
                else:
                    os.remove(target_item)
            
            shutil.move(source_item, target_dir)
    
    def read_manifest_info(self, pack_path):
        """Odczytuje UUID i wersję z manifest.json"""
        try:
            manifest_path = os.path.join(pack_path, 'manifest.json')
            if not os.path.exists(manifest_path):
                return None, None
            
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            header = manifest.get('header', {})
            uuid = header.get('uuid', '')
            version = header.get('version', [0, 0, 0])
            
            # Konwertuj wersję do stringa jeśli to lista
            if isinstance(version, list):
                version = '.'.join(map(str, version))
            
            return uuid, str(version)
            
        except Exception as e:
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
            
            return True, f"Updated {pack_type} packs for world {target_world}"
            
        except Exception as e:
            return False, f"Error updating world packs: {str(e)}"
    
    def install_addon(self, addon, server_name, world_name=None):
        """Instaluje addon na serwerze"""
        try:
            if addon.type == 'worlds':
                return self.install_world(addon, server_name)
            
            server_path = os.path.join(self.server_base_path, server_name)
            
            # Sprawdź czy serwer istnieje
            if not os.path.exists(server_path):
                return False, "Server directory not found"
            
            results = {}
            pack_info = {}
            
            # Określ URL i typ packa na podstawie typu addona
            if addon.type == 'textures':
                # Texture pack -> resource_packs
                if addon.resource_pack_url or addon.download_url:
                    url = addon.resource_pack_url or addon.download_url
                    success, message = self.download_and_extract_pack(
                        url, 'textures', addon.name, server_name
                    )
                    if success:
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
            
            elif addon.type == 'script':
                # Script pack -> behavior_packs
                if addon.behavior_pack_url or addon.download_url:
                    url = addon.behavior_pack_url or addon.download_url
                    success, message = self.download_and_extract_pack(
                        url, 'script', addon.name, server_name
                    )
                    if success:
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
            
            else:
                # Standard addon - może mieć oba paki
                # Przetwórz behavior pack
                if addon.behavior_pack_url:
                    success, message = self.download_and_extract_pack(
                        addon.behavior_pack_url, 'behavior', addon.name, server_name
                    )
                    if success:
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
                    success, message = self.download_and_extract_pack(
                        addon.resource_pack_url, 'resource', addon.name, server_name
                    )
                    if success:
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
            
        except Exception as e:
            return False, f"Installation failed: {str(e)}"
    
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
            if not behavior_uuid and addon.behavior_pack_url:
                behavior_path = os.path.join(server_path, 'behavior_packs', addon.name)
                if os.path.exists(behavior_path):
                    behavior_uuid, _ = self.read_manifest_info(behavior_path)
        
            if not resource_uuid and addon.resource_pack_url:
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
