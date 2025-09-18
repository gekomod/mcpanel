import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiTerminal, FiSend, FiTrash2, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// Changed 'status' to '$status' to make it a transient prop
const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-left: 15px;
  
  ${props => props.$status === 'running' ? `
    background-color: #dcfce7;
    color: #16a34a;
  ` : `
    background-color: #fee2e2;
    color: #dc2626;
  `}
`;

const ConsoleContainer = styled.div`
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  height: 500px;
  display: flex;
  flex-direction: column;
`;

const ConsoleHeader = styled.div`
  background: #2d2d2d;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConsoleTitle = styled.div`
  color: #fff;
  font-weight: 500;
`;

const ConsoleActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ConsoleButton = styled.button`
  background: #404040;
  border: none;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  
  &:hover {
    background: #4a4a4a;
  }
  
  &:disabled {
    background: #666;
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
  color: #e0e0e0;
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
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  &:disabled {
    background: #f3f4f6;
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
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
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
  
  &:hover {
    background: #2563eb;
  }
`;

function Console() {
  const { serverId } = useParams();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isBedrock, setIsBedrock] = useState(false);
  const consoleEndRef = useRef(null);

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
        const lines = response.data.output.split('\n').filter(line => line.trim());
        const formattedOutput = lines.map(line => {
          // Parse timestamp from log line if available
          const timestampMatch = line.match(/\[(.*?)\]/);
          const timestamp = timestampMatch ? new Date(timestampMatch[1]) : new Date();
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
      <Header>
        <Title>
          <FiTerminal /> Console - {server.name} ({server.type.toUpperCase()})
        </Title>
        {/* Changed status to $status to use the transient prop */}
        <StatusBadge $status={server.status}>
          {server.status.toUpperCase()}
        </StatusBadge>
      </Header>

      {server.status !== 'running' && (
        <ErrorMessage>
          <FiAlertCircle />
          Server is not running. Start the server to access the console.
        </ErrorMessage>
      )}

      <ConsoleContainer>
        <ConsoleHeader>
          <ConsoleTitle>Server Console {isBedrock && '(Real-time)'}</ConsoleTitle>
          <ConsoleActions>
            <ConsoleButton 
              onClick={handleRefreshOutput}
              disabled={server.status !== 'running'}
              title="Refresh output"
            >
              <FiRefreshCw />
            </ConsoleButton>
            <ConsoleButton onClick={handleClearConsole}>
              <FiTrash2 /> Clear
            </ConsoleButton>
            <ConsoleButton 
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ background: autoRefresh ? '#4a4a4a' : '#404040' }}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              Auto: {autoRefresh ? 'ON' : 'OFF'}
            </ConsoleButton>
          </ConsoleActions>
        </ConsoleHeader>
        
        <ConsoleContent>
          {output.length === 0 ? (
            <ConsoleLine>
              {server.status === 'running' 
                ? 'No console output available. The server may be starting up...'
                : 'Server is not running. Start the server to see console output.'
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
          placeholder={server.status === 'running' ? "Type a command..." : "Server is not running"}
          disabled={server.status !== 'running'}
        />
        <SendButton 
          onClick={handleSendCommand}
          disabled={server.status !== 'running' || !command.trim()}
        >
          <FiSend /> Send
        </SendButton>
      </InputContainer>
    </Container>
  );
}

export default Console;
