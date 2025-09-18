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
  FiInfo
} from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  color: #6b7280;
  font-size: 0.9rem;
`;

// Changed 'clickable' to '$clickable' to make it a transient prop
const BreadcrumbItem = styled.span`
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  ${props => props.$clickable && `
    &:hover {
      color: #3b82f6;
    }
  `}
  
  &:after {
    content: '/';
    margin: 0 8px;
    color: #d1d5db;
  }
  
  &:last-child:after {
    content: '';
    margin: 0;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  height: calc(100vh - 180px);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
`;

const FileActions = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  margin-top: 15px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 5px;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f3f4f6;
  }
  
  ${props => props.selected && `
    background: #e0e7ff;
    font-weight: 500;
  `}
`;

const FileIcon = styled.span`
  margin-right: 10px;
  color: #6b7280;
`;

const FileName = styled.span`
  flex: 1;
  word-break: break-all;
`;

const FileSize = styled.span`
  color: #6b7280;
  font-size: 0.85rem;
  margin-left: 8px;
  white-space: nowrap;
`;

const EditorContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const EditorTitle = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
`;

const EditorActions = styled.div`
  display: flex;
  gap: 10px;
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
  border: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  
  &:focus {
    outline: none;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #6b7280;
`;

const NoFileSelected = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #6b7280;
  font-size: 1.1rem;
  text-align: center;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
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

function FileEditor() {
  const { serverId } = useParams();
  const [server, setServer] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServer();
    loadFiles('');
  }, [serverId]);

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
      const response = await api.get(`/servers/${serverId}/files?path=${encodeURIComponent(path)}`);
      
      if (response.data && Array.isArray(response.data)) {
        setFiles(response.data);
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

  if (error && !files.length) {
    return (
      <Container>
        <Header>
          <Title>File Manager - {server?.name || 'Loading...'}</Title>
        </Header>
        <ErrorMessage>
          {error}
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>File Manager - {server?.name || 'Loading...'}</Title>
        <Breadcrumb>
          {getBreadcrumbItems().map((item, index) => (
            <BreadcrumbItem 
              key={index} 
              $clickable={item.clickable} // Changed to $clickable
              onClick={item.clickable ? () => loadFiles(item.path) : undefined}
            >
              {item.name}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </Header>

      {error && (
        <ErrorMessage>
          <FiXCircle style={{ marginRight: '10px' }} />
          {error}
        </ErrorMessage>
      )}

      <Content>
        <Sidebar>
          <FileActions>
            <ActionButton onClick={navigateUp} disabled={currentPath === ''}>
              <FiArrowLeft /> Up
            </ActionButton>
            <ActionButton disabled>
              <FiUpload /> Upload
            </ActionButton>
            <ActionButton disabled>
              <FiPlus /> New
            </ActionButton>
          </FileActions>

          <FileList>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> Loading files...
              </div>
            ) : (
              <>
                {files.map(file => (
                  <FileItem 
                    key={file.name} 
                    onClick={() => loadFileContent(file)}
                    selected={selectedFile && selectedFile.name === file.name}
                  >
                    <FileIcon>
                      {file.is_dir ? <FiFolder /> : <FiFile />}
                    </FileIcon>
                    <FileName>{file.name}</FileName>
                    {!file.is_dir && file.size !== undefined && (
                      <FileSize>{formatFileSize(file.size)}</FileSize>
                    )}
                  </FileItem>
                ))}
                
                {files.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    No files found in this directory
                  </div>
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
                  <FiFile /> {selectedFile.name}
                  {saving && (
                    <span style={{ marginLeft: '10px', color: '#6b7280', fontSize: '0.9rem' }}>
                      <FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '5px' }} />
                      Saving...
                    </span>
                  )}
                </EditorTitle>
                <EditorActions>
                  <ActionButton onClick={saveFile} disabled={saving}>
                    <FiSave /> {saving ? 'Saving...' : 'Save'}
                  </ActionButton>
                  <ActionButton disabled>
                    <FiDownload /> Download
                  </ActionButton>
                </EditorActions>
              </EditorHeader>
              
              <EditorContent>
                {fileLoading && (
                  <LoadingOverlay>
                    <FiLoader style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} /> 
                    Loading file...
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
              {loading ? 'Loading...' : 'Select a file to edit or navigate through directories'}
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
