import React, { useState, useEffect, useCallback } from 'react';
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
import { useLanguage } from '../context/LanguageContext';

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

const ServerStatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => props.$online ? '#065f46' : '#4a5070'};
  color: ${props => props.$online ? '#10b981' : '#a4aabc'};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$online ? '#10b981' : '#a4aabc'};
`;

const PlayerStatus = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PlayerIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const PlayerDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const PlayerTitle = styled.div`
  font-size: 14px;
  color: #a4aabc;
  margin-bottom: 2px;
`;

const PlayerCount = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
`;

const PlayerMax = styled.span`
  font-size: 16px;
  color: #a4aabc;
  font-weight: 500;
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
  const { t } = useLanguage();
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
  const [playerStats, setPlayerStats] = useState(null);
  const [hasFiles, setHasFiles] = useState(true); 
  const [performanceInterval, setPerformanceInterval] = useState(null);

useEffect(() => {
  fetchServer();
  fetchServerSizes();
  fetchBackups();
  checkServerFiles();
}, [serverId]);

useEffect(() => {
  let performanceInterval;
  let playerStatsInterval;

  if (server?.status === 'running') {
    fetchPerformanceStats();
    performanceInterval = setInterval(fetchPerformanceStats, 5000);
    playerStatsInterval = setInterval(fetchRealtimeOutput, 3000);
  }

  return () => {
    stopProgressPolling();
    if (performanceInterval) clearInterval(performanceInterval);
    if (playerStatsInterval) clearInterval(playerStatsInterval);
  };
}, [serverId, server?.status]);
	
  const checkServerFiles = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/files/check`);
      setHasFiles(response.data.hasFiles || false);
    } catch (error) {
      console.error('Error checking server files:', error);
      setHasFiles(false);
    }
  };

	const checkInstallationStatus = async () => {
	  try {
		const response = await api.get(`/servers/${serverId}/files/check`);
		const hasServerFiles = response.data.hasFiles;
		const checkedVia = response.data.checkedVia;
		
		console.log(`Files check result: ${hasServerFiles} (via: ${checkedVia})`);
		
		setHasFiles(hasServerFiles);
		
		if (hasServerFiles) {
		  // Jeśli pliki są już zainstalowane, zatrzymaj polling
		  stopInstallationPolling();
		  toast.success(t('server.install.success') || 'Serwer został pomyślnie zainstalowany');
		}
		
		return hasServerFiles;
	  } catch (error) {
		console.error('Error checking installation status:', error);
		return false;
	  }
	};

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
      
      if (response.data.status === 'stopped') {
        checkDownloadProgress();
      }
      checkServerFiles();
    } catch (error) {
      console.error('Error fetching server:', error);
    } finally {
      setLoading(false);
    }
  };

