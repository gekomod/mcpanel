import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlus,
  FiUser,
  FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AddServer from './AddServer';

const ServersContainer = styled.div`
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

const ServerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ServerCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid #3a3f57;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
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
  background-color: ${props => props.$online ? '#065f46' : '#7c2d2d'};
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
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
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #3a3f57;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const AddServerCard = styled.div`
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

const AddServerIcon = styled.div`
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

const AddServerText = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin: 0;
`;

const AddServerDescription = styled.p`
  font-size: 14px;
  color: #a4aabc;
  text-align: center;
  margin: 0;
`;

const Footer = styled.footer`
  text-align: center;
  padding: 30px 0;
  margin-top: 40px;
  border-top: 1px solid #3a3f57;
  color: #a4aabc;
  font-size: 14px;
`;

function Servers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddServer, setShowAddServer] = useState(false);
  const [statusChecks, setStatusChecks] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
    
    const interval = setInterval(checkRealStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const response = await api.get('/servers');
      setServers(response.data);
      
      response.data.forEach(server => {
        checkServerRealStatus(server.id);
      });
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkServerRealStatus = async (serverId) => {
    try {
      const response = await api.get(`/servers/${serverId}/real-status`);
      setStatusChecks(prev => ({
        ...prev,
        [serverId]: response.data
      }));
    } catch (error) {
      console.error('Error checking real status:', error);
    }
  };

  const checkRealStatus = () => {
    servers.forEach(server => {
      checkServerRealStatus(server.id);
    });
  };

  const isServerReallyRunning = (server) => {
    const statusCheck = statusChecks[server.id];
    if (statusCheck) {
      return statusCheck.real_status.running;
    }
    return server.status === 'running';
  };

  const handleServerClick = (serverId) => {
    navigate(`/servers/${serverId}`);
  };

  const handleManageServer = (e, serverId) => {
    e.stopPropagation();
    navigate(`/servers/${serverId}`);
  };

  if (loading) {
    return (
      <ServersContainer>
        <div>Loading servers...</div>
      </ServersContainer>
    );
  }

  return (
    <ServersContainer>

      <ServerGrid>
        {servers.map(server => {
          const isRunning = isServerReallyRunning(server);
          const playerCount = isRunning ? '4/20' : '0/20';
          
          return (
            <ServerCard key={server.id} onClick={() => handleServerClick(server.id)}>
              <ServerCardHeader>
                <ServerCardTitle>{server.name}</ServerCardTitle>
                <ServerStatus $online={isRunning}>
                  <StatusIndicator $online={isRunning} />
                  <span>{isRunning ? 'Online' : 'Offline'}</span>
                </ServerStatus>
              </ServerCardHeader>
              
              <ServerCardDetails>
                <ServerDetail>
                  <ServerDetailLabel>Wersja:</ServerDetailLabel>
                  <ServerDetailValue>{server.version}</ServerDetailValue>
                </ServerDetail>
                <ServerDetail>
                  <ServerDetailLabel>IP:</ServerDetailLabel>
                  <ServerDetailValue>{server.address || 'localhost'}</ServerDetailValue>
                </ServerDetail>
                <ServerDetail>
                  <ServerDetailLabel>Lokalizacja:</ServerDetailLabel>
                  <ServerDetailValue>Europa</ServerDetailValue>
                </ServerDetail>
              </ServerCardDetails>
              
              <ServerCardFooter>
                <ServerPlayers>
                  <FiUser />
                  <span>{playerCount} graczy</span>
                </ServerPlayers>
                <ManageServerButton onClick={(e) => handleManageServer(e, server.id)}>
                  Zarządzaj
                </ManageServerButton>
              </ServerCardFooter>
            </ServerCard>
          );
        })}
        
        <AddServerCard onClick={() => setShowAddServer(true)}>
          <AddServerIcon>
            <FiPlus />
          </AddServerIcon>
          <AddServerText>Dodaj nowy serwer</AddServerText>
          <AddServerDescription>Kliknij tutaj, aby dodać nowy serwer Minecraft</AddServerDescription>
        </AddServerCard>
      </ServerGrid>

      <AddServer
        isOpen={showAddServer}
        onClose={() => setShowAddServer(false)}
        onServerAdded={fetchServers}
      />
    </ServersContainer>
  );
}

export default Servers;
