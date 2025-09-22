import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
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
  FiUser,
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.$variant === 'danger') return '#dc2626';
    if (props.$variant === 'secondary') return '#4a5070';
    if (props.$variant === 'success') return '#065f46';
    return '#3b82f6';
  }};
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
  min-width: 140px;
  
  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$variant === 'danger') return '#b91c1c';
      if (props.$variant === 'secondary') return '#565d81';
      if (props.$variant === 'success') return '#064e3b';
      return '#2563eb';
    }};
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const StatusMessage = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 500;
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

const ConsoleTabs = styled.div`
  display: flex;
  background: #35394e;
  border-radius: 6px;
  padding: 4px;
  margin-bottom: 15px;
  gap: 2px;
`;

const ConsoleTab = styled.div`
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.8rem;
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
    background: #3a3f57;
  }
`;

const TabBadge = styled.span`
  background: ${props => {
    switch(props.$type) {
      case 'ERROR': return '#ef4444';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
`;

const ConsoleContent = styled.div`
  background: #1a1d2b;
  border-radius: 6px;
  padding: 15px;
  height: 280px;
  overflow-y: auto;
  margin-bottom: 15px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #a4aabc;
  line-height: 1.4;
`;

const LogLine = styled.div`
  margin: 2px 0;
  white-space: pre-wrap;
  word-break: break-all;
  
  /* Domyślny kolor dla niezidentyfikowanych logów */
  color: #a4aabc;
  
  /* Kolory dla różnych typów logów */
  ${props => props.$type === 'INFO' && `
    color: #3b82f6; /* Niebieski dla INFO */
  `}
  
  ${props => props.$type === 'WARN' && `
    color: #f59e0b; /* Żółty/pomarańczowy dla WARN */
    font-weight: 500;
  `}
  
  ${props => props.$type === 'ERROR' && `
    color: #ef4444; /* Czerwony dla ERROR */
    font-weight: 600;
  `}
  
  ${props => props.$type === 'DEBUG' && `
    color: #10b981; /* Zielony dla DEBUG */
  `}
  
  ${props => props.$type === 'COMMAND' && `
    color: #8b5cf6; /* Fioletowy dla komend */
    font-style: italic;
  `}
  
  ${props => props.$type === 'TIMESTAMP' && `
    color: #6b7280; /* Szary dla timestamp */
  `}
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
    font-family: 'Courier New', monospace;
    font-size: 13px;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
  
  button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 15px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
    
    &:disabled {
      background: #4a5070;
      cursor: not-allowed;
      opacity: 0.6;
    }
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
  margin-bottom: 0; // Zmiana z 10px na 0
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
  border-radius: 3px;
  width: ${props => props.$width || '0%'};
  background: ${props => props.style?.background || '#3b82f6'};
`;

const Footer = styled.footer`
  text-align: center;
  padding: 20px 0;
  margin-top: 30px;
  border-top: 1px solid #3a3f57;
  color: #a4aabc;
  font-size: 14px;
`;

// Funkcja do analizowania i kolorowania logów
const parseLogLine = (log) => {
  if (typeof log !== 'string') {
    return { content: String(log), type: 'UNKNOWN' };
  }
  
  // Sprawdź czy to komenda użytkownika
  if (log.startsWith('> ')) {
    return { content: log, type: 'COMMAND' };
  }
  
  // Sprawdź czy to błąd
  if (log.includes('ERROR') || log.includes('Error') || log.toLowerCase().includes('exception') || log.toLowerCase().includes('error')) {
    return { content: log, type: 'ERROR' };
  }
  
  // Sprawdź czy to warning
  if (log.includes('WARN') || log.includes('Warning') || log.toLowerCase().includes('warn')) {
    return { content: log, type: 'WARN' };
  }
  
  // Sprawdź czy to info
  if (log.includes('INFO') || log.includes('Info') || log.toLowerCase().includes('info')) {
    return { content: log, type: 'INFO' };
  }
  
  // Sprawdź czy to debug
  if (log.includes('DEBUG') || log.includes('Debug') || log.toLowerCase().includes('debug')) {
    return { content: log, type: 'DEBUG' };
  }
  
  // Sprawdź czy zawiera timestamp (format daty)
  const timestampRegex = /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/;
  if (timestampRegex.test(log)) {
    return { content: log, type: 'TIMESTAMP' };
  }
  
  return { content: log, type: 'UNKNOWN' };
};

