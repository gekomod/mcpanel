import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiMessageSquare, 
  FiSend,
  FiZap,
  FiCpu,
  FiShield,
  FiTrendingUp,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import api from '../services/api';

const AIAssistantContainer = styled.div`
  padding: 20px;
  margin-bottom: 30px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
    border-radius: 3px;
  }
`;

const AIContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChatContainer = styled.div`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 12px;
  border: 1px solid #3a3f57;
  display: flex;
  flex-direction: column;
  height: 600px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
`;

const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #3a3f57;
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(59, 130, 246, 0.1);
`;

const AIIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const ChatTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div`
  max-width: 80%;
  padding: 15px 20px;
  border-radius: 18px;
  line-height: 1.5;
  position: relative;
  
  ${props => props.isAI ? `
    align-self: flex-start;
    background: #3a3f57;
    border-bottom-left-radius: 4px;
    color: #fff;
  ` : `
    align-self: flex-end;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-bottom-right-radius: 4px;
    color: white;
  `}
`;

const MessageSender = styled.strong`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  opacity: 0.8;
`;

const Recommendations = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
`;

const AutoFixButton = styled.button`
  margin-top: 10px;
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

const ChatInputContainer = styled.div`
  padding: 20px;
  border-top: 1px solid #3a3f57;
  display: flex;
  gap: 10px;
`;

const ChatInput = styled.input`
  flex: 1;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SendButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ToolsContainer = styled.div`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #3a3f57;
  height: fit-content;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
`;

const ToolsTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToolGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ToolItem = styled.div`
  background: #35394e;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  &:hover {
    border-color: #3b82f6;
    transform: translateX(5px);
    background: #3a3f57;
  }
`;

const ToolHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
`;

const ToolIcon = styled.div`
  color: #3b82f6;
  font-size: 16px;
`;

const ToolName = styled.strong`
  color: #fff;
  font-size: 14px;
