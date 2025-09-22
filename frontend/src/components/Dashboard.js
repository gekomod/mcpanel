import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiServer, 
  FiPlay, 
  FiStopCircle, 
  FiRefreshCw, 
  FiCpu,
  FiHardDrive,
  FiPlus,
  FiSettings,
  FiTrash2,
  FiAlertCircle,
  FiDownload,
  FiXCircle,
  FiUserPlus,
  FiCheckCircle,
  FiUsers
} from 'react-icons/fi';
import { FaTimesCircle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AddServer from './AddServer';
import AddUserDialog from './AddUserDialog';

const DashboardContainer = styled.div`
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
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #2563eb;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #3a3f57;
  display: flex;
  flex-direction: column;
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const StatTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #a4aabc;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background-color: ${props => props.$bgColor};
  color: ${props => props.$color};
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #fff;
`;

const StatLabel = styled.div`
  color: #a4aabc;
  font-size: 14px;
`;

const ServerList = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 0;
  border: 1px solid #3a3f57;
  overflow: hidden;
  margin-bottom: 30px;
`;

const ServerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #3a3f57;
  transition: background-color 0.2s;
  cursor: pointer;
  
  &:hover {
    background: #222b43;
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
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
`;

const ServerDetails = styled.div`
  display: flex;
  gap: 15px;
  color: #a4aabc;
  font-size: 0.9rem;
  align-items: center;
  flex-wrap: wrap;
`;

const ServerStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => props.$status === 'running' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(248, 113, 113, 0.2)'};
  color: ${props => props.$status === 'running' ? '#10b981' : '#f87171'};
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
  background: #35394e;
  border: 1px solid #3a3f57;
  color: #a4aabc;
  
  &:hover:not(:disabled) {
    background: ${props => {
      switch(props.$variant) {
        case 'start': return '#10b981';
        case 'stop': return '#ef4444';
        case 'restart': return '#f59e0b';
        case 'settings': return '#3b82f6';
        case 'delete': return '#6b7280';
        default: return '#3b82f6';
      }
    }};
    border-color: ${props => {
      switch(props.$variant) {
        case 'start': return '#10b981';
        case 'stop': return '#ef4444';
        case 'restart': return '#f59e0b';
        case 'settings': return '#3b82f6';
        case 'delete': return '#6b7280';
        default: return '#3b82f6';
      }
    }};
    color: white;
  }
  
  &:disabled {
    background: #4b5563;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #a4aabc;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  color: #6b7293;
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
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
  padding: 10px 15px;
  border-radius: 6px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  border: 1px solid rgba(220, 38, 38, 0.3);
`;

const RecentActivity = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #3a3f57;
  margin-bottom: 30px;
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ActivityTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const ActivityList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ActivityItem = styled.li`
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #3a3f57;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 16px;
  background-color: ${props => props.$bgColor};
  color: ${props => props.$color};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityServer = styled.div`
  font-weight: 600;
  color: #fff;
  margin-bottom: 3px;
`;

const ActivityDescription = styled.div`
  font-size: 14px;
  color: #a4aabc;
`;

const ActivityTime = styled.div`
  font-size: 12px;
  color: #6b7293;
`;

const QuickActions = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #3a3f57;
`;

const ActionsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ActionsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
`;

const ActionButtonCard = styled.div`
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3b82f6;
    border-color: #3b82f6;
    
    .action-icon {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    
    .action-text {
      color: #fff;
    }
  }
`;

const ActionIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  font-size: 20px;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  transition: all 0.2s ease;
`;

const ActionText = styled.div`
  font-weight: 500;
  color: #a4aabc;
  text-align: center;
  transition: all 0.2s ease;
`;

function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddServer, setShowAddServer] = useState(false);
  const [statusChecks, setStatusChecks] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const [serverSizes, setServerSizes] = useState({});
  const navigate = useNavigate();
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    fetchServers();
    
    const interval = setInterval(checkRealStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const response = await api.get('/servers');
      const serversData = response.data;
      setServers(serversData);
      
      serversData.forEach(server => {
        checkServerRealStatus(server.id);
      });
      
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
      
      const serverIndex = servers.findIndex(s => s.id === serverId);
      if (serverIndex !== -1) {
        const realStatus = statusData.real_status.running ? 'running' : 'stopped';
        if (servers[serverIndex].status !== realStatus) {
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
    setActionErrors(prev => ({ ...prev, [serverId]: null }));
    
    try {
      await api.post(`/servers/${serverId}/${action}`);
      
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
      
      setTimeout(() => {
        checkServerRealStatus(serverId);
        fetchServers();
      }, 3000);
    } catch (error) {
      console.error(`Error ${action} server:`, error);
      const errorMessage = error.response?.data?.error || error.message;
      
      setActionErrors(prev => ({ ...prev, [serverId]: errorMessage }));
      
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
  
  const handleUserAdded = () => {
    console.log('User added - refresh users list if needed');
  };

  const totalStorageUsed = Object.values(serverSizes).reduce((total, size) => total + size, 0);

  if (loading) {
    return <DashboardContainer>Loading servers...</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <ButtonGroup>
          <AddButton onClick={() => setShowAddUser(true)}>
            <FiUserPlus /> Add User
          </AddButton>
          <AddButton onClick={() => setShowAddServer(true)}>
            <FiPlus /> Add Server
          </AddButton>
        </ButtonGroup>
      </Header>
      
      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Total Servers</StatTitle>
            <StatIcon $bgColor="rgba(59, 130, 246, 0.2)" $color="#3b82f6">
              <FiServer />
            </StatIcon>
          </StatHeader>
          <StatValue>{servers.length}</StatValue>
          <StatLabel>All your servers</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Running Servers</StatTitle>
            <StatIcon $bgColor="rgba(16, 185, 129, 0.2)" $color="#10b981">
              <FiCheckCircle />
            </StatIcon>
          </StatHeader>
          <StatValue>{runningServers}</StatValue>
          <StatLabel>Active servers</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Stopped Servers</StatTitle>
            <StatIcon $bgColor="rgba(248, 113, 113, 0.2)" $color="#f87171">
              <FaTimesCircle />
            </StatIcon>
          </StatHeader>
          <StatValue>{servers.length - runningServers}</StatValue>
          <StatLabel>Inactive servers</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Players Online</StatTitle>
            <StatIcon $bgColor="rgba(139, 92, 246, 0.2)" $color="#8b5cf6">
              <FiUsers />
            </StatIcon>
          </StatHeader>
          <StatValue>24</StatValue>
          <StatLabel>Across all servers</StatLabel>
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
                    <ServerStatus $status={realStatus}>
                      {realStatus === 'running' ? <FiCheckCircle /> : <FaTimesCircle />}
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

      <QuickActions>
        <ActionsHeader>
          <ActionsTitle>Quick Actions</ActionsTitle>
        </ActionsHeader>
        <ActionsGrid>
          <ActionButtonCard onClick={() => setShowAddServer(true)}>
            <ActionIcon className="action-icon">
              <FiPlus />
            </ActionIcon>
            <ActionText className="action-text">Add Server</ActionText>
          </ActionButtonCard>
          <ActionButtonCard onClick={() => {
            servers.forEach(server => {
              if (isServerReallyRunning(server)) {
                handleServerAction(server.id, 'restart');
              }
            });
          }}>
            <ActionIcon className="action-icon">
              <FiRefreshCw />
            </ActionIcon>
            <ActionText className="action-text">Restart All</ActionText>
          </ActionButtonCard>
          <ActionButtonCard onClick={() => {
            servers.forEach(server => {
              if (!isServerReallyRunning(server)) {
                handleServerAction(server.id, 'start');
              }
            });
          }}>
            <ActionIcon className="action-icon">
              <FiPlay />
            </ActionIcon>
            <ActionText className="action-text">Start All</ActionText>
          </ActionButtonCard>
          <ActionButtonCard onClick={() => alert('Backup functionality coming soon!')}>
            <ActionIcon className="action-icon">
              <FiDownload />
            </ActionIcon>
            <ActionText className="action-text">Backup</ActionText>
          </ActionButtonCard>
        </ActionsGrid>
      </QuickActions>

      <AddServer
        isOpen={showAddServer}
        onClose={() => setShowAddServer(false)}
        onServerAdded={handleServerAdded}
      />
      
      <AddUserDialog
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        onUserAdded={handleUserAdded}
      />
    </DashboardContainer>
  );
}

export default Dashboard;
