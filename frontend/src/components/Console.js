import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { 
  FiTerminal, 
  FiSend, 
  FiTrash2, 
  FiRefreshCw, 
  FiAlertCircle,
  FiActivity,
  FiFolder,
  FiSettings,
  FiUser,
  FiDownload,
  FiBox
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
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

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-left: 15px;
  
  ${props => props.$status === 'running' ? `
    background-color: #065f46;
    color: #10b981;
  ` : `
    background-color: #991b1b;
    color: #ef4444;
  `}
`;

const ConsoleContainer = styled.div`
  background: #2e3245;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  height: 500px;
  display: flex;
  flex-direction: column;
`;

const ConsoleHeader = styled.div`
  background: #35394e;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3f57;
`;

const ConsoleTitle = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 18px;
`;

const ConsoleActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ConsoleButton = styled.button`
  background: #4a5070;
  border: none;
  color: #cbd5e1;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #565d81;
    color: white;
  }
  
  &:disabled {
    background: #3a3f57;
    cursor: not-allowed;
  }
`;

const ConsoleContent = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
  color: #a4aabc;
  background: #35394e;
`;

const ConsoleLine = styled.div`
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-all;
`;

const Timestamp = styled.span`
  color: #6a9955;
  margin-right: 10px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const CommandInput = styled.input`
  flex: 1;
  padding: 12px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &:disabled {
    background: #2e3245;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  padding: 0 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #991b1b;
  color: #ef4444;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #ef4444;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
  }
`;

function Console() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isBedrock, setIsBedrock] = useState(false);
  const consoleEndRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchServer();
  }, [serverId]);

  useEffect(() => {
    if (server) {
      setIsBedrock(server.type === 'bedrock');
      if (server.status === 'running') {
        fetchOutput();
        
        // Set up auto-refresh if server is running
        let refreshInterval;
        if (autoRefresh) {
          refreshInterval = setInterval(fetchOutput, 2000); // Refresh every 2 seconds
        }

        return () => {
          if (refreshInterval) clearInterval(refreshInterval);
        };
      }
    }
  }, [serverId, autoRefresh, server]);

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      console.error('Error fetching server:', error);
      setError('Failed to load server information');
    } finally {
      setLoading(false);
    }
  };

const fetchOutput = async () => {
  if (!server || server.status !== 'running') return;

  try {
    let response;
    if (isBedrock) {
      // Use real-time output for Bedrock servers
      response = await api.get(`/servers/${serverId}/realtime-output`);
    } else {
      // Use log files for Java servers
      response = await api.get(`/servers/${serverId}/logs`);
    }
    
    if (response.data && response.data.output) {
      let logContent = response.data.output;
      
      // Dla serwerów Java - usuń kod ANSI z logów
      if (!isBedrock) {
        logContent = removeAnsiCodes(logContent);
      }
      
      const lines = logContent.split('\n').filter(line => line.trim());
      const formattedOutput = lines.map(line => {
        // Parse timestamp from log line if available
        const timestampMatch = line.match(/\[(.*?)\]/);
        const timestamp = timestampMatch ? parseLogTimestamp(timestampMatch[1]) : new Date();
        return {
          timestamp: timestamp,
          message: line.replace(/\[.*?\]\s*/, '') // Remove timestamp from message
        };
      });
      setOutput(formattedOutput);
    }
  } catch (error) {
    console.error('Error fetching output:', error);
    // Don't set error state for output to avoid breaking the UI
  }
};

