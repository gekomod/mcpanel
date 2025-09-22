import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiSettings, 
  FiSave, 
  FiServer,
  FiCpu,
  FiHardDrive,
  FiShield,
  FiBell,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiGlobe,
  FiRefreshCw,
  FiActivity,
  FiTerminal,
  FiFolder,
  FiUser,
  FiDownload,
  FiBox
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

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
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid #3a3f57;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const Tab = styled.button`
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: #a4aabc;
  border-bottom: 2px solid transparent;
  
  ${props => props.$active && `
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  `}
  
  &:hover {
    color: #3b82f6;
  }
`;

const Content = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Section = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #a4aabc;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 10px;
  color: #a4aabc;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #3a3f57;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #4a5070;
  color: #cbd5e1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #565d81;
  }
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 5px;
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

const NotificationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SuccessIcon = styled(FiCheckCircle)`
  color: #10b981;
  font-size: 1.2rem;
`;

const ErrorIcon = styled(FiXCircle)`
  color: #ef4444;
  font-size: 1.2rem;
`;

const InfoIcon = styled(FiInfo)`
  color: #3b82f6;
  font-size: 1.2rem;
`;

const WorldList = styled.div`
  margin-top: 15px;
`;

const WorldItem = styled.div`
  padding: 12px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  margin-bottom: 10px;
  background: ${props => props.$active ? '#1e3a8a' : '#35394e'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#1e40af' : '#3a3f57'};
  }
`;

const WorldName = styled.div`
  font-weight: 500;
  color: #fff;
`;

const WorldPath = styled.div`
  font-size: 0.8rem;
  color: #a4aabc;
  margin-top: 4px;
