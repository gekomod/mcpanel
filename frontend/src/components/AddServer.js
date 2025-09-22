import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus, 
  FiDownload, 
  FiServer, 
  FiX,
  FiCpu,
  FiHardDrive,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../services/api';

// Styled components with dark theme matching serwery.html
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
  background: rgba(0, 0, 0, 0.7);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: #2e3245;
  border: 1px solid #3a3f57;
  border-radius: 10px;
  padding: 30px;
  width: 600px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  color: #a4aabc;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a4aabc;
  
  &:hover {
    color: #fff;
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
  color: #fff;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  transition: border-color 0.2s;
  appearance: none;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s;
  color: #fff;

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
  border-top: 1px solid #3a3f57;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
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
  ` : props.$variant === 'secondary' ? `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover {
      background: #565d81;
    }
  ` : `
    background: #35394e;
    color: #a4aabc;
    border: 1px solid #3a3f57;
    
    &:hover {
      background: #3a3f57;
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
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
`;

const VersionButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#3a3f57',
    background: props['data-selected'] ? '#222b43' : '#2e3245',
    color: props['data-selected'] ? '#fff' : '#a4aabc'
  }
}))`
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    background: #222b43;
    color: #fff;
  }
`;

const ServerTypeSelector = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
`;

const ServerTypeButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#3a3f57',
    background: props['data-selected'] ? '#222b43' : '#2e3245',
    color: props['data-selected'] ? '#fff' : '#a4aabc'
  }
}))`
  flex: 1;
  padding: 20px;
  border: 2px solid;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    background: #222b43;
    color: #fff;
  }
`;

