import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus, 
  FiDownload, 
  FiServer, 
  FiX,
  FiCpu,
  FiHardDrive
} from 'react-icons/fi';
import api from '../services/api';

// Styled components with proper prop handling
const ModalOverlay = styled.div.attrs(props => ({
  style: {
    display: props.$isOpen ? 'flex' : 'none'
  }
}))`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 600px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const VersionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const VersionButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#d1d5db',
    background: props['data-selected'] ? '#e0e7ff' : 'white',
    color: props['data-selected'] ? '#3730a3' : '#374151'
  }
}))`
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: center;
  
  &:hover {
    border-color: #3b82f6;
    background: #e0e7ff;
  }
`;

const ServerTypeSelector = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
`;

const ServerTypeButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#e5e7eb',
    background: props['data-selected'] ? '#e0e7ff' : 'white',
    color: props['data-selected'] ? '#3730a3' : '#374151'
  }
}))`
  flex: 1;
  padding: 20px;
  border: 2px solid;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
  }
`;

const ServerTypeIcon = styled.div.attrs(props => ({
  style: {
    color: props['data-selected'] ? '#3b82f6' : '#6b7280'
  }
}))`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
`;

function AddServer({ isOpen, onClose, onServerAdded }) {
  const [serverType, setServerType] = useState('java');
  const [serverName, setServerName] = useState('');
  const [port, setPort] = useState('25565');
  const [version, setVersion] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, serverType]);

const loadVersions = async () => {
  setLoadingVersions(true);
  setError('');
  
  try {
    let versionsData = [];
    
    if (serverType === 'java') {
      const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
      const data = await response.json();
      versionsData = data.versions
        .filter(v => v.type === 'release')
        .map(v => ({
          id: v.id,
          name: v.id,
          releaseDate: v.releaseTime
        }));
    } else {
      // Pobierz wersje Bedrock z backendu
      try {
        const response = await api.get('/bedrock-versions');
        versionsData = response.data.map(v => ({
          id: v.version,
          name: v.version,
          releaseDate: v.release_date
        }));
      } catch (error) {
        console.error('Error loading bedrock versions:', error);
        // Fallback do przykładowych wersji
        versionsData = [
          { id: '1.20.15', name: '1.20.15', releaseDate: '2023-10-25' },
          { id: '1.20.10', name: '1.20.10', releaseDate: '2023-09-19' },
          { id: '1.20.1', name: '1.20.1', releaseDate: '2023-06-12' },
        ];
      }
    }
    
    setVersions(versionsData.slice(0, 20));
  } catch (error) {
    setError('Failed to load versions');
    console.error('Error loading versions:', error);
  } finally {
    setLoadingVersions(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverName || !version) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/servers', {
        name: serverName,
        type: serverType,
        version: version,
        port: parseInt(port)
      });

      onServerAdded(response.data);
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiPlus /> Add New Server
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGroup>
            <Label>Server Type</Label>
            <ServerTypeSelector>
              <ServerTypeButton
                type="button"
                data-selected={serverType === 'java'}
                onClick={() => setServerType('java')}
              >
                <ServerTypeIcon data-selected={serverType === 'java'}>
                  <FiCpu />
                </ServerTypeIcon>
                Java Edition
              </ServerTypeButton>
              
              <ServerTypeButton
                type="button"
                data-selected={serverType === 'bedrock'}
                onClick={() => setServerType('bedrock')}
              >
                <ServerTypeIcon data-selected={serverType === 'bedrock'}>
                  <FiHardDrive />
                </ServerTypeIcon>
                Bedrock Edition
              </ServerTypeButton>
            </ServerTypeSelector>
          </FormGroup>

          <FormGroup>
            <Label>Server Name *</Label>
            <Input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="My Awesome Server"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Port *</Label>
            <Input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              min="1"
              max="65535"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Minecraft Version *</Label>
            {loadingVersions ? (
              <div>Loading versions...</div>
            ) : (
              <VersionGrid>
                {versions.map((ver) => (
                  <VersionButton
                    key={ver.id}
                    type="button"
                    data-selected={version === ver.id}
                    onClick={() => setVersion(ver.id)}
                  >
                    {ver.id}
                  </VersionButton>
                ))}
              </VersionGrid>
            )}
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>
              Selected: {version || 'None'}
            </div>
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              <FiX /> Cancel
            </Button>
            <Button type="submit" $variant="primary" disabled={loading}>
              {loading ? <LoadingSpinner /> : <FiDownload />}
              {loading ? 'Creating...' : 'Create Server'}
            </Button>
          </ButtonGroup>
        </Form>
      </Modal>
    </ModalOverlay>
  );
}

export default AddServer;
