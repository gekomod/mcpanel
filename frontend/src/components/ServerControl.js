import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPlay, 
  FiStopCircle, 
  FiRefreshCw, 
  FiSettings,
  FiCopy,
  FiPower,
  FiTerminal,
  FiKey,
  FiDownload,
  FiUpload,
  FiCpu,
  FiHardDrive,
  FiServer,
  FiUsers,
  FiActivity,
  FiBarChart2,
  FiClock,
  FiFolder,
  FiShield,
  FiBox,
  FiUser
} from 'react-icons/fi';
import { FaWrench } from "react-icons/fa";
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProgressBar from './ProgressBar';
import { toast } from 'react-toastify';

const Container = styled.div`
  padding: 15px 20px;
  color: #a4aabc;
`;

const NavTabs = styled.div`
  display: flex;
  background: #2e3245;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 15px;
  gap: 4px;
`;

const NavTab = styled.div`
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: #a4aabc;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${props => props.$active && `
    background: #3b82f6;
    color: white;
  `}
  
  &:hover {
    background: #35394e;
  }
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ServerInfo = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
`;

const ServerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const ServerTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
`;

const ServerStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  
  ${props => props.$status === 'running' ? `
    background-color: #065f46;
    color: #10b981;
  ` : `
    background-color: #991b1b;
    color: #ef4444;
  `}
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  ${props => props.$status === 'running' ? `
    background-color: #10b981;
  ` : `
    background-color: #ef4444;
  `}
`;

const ServerDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
`;

const DetailCard = styled.div`
  background-color: #35394e;
  border-radius: 8px;
  padding: 15px;
`;

const DetailTitle = styled.div`
  font-size: 12px;
  color: #a4aabc;
  margin-bottom: 5px;
  font-weight: 500;
`;

const DetailValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 14px;
`;

const ServerActions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
  }
  
  ${props => props.$variant === 'secondary' && `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover:not(:disabled) {
      background: #565d81;
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background: #dc2626;
    
    &:hover:not(:disabled) {
      background: #b91c1c;
    }
  `}
`;

const InstanceContainer = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
`;

const InstanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3f57;
`;

const InstanceTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const InstanceDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const QuickTasks = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
`;

const TasksHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3f57;
`;

const TasksTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const TaskButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

const TaskButton = styled.button`
  background: #35394e;
  border: 1px solid #3a3f57;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1;
  
  &:hover {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
`;

const ConsoleContainer = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
`;

const ConsoleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3f57;
`;

const ConsoleTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const ConsoleContent = styled.div`
  background: #35394e;
  border-radius: 6px;
  padding: 15px;
  height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
  font-family: monospace;
  font-size: 14px;
  color: #a4aabc;
`;

const ConsoleInput = styled.div`
  display: flex;
  gap: 10px;
  
  input {
    flex: 1;
    background: #35394e;
    border: 1px solid #3a3f57;
    border-radius: 6px;
    padding: 10px 15px;
    color: #fff;
    font-family: monospace;
  }
  
  button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 15px;
    cursor: pointer;
  }
`;

const UsageContainer = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
`;

const UsageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3f57;
`;

const UsageTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const UsageMetrics = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
`;

const MetricCard = styled.div`
  background: #35394e;
  border-radius: 8px;
  padding: 15px;
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const MetricName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
`;

const MetricValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #3b82f6;
`;

const ProgressBarContainer = styled.div`
  height: 6px;
  background-color: #3a3f57;
  border-radius: 3px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  background: #3b82f6;
  border-radius: 3px;
  width: ${props => props.$width || '0%'};
