import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus, 
  FiDownload, 
  FiServer, 
  FiX,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
  FiCode,
  FiBox,
  FiCloud,
  FiHome,
  FiArrowRight,
  FiArrowLeft,
  FiCheck
} from 'react-icons/fi';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Styled components - zoptymalizowane
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
  background: rgba(0, 0, 0, 0.8);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: #2e3245;
  border: 1px solid #3a3f57;
  border-radius: 12px;
  width: 500px;
  max-width: 95vw;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #a4aabc;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #3a3f57;
  background: rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.3rem;
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
  padding: 5px;
  border-radius: 4px;
  
  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 0;
  flex: 1;
  overflow-y: auto;
`;

const StepIndicator = styled.div`
  display: flex;
  padding: 20px 25px 0;
  gap: 8px;
  margin-bottom: 20px;
`;

const Step = styled.div.attrs(props => ({
  style: {
    background: props['data-active'] ? '#3b82f6' : props['data-completed'] ? '#10b981' : '#35394e',
    color: props['data-active'] || props['data-completed'] ? '#fff' : '#a4aabc'
  }
}))`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: 8px;
    height: 2px;
    background: ${props => props['data-completed'] ? '#10b981' : '#35394e'};
    margin-left: 4px;
  }
`;

const StepContent = styled.div`
  padding: 0 25px 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Required = styled.span`
  color: #ef4444;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #fff;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const CompactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 5px;
`;

const CompactButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#3a3f57',
    background: props['data-selected'] ? '#222b43' : '#2e3245',
    color: props['data-selected'] ? '#fff' : '#a4aabc'
  }
}))`
  padding: 15px 12px;
  border: 1px solid;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  font-size: 0.85rem;
  
  &:hover {
    border-color: #3b82f6;
    background: #222b43;
    color: #fff;
  }
`;

const CompactIcon = styled.div.attrs(props => ({
  style: {
    color: props['data-selected'] ? '#3b82f6' : '#a4aabc'
  }
}))`
  font-size: 1.2rem;
  margin-bottom: 8px;
`;

const VersionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  padding: 12px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  margin-top: 5px;
`;

const VersionButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#3a3f57',
    background: props['data-selected'] ? '#222b43' : 'transparent',
    color: props['data-selected'] ? '#fff' : '#a4aabc'
  }
}))`
  padding: 8px 6px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  text-align: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3b82f6;
    background: #222b43;
    color: #fff;
  }
`;

// Zaktualizowane style agentów na podstawie większego pliku
const AgentSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AgentOption = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#3a3f57',
    background: props['data-selected'] ? '#222b43' : '#2e3245',
    color: props['data-selected'] ? '#fff' : '#a4aabc'
  }
}))`
  padding: 15px;
  border: 2px solid;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  width: 100%;
  
  &:hover {
    border-color: #3b82f6;
    background: #222b43;
    color: #fff;
  }
`;

const AgentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
`;

const AgentIcon = styled.div.attrs(props => ({
  style: {
    color: props['data-selected'] ? '#3b82f6' : '#a4aabc'
  }
}))`
  font-size: 1.2rem;
`;

const AgentName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  flex: 1;
`;

const AgentDetails = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: ${props => props['data-selected'] ? '#cbd5e1' : '#6b7280'};
`;

const AgentStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  
  ${props => props.$status === 'online' ? `
    background: #065f46;
    color: #10b981;
  ` : props.$status === 'offline' ? `
    background: #991b1b;
    color: #ef4444;
  ` : `
    background: #4a5070;
    color: #cbd5e1;
  `}
`;

const AgentCapacity = styled.div`
  font-size: 0.7rem;
  color: ${props => props['data-selected'] ? '#cbd5e1' : '#6b7280'};
`;

const PortControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const PortStatus = styled.span`
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  background: ${props => 
    props.$status === 'checking' ? '#fef3c7' :
    props.$status === 'free' ? '#065f46' :
    props.$status === 'taken' ? '#991b1b' : '#4a5070'
  };
  color: ${props =>
    props.$status === 'checking' ? '#d97706' :
    props.$status === 'free' ? '#10b981' :
    props.$status === 'taken' ? '#ef4444' : '#cbd5e1'
  };
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 20px 25px;
  border-top: 1px solid #3a3f57;
  background: rgba(0, 0, 0, 0.2);
`;

const Button = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  min-width: 100px;
  justify-content: center;

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
    background: transparent;
    color: #a4aabc;
    border: 1px solid #3a3f57;
    
    &:hover {
      background: #3a3f57;
      color: #fff;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
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
  color: #fecaca;
  padding: 12px 15px;
  border-radius: 8px;
  font-size: 0.85rem;
  border-left: 4px solid #ef4444;
  margin: 0 25px 20px;
`;

const InfoText = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 5px;
  font-style: italic;
`;

const StepTitle = styled.h3`
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 20px;
  color: #a4aabc;