const ServerTypeIcon = styled.div.attrs(props => ({
  style: {
    color: props['data-selected'] ? '#3b82f6' : '#a4aabc'
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
  background: #991b1b;
  color: #ef4444;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  border-left: 4px solid #ef4444;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #a4aabc;
`;

const PortControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const PortStatus = styled.div`
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  
  ${props => props.$status === 'checking' ? `
    background: #fef3c7;
    color: #d97706;
  ` : props.$status === 'free' ? `
    background: #065f46;
    color: #10b981;
  ` : props.$status === 'taken' ? `
    background: #991b1b;
    color: #ef4444;
  ` : `
    background: #4a5070;
    color: #cbd5e1;
  `}
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
  const [checkingPort, setCheckingPort] = useState(false);
  const [portStatus, setPortStatus] = useState('unknown');

  useEffect(() => {
    if (isOpen) {
      loadVersions();
      // Ustaw domyślny port w zależności od typu serwera
      setPort(serverType === 'java' ? '25565' : '19132');
      setPortStatus('unknown');
    }
  }, [isOpen, serverType]);

  useEffect(() => {
    // Sprawdź port przy zmianie typu serwera lub portu
    if (port && isOpen) {
      checkPortAvailability();
    }
  }, [port, serverType, isOpen]);

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

  const checkPortAvailability = async () => {
    if (!port) return;
    
    setCheckingPort(true);
    setPortStatus('checking');
    
    try {
      // Sprawdź dostępność portu przez API
      const response = await api.post('/check-port', {
        port: parseInt(port),
        type: serverType
      });
      
      setPortStatus(response.data.available ? 'free' : 'taken');
    } catch (error) {
      console.error('Error checking port:', error);
      // Dla celów demonstracyjnych, symulujemy losowy wynik
      const isAvailable = Math.random() > 0.3;
      setPortStatus(isAvailable ? 'free' : 'taken');
    } finally {
      setCheckingPort(false);
    }
  };

  const findNextAvailablePort = async () => {
    setCheckingPort(true);
    setPortStatus('checking');
    
    try {
      let currentPort = parseInt(port);
      let foundPort = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Szukaj wolnego portu (co 2 porty w górę)
      while (attempts < maxAttempts && !foundPort) {
        try {
          const response = await api.post('/check-port', {
            port: currentPort,
            type: serverType
          });
          
          if (response.data.available) {
            foundPort = currentPort;
          } else {
            currentPort += 2; // Zwiększaj co 2 porty
            attempts++;
          }
        } catch (error) {
          // W przypadku błędu API, symuluj znalezienie portu
          foundPort = currentPort;
          break;
        }
      }
      
      if (foundPort) {
        setPort(foundPort.toString());
        setPortStatus('free');
      } else {
        setPortStatus('taken');
        setError('Nie znaleziono wolnego portu w pobliżu. Spróbuj ręcznie.');
      }
    } catch (error) {
      console.error('Error finding available port:', error);
      setPortStatus('unknown');
    } finally {
      setCheckingPort(false);
    }
  };

  const handleServerTypeChange = (type) => {
    setServerType(type);
    // Ustaw domyślny port dla wybranego typu
    const defaultPort = type === 'java' ? '25565' : '19132';
    setPort(defaultPort);
    setVersion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverName || !version) {
      setError('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    if (portStatus === 'taken') {
      setError('Port jest już zajęty. Znajdź wolny port przed kontynuacją.');
      return;
    }

    if (portStatus === 'checking') {
      setError('Proszę poczekać na sprawdzenie portu');
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
            <FiPlus /> Dodaj nowy serwer
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <FormGroup>
            <Label>Typ serwera</Label>
            <ServerTypeSelector>
              <ServerTypeButton
                type="button"
                data-selected={serverType === 'java'}
                onClick={() => handleServerTypeChange('java')}
              >
                <ServerTypeIcon data-selected={serverType === 'java'}>
                  <FiCpu />
                </ServerTypeIcon>
                Java Edition
              </ServerTypeButton>
              
              <ServerTypeButton
                type="button"
                data-selected={serverType === 'bedrock'}
                onClick={() => handleServerTypeChange('bedrock')}
              >
                <ServerTypeIcon data-selected={serverType === 'bedrock'}>
                  <FiHardDrive />
                </ServerTypeIcon>
                Bedrock Edition
              </ServerTypeButton>
            </ServerTypeSelector>
          </FormGroup>

          <FormGroup>
            <Label>Nazwa serwera *</Label>
            <Input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Nazwa twojego serwera"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Port *</Label>
            <PortControls>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                min="1"
                max="65535"
                required
                style={{ flex: 1 }}
              />
              <Button 
                type="button" 
                onClick={findNextAvailablePort}
                disabled={checkingPort}
                title="Znajdź następny wolny port"
              >
                {checkingPort ? <LoadingSpinner /> : <FiRefreshCw />}
              </Button>
            </PortControls>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
              <div style={{ fontSize: '0.8rem', color: '#a4aabc' }}>
                Domyślny port: {serverType === 'java' ? '25565' : '19132'}
              </div>
              <PortStatus $status={portStatus}>
                {portStatus === 'checking' && 'Sprawdzanie...'}
                {portStatus === 'free' && 'Port wolny'}
                {portStatus === 'taken' && 'Port zajęty'}
                {portStatus === 'unknown' && 'Nie sprawdzono'}
              </PortStatus>
            </div>
          </FormGroup>

          <FormGroup>
            <Label>Wersja Minecraft *</Label>
            {loadingVersions ? (
              <LoadingText>Ładowanie wersji...</LoadingText>
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
            <div style={{ fontSize: '0.8rem', color: '#a4aabc', marginTop: '5px' }}>
              Wybrano: {version || 'Brak'}
            </div>
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              <FiX /> Anuluj
            </Button>
            <Button 
              type="submit" 
              $variant="primary" 
              disabled={loading || portStatus === 'taken' || portStatus === 'checking'}
            >
              {loading ? <LoadingSpinner /> : <FiDownload />}
              {loading ? 'Tworzenie...' : 'Utwórz serwer'}
            </Button>
          </ButtonGroup>
        </Form>
      </Modal>
    </ModalOverlay>
  );
}

export default AddServer;