`;

const Footer = styled.footer`
  text-align: center;
  padding: 20px 0;
  margin-top: 30px;
  border-top: 1px solid #3a3f57;
  color: #a4aabc;
  font-size: 14px;
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
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchServer();
    fetchPerformanceStats();
    fetchBackups();
    
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

  const handleConsoleSubmit = () => {
    if (consoleInput.trim() !== '') {
      // Send command to server
      api.post(`/servers/${serverId}/console`, { command: consoleInput })
        .then(response => {
          setConsoleLogs([...consoleLogs, `> ${consoleInput}`, ...response.data.output.split('\n')]);
        })
        .catch(error => {
          console.error('Error sending command:', error);
          setConsoleLogs([...consoleLogs, `> ${consoleInput}`, `Error: ${error.response?.data?.error || error.message}`]);
        });
      
      setConsoleInput('');
      
      // Scroll to bottom of console
      const consoleElement = document.querySelector('.console-content');
      if (consoleElement) {
        setTimeout(() => {
          consoleElement.scrollTop = consoleElement.scrollHeight;
        }, 100);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Skopiowano do schowka: ' + text);
    }).catch(err => {
      console.error('Błąd podczas kopiowania: ', err);
    });
  };

  // Fetch console logs
  useEffect(() => {
    if (server?.status === 'running') {
      const fetchLogs = async () => {
        try {
          const response = await api.get(`/servers/${serverId}/logs`);
          setConsoleLogs(response.data.logs || []);
        } catch (error) {
          console.error('Error fetching logs:', error);
        }
      };
      
      fetchLogs();
      const logInterval = setInterval(fetchLogs, 10000); // Update logs every 10 seconds
      
      return () => clearInterval(logInterval);
    }
  }, [serverId, server?.status]);

  if (loading) {
    return <Container>Loading server details...</Container>;
  }

  if (!server) {
    return <Container>Server not found</Container>;
  }

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          <FiActivity /> Overview
        </NavTab>
        <NavTab 
          $active={activeTab === 'console'} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> Console
        </NavTab>
        <NavTab 
          $active={activeTab === 'files'} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> Files
        </NavTab>
        <NavTab 
          $active={activeTab === 'config'} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <FiSettings /> Config
        </NavTab>
        <NavTab 
          $active={activeTab === 'plugins'} 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> Plugins
        </NavTab>
        <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> Users
        </NavTab>
      </NavTabs>

      {downloadProgress && downloadProgress.status !== 'idle' && (
        <ProgressBar
          progress={downloadProgress.progress}
          status={downloadProgress.status}
          message={downloadProgress.message}
          totalSize={downloadProgress.total_size || 0}
          downloadedSize={downloadProgress.downloaded_size || 0}
          onCancel={handleCancelDownload}
        />
      )}

      <ContentLayout>
        <Column>
          <ServerInfo>
            <ServerHeader>
              <ServerTitle>{server.name}</ServerTitle>
              <ServerStatus $status={server.status}>
                <StatusIndicator $status={server.status} />
                <span>{server.status === 'running' ? 'Online' : 'Offline'}</span>
              </ServerStatus>
            </ServerHeader>
            <ServerDetails>
              <DetailCard>
                <DetailTitle>ADRES IP</DetailTitle>
                <DetailValue>
                  <span>{server.ip || 'mc.shockbyte.com'}:{server.port}</span>
                  <CopyButton onClick={() => copyToClipboard(`${server.ip || 'mc.shockbyte.com'}:${server.port}`)}>
                    <FiCopy />
                  </CopyButton>
                </DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>WERSJA</DetailTitle>
                <DetailValue>{server.version}</DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>OSTATNIA AKTYWNOŚĆ</DetailTitle>
                <DetailValue>
                  {server.last_started 
                    ? new Date(server.last_started).toLocaleString() 
                    : 'Nigdy'
                  }
                </DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>LOKALIZACJA</DetailTitle>
                <DetailValue>{server.location || 'Europa (Frankfurt)'}</DetailValue>
              </DetailCard>
            </ServerDetails>
          </ServerInfo>

          <ServerActions>
            <ActionButton 
              onClick={() => handleServerAction('start')} 
              disabled={server.status === 'running' || actionLoading || (downloadProgress && downloadProgress.status !== 'complete')}
            >
              <FiPower /> Uruchom Serwer
            </ActionButton>
            <ActionButton 
              $variant="secondary" 
              onClick={() => handleServerAction('restart')} 
              disabled={server.status === 'stopped' || actionLoading}
            >
              <FiRefreshCw /> Restartuj Serwer
            </ActionButton>
            <ActionButton $variant="secondary" onClick={() => navigate(`/servers/${serverId}/console`)}>
              <FiTerminal /> Konsola
            </ActionButton>
            <ActionButton 
              $variant="danger" 
              onClick={() => handleServerAction('stop')} 
              disabled={server.status === 'stopped' || actionLoading}
            >
              <FiStopCircle /> Zatrzymaj Serwer
            </ActionButton>
          </ServerActions>

          <InstanceContainer>
            <InstanceHeader>
              <InstanceTitle>Aktywna Instancja</InstanceTitle>
            </InstanceHeader>
            <InstanceDetails>
              <DetailCard>
                <DetailTitle>NAZWA</DetailTitle>
                <DetailValue>{server.name}</DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>TYP</DetailTitle>
                <DetailValue>{server.type.toUpperCase()}</DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>WERSJA</DetailTitle>
                <DetailValue>{server.version}</DetailValue>
              </DetailCard>
            </InstanceDetails>
          </InstanceContainer>

          <QuickTasks>
            <TasksHeader>
              <TasksTitle>Szybkie Zadania</TasksTitle>
            </TasksHeader>
            <TaskButtons>
              <TaskButton onClick={handleCreateBackup} disabled={server.status === 'running'}>
                <FiDownload /> Kopia zapasowa
              </TaskButton>
              <TaskButton>
                <FiUpload /> Prześlij świat
              </TaskButton>
              <TaskButton>
                <FaWrench /> Napraw serwer
              </TaskButton>
              <TaskButton onClick={() => navigate(`/servers/${serverId}/users`)}>
                <FiUsers /> Uprawnienia
              </TaskButton>
            </TaskButtons>
          </QuickTasks>
        </Column>

        <Column>
          <ConsoleContainer>
            <ConsoleHeader>
              <ConsoleTitle>Konsola Serwera</ConsoleTitle>
            </ConsoleHeader>
            <ConsoleContent className="console-content">
              {consoleLogs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </ConsoleContent>
            <ConsoleInput>
              <input 
                type="text" 
                placeholder="Wpisz komendę..." 
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConsoleSubmit()}
                disabled={server.status !== 'running'}
              />
              <button onClick={handleConsoleSubmit} disabled={server.status !== 'running'}>Wyślij</button>
            </ConsoleInput>
          </ConsoleContainer>

          <UsageContainer>
            <UsageHeader>
              <UsageTitle>Zasoby</UsageTitle>
            </UsageHeader>
            <UsageMetrics>
              <MetricCard>
                <MetricHeader>
                  <MetricName>CPU</MetricName>
                  <MetricValue>
                    {performanceStats ? `${performanceStats.cpu_percent}%` : '0%'}
                  </MetricValue>
                </MetricHeader>
                <ProgressBarContainer>
                  <Progress $width={performanceStats ? `${performanceStats.cpu_percent}%` : '0%'} />
                </ProgressBarContainer>
              </MetricCard>
              <MetricCard>
                <MetricHeader>
                  <MetricName>Pamięć RAM</MetricName>
                  <MetricValue>
                    {performanceStats ? `${performanceStats.memory_used} / ${performanceStats.memory_max}` : '0GB / 0GB'}
                  </MetricValue>
                </MetricHeader>
                <ProgressBarContainer>
                  <Progress $width={performanceStats ? `${performanceStats.memory_percent}%` : '0%'} />
                </ProgressBarContainer>
              </MetricCard>
              <MetricCard>
                <MetricHeader>
                  <MetricName>Dysk</MetricName>
                  <MetricValue>
                    {server.disk_usage ? `${server.disk_usage.used} / ${server.disk_usage.total}` : '0GB / 0GB'}
                  </MetricValue>
                </MetricHeader>
                <ProgressBarContainer>
                  <Progress $width={server.disk_usage ? `${server.disk_usage.percent}%` : '0%'} />
                </ProgressBarContainer>
              </MetricCard>
            </UsageMetrics>
          </UsageContainer>
        </Column>
      </ContentLayout>
    </Container>
  );
}

export default ServerControl;