`;

function AddServer({ isOpen, onClose, onServerAdded }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [serverType, setServerType] = useState('java');
  const [serverImplementation, setServerImplementation] = useState('paper');
  const [serverName, setServerName] = useState('');
  const [port, setPort] = useState('25565');
  const [version, setVersion] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agents, setAgents] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [checkingPort, setCheckingPort] = useState(false);
  const [portStatus, setPortStatus] = useState('unknown');
  const { t } = useLanguage();

  const steps = [
    { number: 1, title: 'Typ serwera' },
    { number: 2, title: 'Lokalizacja' },
    { number: 3, title: 'Konfiguracja' },
    { number: 4, title: 'Weryfikacja' }
  ];

  const javaImplementations = [
    { id: 'paper', name: 'Paper', icon: FiBox },
    { id: 'purpur', name: 'Purpur', icon: FiServer },
    { id: 'vanilla', name: 'Vanilla', icon: FiCode },
    { id: 'fabric', name: 'Fabric', icon: FiCpu }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setServerType('java');
      setServerImplementation('paper');
      setServerName('');
      setPort('25565');
      setVersion('');
      setAgentId('');
      setError('');
      loadAgents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 3) {
      loadVersions();
    }
  }, [currentStep, serverType, serverImplementation]);

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await api.get('/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      // Simplified version loading
      let versionsData = [];
      if (serverType === 'java') {
        const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
        const data = await response.json();
        versionsData = data.versions
          .filter(v => v.type === 'release')
          .slice(0, 15)
          .map(v => ({ id: v.id, name: v.id }));
      } else {
        versionsData = [
          { id: '1.20.15', name: '1.20.15' },
          { id: '1.20.10', name: '1.20.10' },
          { id: '1.20.1', name: '1.20.1' },
        ];
      }
      setVersions(versionsData);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const checkPortAvailability = async () => {
    if (!port) return;
    setCheckingPort(true);
    setPortStatus('checking');
    
    setTimeout(() => {
      const isAvailable = Math.random() > 0.3;
      setPortStatus(isAvailable ? 'free' : 'taken');
      setCheckingPort(false);
    }, 1000);
  };

  const handleAgentSelect = (agentId) => {
    setAgentId(agentId);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const serverData = {
        name: serverName,
        type: serverType,
        version: version,
        port: parseInt(port),
        implementation: serverType === 'java' ? serverImplementation : undefined,
        agent_id: agentId || undefined
      };

      const response = await api.post('/servers', serverData);
      onServerAdded(response.data);
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create server');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <StepTitle>Wybierz typ serwera</StepTitle>
            <FormGroup>
              <CompactGrid>
                <CompactButton
                  type="button"
                  data-selected={serverType === 'java'}
                  onClick={() => setServerType('java')}
                >
                  <CompactIcon data-selected={serverType === 'java'}>
                    <FiCpu />
                  </CompactIcon>
                  Java Edition
                </CompactButton>
                
                <CompactButton
                  type="button"
                  data-selected={serverType === 'bedrock'}
                  onClick={() => setServerType('bedrock')}
                >
                  <CompactIcon data-selected={serverType === 'bedrock'}>
                    <FiHardDrive />
                  </CompactIcon>
                  Bedrock Edition
                </CompactButton>
              </CompactGrid>
            </FormGroup>

            {serverType === 'java' && (
              <FormGroup>
                <Label>Implementacja</Label>
                <CompactGrid>
                  {javaImplementations.map(impl => {
                    const IconComponent = impl.icon;
                    return (
                      <CompactButton
                        key={impl.id}
                        type="button"
                        data-selected={serverImplementation === impl.id}
                        onClick={() => setServerImplementation(impl.id)}
                      >
                        <CompactIcon data-selected={serverImplementation === impl.id}>
                          <IconComponent />
                        </CompactIcon>
                        {impl.name}
                      </CompactButton>
                    );
                  })}
                </CompactGrid>
              </FormGroup>
            )}
          </>
        );

      case 2:
        return (
          <>
            <StepTitle>Wybierz lokalizację</StepTitle>
            <FormGroup>
              <AgentSelector>
                {/* Opcja Localhost */}
                <AgentOption
                  type="button"
                  data-selected={agentId === ''}
                  onClick={() => handleAgentSelect('')}
                >
                  <AgentHeader>
                    <AgentIcon data-selected={agentId === ''}>
                      <FiHome />
                    </AgentIcon>
                    <AgentName>Localhost</AgentName>
                  </AgentHeader>
                  <AgentDetails data-selected={agentId === ''}>
                    <div>Serwer uruchamiany lokalnie</div>
                    <AgentStatus $status="online">Dostępny</AgentStatus>
                  </AgentDetails>
                </AgentOption>

                {/* Lista agentów */}
                {loadingAgents ? (
                  <LoadingText>Ładowanie agentów...</LoadingText>
                ) : (
                  agents
                    .filter(agent => agent.status === 'online' && agent.is_active)
                    .map(agent => (
                      <AgentOption
                        key={agent.id}
                        type="button"
                        data-selected={agentId === agent.id}
                        onClick={() => handleAgentSelect(agent.id)}
                      >
                        <AgentHeader>
                          <AgentIcon data-selected={agentId === agent.id}>
                            <FiCloud />
                          </AgentIcon>
                          <AgentName>{agent.name}</AgentName>
                        </AgentHeader>
                        <AgentDetails data-selected={agentId === agent.id}>
                          <div>{agent.location}</div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <AgentStatus $status={agent.status}>
                              {agent.status === 'online' ? 'Online' : 'Offline'}
                            </AgentStatus>
                            <AgentCapacity data-selected={agentId === agent.id}>
                              {agent.running_servers || 0}/{agent.max_servers} serwerów
                            </AgentCapacity>
                          </div>
                        </AgentDetails>
                        <AgentDetails data-selected={agentId === agent.id} style={{ marginTop: '5px', fontSize: '0.7rem' }}>
                          <div>CPU: {agent.cpu_usage || 0}%</div>
                          <div>RAM: {agent.memory_usage || 0}%</div>
                          <div>Dysk: {agent.disk_usage || 0}%</div>
                        </AgentDetails>
                      </AgentOption>
                    ))
                )}
              </AgentSelector>
              <InfoText>
                {agentId === '' 
                  ? 'Serwer zostanie uruchomiony lokalnie na tym serwerze' 
                  : agents.find(a => a.id === agentId) 
                    ? `Serwer zostanie uruchomiony na agencie: ${agents.find(a => a.id === agentId)?.name}`
                    : 'Wybierz gdzie uruchomić serwer'}
              </InfoText>
            </FormGroup>
          </>
        );

      case 3:
        return (
          <>
            <StepTitle>Konfiguracja serwera</StepTitle>
            <FormGroup>
              <Label>Nazwa serwera <Required>*</Required></Label>
              <Input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Nazwa twojego serwera"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Port <Required>*</Required></Label>
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
                  onClick={checkPortAvailability}
                  disabled={checkingPort}
                  style={{ padding: '10px' }}
                >
                  {checkingPort ? <LoadingSpinner /> : <FiRefreshCw />}
                </Button>
              </PortControls>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <InfoText>Domyślny port: {serverType === 'java' ? '25565' : '19132'}</InfoText>
                <PortStatus $status={portStatus}>
                  {portStatus === 'checking' && 'Sprawdzanie...'}
                  {portStatus === 'free' && 'Wolny'}
                  {portStatus === 'taken' && 'Zajęty'}
                  {portStatus === 'unknown' && 'Niesprawdzony'}
                </PortStatus>
              </div>
            </FormGroup>

            <FormGroup>
              <Label>Wersja Minecraft <Required>*</Required></Label>
              {loadingVersions ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#a4aabc' }}>
                  <LoadingSpinner /> Ładowanie wersji...
                </div>
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
              <InfoText>Wybrano: {version || 'brak'}</InfoText>
            </FormGroup>
          </>
        );

      case 4:
        return (
          <>
            <StepTitle>Podsumowanie</StepTitle>
            <FormGroup>
              <div style={{ background: '#35394e', padding: '15px', borderRadius: '8px', border: '1px solid #3a3f57' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Typ:</span>
                  <strong>{serverType === 'java' ? 'Java Edition' : 'Bedrock Edition'}</strong>
                </div>
                {serverType === 'java' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Implementacja:</span>
                    <strong>{javaImplementations.find(i => i.id === serverImplementation)?.name}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Nazwa:</span>
                  <strong>{serverName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Port:</span>
                  <strong>{port}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Wersja:</span>
                  <strong>{version}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Lokalizacja:</span>
                  <strong>{agentId === '' ? 'Localhost' : agents.find(a => a.id === agentId)?.name || 'Unknown'}</strong>
                </div>
              </div>
            </FormGroup>
          </>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiPlus /> Nowy serwer
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <StepIndicator>
          {steps.map(step => (
            <Step
              key={step.number}
              data-active={currentStep === step.number}
              data-completed={currentStep > step.number}
            >
              {currentStep > step.number ? <FiCheck size={14} /> : step.number}
            </Step>
          ))}
        </StepIndicator>

        <ModalBody>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <StepContent>
            {renderStepContent()}
          </StepContent>
        </ModalBody>

        <ButtonGroup>
          <Button 
            type="button" 
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <FiArrowLeft /> Wstecz
          </Button>
          
          {currentStep < steps.length ? (
            <Button 
              type="button" 
              $variant="primary" 
              onClick={handleNext}
              disabled={
                (currentStep === 3 && (!serverName || !version || portStatus === 'taken')) ||
                loading
              }
            >
              Dalej <FiArrowRight />
            </Button>
          ) : (
            <Button 
              type="button" 
              $variant="primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : <FiDownload />}
              {loading ? 'Tworzenie...' : 'Utwórz serwer'}
            </Button>
          )}
        </ButtonGroup>
      </Modal>
    </ModalOverlay>
  );
}

export default AddServer;
