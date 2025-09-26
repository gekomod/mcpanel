import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
  FiSettings,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX
} from 'react-icons/fi';
import { FaMemory } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AgentsContainer = styled.div`
  padding: 20px;
  color: #a4aabc;
  background: transparent;
  min-height: 100vh;
  position: relative;
`;

const Header = styled.div`
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

const PageTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const AgentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AgentCard = styled.div`
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

const AgentCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const AgentCardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const AgentStatus = styled.div`
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
  ${props => props.$starting && `
    animation: pulse 2s infinite;
  `}
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const AgentCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const AgentDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const AgentDetailLabel = styled.span`
  font-size: 12px;
  color: #a4aabc;
  font-weight: 500;
`;

const AgentDetailValue = styled.span`
  font-size: 14px;
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

const AgentCardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #3a3f57;
`;

const AgentServers = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #a4aabc;
`;

const AgentActions = styled.div`
  display: flex;
  gap: 10px;
`;

const AgentButton = styled.button`
  background: ${props => props.$primary ? '#3b82f6' : '#4a5070'};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.$primary ? '#2563eb' : '#565d81'};
  }
`;

const AddAgentCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 2px dashed #3a3f57;
  min-height: 200px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: #3b82f6;
  }
`;

const AddAgentIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

const AddAgentText = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin: 0;
`;

const AddAgentDescription = styled.p`
  font-size: 14px;
  color: #a4aabc;
  text-align: center;
  margin: 0;
`;

const Modal = styled.div`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseModal = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
    color: #fff;
  }
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

const Footer = styled.footer`
  text-align: center;
  padding: 30px 0;
  margin-top: 40px;
  border-top: 1px solid #3a3f57;
  color: #a4aabc;
  font-size: 14px;