`;

const RefreshButton = styled.button`
  padding: 8px 12px;
  background: #4a5070;
  color: #cbd5e1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  
  &:hover {
    background: #565d81;
  }
  
  &:disabled {
    background: #3a3f57;
    cursor: not-allowed;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

function Settings() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [server, setServer] = useState(null);
  const [properties, setProperties] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [worlds, setWorlds] = useState([]);
  const [loadingWorlds, setLoadingWorlds] = useState(false);

  useEffect(() => {
    checkPermissions();
    fetchServer();
    fetchProperties();
  }, [serverId]);

  useEffect(() => {
    if (server?.type === 'bedrock') {
      fetchWorlds();
    }
  }, [server]);

  const showSuccess = (message) => {
    toast.success(
      <NotificationContainer>
        <SuccessIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const showError = (message) => {
    toast.error(
      <NotificationContainer>
        <ErrorIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const showInfo = (message) => {
    toast.info(
      <NotificationContainer>
        <InfoIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const checkPermissions = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/users`);
      const currentUser = response.data.find(u => u.user_id === user.id);
      
      if (currentUser && currentUser.permissions.can_edit_files) {
        setHasPermission(true);
      } else if (user.role === 'admin') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
        showInfo(`You do not have permission to edit server settings`);
      }
    } catch (error) {
      showError(`Error checking permissions: ${error}`);
    }
  };

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      showError(`Error fetching server: ${error}`);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/properties`);
      setProperties(response.data);
      setLoading(false);
    } catch (error) {
      showError(`Error fetching properties: ${error}`);
      setLoading(false);
    }
  };

  const fetchWorlds = async () => {
    if (!server) return;
    
    setLoadingWorlds(true);
    try {
      // Pobierz listę plików w głównym katalogu serwera
      const response = await api.get(`/servers/${serverId}/files?path=worlds`);
      const files = response.data;
      
      // Filtruj tylko katalogi (światy) - pomiń standardowe katalogi
      const worldDirectories = files.filter(file => 
        file.isDirectory && 
        !['behavior_packs', 'resource_packs', 'development_behavior_packs', 
          'development_resource_packs', 'worlds', 'backups', 'logs'].includes(file.name)
      );
      
      // Sprawdź każdy katalog czy zawiera pliki świata Bedrock
      const worldsList = [];
      for (const dir of files) {
        try {
          const worldFiles = await api.get(`/servers/${serverId}/files?path=worlds/${dir.name}`);
          const hasWorldFiles = worldFiles.data.some(file => 
            file.name === 'level.dat' || file.name === 'levelname.txt'
          );
          
          if (hasWorldFiles) {
            worldsList.push({
              name: dir.name,
              path: `worlds/${dir.name}`,
              isActive: dir.name === (properties['level-name'] || 'Bedrock level')
            });
          }
        } catch (error) {
          console.log(`Could not check world directory ${dir.name}:`, error);
        }
      }
      
      setWorlds(worldsList);
    } catch (error) {
      console.log('Error fetching worlds:', error);
      setWorlds([]);
    } finally {
      setLoadingWorlds(false);
    }
  };

  const handlePropertyChange = (key, value) => {
    setProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWorldChange = async (worldName) => {
    if (!hasPermission) {
      showError('You do not have permission to change worlds');
      return;
    }

    try {
      // Zmień świat w properties
      handlePropertyChange('level-name', worldName);
      
      showInfo(`World changed to ${worldName}. Remember to save settings.`);
      
      // Po zmianie świata, zaktualizuj pliki world_*_packs.json
      await updateWorldPacksFiles(worldName);
      
    } catch (error) {
      showError(`Error changing world: ${error}`);
    }
  };

const updateWorldPacksFiles = async (worldName) => {
  try {
    // Pobierz zainstalowane dodatki dla tego serwera
    const addonsResponse = await api.get(`/servers/${serverId}/installed-addons`);
    const installedAddons = addonsResponse.data;

    // Filtruj tylko dodatki, które są zainstalowane na tym serwerze
    const serverAddons = installedAddons.filter(addon => 
      addon.installed_on_servers && addon.installed_on_servers.includes(parseInt(serverId))
    );

    // Przygotuj dane dla behavior packs
    const newBehaviorPacks = serverAddons
      .filter(addon => addon.behavior_pack_uuid && addon.enabled)
      .map(addon => ({
        pack_id: addon.behavior_pack_uuid,
        version: addon.behavior_pack_version || [1, 0, 0]
      }));

    // Przygotuj dane dla resource packs
    const newResourcePacks = serverAddons
      .filter(addon => addon.resource_pack_uuid && addon.enabled)
      .map(addon => ({
        pack_id: addon.resource_pack_uuid,
        version: addon.resource_pack_version || [1, 0, 0]
      }));

    // Sprawdź i zaktualizuj plik world_behavior_packs.json
    try {
      const existingBehaviorPacksResponse = await api.get(`/servers/${serverId}/files/read?path=worlds/${worldName}/world_behavior_packs.json`);
      const existingBehaviorPacks = JSON.parse(existingBehaviorPacksResponse.data.content);
      
      // Połącz istniejące pakiety z nowymi, unikając duplikatów
      const mergedBehaviorPacks = [...existingBehaviorPacks];
      newBehaviorPacks.forEach(newPack => {
        if (!mergedBehaviorPacks.some(existingPack => existingPack.pack_id === newPack.pack_id)) {
          mergedBehaviorPacks.push(newPack);
        }
      });

      await api.post(`/servers/${serverId}/files/write`, {
        path: `worlds/${worldName}/world_behavior_packs.json`,
        content: JSON.stringify(mergedBehaviorPacks, null, 2)
      });
    } catch (error) {
      // Jeśli plik nie istnieje lub jest pusty, utwórz nowy
      if (error.response?.status === 404 || error.response?.status === 500) {
        await api.post(`/servers/${serverId}/files/write`, {
          path: `worlds/${worldName}/world_behavior_packs.json`,
          content: JSON.stringify(newBehaviorPacks, null, 2)
        });
      } else {
        throw error;
      }
    }

    // Sprawdź i zaktualizuj plik world_resource_packs.json
    try {
      const existingResourcePacksResponse = await api.get(`/servers/${serverId}/files/read?path=worlds/${worldName}/world_resource_packs.json`);
      const existingResourcePacks = JSON.parse(existingResourcePacksResponse.data.content);
      
      // Połącz istniejące pakiety z nowymi, unikając duplikatów
      const mergedResourcePacks = [...existingResourcePacks];
      newResourcePacks.forEach(newPack => {
        if (!mergedResourcePacks.some(existingPack => existingPack.pack_id === newPack.pack_id)) {
          mergedResourcePacks.push(newPack);
        }
      });

      await api.post(`/servers/${serverId}/files/write`, {
        path: `worlds/${worldName}/world_resource_packs.json`,
        content: JSON.stringify(mergedResourcePacks, null, 2)
      });
    } catch (error) {
      // Jeśli plik nie istnieje lub jest pusty, utwórz nowy
      if (error.response?.status === 404 || error.response?.status === 500) {
        await api.post(`/servers/${serverId}/files/write`, {
          path: `worlds/${worldName}/world_resource_packs.json`,
          content: JSON.stringify(newResourcePacks, null, 2)
        });
      } else {
        throw error;
      }
    }

    showInfo(`World pack files updated for ${worldName}`);

  } catch (error) {
    console.error('Error updating world pack files:', error);
    showError('Could not update world pack files automatically');
  }
};

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/servers/${serverId}/properties`, properties);
      
      // Jeśli to serwer Bedrock i zmieniono świat, zaktualizuj pliki packs
      if (server?.type === 'bedrock' && properties['level-name']) {
        await updateWorldPacksFiles(properties['level-name']);
      }
      
      setSaving(false);
      showSuccess(`Settings saved successfully`);
    } catch (error) {
      showError('Failed to save settings');
      setSaving(false);
    }
  };

  if (loading) {
    return <Container>Loading settings...</Container>;
  }

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          <FiActivity /> Overview
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> Console
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> Files
        </NavTab>
        <NavTab 
          $active={true}
        >
          <FiSettings /> Config
        </NavTab>
        <NavTab 
          $active={false} 
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
        
         <NavTab 
          $active={activeTab === 'backups'} 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> Backups
          </NavTab>
      </NavTabs>

      <Header>
        <Title>
          <FiSettings /> Settings - {server?.name}
        </Title>
      </Header>

      <Tabs>
        <Tab 
          $active={activeTab === 'general'} 
          onClick={() => setActiveTab('general')}
        >
          <FiServer /> General
        </Tab>
        <Tab 
          $active={activeTab === 'performance'} 
          onClick={() => setActiveTab('performance')}
        >
          <FiCpu /> Performance
        </Tab>
        <Tab 
          $active={activeTab === 'world'} 
          onClick={() => setActiveTab('world')}
        >
          <FiHardDrive /> World
        </Tab>
        {server?.type === 'bedrock' && (
          <Tab 
            $active={activeTab === 'bedrock-worlds'} 
            onClick={() => setActiveTab('bedrock-worlds')}
          >
            <FiGlobe /> Bedrock Worlds
          </Tab>
        )}
        <Tab 
          $active={activeTab === 'security'} 
          onClick={() => setActiveTab('security')}
        >
          <FiShield /> Security
        </Tab>
        <Tab 
          $active={activeTab === 'notifications'} 
          onClick={() => setActiveTab('notifications')}
        >
          <FiBell /> Notifications
        </Tab>
      </Tabs>

      <Content>
        {activeTab === 'general' && (
          <>
            <Section>
              <SectionTitle>General Settings</SectionTitle>
              
              <FormGroup>
                <Label>Server Name</Label>
                <Input
                  type="text"
                  value={properties['server-name'] || ''}
                  onChange={(e) => handlePropertyChange('server-name', e.target.value)}
                  placeholder="My Minecraft Server"
                />
                <Description>The name of your Minecraft server</Description>
              </FormGroup>
              
              <FormGroup>
                <Label>MOTD (Message of the Day)</Label>
                <TextArea
                  value={properties['motd'] || ''}
                  onChange={(e) => handlePropertyChange('motd', e.target.value)}
                  placeholder="Welcome to our Minecraft server!"
                />
                <Description>Message shown when players connect to your server</Description>
              </FormGroup>
              
              <TwoColumnGrid>
                <FormGroup>
                  <Label>Max Players</Label>
                  <Input
                    type="number"
                    value={properties['max-players'] || ''}
                    onChange={(e) => handlePropertyChange('max-players', e.target.value)}
                    min="1"
                    max="100"
                  />
                  <Description>Maximum number of players allowed on the server</Description>
                </FormGroup>
                
                <FormGroup>
                  <Label>Server Port</Label>
                  <Input
                    type="number"
                    value={properties['server-port'] || ''}
                    onChange={(e) => handlePropertyChange('server-port', e.target.value)}
                    min="1"
                    max="65535"
                  />
                  <Description>The port the server will listen on</Description>
                </FormGroup>
              </TwoColumnGrid>
            </Section>
            
            <Section>
              <SectionTitle>Game Settings</SectionTitle>
              
              <TwoColumnGrid>
                <FormGroup>
                  <Label>Game Mode</Label>
                  <Select
                    value={properties['gamemode'] || 'survival'}
                    onChange={(e) => handlePropertyChange('gamemode', e.target.value)}
                  >
                    <option value="survival">Survival</option>
                    <option value="creative">Creative</option>
                    <option value="adventure">Adventure</option>
                    <option value="spectator">Spectator</option>
                  </Select>
                  <Description>Default game mode for new players</Description>
                </FormGroup>
                
                <FormGroup>
                  <Label>Difficulty</Label>
                  <Select
                    value={properties['difficulty'] || 'easy'}
                    onChange={(e) => handlePropertyChange('difficulty', e.target.value)}
                  >
                    <option value="peaceful">Peaceful</option>
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </Select>
                  <Description>Difficulty level of the server</Description>
                </FormGroup>
              </TwoColumnGrid>
              
              {server?.type !== 'bedrock' && (
                <FormGroup>
                  <Label>Default World Type</Label>
                  <Select
                    value={properties['level-type'] || 'default'}
                    onChange={(e) => handlePropertyChange('level-type', e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="flat">Flat</option>
                    <option value="largeBiomes">Large Biomes</option>
                    <option value="amplified">Amplified</option>
                    <option value="customized">Customized</option>
                  </Select>
                  <Description>Type of world generation</Description>
                </FormGroup>
              )}
            </Section>
          </>
        )}
        
        {activeTab === 'bedrock-worlds' && server?.type === 'bedrock' && (
          <Section>
            <SectionHeader>
              <SectionTitle>
                <FiGlobe /> Bedrock Worlds
              </SectionTitle>
              <RefreshButton onClick={fetchWorlds} disabled={loadingWorlds}>
                <FiRefreshCw /> Refresh
              </RefreshButton>
            </SectionHeader>
            
            {loadingWorlds ? (
              <div>Loading worlds...</div>
            ) : worlds.length === 0 ? (
              <div>
                No Bedrock worlds found in the server directory.
                <br />
                Worlds will appear here once you create them in the server's main folder.
              </div>
            ) : (
              <WorldList>
                {worlds.map(world => (
                  <WorldItem
                    key={world.name}
                    $active={world.name === (properties['level-name'] || 'Bedrock level')}
                    onClick={() => handleWorldChange(world.name)}
                  >
                    <WorldName>{world.name}</WorldName>
                    <WorldPath>/{world.path}</WorldPath>
                    {world.name === (properties['level-name'] || 'Bedrock level') && (
                      <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '5px' }}>
                        ✓ Active World
                      </div>
                    )}
                  </WorldItem>
                ))}
              </WorldList>
            )}
            
            <Description>
              Select a world to make it active. The server will use this world when starting.
              Changing worlds will automatically update the world pack files with installed addons.
            </Description>
          </Section>
        )}
        
        {activeTab === 'world' && (
          <>
            <Section>
              <SectionTitle>World Settings</SectionTitle>
              
              <FormGroup>
                <Label>World Name</Label>
                <Input
                  type="text"
                  value={properties['level-name'] || 'world'}
                  onChange={(e) => handlePropertyChange('level-name', e.target.value)}
                />
                <Description>Name of the world folder</Description>
              </FormGroup>
              
              {server?.type !== 'bedrock' && (
                <>
                  <FormGroup>
                    <Label>Seed</Label>
                    <Input
                      type="text"
                      value={properties['level-seed'] || ''}
                      onChange={(e) => handlePropertyChange('level-seed', e.target.value)}
                      placeholder="Leave empty for random"
                    />
                    <Description>Seed for world generation</Description>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Allow Nether</Label>
                    <CheckboxLabel>
                      <Checkbox
                        type="checkbox"
                        checked={properties['allow-nether'] !== 'false'}
                        onChange={(e) => handlePropertyChange('allow-nether', e.target.checked ? 'true' : 'false')}
                      />
                      Enable the Nether dimension
                    </CheckboxLabel>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Generate Structures</Label>
                    <CheckboxLabel>
                      <Checkbox
                        type="checkbox"
                        checked={properties['generate-structures'] !== 'false'}
                        onChange={(e) => handlePropertyChange('generate-structures', e.target.checked ? 'true' : 'false')}
                      />
                      Generate villages, strongholds, etc.
                    </CheckboxLabel>
                  </FormGroup>
                </>
              )}
            </Section>
            
            <Section>
              <SectionTitle>World Management</SectionTitle>
              
              <FormGroup>
                <Label>Spawn Protection</Label>
                <Input
                  type="number"
                  value={properties['spawn-protection'] || '16'}
                  onChange={(e) => handlePropertyChange('spawn-protection', e.target.value)}
                  min="0"
                  max="10000"
                />
                <Description>Radius of spawn protection (0 to disable)</Description>
              </FormGroup>
              
              <FormGroup>
                <Label>Allow Flight</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={properties['allow-flight'] === 'true'}
                    onChange={(e) => handlePropertyChange('allow-flight', e.target.checked ? 'true' : 'false')}
                  />
                  Allow players to fly (may require client mods)
                </CheckboxLabel>
              </FormGroup>
            </Section>
          </>
        )}
        
        {activeTab === 'performance' && (
          <>
            <Section>
              <SectionTitle>Performance Settings</SectionTitle>
              
              <TwoColumnGrid>
                <FormGroup>
                  <Label>View Distance</Label>
                  <Input
                    type="number"
                    value={properties['view-distance'] || '10'}
                    onChange={(e) => handlePropertyChange('view-distance', e.target.value)}
                    min="3"
                    max="32"
                  />
                  <Description>How many chunks the server sends to clients (higher = more RAM usage)</Description>
                </FormGroup>
                
                <FormGroup>
                  <Label>Simulation Distance</Label>
                  <Input
                    type="number"
                    value={properties['simulation-distance'] || '10'}
                    onChange={(e) => handlePropertyChange('simulation-distance', e.target.value)}
                    min="3"
                    max="32"
                  />
                  <Description>How many chunks away from players the server updates entities</Description>
                </FormGroup>
              </TwoColumnGrid>
              
              <FormGroup>
                <Label>Max World Size</Label>
                <Input
                  type="number"
                  value={properties['max-world-size'] || '29999984'}
                  onChange={(e) => handlePropertyChange('max-world-size', e.target.value)}
                  min="1"
                  max="29999984"
                />
                <Description>Maximum possible size of the world (in blocks)</Description>
              </FormGroup>
            </Section>
            
            <Section>
              <SectionTitle>Resource Limits</SectionTitle>
              
              <TwoColumnGrid>
                <FormGroup>
                  <Label>Max Build Height</Label>
                  <Input
                    type="number"
                    value={properties['max-build-height'] || '256'}
                    onChange={(e) => handlePropertyChange('max-build-height', e.target.value)}
                    min="64"
                    max="2048"
                  />
                  <Description>Maximum building height</Description>
                </FormGroup>
                
                <FormGroup>
                  <Label>Max Tick Time</Label>
                  <Input
                    type="number"
                    value={properties['max-tick-time'] || '60000'}
                    onChange={(e) => handlePropertyChange('max-tick-time', e.target.value)}
                    min="1000"
                  />
                  <Description>Maximum time (ms) a single tick can take before the server watchdog stops it</Description>
                </FormGroup>
              </TwoColumnGrid>
            </Section>
          </>
        )}
        
        {activeTab === 'security' && (
          <>
            <Section>
              <SectionTitle>Server Security</SectionTitle>
              
              <FormGroup>
                <Label>Online Mode</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={properties['online-mode'] !== 'false'}
                    onChange={(e) => handlePropertyChange('online-mode', e.target.checked ? 'true' : 'false')}
                  />
                  Verify players with Minecraft's official servers (recommended)
                </CheckboxLabel>
              </FormGroup>
              
              <FormGroup>
                <Label>Enforce Whitelist</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={properties['enforce-whitelist'] === 'true'}
                    onChange={(e) => handlePropertyChange('enforce-whitelist', e.target.checked ? 'true' : 'false')}
                  />
                  Only allow whitelisted players to join
                </CheckboxLabel>
              </FormGroup>
              
              <FormGroup>
                <Label>Enable Command Block</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={properties['enable-command-block'] === 'true'}
                    onChange={(e) => handlePropertyChange('enable-command-block', e.target.checked ? 'true' : 'false')}
                  />
                  Allow command blocks to be used in the world
                </CheckboxLabel>
              </FormGroup>
            </Section>
            
            <Section>
              <SectionTitle>Player Restrictions</SectionTitle>
              
              <FormGroup>
                <Label>PVP</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={properties['pvp'] !== 'false'}
                    onChange={(e) => handlePropertyChange('pvp', e.target.checked ? 'true' : 'false')}
                  />
                  Allow players to fight each other
                </CheckboxLabel>
              </FormGroup>
              
              <FormGroup>
                <Label>Force Resource Pack</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={properties['resource-pack'] !== ''}
                    onChange={(e) => handlePropertyChange('resource-pack', e.target.checked ? 'https://example.com/pack.zip' : '')}
                  />
                  Force players to use a specific resource pack
                </CheckboxLabel>
              </FormGroup>
            </Section>
          </>
        )}
        
        {activeTab === 'notifications' && (
          <>
            <Section>
              <SectionTitle>Notification Settings</SectionTitle>
              
              <FormGroup>
                <Label>Discord Webhook URL</Label>
                <Input
                  type="url"
                  value={properties['discord-webhook'] || ''}
                  onChange={(e) => handlePropertyChange('discord-webhook', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                />
                <Description>Webhook URL for sending server notifications to Discord</Description>
              </FormGroup>
              
              <FormGroup>
                <Label>Send Notifications for</Label>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                  />
                  Server startup
                </CheckboxLabel>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                  />
                  Server shutdown
                </CheckboxLabel>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                  />
                  Player joins
                </CheckboxLabel>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={false}
                    onChange={() => {}}
                  />
                  Player leaves
                </CheckboxLabel>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={false}
                    onChange={() => {}}
                  />
                  Server warnings
                </CheckboxLabel>
              </FormGroup>
            </Section>
          </>
        )}
        
        <ButtonGroup>
          <CancelButton onClick={() => fetchProperties()}>
            Discard Changes
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={saving || !hasPermission}>
            <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
          </SaveButton>
        </ButtonGroup>
      </Content>
    </Container>
  );
}

export default Settings;