const fetchPerformanceStats = async () => {
  try {
    const response = await api.get(`/servers/${serverId}/performance`);
    setPerformanceStats(response.data);
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    // Ustaw domyślne wartości w przypadku błędu
    setPerformanceStats({
      cpu_percent: 0,
      memory_percent: 0,
      disk_percent: 0,
      disk_total: 0
    });
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
const fetchRealtimeOutput = useCallback(async () => {
  if (server?.status !== 'running') {
    setConsoleLogs([]);
    return;
  }

  try {
    const response = await api.get(`/servers/${serverId}/realtime-output`);
    
    let logsArray = response.data.output || [];
    
    if (typeof logsArray === 'string') {
      logsArray = logsArray.split('\n');
    }
    
    if (!Array.isArray(logsArray)) {
      logsArray = [];
    }
    
    setConsoleLogs(logsArray);
  } catch (error) {
    console.error('Error fetching realtime output:', error);
    setConsoleLogs([]);
  }
}, [serverId, server?.status]);
  
	const parsePlayerCountFromLogs = (logs) => {
	  if (!Array.isArray(logs)) return null;
	  
	  let playerCount = 0;
	  const playerJoinRegex = /(?:Player connected:|\[.*?\]:\s*\w+\s*joined the game|\[.*?\]:\s*\w+\s*\[.*\] logged in)/i;
	  const playerLeaveRegex = /(?:Player disconnected:|\[.*?\]:\s*\w+\s*left the game|\[.*?\]:\s*\w+\s*lost connection)/i;
	  
	  logs.forEach(log => {
		const logLine = typeof log === 'string' ? log : String(log);
		
		if (playerJoinRegex.test(logLine)) {
		  playerCount++;
		} else if (playerLeaveRegex.test(logLine)) {
		  playerCount = Math.max(0, playerCount - 1);
		}
	  });
	  
	  return playerCount;
	};

	// Alternatywna, bardziej zaawansowana wersja z śledzeniem konkretnych graczy
	const trackPlayersFromLogs = (logs) => {
	  if (!Array.isArray(logs)) return { count: 0, players: [] };
	  
	  const players = new Set();
	  
	  // Rozszerzone wzorce dla różnych formatów logów Minecraft
	  const joinPatterns = [
		/Player connected:\s*(\w+)/i,
		/\[.*?\]:\s*(\w+)\s*joined the game/i,
		/\[.*?\]:\s*(\w+)\s*\[.*\] logged in/i,
		/(\w+) joined the game/i,
		/(\w+)\s*\[.*\] logged in/i
	  ];
	  
	  const leavePatterns = [
		/Player disconnected:\s*(\w+)/i,
		/\[.*?\]:\s*(\w+)\s*left the game/i,
		/\[.*?\]:\s*(\w+)\s*lost connection/i,
		/(\w+) left the game/i,
		/(\w+) lost connection/i
	  ];
	  
	  logs.forEach(log => {
		const logLine = removeAnsiCodes(typeof log === 'string' ? log : String(log));
		
		// Sprawdzanie dołączenia gracza
		for (const pattern of joinPatterns) {
		  const match = logLine.match(pattern);
		  if (match && match[1]) {
		    const playerName = match[1].trim();
		    if (playerName && playerName !== '') {
		      players.add(playerName.toLowerCase());
		      break;
		    }
		  }
		}
		
		// Sprawdzanie opuszczenia gracza
		for (const pattern of leavePatterns) {
		  const match = logLine.match(pattern);
		  if (match && match[1]) {
		    const playerName = match[1].trim();
		    if (playerName && playerName !== '') {
		      players.delete(playerName.toLowerCase());
		      break;
		    }
		  }
		}
	  });
	  
	  return {
		count: players.size,
		players: Array.from(players)
	  };
	};
	
	// Funkcja do usuwania kodów ANSI z logów
	const removeAnsiCodes = (text) => {
	  if (typeof text !== 'string') return text;
	  return text.replace(/\u001b\[\d+m/g, '');
	};

	// Zaktualizuj funkcję parseLogLine:
	const parseLogLine = (log) => {
	  if (typeof log !== 'string') {
		return { content: String(log), type: 'UNKNOWN' };
	  }
	  
	  // Najpierw usuń kody ANSI
	  const cleanLog = removeAnsiCodes(log);
	  
	  // Sprawdź czy to komenda użytkownika
	  if (cleanLog.startsWith('> ')) {
		return { content: cleanLog, type: 'COMMAND' };
	  }
	  
	  // Sprawdź czy to błąd
	  if (cleanLog.includes('ERROR') || cleanLog.includes('Error') || cleanLog.toLowerCase().includes('exception') || cleanLog.toLowerCase().includes('error')) {
		return { content: cleanLog, type: 'ERROR' };
	  }
	  
	  // Sprawdź czy to warning
	  if (cleanLog.includes('WARN') || cleanLog.includes('Warning') || cleanLog.toLowerCase().includes('warn')) {
		return { content: cleanLog, type: 'WARN' };
	  }
	  
	  // Sprawdź czy to info
	  if (cleanLog.includes('INFO') || cleanLog.includes('Info') || cleanLog.toLowerCase().includes('info')) {
		return { content: cleanLog, type: 'INFO' };
	  }
	  
	  // Sprawdź czy to debug
	  if (cleanLog.includes('DEBUG') || cleanLog.includes('Debug') || cleanLog.toLowerCase().includes('debug')) {
		return { content: cleanLog, type: 'DEBUG' };
	  }
	  
	  // Sprawdź czy zawiera timestamp (format daty)
	  const timestampRegex = /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/;
	  if (timestampRegex.test(cleanLog)) {
		return { content: cleanLog, type: 'TIMESTAMP' };
	  }
	  
	  return { content: cleanLog, type: 'UNKNOWN' };
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
          // Natychmiast pobierz statystyki po uruchomieniu
          fetchPerformanceStats();
          // Rozpocznij regularne odświeżanie
          const statsInterval = setInterval(fetchPerformanceStats, 5000);
          
          // Zapisz interval do późniejszego wyczyszczenia
          setPerformanceInterval(statsInterval);
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
        message: t('dashboard.actions.stop.loading') || 'Pobieranie anulowane przez użytkownika'
      });
      
      try {
        await api.post(`/servers/${serverId}/stop`);
      } catch (stopError) {
        console.log('Server might not be running yet:', stopError);
      }
      
      setTimeout(() => fetchServer(), 1000);
      
    } catch (error) {
      console.error('Error cancelling download:', error);
      alert(t('dashboard.actions.stop.error') || 'Failed to cancel download');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await api.post(`/servers/${serverId}/backups`);
      toast.success(t('dashboard.backup.coming') || 'Backup created successfully');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(t('dashboard.delete.error') || 'Failed to create backup');
    }
  };

  const handleRestoreBackup = async (backupName) => {
    if (!window.confirm(t('dashboard.delete.confirm', { name: backupName }) || `Are you sure you want to restore backup "${backupName}"? This will replace the current world.`)) {
      return;
    }

    try {
      await api.post(`/servers/${serverId}/backups/${backupName}/restore`);
      toast.success(t('dashboard.add.server.success') || 'Backup restored successfully');
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(t('dashboard.delete.error') || 'Failed to restore backup');
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
		const logInterval = setInterval(fetchRealtimeOutput, 3000);
		
		return () => clearInterval(logInterval);
	  } else {
		setConsoleLogs([]);
		setPlayerStats(null); // Resetuj liczbę graczy gdy serwer jest wyłączony
	  }
	}, [serverId, server?.status]);