`;

function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const navigate = useNavigate();
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
    
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

const fetchAgents = async () => {
  try {
    const response = await api.get('/agents');
    // Mapowanie danych z API na format używany w komponencie
    const mappedAgents = response.data.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status || 'offline',
      location: agent.location,
      url: agent.url,
      cpuUsage: Math.round(agent.cpu_usage || 0),
      memoryUsage: Math.round(agent.memory_usage || 0),
      diskUsage: Math.round(agent.disk_usage || 0),
      runningServers: agent.running_servers,
      maxServers: agent.max_servers,
      is_active: agent.is_active,
      last_update: agent.last_update
    }));
    setAgents(mappedAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
  } finally {
    setLoading(false);
  }
};

  const handleAddAgent = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const agentData = {
      name: formData.get('name'),
      url: formData.get('url'),
      auth_token: formData.get('token'),
      capacity: parseInt(formData.get('capacity'))
    };
    
    try {
      await api.post('/agents', agentData);
      setShowAddAgent(false);
      fetchAgents();
      e.target.reset();
    } catch (error) {
      console.error('Error adding agent:', error);
      alert('Błąd podczas dodawania agenta');
    }
  };

  const handleRestartAgent = async (agentId) => {
    if (window.confirm('Czy na pewno chcesz zrestartować tego agenta?')) {
      try {
        await api.post(`/agents/${agentId}/restart`);
        fetchAgents();
      } catch (error) {
        console.error('Error restarting agent:', error);
        alert('Błąd podczas restartowania agenta');
      }
    }
  };
  
	const handleDeleteAgent = async (agentId) => {
	  if (window.confirm('Czy na pewno chcesz usunąć tego agenta? Ta operacja jest nieodwracalna.')) {
		try {
		  await api.delete(`/agents/${agentId}`);
		  fetchAgents();
		} catch (error) {
		  console.error('Error deleting agent:', error);
		  alert('Błąd podczas usuwania agenta');
		}
	  }
	};
	
	const handleEditAgent = (agent) => {
	  setEditingAgent(agent);
	};

const handleUpdateAgent = async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const agentData = {
    name: formData.get('name'),
    url: formData.get('url'),
    location: formData.get('location'),
    capacity: parseInt(formData.get('capacity')),
    is_active: formData.get('is_active') === 'true'
  };
  
  // Dodaj token tylko jeśli został podany
  const token = formData.get('token');
  if (token) {
    agentData.token = token;
  }
  
  try {
    await api.put(`/agents/${editingAgent.id}`, agentData);
    setEditingAgent(null);
    fetchAgents();
  } catch (error) {
    console.error('Error updating agent:', error);
    alert('Błąd podczas aktualizacji agenta: ' + (error.response?.data?.error || error.message));
  }
};

  const handleManageAgent = (agentId) => {
    navigate(`/agents/${agentId}`);
  };

  if (loading) {
    return (
      <AgentsContainer>
        <div>Ładowanie agentów...</div>
      </AgentsContainer>
    );
  }

  return (
    <AgentsContainer>
      <Header>
        <PageTitle>Zarządzanie Agentami</PageTitle>
      </Header>

      <AgentsGrid>
        {agents.map(agent => (
          <AgentCard key={agent.id}>
            <AgentCardHeader>
              <AgentCardTitle>{agent.name}</AgentCardTitle>
              <AgentStatus $online={agent.status === 'online'}>
                <StatusIndicator 
                  $online={agent.status === 'online'} 
                  $starting={agent.status === 'starting'}
                />
                <span>
                  {agent.status === 'online' ? 'Online' : 
                   agent.status === 'starting' ? 'Uruchamianie...' : 'Offline'}
                </span>
              </AgentStatus>
            </AgentCardHeader>
            
            <AgentCardDetails>
              
<AgentDetail>
  <AgentDetailLabel>Ostatnia aktualizacja</AgentDetailLabel>
  <AgentDetailValue>
    {agent.last_update 
      ? new Date(agent.last_update).toLocaleString('pl-PL')
      : 'Nigdy'
    }
  </AgentDetailValue>
</AgentDetail>
<AgentDetail>
  <AgentDetailLabel>Status z API</AgentDetailLabel>
  <AgentDetailValue>{agent.status}</AgentDetailValue>
</AgentDetail>

<AgentDetail>
                <AgentDetailLabel>Lokalizacja</AgentDetailLabel>
                <AgentDetailValue>{agent.location || 'Nieznana'}</AgentDetailValue>
              </AgentDetail>
              <AgentDetail>
                <AgentDetailLabel>URL</AgentDetailLabel>
                <AgentDetailValue>{agent.url}</AgentDetailValue>
              </AgentDetail>
              <AgentDetail>
                <AgentDetailLabel>
                  <FiCpu style={{ marginRight: '4px' }} />
                  CPU
                </AgentDetailLabel>
                <AgentDetailValue>{agent.cpuUsage}%</AgentDetailValue>
                <ProgressBar>
                  <ProgressFill 
                    $type="cpu" 
                    style={{ width: `${agent.cpuUsage}%` }} 
                  />
                </ProgressBar>
              </AgentDetail>
              <AgentDetail>
                <AgentDetailLabel>
                  <FaMemory style={{ marginRight: '4px' }} />
                  Pamięć
                </AgentDetailLabel>
                <AgentDetailValue>{agent.memoryUsage}%</AgentDetailValue>
                <ProgressBar>
                  <ProgressFill 
                    $type="memory" 
                    style={{ width: `${agent.memoryUsage}%` }} 
                  />
                </ProgressBar>
              </AgentDetail>
              <AgentDetail>
                <AgentDetailLabel>
                  <FiHardDrive style={{ marginRight: '4px' }} />
                  Dysk
                </AgentDetailLabel>
                <AgentDetailValue>{agent.diskUsage}%</AgentDetailValue>
                <ProgressBar>
                  <ProgressFill 
                    $type="disk" 
                    style={{ width: `${agent.diskUsage}%` }} 
                  />
                </ProgressBar>
              </AgentDetail>
              <AgentDetail>
                <AgentDetailLabel>Serwery</AgentDetailLabel>
                <AgentDetailValue>
                  {agent.runningServers}/{agent.maxServers}
                </AgentDetailValue>
              </AgentDetail>
            </AgentCardDetails>
            
            <AgentCardFooter>
              <AgentServers>
                <FiServer />
                <span>{agent.runningServers} aktywnych serwerów</span>
              </AgentServers>
            </AgentCardFooter>
            
            <AgentActions>
  <AgentButton onClick={() => handleEditAgent(agent)}>
    <FiEdit />
    Edytuj
  </AgentButton>
  <AgentButton onClick={() => handleDeleteAgent(agent.id)}>
    <FiTrash2 />
    Usuń
  </AgentButton>
  <AgentButton onClick={() => handleRestartAgent(agent.id)}>
    <FiRefreshCw />
    Restart
  </AgentButton>
  <AgentButton $primary onClick={() => handleManageAgent(agent.id)}>
    <FiSettings />
    Zarządzaj
  </AgentButton>
</AgentActions>
          </AgentCard>
        ))}
        
        <AddAgentCard onClick={() => setShowAddAgent(true)}>
          <AddAgentIcon>
            <FiPlus />
          </AddAgentIcon>
          <AddAgentText>Dodaj nowego agenta</AddAgentText>
          <AddAgentDescription>
            Kliknij tutaj, aby dodać nowego agenta hostującego
          </AddAgentDescription>
        </AddAgentCard>
      </AgentsGrid>

      {/* Modal dodawania agenta */}
      <Modal $isOpen={showAddAgent}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Dodaj nowego agenta</ModalTitle>
            <CloseModal onClick={() => setShowAddAgent(false)}>
              <FiX />
            </CloseModal>
          </ModalHeader>
          
          <form onSubmit={handleAddAgent}>
            <FormGroup>
              <FormLabel htmlFor="agentName">Nazwa agenta</FormLabel>
              <FormInput 
                type="text" 
                id="agentName" 
                name="name"
                placeholder="Nazwa agenta" 
                required 
              />
            </FormGroup>
            
            <FormGroup>
              <FormLabel htmlFor="agentUrl">URL agenta</FormLabel>
              <FormInput 
                type="url" 
                id="agentUrl" 
                name="url"
                placeholder="http://ip-agent:8080" 
                required 
              />
            </FormGroup>
            
            <FormGroup>
              <FormLabel htmlFor="agentToken">Token autoryzacji</FormLabel>
              <FormInput 
                type="password" 
                id="agentToken" 
                name="token"
                placeholder="Secret token" 
                required 
              />
            </FormGroup>
            
            <FormGroup>
              <FormLabel htmlFor="agentCapacity">Maksymalna liczba serwerów</FormLabel>
              <FormInput 
                type="number" 
                id="agentCapacity" 
                name="capacity"
                defaultValue="5" 
                min="1" 
                max="20" 
                required 
              />
            </FormGroup>
            
            <FormActions>
              <SecondaryButton type="button" onClick={() => setShowAddAgent(false)}>
                Anuluj
              </SecondaryButton>
              <PrimaryButton type="submit">
                Dodaj agenta
              </PrimaryButton>
            </FormActions>
          </form>
        </ModalContent>
      </Modal>
      
      {/* Modal edycji agenta */}
<Modal $isOpen={!!editingAgent}>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Edytuj agenta</ModalTitle>
      <CloseModal onClick={() => setEditingAgent(null)}>
        <FiX />
      </CloseModal>
    </ModalHeader>
    
    <form onSubmit={handleUpdateAgent}>
      <FormGroup>
        <FormLabel htmlFor="editAgentName">Nazwa agenta</FormLabel>
        <FormInput 
          type="text" 
          id="editAgentName" 
          name="name"
          placeholder="Nazwa agenta" 
          defaultValue={editingAgent?.name || ''}
          required 
        />
      </FormGroup>
      
      <FormGroup>
        <FormLabel htmlFor="editAgentUrl">URL agenta</FormLabel>
        <FormInput 
          type="url" 
          id="editAgentUrl" 
          name="url"
          placeholder="http://ip-agent:8080" 
          defaultValue={editingAgent?.url || ''}
          required 
        />
      </FormGroup>
      
      <FormGroup>
        <FormLabel htmlFor="editAgentToken">Token autoryzacji</FormLabel>
        <FormInput 
          type="password" 
          id="editAgentToken" 
          name="token"
          placeholder="Wpisz nowy token lub pozostaw puste, aby zachować obecny" 
          defaultValue=""
        />
        <small style={{color: '#a4aabc', fontSize: '12px', marginTop: '5px'}}>
          Pozostaw puste, jeśli nie chcesz zmieniać tokenu
        </small>
      </FormGroup>
      
      <FormGroup>
        <FormLabel htmlFor="editAgentLocation">Lokalizacja</FormLabel>
        <FormInput 
          type="text" 
          id="editAgentLocation" 
          name="location"
          placeholder="np. Warszawa, DC1" 
          defaultValue={editingAgent?.location || ''}
        />
      </FormGroup>
      
      <FormGroup>
        <FormLabel htmlFor="editAgentCapacity">Maksymalna liczba serwerów</FormLabel>
        <FormInput 
          type="number" 
          id="editAgentCapacity" 
          name="capacity"
          defaultValue={editingAgent?.maxServers || 5} 
          min="1" 
          max="50" 
          required 
        />
      </FormGroup>
      
      <FormGroup>
        <FormLabel htmlFor="editAgentStatus">Status</FormLabel>
        <FormInput 
          as="select"
          id="editAgentStatus" 
          name="is_active"
          defaultValue={editingAgent?.is_active ? 'true' : 'false'}
        >
          <option value="true">Aktywny</option>
          <option value="false">Nieaktywny</option>
        </FormInput>
      </FormGroup>
      
      {/* Sekcja informacji o agencie */}
      {editingAgent && (
        <div style={{
          background: '#35394e',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #3a3f57'
        }}>
          <h4 style={{color: '#fff', margin: '0 0 10px 0', fontSize: '14px'}}>Informacje o agencie</h4>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px'}}>
            <div>
              <span style={{color: '#a4aabc'}}>ID:</span> {editingAgent.id}
            </div>
            <div>
              <span style={{color: '#a4aabc'}}>Status:</span> {editingAgent.status}
            </div>
            <div>
              <span style={{color: '#a4aabc'}}>Serwery:</span> {editingAgent.runningServers}/{editingAgent.maxServers}
            </div>
            <div>
              <span style={{color: '#a4aabc'}}>Ostatnia aktualizacja:</span> {editingAgent.last_update ? new Date(editingAgent.last_update).toLocaleString('pl-PL') : 'Nigdy'}
            </div>
          </div>
        </div>
      )}
      
      <FormActions>
        <SecondaryButton type="button" onClick={() => setEditingAgent(null)}>
          Anuluj
        </SecondaryButton>
        <PrimaryButton type="submit">
          <FiSave style={{marginRight: '5px'}} />
          Zapisz zmiany
        </PrimaryButton>
      </FormActions>
    </form>
  </ModalContent>
</Modal>

      <Footer>
        <p>© 2025 MCPanel | Wersja 1.0.1 | {agents.length} agentów | {
          agents.filter(a => a.status === 'online').length
        } online</p>
      </Footer>
    </AgentsContainer>
  );
}

export default Agents;
