import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlay, 
  FiStopCircle, 
  FiRefreshCw, 
  FiSettings,
  FiArrowLeft,
  FiXCircle,
  FiUsers,
  FiCpu,
  FiHardDrive,
  FiActivity,
  FiBarChart2,
  FiDownload,
  FiUpload,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiServer
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProgressBar from './ProgressBar';
import { toast } from 'react-toastify';

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 15px;
  
  &:hover {
    color: #2563eb;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
`;

const ServerInfo = styled.div`
  display: flex;
  gap: 15px;
  margin-left: auto;
  align-items: center;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  
  ${props => props.$status === 'running' ? `
    background-color: #dcfce7;
    color: #16a34a;
  ` : `
    background-color: #fee2e2;
    color: #dc2626;
  `}
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Sidebar = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Section = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
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
  ` : `
    background-color: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  `}
  
  &:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 25px;
`;

const StatCard = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #3b82f6;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #374151;
`;

const InfoList = styled.div`
  margin-top: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #6b7280;
`;

const InfoValue = styled.span`
  font-weight: 500;
`;

const CancelButton = styled.button`
  margin-top: 15px;
  padding: 10px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: #dc2626;
  }
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
`;

const PerformanceCard = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
`;

const PerformanceValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => {
    if (props.$type === 'cpu') return props.$value > 80 ? '#ef4444' : props.$value > 60 ? '#f59e0b' : '#10b981';
    if (props.$type === 'memory') return props.$value > 85 ? '#ef4444' : props.$value > 70 ? '#f59e0b' : '#10b981';
    if (props.$type === 'tps') return props.$value < 15 ? '#ef4444' : props.$value < 18 ? '#f59e0b' : '#10b981';
    return '#374151';
  }};
  margin: 10px 0;
`;

const LogsContainer = styled.div`
  background: #1f2937;
  color: #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 15px;
`;

const LogLine = styled.div`
  margin-bottom: 4px;
  line-height: 1.4;
  color: ${props => {
    if (props.$level === 'ERROR') return '#ef4444';
    if (props.$level === 'WARN') return '#f59e0b';
    if (props.$level === 'INFO') return '#3b82f6';
    return '#e5e7eb';
  }};
`;

const QuickSettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 15px;
`;

const QuickSettingButton = styled.button`
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
    border-color: #3b82f6;
  }
  
  ${props => props.$active && `
    background: #e0e7ff;
    border-color: #3b82f6;
    color: #3730a3;
  `}
`;

const BackupList = styled.div`
  margin-top: 15px;
`;

const BackupItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f9fafb;
`;

const BackupActions = styled.div`
  display: flex;
  gap: 5px;
`;

const SmallButton = styled.button`
  padding: 5px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: #f3f4f6;
  }
  
  ${props => props.$variant === 'primary' && `
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover {
      background: #2563eb;
    }
  `}