useEffect(() => {
  if (server?.status === 'running' && consoleLogs.length > 0) {
    const playerData = trackPlayersFromLogs(consoleLogs);
    
    // Aktualizuj stan tylko jeśli są zmiany
    if (playerData.count !== (playerStats?.online || 0)) {
      setPlayerStats({
        online: playerData.count,
        max: server.max_players || 20, // Użyj maksymalnej liczby graczy z serwera
        list: playerData.players
      });
    }
  }
}, [consoleLogs, server?.status]);

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
  
  const handleInstallServer = async () => {
    setActionLoading(true);
    setCurrentAction('install');
    
    try {
      await api.post(`/servers/${serverId}/install`);
      toast.success(t('server.add.success') || 'Rozpoczęto instalację serwera');
      
      // Rozpocznij śledzenie postępu instalacji
      startInstallationPolling();
      
    } catch (error) {
      console.error('Error installing server:', error);
      toast.error(`Failed to install server: ${error.response?.data?.error || error.message}`);
      setActionLoading(false);
      setCurrentAction(null);
    }
  };
  
const startInstallationPolling = () => {
  let pollCount = 0;
  const maxPolls = 60; // 3 minuty (60 * 3 sekundy)
  
  const pollInterval = setInterval(async () => {
    pollCount++;
    
    try {
      // Sprawdź status instalacji przez sprawdzenie plików
      const isInstalled = await checkInstallationStatus();
      
      if (isInstalled) {
        console.log('Server installation completed - files found');
        clearInterval(pollInterval);
        setActionLoading(false);
        setCurrentAction(null);
        fetchServer(); // Odśwież dane serwera
        return;
      }
      
      // Równolegle sprawdzaj postęp instalacji przez standardowy endpoint
      const progressResponse = await api.get(`/servers/${serverId}/installation-progress`);
      const progress = progressResponse.data;
      
      console.log('Installation progress:', progress);
      
      if (progress.status === 'complete') {
        console.log('Installation marked as complete');
        clearInterval(pollInterval);
        setActionLoading(false);
        setCurrentAction(null);
        setHasFiles(true);
        toast.success(t('server.add.success') || 'Instalacja serwera zakończona pomyślnie');
        fetchServer();
        return;
      } else if (progress.status === 'error') {
        console.log('Installation error detected');
        clearInterval(pollInterval);
        setActionLoading(false);
        setCurrentAction(null);
        toast.error(t('server.add.error') || 'Błąd podczas instalacji serwera');
        return;
      }
      
      // Aktualizuj postęp pobierania jeśli dostępny
      if (progress.downloadProgress) {
        setDownloadProgress(progress.downloadProgress);
      }
      
      // Timeout po maxPolls
      if (pollCount >= maxPolls) {
        console.log('Installation polling timeout');
        clearInterval(pollInterval);
        setActionLoading(false);
        setCurrentAction(null);
        toast.error('Instalacja serwera przekroczyła limit czasu (3 minuty)');
        
        // Na koniec sprawdź jeszcze raz czy może jednak pliki się pojawiły
        setTimeout(() => {
          checkInstallationStatus();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error polling installation progress:', error);
      
      // Po pewnym czasie przerwij polling w przypadku błędów
      if (pollCount >= 20) { // 1 minuta błędów
        clearInterval(pollInterval);
        setActionLoading(false);
        setCurrentAction(null);
        toast.error('Błąd podczas śledzenia instalacji serwera');
      }
    }
  }, 3000); // Sprawdzaj co 3 sekundy

  // Zapisz interval do późniejszego wyczyszczenia
  setProgressInterval(pollInterval);
};
  
  useEffect(() => {
  return () => {
    if (performanceInterval) {
      clearInterval(performanceInterval);
    }
  };
}, [performanceInterval]);

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
		start: t('dashboard.actions.start.loading') || 'Trwa uruchamianie serwera, proszę czekać...',
		install: t('server.add.creating') || 'Trwa instalacja serwera, proszę czekać...',
		restart: t('dashboard.actions.restart.loading') || 'Trwa restartowanie serwera, proszę czekać...',
		stop: t('dashboard.actions.stop.loading') || 'Trwa zatrzymywanie serwera, proszę czekać...'
	  };
	  
	  return messages[currentAction] || null;
	};
	
	const getPlayerRegexPatterns = () => ({
	  // Vanilla Minecraft
	  vanilla: {
		join: /\[.*?\]:\s*(\w+)\s*joined the game/,
		leave: /\[.*?\]:\s*(\w+)\s*left the game/
	  },
	  // Bukkit/Spigot/Paper
	  bukkit: {
		join: /\[.*?\]:\s*(\w+)\s*\[.*\] logged in/,
		leave: /\[.*?\]:\s*(\w+)\s*lost connection/
	  },
	  // Custom messages
	  custom: {
		join: /Player connected:\s*(\w+)/,
		leave: /Player disconnected:\s*(\w+)/
	  },
	  // Bedrock Edition
	  bedrock: {
		join: /\[.*?\]:\s*Player connected:\s*(\w+)/,
		leave: /\[.*?\]:\s*Player disconnected:\s*(\w+)/
	  }
	});

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          <FiActivity /> {t('page.dashboard') || 'Overview'}
        </NavTab>
        <NavTab 
          $active={activeTab === 'console'} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> {t('nav.console') || 'Console'}
        </NavTab>
        <NavTab 
          $active={activeTab === 'files'} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> {t('page.files') || 'Files'}
        </NavTab>
        <NavTab 
          $active={activeTab === 'config'} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <FiSettings /> {t('page.server.settings') || 'Config'}
        </NavTab>
        <NavTab 
          $active={activeTab === 'plugins'} 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> {t('page.plugins') || 'Plugins'}
        </NavTab>
        <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> {t('page.server.users') || 'Users'}
        </NavTab>
        <NavTab 
          $active={activeTab === 'backups'} 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> {t('page.backups') || 'Backups'}
        </NavTab>
      </NavTabs>
      
      {/* Player Status Component */}
      {server.status === 'running' && (
<PlayerStatus>
  <PlayerInfo>
    <PlayerIcon>
      <FiUsers />
    </PlayerIcon>
    <PlayerDetails>
      <PlayerTitle>{t('dashboard.stats.players') || 'Gracze online'}</PlayerTitle>
      <PlayerCount>
        {playerStats ? playerStats.online : '0'}
        <PlayerMax> / {server.max_players || 20}</PlayerMax>
      </PlayerCount>
      {playerStats?.list && playerStats.list.length > 0 && (
        <div style={{ fontSize: '12px', color: '#a4aabc', marginTop: '5px' }}>
          {t('server.players.onlineList') || 'Online'}: {playerStats.list.join(', ')}
        </div>
      )}
    </PlayerDetails>
  </PlayerInfo>
  <ServerStatusIndicator $online={playerStats && playerStats.online > 0}>
    <StatusDot $online={playerStats && playerStats.online > 0} />
    {playerStats && playerStats.online > 0 ? t('server.players.active') || 'Aktywni gracze' : t('server.players.none') || 'Brak graczy'}
  </ServerStatusIndicator>
</PlayerStatus>
      )}

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
				{t('server.status.refreshing') || 'Status będzie automatycznie odświeżany...'}
			  </div>
			</div>
		  </StatusMessage>
		)}

      <ServerActions>
        {!hasFiles ? (
          <ActionButton 
            $variant="success"
            onClick={handleInstallServer} 
            disabled={actionLoading || server.status === 'running'}
          >
            {actionLoading && currentAction === 'install' ? <LoadingSpinner /> : <FiDownload />}
            {t('server.actions.install') || 'Zainstaluj Serwer'}
          </ActionButton>
        ) : (
          <ActionButton 
            $variant="success"
            onClick={() => handleServerAction('start')} 
            disabled={server.status === 'running' || actionLoading || (downloadProgress && downloadProgress.status !== 'complete')}
          >
            {actionLoading && currentAction === 'start' ? <LoadingSpinner /> : <FiPower />}
            {t('dashboard.actions.start') || 'Uruchom Serwer'}
          </ActionButton>
        )}
        <ActionButton 
          $variant="secondary" 
          onClick={() => handleServerAction('restart')} 
          disabled={server.status === 'stopped' || actionLoading || !hasFiles}
        >
          {actionLoading && currentAction === 'restart' ? <LoadingSpinner /> : <FiRefreshCw />}
          {t('dashboard.actions.restart') || 'Restartuj Serwer'}
        </ActionButton>
        <ActionButton 
          $variant="secondary" 
          onClick={() => navigate(`/servers/${serverId}/console`)} 
          disabled={server.status === 'stopped' || actionLoading || !hasFiles}
        >
          <FiTerminal /> {t('nav.console') || 'Konsola'}
        </ActionButton>
        <ActionButton 
          $variant="danger" 
          onClick={() => handleServerAction('stop')} 
          disabled={server.status === 'stopped' || actionLoading || !hasFiles}
        >
          {actionLoading && currentAction === 'stop' ? <LoadingSpinner /> : <FiStopCircle />}
          {t('dashboard.actions.stop') || 'Zatrzymaj Serwer'}
        </ActionButton>
      </ServerActions>

      <ContentLayout>
        <Column>
          <ServerInfo>
            <ServerHeader>
              <ServerTitle>{server.name}</ServerTitle>
              <ServerStatus $status={server.status}>
                <StatusIndicator $status={server.status} />
                <span>{server.status === 'running' ? t('dashboard.status.running') : t('dashboard.status.stopped')}</span>
              </ServerStatus>
            </ServerHeader>
            <ServerDetails>
              <DetailCard>
                <DetailTitle>{t('server.details.ip') || 'ADRES IP'}</DetailTitle>
                <DetailValue>
                  <span>{server.ip || 'localhost'}:{server.port}</span>
                  <CopyButton onClick={() => copyToClipboard(`${server.ip || 'localhost'}:${server.port}`)}>
                    <FiCopy />
                  </CopyButton>
                </DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>{t('server.details.version') || 'WERSJA'}</DetailTitle>
                <DetailValue>{server.version}</DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>{t('server.details.lastActivity') || 'OSTATNIA AKTYWNOŚĆ'}</DetailTitle>
                <DetailValue>
                  {server.last_started 
                    ? new Date(server.last_started).toLocaleString() 
                    : t('common.never') || 'Nigdy'
                  }
                </DetailValue>
              </DetailCard>
              <DetailCard>
  <DetailTitle>{t('server.details.pid') || 'PID PROCESU'}</DetailTitle>
  <DetailValue>
    {server.pid || server.process_id || t('common.none') || 'N/A'}
    {server.pid && (
      <CopyButton onClick={() => copyToClipboard(server.pid.toString())}>
        <FiCopy />
      </CopyButton>
    )}
  </DetailValue>
