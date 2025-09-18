import os
import shutil
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