`;

function ServerControl() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [progressInterval, setProgressInterval] = useState(null);
  const [pollingTimeout, setPollingTimeout] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [quickSettings, setQuickSettings] = useState({
    difficulty: 'easy',
    gamemode: 'survival',
    whitelist: false
  });

  useEffect(() => {
    fetchServer();
    fetchPerformanceStats();
    fetchBackups();
    fetchQuickSettings();
    
    // Set up interval for performance stats if server is running
    let performanceInterval;
    if (server?.status === 'running') {
      performanceInterval = setInterval(fetchPerformanceStats, 5000);
    }
    
    return () => {
      stopProgressPolling();
      if (performanceInterval) clearInterval(performanceInterval);
    };
  }, [serverId, server?.status]);

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
      
      if (response.data.status === 'stopped') {
        checkDownloadProgress();
      }
    } catch (error) {
      console.error('Error fetching server:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceStats = async () => {
    if (server?.status !== 'running') return;
    
    try {
      const response = await api.get(`/servers/${serverId}/performance`);
      setPerformanceStats(response.data);
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/backups`);
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const fetchQuickSettings = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/quick-settings`);
      setQuickSettings(response.data);
    } catch (error) {
      console.error('Error fetching quick settings:', error);
    }
  };

  const checkDownloadProgress = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/download-progress`);
      const progress = response.data;
      
      if (progress.status !== 'idle') {
        setDownloadProgress(progress);
        
        if (!['complete', 'error'].includes(progress.status)) {
          // Continue polling
        } else {
          stopProgressPolling();
          if (progress.status === 'complete') {
            setTimeout(fetchServer, 2000);
          }
        }
      } else {
        setDownloadProgress(null);
        stopProgressPolling();
      }
    } catch (error) {
      console.error('Error checking download progress:', error);
      setDownloadProgress(null);
      stopProgressPolling();
    }
  };

  const startProgressPolling = () => {
    stopProgressPolling();
    
    const interval = setInterval(checkDownloadProgress, 2000);
    setProgressInterval(interval);
    
    const timeout = setTimeout(() => {
      stopProgressPolling();
      setDownloadProgress({
        status: 'error',
        progress: 0,
        message: 'Timeout: Server start took too long (5 minutes)'
      });
    }, 5 * 60 * 1000);
    
    setPollingTimeout(timeout);
  };

  const stopProgressPolling = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      setPollingTimeout(null);
    }
  };

  const handleServerAction = async (action) => {
    setActionLoading(true);
    
    try {
      await api.post(`/servers/${serverId}/${action}`);
      
      if (action === 'start') {
        setTimeout(() => {
          startProgressPolling();
          setActionLoading(false);
        }, 1000);
      } else {
        setTimeout(() => {
          fetchServer();
          setDownloadProgress(null);
          setActionLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error(`Error ${action} server:`, error);
      alert(`Failed to ${action} server: ${error.response?.data?.error || error.message}`);
      setActionLoading(false);
    }
  };

  const handleCancelDownload = async () => {
    try {
      stopProgressPolling();
      
      setDownloadProgress({
        status: 'error',
        progress: 0,
        message: 'Pobieranie anulowane przez użytkownika'
      });
      
      try {
        await api.post(`/servers/${serverId}/stop`);
      } catch (stopError) {
        console.log('Server might not be running yet:', stopError);
      }
      
      setTimeout(() => fetchServer(), 1000);
      
    } catch (error) {
      console.error('Error cancelling download:', error);
      alert('Failed to cancel download');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await api.post(`/servers/${serverId}/backups`);
      toast.success('Backup created successfully');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleRestoreBackup = async (backupName) => {
    if (!window.confirm(`Are you sure you want to restore backup "${backupName}"? This will replace the current world.`)) {
      return;
    }

    try {
      await api.post(`/servers/${serverId}/backups/${backupName}/restore`);
      toast.success('Backup restored successfully');
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    }
  };

  const handleQuickSettingChange = async (setting, value) => {
    try {
      await api.post(`/servers/${serverId}/quick-settings`, {
        [setting]: value
      });
      setQuickSettings(prev => ({ ...prev, [setting]: value }));
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  if (loading) {
    return <Container>Loading server details...</Container>;
  }

  if (!server) {
    return <Container>Server not found</Container>;
  }

  const showProgress = downloadProgress && downloadProgress.status !== 'idle';
  const showCancelButton = showProgress && ['downloading', 'extracting', 'starting', 'preparing'].includes(downloadProgress.status);

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          <FiArrowLeft /> Back to Dashboard
        </BackButton>
        <Title>{server.name} Control Panel</Title>
        <ServerInfo>
          <StatusBadge $status={server.status}>
            {server.status.toUpperCase()}
          </StatusBadge>
          <span>{server.type.toUpperCase()} {server.version}</span>
        </ServerInfo>
      </Header>

      {showProgress && (
        <ProgressBar
          progress={downloadProgress.progress}
          status={downloadProgress.status}
          message={downloadProgress.message}
          totalSize={downloadProgress.total_size || 0}
          downloadedSize={downloadProgress.downloaded_size || 0}
          onCancel={handleCancelDownload}
        />
      )}

      <Content>
        <MainSection>
          {/* Server Information Section */}
          <Section>
            <SectionTitle>
              <FiServer /> Server Information
            </SectionTitle>
            
            <StatsGrid>
              <StatCard>
                <StatLabel><FiServer /> Server Type</StatLabel>
                <StatValue>{server.type.toUpperCase()}</StatValue>
              </StatCard>
              
              <StatCard>
                <StatLabel><FiActivity /> Version</StatLabel>
                <StatValue>{server.version}</StatValue>
              </StatCard>
              
              <StatCard>
                <StatLabel><FiBarChart2 /> Port</StatLabel>
                <StatValue>{server.port}</StatValue>
              </StatCard>
              
              <StatCard>
                <StatLabel><FiActivity /> Status</StatLabel>
                <StatValue>
                  <StatusBadge $status={server.status}>
                    {server.status.toUpperCase()}
                  </StatusBadge>
                </StatValue>
              </StatCard>
            </StatsGrid>

            <InfoList>
              <InfoItem>
                <InfoLabel>Created</InfoLabel>
                <InfoValue>{new Date(server.created_at).toLocaleDateString()}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Last Started</InfoLabel>
                <InfoValue>
                  {server.last_started 
                    ? new Date(server.last_started).toLocaleString() 
                    : 'Never'
                  }
                </InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Process ID</InfoLabel>
                <InfoValue>{server.pid || 'N/A'}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Server Path</InfoLabel>
                <InfoValue>{server.path}</InfoValue>
              </InfoItem>
            </InfoList>
          </Section>

          {/* Performance Stats Section */}
          {server.status === 'running' && performanceStats && (
            <Section>
              <SectionTitle>
                <FiCpu /> Performance Stats
              </SectionTitle>
              
              <PerformanceGrid>
                <PerformanceCard>
                  <StatLabel><FiCpu /> CPU Usage</StatLabel>
                  <PerformanceValue $type="cpu" $value={performanceStats.cpu_percent}>
                    {performanceStats.cpu_percent}%
                  </PerformanceValue>
                </PerformanceCard>
                
                <PerformanceCard>
                  <StatLabel><FiHardDrive /> Memory Usage</StatLabel>
                  <PerformanceValue $type="memory" $value={performanceStats.memory_percent}>
                    {performanceStats.memory_percent}%
                  </PerformanceValue>
                </PerformanceCard>
                
                <PerformanceCard>
                  <StatLabel><FiActivity /> TPS</StatLabel>
                  <PerformanceValue $type="tps" $value={performanceStats.tps}>
                    {performanceStats.tps}
                  </PerformanceValue>
                </PerformanceCard>
              </PerformanceGrid>

              <StatsGrid>
                <StatCard>
                  <StatLabel><FiUsers /> Players Online</StatLabel>
                  <StatValue>{performanceStats.players_online || 0}</StatValue>
                </StatCard>
                
                <StatCard>
                  <StatLabel><FiDownload /> Network Down</StatLabel>
                  <StatValue>{performanceStats.network_down || '0'} KB/s</StatValue>
                </StatCard>
                
                <StatCard>
                  <StatLabel><FiUpload /> Network Up</StatLabel>
                  <StatValue>{performanceStats.network_up || '0'} KB/s</StatValue>
                </StatCard>
                
                <StatCard>
                  <StatLabel><FiClock /> Uptime</StatLabel>
                  <StatValue>{performanceStats.uptime || '0'}s</StatValue>
                </StatCard>
              </StatsGrid>
            </Section>
          )}

          {/* Backups Section */}
          <Section>
            <SectionTitle>
              <FiHardDrive /> Backups
            </SectionTitle>
            
            <ActionButton onClick={handleCreateBackup} disabled={server.status === 'running'}>
              <FiDownload /> Create Backup
            </ActionButton>
            
            <BackupList>
              {backups.slice(0, 3).map(backup => (
                <BackupItem key={backup.name}>
                  <div>
                    <div>{backup.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {new Date(backup.created_at).toLocaleString()}
                    </div>
                  </div>
                  <BackupActions>
                    <SmallButton 
                      $variant="primary" 
                      onClick={() => handleRestoreBackup(backup.name)}
                      disabled={server.status === 'running'}
                    >
                      Restore
                    </SmallButton>
                  </BackupActions>
                </BackupItem>
              ))}
              
              {backups.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No backups available
                </div>
              )}
            </BackupList>
          </Section>
        </MainSection>

        <Sidebar>
          {/* Server Actions */}
          <SectionTitle>Server Actions</SectionTitle>
          
          <ActionButtons>
            <ActionButton
              $variant="start"
              onClick={() => handleServerAction('start')}
              disabled={server.status === 'running' || actionLoading || (downloadProgress && downloadProgress.status !== 'complete')}
            >
              <FiPlay /> Start Server
            </ActionButton>
            
            <ActionButton
              $variant="stop"
              onClick={() => handleServerAction('stop')}
              disabled={server.status === 'stopped' || actionLoading}
            >
              <FiStopCircle /> Stop Server
            </ActionButton>
            
            <ActionButton
              $variant="restart"
              onClick={() => handleServerAction('restart')}
              disabled={server.status === 'stopped' || actionLoading}
            >
              <FiRefreshCw /> Restart Server
            </ActionButton>
            
            <ActionButton
              onClick={() => navigate(`/servers/${serverId}/settings`)}
              disabled={actionLoading}
            >
              <FiSettings /> Server Settings
            </ActionButton>
          </ActionButtons>

          {/* Quick Settings */}
          {server.status === 'running' && (
            <>
              <SectionTitle style={{ marginTop: '30px' }}>Quick Settings</SectionTitle>
              
              <QuickSettingsGrid>
                <QuickSettingButton
                  $active={quickSettings.difficulty === 'peaceful'}
                  onClick={() => handleQuickSettingChange('difficulty', 'peaceful')}
                >
                  Peaceful
                </QuickSettingButton>
                <QuickSettingButton
                  $active={quickSettings.difficulty === 'easy'}
                  onClick={() => handleQuickSettingChange('difficulty', 'easy')}
                >
                  Easy
                </QuickSettingButton>
                <QuickSettingButton
                  $active={quickSettings.difficulty === 'normal'}
                  onClick={() => handleQuickSettingChange('difficulty', 'normal')}
                >
                  Normal
                </QuickSettingButton>
                <QuickSettingButton
                  $active={quickSettings.difficulty === 'hard'}
                  onClick={() => handleQuickSettingChange('difficulty', 'hard')}
                >
                  Hard
                </QuickSettingButton>
              </QuickSettingsGrid>

              <QuickSettingsGrid style={{ marginTop: '10px' }}>
                <QuickSettingButton
                  $active={quickSettings.gamemode === 'survival'}
                  onClick={() => handleQuickSettingChange('gamemode', 'survival')}
                >
                  Survival
                </QuickSettingButton>
                <QuickSettingButton
                  $active={quickSettings.gamemode === 'creative'}
                  onClick={() => handleQuickSettingChange('gamemode', 'creative')}
                >
                  Creative
                </QuickSettingButton>
                <QuickSettingButton
                  $active={quickSettings.whitelist}
                  onClick={() => handleQuickSettingChange('whitelist', !quickSettings.whitelist)}
                >
                  {quickSettings.whitelist ? 'Whitelist ✓' : 'Whitelist'}
                </QuickSettingButton>
              </QuickSettingsGrid>
            </>
          )}

          {/* Quick Navigation */}
          <SectionTitle style={{ marginTop: '30px' }}>Quick Navigation</SectionTitle>
          
          <ActionButtons>
            <ActionButton onClick={() => navigate(`/servers/${serverId}/console`)}>
              Console
            </ActionButton>
            
            <ActionButton onClick={() => navigate(`/servers/${serverId}/files`)}>
              File Manager
            </ActionButton>
            
            <ActionButton onClick={() => navigate(`/servers/${serverId}/users`)}>
              User Management
            </ActionButton>
            
            <ActionButton onClick={() => navigate(`/servers/${serverId}/plugins`)}>
              Plugin Manager
            </ActionButton>
          </ActionButtons>
        </Sidebar>
      </Content>
    </Container>
  );
}

export default ServerControl;