</DetailCard>
              <DetailCard>
                <DetailTitle>{t('server.details.location') || 'LOKALIZACJA'}</DetailTitle>
                <DetailValue>{server.location || 'Europa (Frankfurt)'}</DetailValue>
              </DetailCard>
            </ServerDetails>
          </ServerInfo>

          <InstanceContainer>
            <InstanceHeader>
              <InstanceTitle>{t('server.instance.active') || 'Aktywna Instancja'}</InstanceTitle>
            </InstanceHeader>
            <InstanceDetails>
              <DetailCard>
                <DetailTitle>{t('server.instance.name') || 'NAZWA'}</DetailTitle>
                <DetailValue>{server.name}</DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>{t('server.instance.type') || 'TYP'}</DetailTitle>
                <DetailValue>{server.type.toUpperCase()}</DetailValue>
              </DetailCard>
              <DetailCard>
                <DetailTitle>{t('server.instance.version') || 'WERSJA'}</DetailTitle>
                <DetailValue>{server.version}</DetailValue>
              </DetailCard>
              <DetailCard>
  <DetailTitle>{t('server.instance.pid') || 'PID'}</DetailTitle>
  <DetailValue>
    {server.pid || server.process_id || t('server.instance.stopped') || 'Brak (serwer zatrzymany)'}
  </DetailValue>
