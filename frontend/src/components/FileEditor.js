import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiFolder, 
  FiFile, 
  FiSave, 
  FiEdit, 
  FiTrash2, 
  FiPlus,
  FiArrowLeft,
  FiDownload,
  FiUpload,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiChevronRight,
  FiActivity,
  FiTerminal,
  FiSettings,
  FiUser,
  FiBox
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Container = styled.div`
  padding: 15px 20px;
  color: #a4aabc;
`;

const NavTabs = styled.div`
  display: flex;
  background: #2e3245;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 15px;
  gap: 4px;
`;

const NavTab = styled.div`
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: #a4aabc;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${props => props.$active && `
    background: #3b82f6;
    color: white;
  `}
  
  &:hover {
    background: #35394e;
  }
`;
const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  color: #fff;
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  color: #a4aabc;
  font-size: 0.9rem;
  flex-wrap: wrap;
`;

const BreadcrumbItem = styled.span`
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  
  ${props => props.$clickable && `
    &:hover {
      color: #3b82f6;
    }
  `}
  
  &:after {
    content: '/';
    margin: 0 8px;
    color: #6b7280;
  }
  
  &:last-child:after {
    content: '';
    margin: 0;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  height: calc(100vh - 200px);
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const Sidebar = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #3a3f57;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
`;

const FileActions = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${props => props.variant === 'secondary' ? '#35394e' : '#3b82f6'};
  color: ${props => props.variant === 'secondary' ? '#cbd5e1' : 'white'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.variant === 'secondary' ? '#565d81' : '#2563eb'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #4a5070;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const SearchBox = styled.div`
  margin-bottom: 16px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #a4aabc;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a4aabc;
`;

const FileList = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #35394e;
  }
  
  ${props => props.selected && `
    background: #3b82f6;
    font-weight: 500;
  `}
`;

const FileIcon = styled.span`
  margin-right: 10px;
  color: ${props => props.$isDir ? '#f59e0b' : '#a4aabc'};
  display: flex;
  align-items: center;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 0.95rem;
  word-break: break-all;
  color: #fff;
`;

const FileMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: #a4aabc;
  font-size: 0.8rem;
  margin-top: 2px;
`;

const FileSize = styled.span`
  white-space: nowrap;
`;

const EditorContainer = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #3a3f57;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: #35394e;
`;

const EditorTitle = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  word-break: break-all;
  color: #fff;
`;

const EditorActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const EditorContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 20px;
  background: #35394e;
  border: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #fff;
  
  &:focus {
    outline: none;
    background: #2e3245;
  }
  
  &:disabled {
    color: #a4aabc;
    background: #2e3245;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(46, 50, 69, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #a4aabc;
  flex-direction: column;
  gap: 12px;
`;

const NoFileSelected = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #a4aabc;
  font-size: 1.1rem;
  text-align: center;
  padding: 40px;
  flex-direction: column;
  gap: 16px;
`;

const ErrorMessage = styled.div`
  background: #991b1b;
  color: #ef4444;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 4px solid #ef4444;
`;

const NotificationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SuccessIcon = styled(FiCheckCircle)`
  color: #10b981;
  font-size: 1.2rem;
`;

const ErrorIcon = styled(FiXCircle)`
  color: #ef4444;
  font-size: 1.2rem;
`;

const InfoIcon = styled(FiInfo)`
  color: #3b82f6;
  font-size: 1.2rem;
`;

const FileTypeIndicator = styled.span`
  font-size: 0.8rem;
  color: #a4aabc;
  margin-left: 8px;
  font-weight: normal;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #a4aabc;
`;

function FileEditor() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('files');

  useEffect(() => {
    fetchServer();
    loadFiles('');
  }, [serverId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      // Sortuj: katalogi na górze, potem pliki
      const sorted = filtered.sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      });
      setFilteredFiles(sorted);
    } else {
      // Sortuj również oryginalną listę plików
      const sorted = [...files].sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      });
      setFilteredFiles(sorted);
    }
  }, [files, searchQuery]);

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      console.error('Error fetching server:', error);
      setError('Failed to load server information');
      showError('Failed to load server information');
    }
  };
  
  const showSuccess = (message) => {
    toast.success(
      <NotificationContainer>
        <SuccessIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const showError = (message) => {
    toast.error(
      <NotificationContainer>
        <ErrorIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const showInfo = (message) => {
    toast.info(
      <NotificationContainer>
        <InfoIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const loadFiles = async (path) => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery('');
      const response = await api.get(`/servers/${serverId}/files?path=${encodeURIComponent(path)}`);
      
      if (response.data && Array.isArray(response.data)) {
        // Sortuj pliki: katalogi na górze, potem pliki alfabetycznie
        const sortedFiles = response.data.sort((a, b) => {
          if (a.is_dir && !b.is_dir) return -1;
          if (!a.is_dir && b.is_dir) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setFiles(sortedFiles);
        setFilteredFiles(sortedFiles);
        setCurrentPath(path);
        
        if (path && response.data.length > 0) {
          showInfo(`Loaded ${response.data.length} items from ${path}`);
        }
      } else {
        setError('Invalid response format from server');
        showError('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      const errorMsg = 'Failed to load files. Make sure you have permission to access this server.';
      setError(errorMsg);
      showError(errorMsg);
      // Ustaw puste listy w przypadku błędu
      setFiles([]);
      setFilteredFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (file) => {
    if (file.is_dir) {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      loadFiles(newPath);
      setSelectedFile(null);
      showInfo(`Navigating to ${file.name}`);
      return;
    }

    try {
      setFileLoading(true);
      setError(null);
      
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const response = await api.get(`/servers/${serverId}/files/read?path=${encodeURIComponent(filePath)}`);
      
      if (response.data && response.data.content !== undefined) {
        setFileContent(response.data.content);
        setSelectedFile(file);
        showSuccess(`Loaded file: ${file.name}`);
      } else {
        const errorMsg = 'Failed to load file content: Invalid response format';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      console.error('Error loading file:', error);
      const errorMsg = `Failed to load file: ${error.response?.data?.error || error.message}`;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setFileLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    try {
      setSaving(true);
      setError(null);
      
      const filePath = currentPath ? `${currentPath}/${selectedFile.name}` : selectedFile.name;
      await api.post(`/servers/${serverId}/files/write`, {
        path: filePath,
        content: fileContent
      });
      
      showSuccess('File saved successfully!');
    } catch (error) {
      console.error('Error saving file:', error);
      const errorMsg = `Failed to save file: ${error.response?.data?.error || error.message}`;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const navigateUp = () => {
    if (currentPath === '') {
      showInfo('Already at root directory');
      return;
    }
    
    const pathParts = currentPath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/');
    loadFiles(parentPath);
    setSelectedFile(null);
    showInfo('Navigated to parent directory');
  };

  const getBreadcrumbItems = () => {
    const items = [{ name: 'Root', path: '', clickable: true }];
    
    if (currentPath) {
      const parts = currentPath.split('/').filter(part => part);
      let accumulatedPath = '';
      
      parts.forEach((part, index) => {
        accumulatedPath += `/${part}`;
        items.push({ 
          name: part, 
          path: accumulatedPath, 
          clickable: index < parts.length - 1 
        });
      });
    }
    
    return items;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  if (error && !files.length) {
    return (
      <Container>
        <NavTabs>
          <NavTab 
            $active={activeTab === 'overview'} 
            onClick={() => navigate(`/servers/${serverId}`)}
          >
            <FiActivity /> Overview
          </NavTab>
          <NavTab 
            $active={activeTab === 'console'} 
            onClick={() => navigate(`/servers/${serverId}/console`)}
          >
            <FiTerminal /> Console
          </NavTab>
          <NavTab 
            $active={activeTab === 'files'} 
            onClick={() => navigate(`/servers/${serverId}/files`)}
          >
            <FiFolder /> Files
          </NavTab>
          <NavTab 
            $active={activeTab === 'config'} 
            onClick={() => navigate(`/servers/${serverId}/settings`)}
          >
            <FiSettings /> Config
          </NavTab>
          <NavTab 
            $active={activeTab === 'plugins'} 
            onClick={() => navigate(`/servers/${serverId}/plugins`)}
          >
            <FiBox /> Plugins
          </NavTab>
          <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> Users
          </NavTab>
          
        </NavTabs>
        
        <Header>
          <Title>File Manager - {server?.name || 'Loading...'}</Title>
        </Header>
        <ErrorMessage>
          <FiXCircle /> {error}
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={activeTab === 'overview'} 
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          <FiActivity /> Overview
        </NavTab>
        <NavTab 
          $active={activeTab === 'console'} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> Console
        </NavTab>
        <NavTab 
          $active={activeTab === 'files'} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> Files
        </NavTab>
        <NavTab 
          $active={activeTab === 'config'} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <FiSettings /> Config
        </NavTab>
        <NavTab 
          $active={activeTab === 'plugins'} 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> Plugins
        </NavTab>
        <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> Users
        </NavTab>
        
          <NavTab 
          $active={activeTab === 'backups'} 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> Backups
          </NavTab>
      </NavTabs>

      <Header>
        <Title>File Manager - {server?.name || 'Loading...'}</Title>
        <Breadcrumb>
          {getBreadcrumbItems().map((item, index) => (
            <BreadcrumbItem 
              key={index} 
              $clickable={item.clickable}
              onClick={item.clickable ? () => loadFiles(item.path) : undefined}
            >
              {item.name}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </Header>

      {error && (
        <ErrorMessage>
          <FiXCircle /> {error}
        </ErrorMessage>
      )}

      <Content>
        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>Files</SidebarTitle>
            <ActionButton 
              variant="secondary" 
              onClick={navigateUp} 
              disabled={currentPath === ''}
              title="Go up one directory"
            >
              <FiArrowLeft />
            </ActionButton>
          </SidebarHeader>

          <SearchBox>
            <SearchIcon>
              <FiInfo size={16} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>

          <FileActions>
            <ActionButton disabled title="Upload file">
              <FiUpload /> Upload
            </ActionButton>
            <ActionButton disabled title="Create new file">
              <FiPlus /> New
            </ActionButton>
          </FileActions>

          <FileList>
            {loading ? (
              <LoadingOverlay>
                <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> 
                Loading files...
              </LoadingOverlay>
            ) : (
              <>
                {filteredFiles.map(file => (
                  <FileItem 
                    key={file.name} 
                    onClick={() => loadFileContent(file)}
                    selected={selectedFile && selectedFile.name === file.name}
                    title={file.is_dir ? "Directory" : `File: ${file.name}`}
                  >
                    <FileIcon $isDir={file.is_dir}>
                      {file.is_dir ? <FiFolder size={18} /> : <FiFile size={16} />}
                    </FileIcon>
                    <FileInfo>
                      <FileName>
                        {file.name}
                        {!file.is_dir && <FileTypeIndicator>{getFileExtension(file.name)}</FileTypeIndicator>}
                      </FileName>
                      <FileMeta>
                        <span>{formatDate(file.modified)}</span>
                        {!file.is_dir && file.size !== undefined && (
                          <FileSize>{formatFileSize(file.size)}</FileSize>
                        )}
                      </FileMeta>
                    </FileInfo>
                  </FileItem>
                ))}
                
                {filteredFiles.length === 0 && (
                  <EmptyState>
                    {searchQuery ? 'No files match your search' : 'No files found in this directory'}
                  </EmptyState>
                )}
              </>
            )}
          </FileList>
        </Sidebar>

        <EditorContainer>
          {selectedFile ? (
            <>
              <EditorHeader>
                <EditorTitle>
                  {fileLoading ? <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> : <FiFile />}
                  {selectedFile.name}
                  {saving && (
                    <span style={{ color: '#a4aabc', fontSize: '0.9rem' }}>
                      <FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '5px' }} />
                      Saving...
                    </span>
                  )}
                </EditorTitle>
                <EditorActions>
                  <ActionButton 
                    onClick={saveFile} 
                    disabled={saving || fileLoading}
                    title="Save changes"
                  >
                    <FiSave /> {saving ? 'Saving...' : 'Save'}
                  </ActionButton>
                  <ActionButton disabled title="Download file">
                    <FiDownload /> Download
                  </ActionButton>
                </EditorActions>
              </EditorHeader>
              
              <EditorContent>
                {fileLoading && (
                  <LoadingOverlay>
                    <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> 
                    Loading file content...
                  </LoadingOverlay>
                )}
                <TextArea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  placeholder="File content..."
                  spellCheck={false}
                  disabled={fileLoading || saving}
                />
              </EditorContent>
            </>
          ) : (
            <NoFileSelected>
              <FiFile size={48} />
              <div>
                {loading ? 'Loading...' : 'Select a file to edit or navigate through directories'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#a4aabc' }}>
                Use the sidebar to browse files and folders
              </div>
            </NoFileSelected>
          )}
        </EditorContainer>
      </Content>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Container>
  );
}

export default FileEditor;