function ServerControl() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [progressInterval, setProgressInterval] = useState(null);
  const [pollingTimeout, setPollingTimeout] = useState(null);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [discStats, setDiscStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [consoleFilter, setConsoleFilter] = useState('ALL');

	useEffect(() => {
	  fetchServer();
	  fetchServerSizes();
	  fetchBackups();
	  
	  let performanceInterval;
	  
	  if (server?.status === 'running') {
		fetchPerformanceStats();
		performanceInterval = setInterval(fetchPerformanceStats, 5000);
	  }
	  
	  return () => {
		stopProgressPolling();
		if (performanceInterval) clearInterval(performanceInterval);
	  };
	}, [serverId]); 

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

  const fetchServerSizes = async () => {
      try {
        const response = await api.get(`/servers/${serverId}/size`);
        setDiscStats(response.data.size_gb);
      } catch (error) {
        console.error(`Error fetching size for server ${serverId}:`, error);
        setDiscStats(0);
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

  // Fetch real-time output logs
  const fetchRealtimeOutput = async () => {
    if (server?.status !== 'running') {
      setConsoleLogs([]);
      return;
    }

    try {
      const response = await api.get(`/servers/${serverId}/realtime-output`);
      
      // Upewnij się, że output jest tablicą
      let logsArray = response.data.output || [];
      
      // Jeśli logs jest stringiem, zamień na tablicę linii
      if (typeof logsArray === 'string') {
        logsArray = logsArray.split('\n');
      }
      
      // Upewnij się, że to na pewno tablica
      if (!Array.isArray(logsArray)) {
        logsArray = [];
      }
      
      setConsoleLogs(logsArray);
    } catch (error) {
      console.error('Error fetching realtime output:', error);
      setConsoleLogs([]); // Ustaw pustą tablicę w przypadku błędu
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
	  setCurrentAction(action);
	  
	  try {
		await api.post(`/servers/${serverId}/${action}`);

		if (action === 'start') {
		  startStatusPolling('running');
		} else if (action === 'stop') {
		  startStatusPolling('stopped');
		} else if (action === 'restart') {
		  setTimeout(() => {
		    startStatusPolling('running');
		  }, 5000);
		}
		
	  } catch (error) {
		console.error(`Error ${action} server:`, error);
		toast.error(`Failed to ${action} server: ${error.response?.data?.error || error.message}`);
		setActionLoading(false);
		setCurrentAction(null);
	  }
	};

	const startStatusPolling = (targetStatus) => {
	  const pollInterval = setInterval(async () => {
		try {
		  const response = await api.get(`/servers/${serverId}`);
		  const currentStatus = response.data.status;
		  
		  if (currentStatus === targetStatus) {
		    clearInterval(pollInterval);
		    setServer(response.data);
		    setActionLoading(false);
		    setCurrentAction(null);
		    
		    if (targetStatus === 'running') {
		      fetchPerformanceStats();
		    }
		  }
		} catch (error) {
		  console.error('Error polling server status:', error);
		}
	  }, 2000);

	  setTimeout(() => {
		clearInterval(pollInterval);
		setActionLoading(false);
		setCurrentAction(null);
		fetchServer();
	  }, 150000);
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
      // Upewnij się, że consoleLogs jest tablicą
      const currentLogs = Array.isArray(consoleLogs) ? consoleLogs : [];
      
      // Dodaj komendę do logów natychmiast
      const commandLog = `> ${consoleInput}`;
      setConsoleLogs([...currentLogs, commandLog]);
      
      api.post(`/servers/${serverId}/console`, { command: consoleInput })
        .then(response => {
          // Upewnij się, że output jest tablicą
          let outputLines = response.data.output || [];
          if (typeof outputLines === 'string') {
            outputLines = outputLines.split('\n');
          }
          if (!Array.isArray(outputLines)) {
            outputLines = [];
          }
          
          setConsoleLogs(prevLogs => [...prevLogs, ...outputLines]);
        })
        .catch(error => {
          setConsoleLogs(prevLogs => [...prevLogs, `Error: ${error.response?.data?.error || error.message}`]);
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

  // Fetch real-time output logs
  useEffect(() => {
    if (server?.status === 'running') {
      fetchRealtimeOutput();
      const logInterval = setInterval(fetchRealtimeOutput, 3000); // Update logs every 3 seconds
      
      return () => clearInterval(logInterval);
    } else {
      setConsoleLogs([]); // Wyczyść logi gdy serwer jest wyłączony
    }
  }, [serverId, server?.status]);

  // Funkcja do filtrowania logów
  const getFilteredLogs = () => {
    if (!Array.isArray(consoleLogs)) return [];
    
    if (consoleFilter === 'ALL') {
      return consoleLogs;
    }
    
    return consoleLogs.filter(log => {
      const parsedLog = parseLogLine(log);
      return parsedLog.type === consoleFilter;
    });
  };

  // Funkcja do zliczania logów według typu
  const getLogCounts = () => {
    if (!Array.isArray(consoleLogs)) {
      return { ALL: 0, ERROR: 0, WARN: 0, INFO: 0 };
    }
    
    const counts = { ALL: consoleLogs.length, ERROR: 0, WARN: 0, INFO: 0 };
    
    consoleLogs.forEach(log => {
      const parsedLog = parseLogLine(log);
      if (counts.hasOwnProperty(parsedLog.type)) {
        counts[parsedLog.type]++;
      }
    });
    
    return counts;
  };

  const logCounts = getLogCounts();

  if (loading) {
    return <Container>Loading server details...</Container>;
  }

  if (!server) {
    return <Container>Server not found</Container>;
  }

	const getActionMessage = () => {
	  if (!currentAction) return null;
	  
	  const messages = {
		start: 'Trwa uruchamianie serwera, proszę czekać...',
		restart: 'Trwa restartowanie serwera, proszę czekać...',
		stop: 'Trwa zatrzymywanie serwera, proszę czekać...'
	  };
	  
	  return messages[currentAction] || null;
	};

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

		{currentAction && (
		  <StatusMessage>
			<LoadingSpinner />
			<div>
			  <div>{getActionMessage()}</div>
			  <div style={{ fontSize: '12px', opacity: '0.8', marginTop: '5px' }}>
				Status będzie automatycznie odświeżany...
			  </div>
			</div>
		  </StatusMessage>
		)}

      <ServerActions>
        <ActionButton 
          $variant="success"
          onClick={() => handleServerAction('start')} 
          disabled={server.status === 'running' || actionLoading || (downloadProgress && downloadProgress.status !== 'complete')}
        >
          {actionLoading && currentAction === 'start' ? <LoadingSpinner /> : <FiPower />}
          Uruchom Serwer
        </ActionButton>
        <ActionButton 
          $variant="secondary" 
          onClick={() => handleServerAction('restart')} 
          disabled={server.status === 'stopped' || actionLoading}
        >
          {actionLoading && currentAction === 'restart' ? <LoadingSpinner /> : <FiRefreshCw />}
          Restartuj Serwer
        </ActionButton>
        <ActionButton $variant="secondary" onClick={() => navigate(`/servers/${serverId}/console`)}>
          <FiTerminal /> Konsola
        </ActionButton>
        <ActionButton 
          $variant="danger" 
          onClick={() => handleServerAction('stop')} 
          disabled={server.status === 'stopped' || actionLoading}
        >
          {actionLoading && currentAction === 'stop' ? <LoadingSpinner /> : <FiStopCircle />}
          Zatrzymaj Serwer
        </ActionButton>
      </ServerActions>

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
                  <span>{server.ip || 'localhost'}:{server.port}</span>
                  <CopyButton onClick={() => copyToClipboard(`${server.ip || 'localhost'}:${server.port}`)}>
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
  <DetailTitle>PID PROCESU</DetailTitle>
  <DetailValue>
    {server.pid || server.process_id || 'N/A'}
    {server.pid && (
      <CopyButton onClick={() => copyToClipboard(server.pid.toString())}>
        <FiCopy />
      </CopyButton>
    )}
  </DetailValue>
</DetailCard>
              <DetailCard>
                <DetailTitle>LOKALIZACJA</DetailTitle>
                <DetailValue>{server.location || 'Europa (Frankfurt)'}</DetailValue>
              </DetailCard>
            </ServerDetails>
          </ServerInfo>

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
              <DetailCard>
  <DetailTitle>PID</DetailTitle>
  <DetailValue>
    {server.pid || server.process_id || 'Brak (serwer zatrzymany)'}
  </DetailValue>
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
			  <TaskButton onClick={() => toast.info('Funkcja "Prześlij świat" jest w trakcie tworzenia')}>
				<FiUpload /> Prześlij świat
			  </TaskButton>
			  <TaskButton onClick={() => toast.info('Funkcja "Napraw serwer" jest w trakcie tworzenia')}>
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
            
            <ConsoleTabs>
              <ConsoleTab 
                $active={consoleFilter === 'ALL'} 
                onClick={() => setConsoleFilter('ALL')}
              >
                <FiTerminal /> All <TabBadge>{logCounts.ALL}</TabBadge>
              </ConsoleTab>
              <ConsoleTab 
                $active={consoleFilter === 'ERROR'} 
                onClick={() => setConsoleFilter('ERROR')}
              >
                <FiAlertCircle /> Errors <TabBadge $type="ERROR">{logCounts.ERROR}</TabBadge>
              </ConsoleTab>
              <ConsoleTab 
                $active={consoleFilter === 'WARN'} 
                onClick={() => setConsoleFilter('WARN')}
              >
                <FiAlertTriangle /> Warnings <TabBadge $type="WARN">{logCounts.WARN}</TabBadge>
              </ConsoleTab>
              <ConsoleTab 
                $active={consoleFilter === 'INFO'} 
                onClick={() => setConsoleFilter('INFO')}
              >
                <FiInfo /> Info <TabBadge $type="INFO">{logCounts.INFO}</TabBadge>
              </ConsoleTab>
            </ConsoleTabs>
            
            <ConsoleContent className="console-content">
              {getFilteredLogs().map((log, index) => {
                const parsedLog = parseLogLine(log);
                return (
                  <LogLine key={index} $type={parsedLog.type}>
                    {parsedLog.content}
                  </LogLine>
                );
              })}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <MetricName style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px' }}>
          <span style={{ color: '#807bc3' }}>•</span> CPU
        </MetricName>
        <MetricValue style={{ color: '#807bc3', minWidth: '40px' }}>
          {performanceStats ? `${performanceStats.cpu_percent}%` : '0%'}
        </MetricValue>
        <ProgressBarContainer style={{ flex: 1 }}>
          <Progress 
            $width={performanceStats ? `${performanceStats.cpu_percent}%` : '0%'} 
            style={{ background: '#807bc3' }}
          />
        </ProgressBarContainer>
      </div>
    </MetricHeader>
  </MetricCard>
  
  <MetricCard>
    <MetricHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <MetricName style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px' }}>
          <span style={{ color: '#3881fc' }}>•</span> RAM
        </MetricName>
        <MetricValue style={{ color: '#3881fc', minWidth: '40px' }}>
          {performanceStats ? `${performanceStats.memory_percent}%` : '0%'}
        </MetricValue>
        <ProgressBarContainer style={{ flex: 1 }}>
          <Progress 
            $width={performanceStats ? `${performanceStats.memory_percent}%` : '0%'} 
            style={{ background: '#3881fc' }}
          />
        </ProgressBarContainer>
      </div>
    </MetricHeader>
  </MetricCard>
  
  <MetricCard>
    <MetricHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <MetricName style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px' }}>
          <span style={{ color: '#fb6158' }}>•</span> DYSK
        </MetricName>
        <MetricValue style={{ color: '#fb6158', minWidth: 'auto', fontSize: '14px' }}>
          {performanceStats && discStats !== undefined && performanceStats.disk_total !== undefined 
            ? `${discStats}/${performanceStats.disk_total} GB`
            : performanceStats && discStats !== undefined
            ? `${discStats}/no limit GB`
            : '0GB/no limit'
          }
        </MetricValue>
        <ProgressBarContainer style={{ flex: 1 }}>
          <Progress 
            $width={performanceStats ? `${performanceStats.disk_percent}%` : '0%'} 
            style={{ background: '#fb6158' }}
          />
        </ProgressBarContainer>
      </div>
    </MetricHeader>
  </MetricCard>
</UsageMetrics>
          </UsageContainer>
        </Column>
      </ContentLayout>

      <Footer>
        © 2024 Minecraft Server Panel | Wersja 1.0.0
      </Footer>
    </Container>
  );
}

export default ServerControl;