</DetailCard>
            </InstanceDetails>
          </InstanceContainer>

          <QuickTasks>
            <TasksHeader>
              <TasksTitle>{t('server.quickTasks.title') || 'Szybkie Zadania'}</TasksTitle>
            </TasksHeader>
			<TaskButtons>
			  <TaskButton onClick={handleCreateBackup} disabled={server.status === 'running'}>
				<FiDownload /> {t('server.quickTasks.backup') || 'Kopia zapasowa'}
			  </TaskButton>
			  <TaskButton onClick={() => navigate(`/servers/${serverId}/backups`)}>
                <FiDownload /> {t('page.backups') || 'Backup Manager'}
              </TaskButton>
              <TaskButton onClick={() => navigate(`/servers/${serverId}/plugins`)}>
                <FiBox /> {t('server.quickTasks.plugins') || 'Plugin Manager'}
              </TaskButton>
			  <TaskButton onClick={() => toast.info(t('server.quickTasks.repairComing') || 'Funkcja "Napraw serwer" jest w trakcie tworzenia')}>
				<FaWrench /> {t('server.quickTasks.repair') || 'Napraw serwer'}
			  </TaskButton>
			  <TaskButton onClick={() => navigate(`/servers/${serverId}/users`)}>
				<FiUsers /> {t('server.quickTasks.permissions') || 'Uprawnienia'}
			  </TaskButton>
			</TaskButtons>
          </QuickTasks>
        </Column>

        <Column>
          <ConsoleContainer>
            <ConsoleHeader>
              <ConsoleTitle>{t('server.console.title') || 'Konsola Serwera'}</ConsoleTitle>
            </ConsoleHeader>
            
            <ConsoleTabs>
              <ConsoleTab 
                $active={consoleFilter === 'ALL'} 
                onClick={() => setConsoleFilter('ALL')}
              >
                <FiTerminal /> {t('server.console.all') || 'All'} <TabBadge>{logCounts.ALL}</TabBadge>
              </ConsoleTab>
              <ConsoleTab 
                $active={consoleFilter === 'ERROR'} 
                onClick={() => setConsoleFilter('ERROR')}
              >
                <FiAlertCircle /> {t('server.console.errors') || 'Errors'} <TabBadge $type="ERROR">{logCounts.ERROR}</TabBadge>
              </ConsoleTab>
              <ConsoleTab 
                $active={consoleFilter === 'WARN'} 
                onClick={() => setConsoleFilter('WARN')}
              >
                <FiAlertTriangle /> {t('server.console.warnings') || 'Warnings'} <TabBadge $type="WARN">{logCounts.WARN}</TabBadge>
              </ConsoleTab>
              <ConsoleTab 
                $active={consoleFilter === 'INFO'} 
                onClick={() => setConsoleFilter('INFO')}
              >
                <FiInfo /> {t('server.console.info') || 'Info'} <TabBadge $type="INFO">{logCounts.INFO}</TabBadge>
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
                placeholder={t('server.console.placeholder') || "Wpisz komendę..."} 
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConsoleSubmit()}
                disabled={server.status !== 'running'}
              />
              <button onClick={handleConsoleSubmit} disabled={server.status !== 'running'}>
                {t('server.console.send') || 'Wyślij'}
              </button>
            </ConsoleInput>
          </ConsoleContainer>

          <UsageContainer>
            <UsageHeader>
              <UsageTitle>{t('server.resources.title') || 'Zasoby'}</UsageTitle>
            </UsageHeader>
<UsageMetrics>
  <MetricCard>
    <MetricHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <MetricName style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '100px' }}>
          <span style={{ color: '#807bc3' }}>•</span> {t('server.resources.cpu') || 'CPU'}
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
          <span style={{ color: '#3881fc' }}>•</span> {t('server.resources.ram') || 'RAM'}
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
          <span style={{ color: '#fb6158' }}>•</span> {t('server.resources.disk') || 'DYSK'}
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
        © 2025 Minecraft Server Panel | {t('app.version') || 'Wersja'} 1.1.0
      </Footer>
    </Container>
  );
}

export default ServerControl;
