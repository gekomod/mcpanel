import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiArrowLeft,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
  FiSettings,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiDownload,
  FiFileText,
  FiWifi,
  FiEye,
  FiClock,
  FiExternalLink
} from 'react-icons/fi';
import { FaMemory } from "react-icons/fa6";
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';

const ManagementContainer = styled.div`
  padding: 20px;
  color: #a4aabc;
  background: transparent;
  min-height: 100vh;
`;

const ManagementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 15px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
`;

const ManagementTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const BackButton = styled.button`
  background: #4a5070;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: #565d81;
  }
`;

const ManagementTabs = styled.div`
  display: flex;
  background: #35394e;
  border-radius: 8px;
  padding: 5px;
  margin-bottom: 25px;
  border: 1px solid #3a3f57;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ManagementTab = styled.div`
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  text-align: center;
  flex: 1;
  background: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#a4aabc'};
  
  &:hover {
    background: ${props => props.$active ? '#3b82f6' : '#222b43'};
  }
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const ManagementContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background: #35394e;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #3a3f57;
`;

const InfoCardTitle = styled.div`
  font-size: 14px;
  color: #a4aabc;
  margin-bottom: 8px;
`;

const InfoCardValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #35394e;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  background: ${props => {
    switch(props.$type) {
      case 'cpu': return 'linear-gradient(90deg, #10b981, #3b82f6)';
      case 'memory': return 'linear-gradient(90deg, #f59e0b, #ef4444)';
      case 'disk': return 'linear-gradient(90deg, #8b5cf6, #ec4899)';
      default: return '#3b82f6';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 25px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 14px;
  
  ${props => {
    switch(props.$variant) {
      case 'restart': 
        return `
          background: #f59e0b;
          color: white;
          &:hover { background: #d97706; }
        `;
      case 'test':
        return `
          background: #4a5070;
          color: white;
          &:hover { background: #565d81; }
        `;
      case 'logs':
        return `
          background: #4a5070;
          color: white;
          &:hover { background: #565d81; }
        `;
      case 'update':
        return `
          background: #4a5070;
          color: white;
          &:hover { background: #565d81; }
        `;
      default:
        return `
          background: #4a5070;
          color: white;
          &:hover { background: #565d81; }
        `;
    }
  }}
`;

const SettingsForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const DangerZone = styled.div`
  grid-column: 1 / -1;
  background: #7c2d2d20;
  border: 1px solid #7c2d2d;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const DangerZoneTitle = styled.div`
  color: #f87171;
  font-size: 18px;
  margin-bottom: 15px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #fff;
`;

const FormInput = styled.input`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
  font-size: 14px;
`;

const PrimaryButton = styled(Button)`
  background: #3b82f6;
  color: white;
  
  &:hover {
    background: #2563eb;
  }
`;

const SecondaryButton = styled(Button)`
  background: #4a5070;
  color: #cbd5e1;
  
  &:hover {
    background: #565d81;
  }
`;

const DangerButton = styled(Button)`
  background: #dc2626;
  color: white;
  
  &:hover {
    background: #b91c1c;
  }
`;

const ServersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const ServerCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #3a3f57;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const ServerCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const ServerCardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const ServerStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${props => props.$online ? '#065f46' : '#7c2d2d'};
  color: ${props => props.$online ? '#10b981' : '#f87171'};
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$online ? '#10b981' : '#f87171'};
`;

const ServerCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const ServerDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ServerDetailLabel = styled.span`
  font-size: 12px;
  color: #a4aabc;
  font-weight: 500;
`;

const ServerDetailValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

const ServerCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #3a3f57;
`;

const ServerPlayers = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #a4aabc;
`;

const ManageServerButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background: #2563eb;
  }
`;

const LogsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$show ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const LogsContent = styled.div`
  background: #2a2d3e;
  border-radius: 10px;
  width: 90%;
  height: 80%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  border: 1px solid #3a3f57;
`;

const LogsHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #3a3f57;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogsTitle = styled.h3`
  color: #fff;
  margin: 0;
  font-size: 18px;
`;

const LogsClose = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #fff;
  }
`;

const LogsToolbar = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #3a3f57;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const LogsSelect = styled.select`
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 4px;
  padding: 8px 12px;
  color: #fff;
  font-size: 14px;
`;

const LogsInput = styled.input`
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 4px;
  padding: 8px 12px;
  color: #fff;
  font-size: 14px;
  width: 80px;
`;

const LogsBody = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  background: #1e2130;
  color: #e2e8f0;
`;

const LogLine = styled.div`
  margin-bottom: 2px;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const LogsFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #3a3f57;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2a2d3e;
`;

const LogsInfo = styled.div`
  color: #a4aabc;
  font-size: 12px;
`;

const LogsActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$show ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ConfirmationContent = styled.div`
  background: #2a2d3e;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  padding: 25px;
  border: 1px solid #3a3f57;
`;

const ConfirmationTitle = styled.h3`
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 18px;
`;

const ConfirmationMessage = styled.p`
  color: #a4aabc;
  margin: 0 0 20px 0;
  line-height: 1.5;
`;

const ConfirmationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

function AgentManagement() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  
  // Stan dla logów
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logType, setLogType] = useState('agent');
  const [selectedServer, setSelectedServer] = useState('');
  const [linesCount, setLinesCount] = useState(100);

  // Stan dla potwierdzeń
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState({});

  useEffect(() => {
    fetchAgentData();
    
    const interval = setInterval(fetchAgentData, 10000);
    return () => clearInterval(interval);
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      const [agentResponse, serversResponse] = await Promise.all([
        api.get(`/agents/${agentId}`),
        api.get(`/agents/${agentId}/servers`)
      ]);

      const agentData = agentResponse.data;
      const isOnline = agentData.status === 'online';
      
      setAgent({
        ...agentData,
        isOnline,
        cpuUsage: Math.round(agentData.cpu_usage || 0),
        memoryUsage: Math.round(agentData.memory_usage || 0),
        diskUsage: Math.round(agentData.disk_usage || 0),
        location: agentData.location,
        version: agentData.version,
        last_update: agentData.last_update,
        max_servers: agentData.max_servers,
        running_servers: agentData.running_servers,
        description: agentData.description
      });

      setServers(serversResponse.data);
    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast.error('Błąd podczas ładowania danych agenta');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = (action, data = {}) => {
    setConfirmAction(action);
    setConfirmData(data);
    setShowConfirm(true);
  };

  const hideConfirmation = () => {
    setShowConfirm(false);
    setConfirmAction(null);
    setConfirmData({});
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction(confirmData);
    }
    hideConfirmation();
  };

  const handleRestartAgent = async () => {
    showConfirmation(async () => {
      try {
        await api.post(`/agents/${agentId}/restart`);
        fetchAgentData();
        toast.success('Komenda restartu została wysłana do agenta');
      } catch (error) {
        console.error('Error restarting agent:', error);
        toast.error('Błąd podczas restartowania agenta: ' + (error.response?.data?.error || error.message));
      }
    }, {
      title: 'Restart agenta',
      message: 'Czy na pewno chcesz zrestartować tego agenta?',
      confirmText: 'Tak, restartuj',
      confirmVariant: 'warning'
    });
  };

  const handleTestConnection = async () => {
    try {
      // POPRAWIONE: Używamy GET zamiast POST i poprawnego endpointa
      const response = await api.get(`/agents/${agentId}/test`);
      
      if (response.data.status === 'success') {
        toast.success(`Połączenie z agentem: SUKCES - ${response.data.message}`);
        
        // Dodatkowe informacje o statusie agenta jeśli są dostępne
        if (response.data.agent_status) {
          console.log('Status agenta:', response.data.agent_status);
        }
      } else {
        toast.error(`Połączenie z agentem: BŁĄD - ${response.data.message}`);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.error('Błąd podczas testowania połączenia z agentem: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateAgent = () => {
    toast.info('Funkcja aktualizacji agenta będzie dostępna wkrótce', {
      autoClose: 3000,
    });
  };
  
  const handleShowLogs = async () => {
    setShowLogs(true);
    await fetchLogs();
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      let url = '';
      if (logType === 'agent') {
        url = `${agent.url}/logs/agent?lines=${linesCount}`;
      } else {
        url = `${agent.url}/logs/server/${selectedServer}?lines=${linesCount}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${agent.auth_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        setLogs([`Błąd podczas pobierania logów: ${response.status}`]);
        toast.error('Błąd podczas pobierania logów');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([`Błąd połączenia: ${error.message}`]);
      toast.error('Błąd połączenia podczas pobierania logów');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDownloadLogs = async () => {
    try {
      let url = '';
      if (logType === 'agent') {
        url = `${agent.url}/logs/download/agent`;
      } else {
        url = `${agent.url}/logs/download/server/${selectedServer}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${agent.auth_token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'logs.log';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('Logi zostały pobrane pomyślnie');
      } else {
        toast.error('Błąd podczas pobierania logów');
      }
    } catch (error) {
      console.error('Error downloading logs:', error);
      toast.error('Błąd podczas pobierania logów');
    }
  };

  const handleLogTypeChange = (type) => {
    setLogType(type);
    if (type === 'server' && servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0].name);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const agentData = {
      name: formData.get('name'),
      location: formData.get('location'),
      description: formData.get('description'),
      capacity: parseInt(formData.get('capacity'))
    };
    
    try {
      await api.put(`/agents/${agentId}`, agentData);
      setEditing(false);
      fetchAgentData();
      toast.success('Ustawienia agenta zostały zaktualizowane');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Błąd podczas aktualizacji agenta: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteAgent = async () => {
    showConfirmation(async () => {
      try {
        await api.delete(`/agents/${agentId}`);
        navigate('/agents');
        toast.success('Agent został usunięty pomyślnie');
      } catch (error) {
        console.error('Error deleting agent:', error);
        const errorMessage = error.response?.data?.error || 'Błąd podczas usuwania agenta';
        if (error.response?.data?.servers) {
          toast.error(`${errorMessage}\nSerwery: ${error.response.data.servers.join(', ')}`);
        } else {
          toast.error(errorMessage);
        }
      }
    }, {
      title: 'Usuwanie agenta',
      message: 'CZY NA PEWNO CHCESZ USUNĄĆ TEGO AGENTA? Wszystkie serwery na tym agencie zostaną usunięte!',
      confirmText: 'Tak, usuń',
      confirmVariant: 'danger'
    });
  };

  const handleManageServer = (serverId) => {
    navigate(`/servers/${serverId}`);
  };

  const getConfirmButton = () => {
    switch (confirmData.confirmVariant) {
      case 'danger':
        return <DangerButton onClick={handleConfirm}>{confirmData.confirmText || 'Potwierdź'}</DangerButton>;
      case 'warning':
        return (
          <Button 
            onClick={handleConfirm}
            style={{ background: '#f59e0b', color: 'white' }}
          >
            {confirmData.confirmText || 'Potwierdź'}
          </Button>
        );
      default:
        return <PrimaryButton onClick={handleConfirm}>{confirmData.confirmText || 'Potwierdź'}</PrimaryButton>;
    }
  };

  if (loading) {
    return (
      <ManagementContainer>
        <div>Ładowanie danych agenta...</div>
      </ManagementContainer>
    );
  }

  if (!agent) {
    return (
      <ManagementContainer>
        <div>Agent nie znaleziony</div>
      </ManagementContainer>
    );
  }

  return (
    <ManagementContainer>
      <ManagementHeader>
        <ManagementTitle>Zarządzanie: {agent.name}</ManagementTitle>
        <BackButton onClick={() => navigate('/admin/agents')}>
          <FiArrowLeft />
          Powrót do listy agentów
        </BackButton>
      </ManagementHeader>

      <ManagementTabs>
        <ManagementTab 
          $active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Przegląd
        </ManagementTab>
        <ManagementTab 
          $active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          Ustawienia
        </ManagementTab>
        <ManagementTab 
          $active={activeTab === 'servers'} 
          onClick={() => setActiveTab('servers')}
        >
          Serwery ({servers.length})
        </ManagementTab>
      </ManagementTabs>

      {/* Zakładka Przegląd */}
      <ManagementContent $active={activeTab === 'overview'}>
        <InfoGrid>
          <InfoCard>
            <InfoCardTitle>Status</InfoCardTitle>
            <InfoCardValue style={{ color: agent.isOnline ? '#10b981' : '#f87171' }}>
              {agent.isOnline ? 'Online' : 'Offline'}
            </InfoCardValue>
          </InfoCard>
          <InfoCard>
            <InfoCardTitle>Lokalizacja</InfoCardTitle>
            <InfoCardValue>{agent.location || 'Nieznana'}</InfoCardValue>
          </InfoCard>
          <InfoCard>
            <InfoCardTitle>Wersja oprogramowania</InfoCardTitle>
            <InfoCardValue>{agent.version || 'Nieznana'}</InfoCardValue>
          </InfoCard>
          <InfoCard>
            <InfoCardTitle>Ostatnia aktualizacja</InfoCardTitle>
            <InfoCardValue>
              {agent.last_update 
                ? new Date(agent.last_update).toLocaleString('pl-PL')
                : 'Nigdy'}
            </InfoCardValue>
          </InfoCard>
        </InfoGrid>

        <h4 style={{ color: '#fff', marginBottom: '15px' }}>Zasoby systemowe</h4>
        <InfoGrid>
          <InfoCard>
            <InfoCardTitle>CPU</InfoCardTitle>
            <InfoCardValue>{agent.cpuUsage}%</InfoCardValue>
            <ProgressBar>
              <ProgressFill 
                $type="cpu" 
                style={{ width: `${agent.cpuUsage}%` }} 
              />
            </ProgressBar>
          </InfoCard>
          <InfoCard>
            <InfoCardTitle>Pamięć RAM</InfoCardTitle>
            <InfoCardValue>
              {agent.memoryUsage}%
            </InfoCardValue>
            <ProgressBar>
              <ProgressFill 
                $type="memory" 
                style={{ width: `${agent.memoryUsage}%` }} 
              />
            </ProgressBar>
          </InfoCard>
          <InfoCard>
            <InfoCardTitle>Dysk</InfoCardTitle>
            <InfoCardValue>
              {agent.diskUsage}%
            </InfoCardValue>
            <ProgressBar>
              <ProgressFill 
                $type="disk" 
                style={{ width: `${agent.diskUsage}%` }} 
              />
            </ProgressBar>
          </InfoCard>
          <InfoCard>
            <InfoCardTitle>Serwery</InfoCardTitle>
            <InfoCardValue>{agent.running_servers || 0}/{agent.max_servers || 5}</InfoCardValue>
            <InfoCardTitle style={{ marginTop: '5px', fontSize: '12px' }}>
              Aktywne: {agent.running_servers || 0}
            </InfoCardTitle>
          </InfoCard>
        </InfoGrid>

        <ActionButtons>
          <ActionButton $variant="restart" onClick={handleRestartAgent}>
            <FiRefreshCw />
            Restartuj agenta
          </ActionButton>
          <ActionButton $variant="test" onClick={handleTestConnection}>
            <FiWifi />
            Test połączenia
          </ActionButton>
          <ActionButton $variant="logs" onClick={handleShowLogs}>
            <FiFileText />
            Pokaż logi agenta
          </ActionButton>
          <ActionButton $variant="update" onClick={handleUpdateAgent}>
            <FiDownload />
            Aktualizuj agenta
          </ActionButton>
        </ActionButtons>
      </ManagementContent>

      {/* Zakładka Ustawienia */}
      <ManagementContent $active={activeTab === 'settings'}>
        {editing ? (
          <SettingsForm onSubmit={handleSaveSettings}>
            <FormGroup>
              <FormLabel htmlFor="agentName">Nazwa agenta</FormLabel>
              <FormInput 
                type="text" 
                id="agentName" 
                name="name"
                defaultValue={agent.name}
                required 
              />
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="agentLocation">Lokalizacja</FormLabel>
              <FormSelect 
                id="agentLocation" 
                name="location"
                defaultValue={agent.location || 'frankfurt'}
              >
                <option value="frankfurt">Frankfurt, DE</option>
                <option value="warsaw">Warsaw, PL</option>
                <option value="london">London, UK</option>
                <option value="newyork">New York, US</option>
                <option value="singapore">Singapore, SG</option>
              </FormSelect>
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="agentDescription">Opis agenta</FormLabel>
              <FormTextarea 
                id="agentDescription" 
                name="description"
                defaultValue={agent.description || ''}
                placeholder="Opis agenta..."
              />
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="agentCapacity">Maksymalna liczba serwerów</FormLabel>
              <FormInput 
                type="number" 
                id="agentCapacity" 
                name="capacity"
                defaultValue={agent.max_servers || 5}
                min="1" 
                max="50" 
                required 
              />
            </FormGroup>
            
            <FormActions>
              <SecondaryButton type="button" onClick={() => setEditing(false)}>
                Anuluj
              </SecondaryButton>
              <PrimaryButton type="submit">
                <FiSave style={{ marginRight: '5px' }} />
                Zapisz zmiany
              </PrimaryButton>
            </FormActions>

            <DangerZone>
              <DangerZoneTitle>Strefa niebezpieczna</DangerZoneTitle>
              <p style={{ marginBottom: '15px', color: '#a4aabc' }}>
                Tej akcji nie można cofnąć. Uważaj!
              </p>
              <DangerButton type="button" onClick={handleDeleteAgent}>
                <FiTrash2 style={{ marginRight: '5px' }} />
                Usuń agenta
              </DangerButton>
            </DangerZone>
          </SettingsForm>
        ) : (
          <div>
            <div style={{ 
              background: '#35394e', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ color: '#fff', margin: 0 }}>Ustawienia agenta</h4>
                <PrimaryButton onClick={() => setEditing(true)}>
                  <FiEdit style={{ marginRight: '5px' }} />
                  Edytuj ustawienia
                </PrimaryButton>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <InfoCardTitle>Nazwa agenta</InfoCardTitle>
                  <InfoCardValue style={{ fontSize: '16px' }}>{agent.name}</InfoCardValue>
                </div>
                <div>
                  <InfoCardTitle>Lokalizacja</InfoCardTitle>
                  <InfoCardValue style={{ fontSize: '16px' }}>{agent.location || 'Nieznana'}</InfoCardValue>
                </div>
                <div>
                  <InfoCardTitle>Maksymalna liczba serwerów</InfoCardTitle>
                  <InfoCardValue style={{ fontSize: '16px' }}>{agent.max_servers || 5}</InfoCardValue>
                </div>
                <div>
                  <InfoCardTitle>Aktywne serwery</InfoCardTitle>
                  <InfoCardValue style={{ fontSize: '16px' }}>{agent.running_servers || 0}</InfoCardValue>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <InfoCardTitle>Opis</InfoCardTitle>
                  <InfoCardValue style={{ fontSize: '16px' }}>
                    {agent.description || 'Brak opisu'}
                  </InfoCardValue>
                </div>
              </div>
            </div>
            
            <DangerZone>
              <DangerZoneTitle>Strefa niebezpieczna</DangerZoneTitle>
              <p style={{ marginBottom: '15px', color: '#a4aabc' }}>
                Tej akcji nie można cofnąć. Uważaj!
              </p>
              <DangerButton onClick={handleDeleteAgent}>
                <FiTrash2 style={{ marginRight: '5px' }} />
                Usuń agenta
              </DangerButton>
            </DangerZone>
          </div>
        )}
      </ManagementContent>

      {/* Zakładka Serwery */}
      <ManagementContent $active={activeTab === 'servers'}>
        <h4 style={{ color: '#fff', marginBottom: '15px' }}>
          Serwery na tym agencie ({servers.length})
        </h4>
        
        {servers.length === 0 ? (
          <div style={{ 
            background: '#2e3245', 
            padding: '40px', 
            borderRadius: '10px', 
            textAlign: 'center',
            border: '1px solid #3a3f57'
          }}>
            <FiServer size={48} style={{ color: '#4a5070', marginBottom: '15px' }} />
            <h4 style={{ color: '#fff', marginBottom: '10px' }}>Brak serwerów</h4>
            <p style={{ color: '#a4aabc' }}>Na tym agencie nie ma jeszcze żadnych serwerów.</p>
          </div>
        ) : (
          <ServersGrid>
            {servers.map(server => (
              <ServerCard key={server.id}>
                <ServerCardHeader>
                  <ServerCardTitle>{server.name}</ServerCardTitle>
                  <ServerStatus $online={server.status === 'running'}>
                    <StatusIndicator $online={server.status === 'running'} />
                    <span>{server.status === 'running' ? 'Online' : 'Offline'}</span>
                  </ServerStatus>
                </ServerCardHeader>
                
                <ServerCardDetails>
                  <ServerDetail>
                    <ServerDetailLabel>Typ:</ServerDetailLabel>
                    <ServerDetailValue>{server.type}</ServerDetailValue>
                  </ServerDetail>
                  <ServerDetail>
                    <ServerDetailLabel>Wersja:</ServerDetailLabel>
                    <ServerDetailValue>{server.version}</ServerDetailValue>
                  </ServerDetail>
                  <ServerDetail>
                    <ServerDetailLabel>Port:</ServerDetailLabel>
                    <ServerDetailValue>{server.port}</ServerDetailValue>
                  </ServerDetail>
                  <ServerDetail>
                    <ServerDetailLabel>Gracze:</ServerDetailLabel>
                    <ServerDetailValue>0/20</ServerDetailValue>
                  </ServerDetail>
                </ServerCardDetails>
                
                <ServerCardFooter>
                  <ServerPlayers>
                    <FiServer />
                    <span>Status: {server.status}</span>
                  </ServerPlayers>
                  <ManageServerButton onClick={() => handleManageServer(server.id)}>
                    Zarządzaj
                  </ManageServerButton>
                </ServerCardFooter>
              </ServerCard>
            ))}
          </ServersGrid>
        )}
      </ManagementContent>

      {/* Modal z logami */}
      <LogsModal $show={showLogs}>
        <LogsContent>
          <LogsHeader>
            <LogsTitle>
              <FiFileText style={{ marginRight: '10px' }} />
              Logi {logType === 'agent' ? 'Agenta' : `Serwera ${selectedServer}`}
            </LogsTitle>
            <LogsClose onClick={() => setShowLogs(false)}>
              <FiX />
            </LogsClose>
          </LogsHeader>

          <LogsToolbar>
            <LogsSelect 
              value={logType} 
              onChange={(e) => handleLogTypeChange(e.target.value)}
            >
              <option value="agent">Logi Agenta</option>
              <option value="server">Logi Serwera</option>
            </LogsSelect>

            {logType === 'server' && (
              <LogsSelect 
                value={selectedServer} 
                onChange={(e) => setSelectedServer(e.target.value)}
              >
                <option value="">Wybierz serwer</option>
                {servers.map(server => (
                  <option key={server.id} value={server.name}>
                    {server.name}
                  </option>
                ))}
              </LogsSelect>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
              <span style={{ color: '#a4aabc', fontSize: '14px' }}>Liczba linii:</span>
              <LogsInput 
                type="number" 
                value={linesCount} 
                onChange={(e) => setLinesCount(parseInt(e.target.value) || 100)}
                min="10"
                max="10000"
              />
            </div>

            <SecondaryButton onClick={fetchLogs} disabled={logsLoading}>
              <FiRefreshCw />
              Odśwież
            </SecondaryButton>

            <PrimaryButton onClick={handleDownloadLogs}>
              <FiDownload />
              Pobierz
            </PrimaryButton>
          </LogsToolbar>

          <LogsBody>
            {logsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#a4aabc' }}>
                Ładowanie logów...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#a4aabc' }}>
                Brak logów do wyświetlenia
              </div>
            ) : (
              logs.map((log, index) => (
                <LogLine key={index}>{log}</LogLine>
              ))
            )}
          </LogsBody>

          <LogsFooter>
            <LogsInfo>
              Wyświetlono {logs.length} linii • 
              Ostatnie odświeżenie: {new Date().toLocaleString('pl-PL')}
            </LogsInfo>
            <LogsActions>
              <SecondaryButton onClick={() => setLogs([])}>
                Wyczyść
              </SecondaryButton>
            </LogsActions>
          </LogsFooter>
        </LogsContent>
      </LogsModal>

      {/* Modal potwierdzenia */}
      <ConfirmationModal $show={showConfirm}>
        <ConfirmationContent>
          <ConfirmationTitle>{confirmData.title || 'Potwierdź akcję'}</ConfirmationTitle>
          <ConfirmationMessage>
            {confirmData.message || 'Czy na pewno chcesz wykonać tę akcję?'}
          </ConfirmationMessage>
          <ConfirmationActions>
            <SecondaryButton onClick={hideConfirmation}>
              Anuluj
            </SecondaryButton>
            {getConfirmButton()}
          </ConfirmationActions>
        </ConfirmationContent>
      </ConfirmationModal>
    </ManagementContainer>
  );
}

export default AgentManagement;
