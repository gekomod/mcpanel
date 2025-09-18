import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiServer, 
  FiPlay, 
  FiStopCircle, 
  FiRefreshCw, 
  FiActivity,
  FiCpu,
  FiHardDrive,
  FiPlus,
  FiSettings,
  FiTrash2,
  FiAlertCircle,
  FiDownload,
  FiXCircle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AddServer from './AddServer';

const DashboardContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  color: #374151;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #059669;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 20px;
  color: #3b82f6;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #374151;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
`;

const ServerList = styled.div`
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ServerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
  cursor: pointer;
  
  &:hover {
    background: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ServerInfo = styled.div`
  flex: 1;
`;

const ServerName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ServerDetails = styled.div`
  display: flex;
  gap: 15px;
  color: #6b7280;
  font-size: 0.9rem;
  align-items: center;
  flex-wrap: wrap;
`;

const ServerStatus = styled.span.attrs(props => ({
  style: {
    backgroundColor: props['data-status'] === 'running' ? '#dcfce7' : '#fee2e2',
    color: props['data-status'] === 'running' ? '#16a34a' : '#dc2626'
  }
}))`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ServerActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  ${props => props.$variant === 'start' ? `
    background-color: #10b981;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #059669;
    }
  ` : props.$variant === 'stop' ? `
    background-color: #ef4444;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #dc2626;
    }
  ` : props.$variant === 'restart' ? `
    background-color: #f59e0b;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #d97706;
    }
  ` : props.$variant === 'settings' ? `
    background-color: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  ` : props.$variant === 'delete' ? `
    background-color: #6b7280;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #4b5563;
    }
  ` : ''}
  
  &:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 20px;
`;

const EmptyStateText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 20px;
`;

const StatusMismatchIndicator = styled.span`
  color: #f59e0b;
  font-size: 0.8rem;
  margin-left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 10px 15px;
  border-radius: 6px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
