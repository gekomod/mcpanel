import os
from .server_manager import ServerManager
from .file_manager import FileManager

server_manager = None
file_manager = None

def init_managers(app):
    global server_manager, file_manager
    server_manager = ServerManager(app.config['SERVER_BASE_PATH'])
    file_manager = FileManager(app.config['SERVER_BASE_PATH'])
    
    # Create servers directory if it doesn't exist
    os.makedirs(app.config['SERVER_BASE_PATH'], exist_ok=True)