// Funkcja do usuwania kodów ANSI
const removeAnsiCodes = (text) => {
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

// Funkcja do parsowania timestamp z logów Minecraft
const parseLogTimestamp = (timestampStr) => {
  try {
    // Format timestamp z logów: "19:38:22"
    const [hours, minutes, seconds] = timestampStr.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, seconds, 0);
    return now;
  } catch (error) {
    console.warn('Failed to parse timestamp:', timestampStr);
    return new Date();
  }
};

  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [output]);

  const handleSendCommand = async () => {
    if (!command.trim() || !server || server.status !== 'running') return;

    // Add command to output
    const newOutput = [...output, 
      { timestamp: new Date(), message: `> ${command}` }
    ];
    setOutput(newOutput);
    
    try {
      // Send command to server
      await api.post(`/servers/${serverId}/command`, {
        command: command
      });
      
      // Refresh output to see command result
      setTimeout(fetchOutput, 1000);
      
    } catch (error) {
      setOutput(prev => [...prev, 
        { 
          timestamp: new Date(), 
          message: `Error: ${error.response?.data?.error || 'Failed to execute command'}` 
        }
      ]);
    }
    
    setCommand('');
  };

  const handleClearConsole = () => {
    setOutput([]);
  };

  const handleRefreshOutput = () => {
    fetchOutput();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    }
  };

  if (loading) {
    return <Container>Loading server console...</Container>;
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>
            <FiTerminal /> Console - Error
          </Title>
        </Header>
        <ErrorMessage>
          <FiAlertCircle />
          {error}
        </ErrorMessage>
        <RetryButton onClick={fetchServer}>
          <FiRefreshCw /> Try Again
        </RetryButton>
      </Container>
    );
  }

  if (!server) {
    return <Container>Server not found</Container>;
  }

  return (
    <Container>
      <NavTabs>
        <NavTab 
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          <FiActivity /> {t('page.dashboard') || 'Overview'}
        </NavTab>
        <NavTab 
          $active={true}
        >
          <FiTerminal /> {t('nav.console') || 'Console'}
        </NavTab>
        <NavTab 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> {t('page.files') || 'Files'}
        </NavTab>
        <NavTab 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <FiSettings /> {t('page.server.settings') || 'Config'}
        </NavTab>
        <NavTab 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> {t('page.plugins') || 'Plugins'}
        </NavTab>
        <NavTab 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> {t('page.server.users') || 'Users'}
        </NavTab>
        
        <NavTab 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> {t('page.backups') || 'Backups'}
        </NavTab>
      </NavTabs>

      <Header>
        <Title>
          <FiTerminal /> {t('server.console.title')} - {server.name} ({server.type.toUpperCase()})
        </Title>
        <StatusBadge $status={server.status}>
          {server.status.toUpperCase()}
        </StatusBadge>
      </Header>

      {server.status !== 'running' && (
        <ErrorMessage>
          <FiAlertCircle />
          {t('server.console.notRunning')}
        </ErrorMessage>
      )}

      <ConsoleContainer>
        <ConsoleHeader>
          <ConsoleTitle>{t('server.console.title')} {isBedrock && '(Real-time)'}</ConsoleTitle>
          <ConsoleActions>
            <ConsoleButton 
              onClick={handleRefreshOutput}
              disabled={server.status !== 'running'}
              title={t('server.console.refreshOutput')}
            >
              <FiRefreshCw />
            </ConsoleButton>
            <ConsoleButton onClick={handleClearConsole}>
              <FiTrash2 /> {t('common.clear')} 
            </ConsoleButton>
            <ConsoleButton 
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ background: autoRefresh ? '#3b82f6' : '#4a5070', color: 'white' }}
              title={autoRefresh ? t('server.console.autoRefreshEnabled') : t('server.console.autoRefreshDisabled')}
            >
              Auto: {autoRefresh ? 'ON' : 'OFF'}
            </ConsoleButton>
          </ConsoleActions>
        </ConsoleHeader>
        
        <ConsoleContent>
          {output.length === 0 ? (
            <ConsoleLine>
              {server.status === 'running' 
				  ? t('server.console.noOutputStarting')
				  : t('server.console.noOutputStopped')
				}
            </ConsoleLine>
          ) : (
            output.map((line, index) => (
              <ConsoleLine key={index}>
                <Timestamp>[{line.timestamp.toLocaleTimeString()}]</Timestamp>
                {line.message}
              </ConsoleLine>
            ))
          )}
          <div ref={consoleEndRef} />
        </ConsoleContent>
      </ConsoleContainer>

      <InputContainer>
        <CommandInput
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={server.status === 'running' ? t('server.console.typeCommand') : t('server.console.serverNotRunning')}
          disabled={server.status !== 'running'}
        />
        <SendButton 
          onClick={handleSendCommand}
          disabled={server.status !== 'running' || !command.trim()}
        >
          <FiSend /> {t('common.send')}
        </SendButton>
      </InputContainer>
    </Container>
  );
}

export default Console;