`;

function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddServer, setShowAddServer] = useState(false);
  const [statusChecks, setStatusChecks] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const [serverSizes, setServerSizes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
    
    // Set up interval to check real server status every 10 seconds
    const interval = setInterval(checkRealStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const response = await api.get('/servers');
      const serversData = response.data;
      setServers(serversData);
      
      // Check real status for each server
      serversData.forEach(server => {
        checkServerRealStatus(server.id);
      });
      
      // Fetch sizes for all servers
      fetchServerSizes(serversData);
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchServerSizes = async (serversList) => {
    const sizes = {};
    
    for (const server of serversList) {
      try {
        const response = await api.get(`/servers/${server.id}/size`);
        sizes[server.id] = response.data.size_gb;
      } catch (error) {
        console.error(`Error fetching size for server ${server.id}:`, error);
        sizes[server.id] = 0;
      }
    }
    
    setServerSizes(sizes);
  };

  const checkServerRealStatus = async (serverId) => {
    try {
      const response = await api.get(`/servers/${serverId}/real-status`);
      const statusData = response.data;
      
      setStatusChecks(prev => ({
        ...prev,
        [serverId]: statusData
      }));
      
      // If real status differs from database, update the server list
      const serverIndex = servers.findIndex(s => s.id === serverId);
      if (serverIndex !== -1) {
        const realStatus = statusData.real_status.running ? 'running' : 'stopped';
        if (servers[serverIndex].status !== realStatus) {
          // Update the server status in local state
          const updatedServers = [...servers];
          updatedServers[serverIndex] = {
            ...updatedServers[serverIndex],
            status: realStatus
          };
          setServers(updatedServers);
        }
      }
    } catch (error) {
      console.error('Error checking real status:', error);
    }
  };

  const checkRealStatus = () => {
    servers.forEach(server => {
      checkServerRealStatus(server.id);
    });
  };

  const handleServerAction = async (serverId, action) => {
    // Clear any previous error for this server
    setActionErrors(prev => ({ ...prev, [serverId]: null }));
    
    try {
      await api.post(`/servers/${serverId}/${action}`);
      
      // Update local state immediately for better UX
      const serverIndex = servers.findIndex(s => s.id === serverId);
      if (serverIndex !== -1) {
        const updatedServers = [...servers];
        if (action === 'start') {
          updatedServers[serverIndex] = {
            ...updatedServers[serverIndex],
            status: 'starting'
          };
        } else if (action === 'stop') {
          updatedServers[serverIndex] = {
            ...updatedServers[serverIndex],
            status: 'stopping'
          };
        } else if (action === 'restart') {
          updatedServers[serverIndex] = {
            ...updatedServers[serverIndex],
            status: 'restarting'
          };
        }
        setServers(updatedServers);
      }
      
      // Wait a bit and check real status
      setTimeout(() => {
        checkServerRealStatus(serverId);
        fetchServers();
      }, 3000);
    } catch (error) {
      console.error(`Error ${action} server:`, error);
      const errorMessage = error.response?.data?.error || error.message;
      
      // Store error for this server
      setActionErrors(prev => ({ ...prev, [serverId]: errorMessage }));
      
      // If action failed, refresh server status
      setTimeout(() => {
        checkServerRealStatus(serverId);
        fetchServers();
      }, 1000);
    }
  };

  const handleDeleteServer = async (serverId, serverName) => {
    if (!window.confirm(`Are you sure you want to delete server "${serverName}"?`)) {
      return;
    }

    try {
      await api.delete(`/servers/${serverId}`);
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Failed to delete server');
    }
  };

  const handleServerAdded = () => {
    fetchServers();
  };

  const getServerStatus = (server) => {
    const statusCheck = statusChecks[server.id];
    
    // If we have real status check and it differs from database
    if (statusCheck && statusCheck.database_status !== (statusCheck.real_status.running ? 'running' : 'stopped')) {
      return statusCheck.real_status.running ? 'running' : 'stopped';
    }
    
    return server.status;
  };

  const isServerReallyRunning = (server) => {
    const statusCheck = statusChecks[server.id];
    if (statusCheck) {
      return statusCheck.real_status.running;
    }
    return server.status === 'running';
  };

  const hasStatusMismatch = (server) => {
    const statusCheck = statusChecks[server.id];
    if (!statusCheck) return false;
    
    const realStatus = statusCheck.real_status.running ? 'running' : 'stopped';
    return statusCheck.database_status !== realStatus;
  };

  const isServerInTransition = (server) => {
    return ['starting', 'stopping', 'restarting', 'downloading'].includes(server.status);
  };

  const runningServers = servers.filter(server => {
    const statusCheck = statusChecks[server.id];
    if (statusCheck) {
      return statusCheck.real_status.running;
    }
    return server.status === 'running';
  }).length;

  // Calculate total storage used
  const totalStorageUsed = Object.values(serverSizes).reduce((total, size) => total + size, 0);

  if (loading) {
    return <DashboardContainer>Loading servers...</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Server Dashboard</Title>
        <AddButton onClick={() => setShowAddServer(true)}>
          <FiPlus /> Add Server
        </AddButton>
      </Header>
      
      <StatsGrid>
        <StatCard>
          <StatIcon>
            <FiServer />
          </StatIcon>
          <StatContent>
            <StatValue>{servers.length}</StatValue>
            <StatLabel>Total Servers</StatLabel>
          </StatContent>
        </StatCard>
        
        <StatCard>
          <StatIcon>
            <FiActivity />
          </StatIcon>
          <StatContent>
            <StatValue>{runningServers}</StatValue>
            <StatLabel>Running Servers</StatLabel>
          </StatContent>
        </StatCard>
        
        <StatCard>
          <StatIcon>
            <FiCpu />
          </StatIcon>
          <StatContent>
            <StatValue>{servers.length - runningServers}</StatValue>
            <StatLabel>Stopped Servers</StatLabel>
          </StatContent>
        </StatCard>
        
        <StatCard>
          <StatIcon>
            <FiHardDrive />
          </StatIcon>
          <StatContent>
            <StatValue>{totalStorageUsed.toFixed(1)}GB</StatValue>
            <StatLabel>Total Storage Used</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>
      
      <ServerList>
        {servers.map(server => {
          const realStatus = getServerStatus(server);
          const isReallyRunning = isServerReallyRunning(server);
          const statusMismatch = hasStatusMismatch(server);
          const inTransition = isServerInTransition(server);
          const error = actionErrors[server.id];
          const serverSize = serverSizes[server.id] || 0;
          
          return (
            <div key={server.id}>
              <ServerItem onClick={() => navigate(`/servers/${server.id}`)}>
                <ServerInfo>
                  <ServerName>
                    {server.name}
                    {server.status === 'downloading' && (
                      <FiDownload style={{ color: '#3b82f6' }} />
                    )}
                    {statusMismatch && (
                      <FiAlertCircle 
                        style={{ color: '#f59e0b' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          checkServerRealStatus(server.id);
                          fetchServers();
                        }}
                        title="Status mismatch - click to refresh"
                      />
                    )}
                  </ServerName>
                  <ServerDetails>
                    <span>{server.type.toUpperCase()} {server.version}</span>
                    <span>Port: {server.port}</span>
                    <span>Size: {serverSize.toFixed(1)}GB</span>
                    <ServerStatus data-status={realStatus}>
                      {realStatus.toUpperCase()}
                      {statusMismatch && ' *'}
                      {inTransition && '...'}
                    </ServerStatus>
                    {statusMismatch && (
                      <StatusMismatchIndicator title="Status differs from database">
                        <FiAlertCircle />
                        (was: {server.status})
                      </StatusMismatchIndicator>
                    )}
                  </ServerDetails>
                </ServerInfo>
                
                <ServerActions onClick={(e) => e.stopPropagation()}>
                  <ActionButton
                    $variant="start"
                    onClick={() => handleServerAction(server.id, 'start')}
                    disabled={isReallyRunning || inTransition}
                  >
                    <FiPlay /> Start
                  </ActionButton>
                  
                  <ActionButton
                    $variant="stop"
                    onClick={() => handleServerAction(server.id, 'stop')}
                    disabled={!isReallyRunning || inTransition}
                  >
                    <FiStopCircle /> Stop
                  </ActionButton>
                  
                  <ActionButton
                    $variant="restart"
                    onClick={() => handleServerAction(server.id, 'restart')}
                    disabled={!isReallyRunning || inTransition}
                  >
                    <FiRefreshCw /> Restart
                  </ActionButton>
                  
                  <ActionButton
                    $variant="settings"
                    onClick={() => navigate(`/servers/${server.id}/settings`)}
                    disabled={inTransition}
                  >
                    <FiSettings /> Settings
                  </ActionButton>
                  
                  <ActionButton
                    $variant="delete"
                    onClick={() => handleDeleteServer(server.id, server.name)}
                    disabled={inTransition}
                  >
                    <FiTrash2 /> Delete
                  </ActionButton>
                </ServerActions>
              </ServerItem>
              
              {error && (
                <ErrorMessage>
                  <FiXCircle />
                  {error}
                </ErrorMessage>
              )}
            </div>
          );
        })}
        
        {servers.length === 0 && (
          <EmptyState>
            <EmptyStateIcon>
              <FiServer />
            </EmptyStateIcon>
            <EmptyStateText>No servers found</EmptyStateText>
            <AddButton onClick={() => setShowAddServer(true)}>
              <FiPlus /> Create Your First Server
            </AddButton>
          </EmptyState>
        )}
      </ServerList>

      <AddServer
        isOpen={showAddServer}
        onClose={() => setShowAddServer(false)}
        onServerAdded={handleServerAdded}
      />
    </DashboardContainer>
  );
}

export default Dashboard;
