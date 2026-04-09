import os
import shutil
from werkzeug.utils import secure_filename
from pathlib import Path
import json

class FileManager:
    def __init__(self, server_base_path):
        self.server_base_path = server_base_path
    
    def list_files(self, server_name, path=''):
        server_path = self.get_server_path(server_name)
        target_path = os.path.join(server_path, path)
        
        # Security check to prevent directory traversal
        if not os.path.abspath(target_path).startswith(os.path.abspath(server_path)):
            return None, "Access denied"
        
        if not os.path.exists(target_path):
            return None, "Path does not exist"
        
        files = []
        try:
            for item in os.listdir(target_path):
                item_path = os.path.join(target_path, item)
                files.append({
                    'name': item,
                    'is_dir': os.path.isdir(item_path),
                    'size': os.path.getsize(item_path) if not os.path.isdir(item_path) else 0,
                    'modified': os.path.getmtime(item_path)
                })
            
            return files, None
        except Exception as e:
            return None, f"Error reading directory: {str(e)}"
    
    def read_file(self, server_name, file_path):
        server_path = self.get_server_path(server_name)
        target_path = os.path.join(server_path, file_path)
        
        # Security check
        if not os.path.abspath(target_path).startswith(os.path.abspath(server_path)):
            return None, "Access denied"
        
        if not os.path.exists(target_path):
            return None, "File does not exist"
        
        if os.path.isdir(target_path):
            return None, "Path is a directory"
        
        try:
            with open(target_path, 'r') as f:
                content = f.read()
            return content, None
        except Exception as e:
            return None, f"Error reading file: {str(e)}"
    
    def write_file(self, server_name, file_path, content):
        server_path = self.get_server_path(server_name)
        target_path = os.path.join(server_path, file_path)
        
        # Security check
        if not os.path.abspath(target_path).startswith(os.path.abspath(server_path)):
            return False, "Access denied"
        
        # Don't allow writing outside the server directory
        if not target_path.startswith(server_path):
            return False, "Access denied"
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            
            with open(target_path, 'w') as f:
                f.write(content)
            return True, None
        except Exception as e:
            return False, f"Error writing file: {str(e)}"
    
    def create_directory(self, server_name, path):
        server_path = self.get_server_path(server_name)
        target_path = os.path.join(server_path, path)
        
        # Security check
        if not os.path.abspath(target_path).startswith(os.path.abspath(server_path)):
            return False, "Access denied"
        
        try:
            os.makedirs(target_path, exist_ok=True)
            return True, None
        except Exception as e:
            return False, f"Error creating directory: {str(e)}"
    
    def delete_path(self, server_name, path):
        server_path = self.get_server_path(server_name)
        target_path = os.path.join(server_path, path)
        
        # Security check
        if not os.path.abspath(target_path).startswith(os.path.abspath(server_path)):
            return False, "Access denied"
        
        if not os.path.exists(target_path):
            return False, "Path does not exist"
        
        try:
            if os.path.isdir(target_path):
                shutil.rmtree(target_path)
            else:
                os.remove(target_path)
            return True, None
        except Exception as e:
            return False, f"Error deleting path: {str(e)}"
    
    def get_server_path(self, server_name):
        return os.path.join(self.server_base_path, server_name)
        
    def upload_file(self, server_name, path, file):
        """Upload pliku do serwera"""
        try:
            server_path = self.get_server_path(server_name)
    
            print(f"=== FILE MANAGER UPLOAD ===")
            print(f"Server name: {server_name}")
            print(f"Server path: {server_path}")
            print(f"Upload path: {path}")
            print(f"File: {file.filename}")
            print(f"File size: {file.content_length}")
            print(f"File content type: {file.content_type}")
    
            # Sprawdź czy ścieżka serwera istnieje
            if not os.path.exists(server_path):
                print(f"ERROR: Server path does not exist: {server_path}")
                return False, f"Server directory does not exist: {server_path}"
    
            # Określ ścieżkę docelową
            if path and path.strip():
                target_path = os.path.join(server_path, path)
            else:
                target_path = server_path
    
            print(f"Target path: {target_path}")
    
            # Zabezpiecz nazwę pliku
            filename = secure_filename(file.filename)
            full_path = os.path.join(target_path, filename)
    
            print(f"Full path: {full_path}")
    
            # Sprawdź czy katalog docelowy istnieje, jeśli nie - utwórz
            os.makedirs(target_path, exist_ok=True)
            print(f"Directory ensured: {target_path}")
    
            # Zapisz plik
            print("Saving file...")
            file.save(full_path)
            print("File saved successfully")
    
            # Zweryfikuj zapisany plik
            if os.path.exists(full_path):
                file_size = os.path.getsize(full_path)
                print(f"File verified - Size: {file_size} bytes")
                return True, None
            else:
                print("ERROR: File was not saved properly")
                return False, "File was not saved properly"
    
        except Exception as e:
            print(f"FILE MANAGER ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, f"Upload failed: {str(e)}"
    
    def create_directory(self, server_name, dir_path):
        """Tworzy nowy katalog"""
        try:
            server_path = self.get_server_path(server_name)
            full_path = os.path.join(server_path, dir_path)
            
            # Sprawdź czy katalog już istnieje
            if os.path.exists(full_path):
                return False, "Directory already exists"
            
            # Utwórz katalog
            os.makedirs(full_path, exist_ok=True)
            
            return True, None
            
        except Exception as e:
            return False, f"Failed to create directory: {str(e)}"
    
    def delete_item(self, server_name, item_path, is_directory=False):
        """Usuwa plik lub katalog"""
        try:
            server_path = self.get_server_path(server_name)
            full_path = os.path.join(server_path, item_path)
            
            # Sprawdź czy ścieżka istnieje
            if not os.path.exists(full_path):
                return False, "Item not found"
            
            if is_directory:
                # Usuń katalog rekurencyjnie
                shutil.rmtree(full_path)
            else:
                # Usuń plik
                os.remove(full_path)
            
            return True, None
            
        except Exception as e:
            return False, f"Delete failed: {str(e)}"
    
    def rename_item(self, server_name, old_path, new_path):
        """Zmienia nazwę pliku lub katalogu"""
        try:
            server_path = self.get_server_path(server_name)
            old_full_path = os.path.join(server_path, old_path)
            new_full_path = os.path.join(server_path, new_path)
            
            # Sprawdź czy stara ścieżka istnieje
            if not os.path.exists(old_full_path):
                return False, "Source item not found"
            
            # Sprawdź czy nowa ścieżka już istnieje
            if os.path.exists(new_full_path):
                return False, "Destination already exists"
            
            # Zmień nazwę
            os.rename(old_full_path, new_full_path)
            
            return True, None
            
        except Exception as e:
            return False, f"Rename failed: {str(e)}"
    
    def copy_item(self, server_name, source_path, destination_path):
        """Kopiuje plik lub katalog"""
        try:
            server_path = self.get_server_path(server_name)
            source_full_path = os.path.join(server_path, source_path)
            destination_full_path = os.path.join(server_path, destination_path)
            
            # Sprawdź czy źródło istnieje
            if not os.path.exists(source_full_path):
                return False, "Source item not found"
            
            # Sprawdź czy cel już istnieje
            if os.path.exists(destination_full_path):
                return False, "Destination already exists"
            
            if os.path.isdir(source_full_path):
                # Kopiuj katalog rekurencyjnie
                shutil.copytree(source_full_path, destination_full_path)
            else:
                # Kopiuj plik
                shutil.copy2(source_full_path, destination_full_path)
            
            return True, None
            
        except Exception as e:
            return False, f"Copy failed: {str(e)}"
    
    def move_item(self, server_name, source_path, destination_path):
        """Przenosi plik lub katalog"""
        try:
            server_path = self.get_server_path(server_name)
            source_full_path = os.path.join(server_path, source_path)
            destination_full_path = os.path.join(server_path, destination_path)
            
            # Sprawdź czy źródło istnieje
            if not os.path.exists(source_full_path):
                return False, "Source item not found"
            
            # Sprawdź czy cel już istnieje
            if os.path.exists(destination_full_path):
                return False, "Destination already exists"
            
            # Przenieś
            shutil.move(source_full_path, destination_full_path)
            
            return True, None
            
        except Exception as e:
            return False, f"Move failed: {str(e)}"
    
    def get_file_info(self, server_name, file_path):
        """Pobiera informacje o pliku lub katalogu"""
        try:
            server_path = self.get_server_path(server_name)
            full_path = os.path.join(server_path, file_path)
            
            if not os.path.exists(full_path):
                return None, "Item not found"
            
            stats = os.stat(full_path)
            is_dir = os.path.isdir(full_path)
            
            info = {
                'name': os.path.basename(file_path),
                'path': file_path,
                'is_directory': is_dir,
                'size': stats.st_size if not is_dir else 0,
                'modified': stats.st_mtime,
                'created': stats.st_ctime,
                'permissions': oct(stats.st_mode)[-3:]
            }
            
            return info, None
            
        except Exception as e:
            return None, f"Failed to get file info: {str(e)}"
    
    def get_full_path(self, server_name, file_path):
        """Pobiera pełną ścieżkę do pliku"""
        try:
            server_path = self.get_server_path(server_name)
            full_path = os.path.join(server_path, file_path)
            
            # Zabezpieczenie przed directory traversal
            full_path = os.path.realpath(full_path)
            server_real_path = os.path.realpath(server_path)
            
            if not full_path.startswith(server_real_path):
                return None, "Access denied"
            
            return full_path, None
            
        except Exception as e:
            return None, f"Failed to get full path: {str(e)}"