`;

const ToolDescription = styled.div`
  color: #a4aabc;
  font-size: 12px;
  line-height: 1.4;
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a4aabc;
  font-style: italic;
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 3px;
  
  div {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3b82f6;
    animation: bounce 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    // Początkowa wiadomość AI
    setMessages([{
      id: 1,
      sender: 'ai',
      content: 'Witaj! Jestem Twoim asystentem AI MCpanel. Mogę pomóc w:\n• 🚀 Optymalizacji serwerów\n• 🔧 Rozwiązywaniu problemów\n• ⚙️ Automatyzacji zadań\n• 📊 Analizie wydajności\n\nO co chcesz zapytać?',
      timestamp: new Date(),
      suggestions: [
        "Sprawdź status moich serwerów",
        "Mam problem z lagami", 
        "Pomóż zmienić konfigurację",
        "Uruchom diagnostykę"
      ]
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const ACTION_HANDLERS = {
  start_server: async (serverId) => {
    const response = await api.post(`/servers/${serverId}/start`);
    return response.data;
  },
  stop_server: async (serverId) => {
    const response = await api.post(`/servers/${serverId}/stop`);
    return response.data;
  },
  restart_server: async (serverId) => {
    const response = await api.post(`/servers/${serverId}/restart`);
    return response.data;
  }
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: inputMessage,
        history: conversationHistory.slice(-6) // Ostatnie 6 wiadomości dla kontekstu
      });

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: response.data.response,
        actions: response.data.actions || [],
        requiresConfirmation: response.data.requires_confirmation || false,
        intent: response.data.intent,
        suggestions: response.data.suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { role: 'assistant', content: response.data.response }
      ]);

    } catch (error) {
      console.error('Błąd AI:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: '❌ Błąd połączenia z AI. Spróbuj ponownie za chwilę.',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
	
	const executeAction = async (action) => {
	  setIsLoading(true);
	  
	  try {
		let result;
		
		// Obsługa różnych typów akcji
		if (action.type === 'start_server' && action.server_id) {
		  result = await ACTION_HANDLERS.start_server(action.server_id);
		} else if (action.type === 'stop_server' && action.server_id) {
		  result = await ACTION_HANDLERS.stop_server(action.server_id);
		} else if (action.type === 'restart_server' && action.server_id) {
		  result = await ACTION_HANDLERS.restart_server(action.server_id);
		} else {
		  // Domyślna obsługa przez endpoint AI
		  const response = await api.post('/ai/execute-action', {
		    action_type: action.type,
		    parameters: action.parameters || {},
		    server_id: action.server_id
		  });
		  result = response.data;
		}

		const resultMessage = {
		  id: Date.now(),
		  sender: 'ai',
		  content: result.success ? `✅ ${result.message}` : `❌ ${result.message || 'Błąd wykonania akcji'}`,
		  timestamp: new Date()
		};
		
		setMessages(prev => [...prev, resultMessage]);
		
	  } catch (error) {
		const errorMessage = {
		  id: Date.now(),
		  sender: 'ai',
		  content: `❌ Błąd wykonania akcji: ${error.response?.data?.error || error.message}`,
		  isError: true,
		  timestamp: new Date()
		};
		setMessages(prev => [...prev, errorMessage]);
	  } finally {
		setIsLoading(false);
	  }
	};

  const ActionButtons = ({ actions, onExecute }) => {
    if (!actions || actions.length === 0) return null;
    
    return (
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onExecute(action)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  const SuggestionButtons = ({ suggestions, onSuggestionClick }) => {
    if (!suggestions || suggestions.length === 0) return null;
    
    return (
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            style={{
              padding: '6px 12px',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#3b82f6';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
              e.target.style.color = '#3b82f6';
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  };
  
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    // Auto-wyślij po 100ms dla lepszego UX
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAutoFix = async (serverId) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/ai/auto-fix', {
        issue_type: 'high_ram_usage',
        server_id: serverId
      });

      const fixMessage = {
        id: Date.now(),
        sender: 'ai',
        content: response.data.success ? 
          `✅ ${response.data.message}` : 
          `❌ ${response.data.message}`,
        actions: response.data.actions,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fixMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now(),
        sender: 'ai',
        content: '❌ Błąd automatycznej naprawy',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

const runAITool = async (toolName) => {
  setIsLoading(true);
  
  try {
    const response = await api.post(`/ai/tools/${toolName}`);
    
    let toolResult = "Narzędzie wykonane pomyślnie";
    
    if (response.data.result) {
      if (typeof response.data.result === 'string') {
        toolResult = response.data.result;
      } else if (typeof response.data.result === 'object') {
        // Prosta formatyka dla obiektów
        toolResult = JSON.stringify(response.data.result, null, 2);
      }
    }
    
    const toolMessage = {
      id: Date.now(),
      sender: 'ai',
      content: `🛠️ **${toolName}**\n\n${toolResult}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, toolMessage]);
  } catch (error) {
    const errorMessage = {
      id: Date.now(),
      sender: 'ai',
      content: `❌ Błąd narzędzia: ${error.response?.data?.error || error.message}`,
      isError: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

  const aiTools = [
    {
      name: "Szybka Diagnostyka",
      icon: <FiZap />,
      description: "Automatyczna analiza wszystkich serwerów",
      action: () => runAITool('quick-diagnostic')
    },
    {
      name: "Automatyczna Optymalizacja", 
      icon: <FiCpu />,
      description: "AI samodzielnie optymalizuje ustawienia",
      action: () => runAITool('auto-optimization')
    },
    {
      name: "Predykcja Wydajności",
      icon: <FiTrendingUp />,
      description: "Prognozowanie przyszłych problemów",
      action: () => runAITool('performance-prediction')
    },
    {
      name: "Analiza Bezpieczeństwa",
      icon: <FiShield />,
      description: "Skanowanie pod kątem zagrożeń",
      action: () => runAITool('security-analysis')
    }
  ];

  return (
    <AIAssistantContainer>
      <Header>
        <Title>AI Assistant</Title>
      </Header>

      <AIContent>
        <ChatContainer>
          <ChatHeader>
            <AIIcon>
              <FiMessageSquare />
            </AIIcon>
            <ChatTitle>MCPanel AI Assistant</ChatTitle>
          </ChatHeader>
          
          <ChatMessages>
            {messages.map(message => (
              <Message key={message.id} isAI={message.sender === 'ai'}>
                <MessageSender>
                  {message.sender === 'ai' ? 'MCPanel AI' : 'Ty'}
                </MessageSender>
                <div style={{ whiteSpace: 'pre-line' }}>
                  {message.content}
                </div>
                
                <ActionButtons 
                  actions={message.actions} 
                  onExecute={executeAction}
                />
                
                <SuggestionButtons 
                  suggestions={message.suggestions}
                  onSuggestionClick={handleSuggestionClick}
                />
              </Message>
            ))}
            
            {isLoading && (
              <Message isAI={true}>
                <MessageSender>MCPanel AI</MessageSender>
                <LoadingMessage>
                  <span>Analizuję...</span>
                  <TypingIndicator>
                    <div></div>
                    <div></div>
                    <div></div>
                  </TypingIndicator>
                </LoadingMessage>
              </Message>
            )}
            
            <div ref={messagesEndRef} />
          </ChatMessages>
          
          <ChatInputContainer>
            <ChatInput
              type="text"
              placeholder="Zapytaj AI o pomoc... (Enter aby wysłać)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <SendButton 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
            >
              <FiSend /> {isLoading ? 'Wysyłanie...' : 'Wyślij'}
            </SendButton>
          </ChatInputContainer>
        </ChatContainer>
        
        <ToolsContainer>
          <ToolsTitle>
            <FiZap /> Szybkie Narzędzia AI
          </ToolsTitle>
          <ToolGrid>
            {aiTools.map((tool, index) => (
              <ToolItem key={index} onClick={tool.action}>
                <ToolHeader>
                  <ToolIcon>{tool.icon}</ToolIcon>
                  <ToolName>{tool.name}</ToolName>
                </ToolHeader>
                <ToolDescription>{tool.description}</ToolDescription>
              </ToolItem>
            ))}
          </ToolGrid>
        </ToolsContainer>
      </AIContent>
    </AIAssistantContainer>
  );
}

export default AIAssistant;
