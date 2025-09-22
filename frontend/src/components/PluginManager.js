import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPackage, 
  FiDownload, 
  FiTrash2, 
  FiRefreshCw,
  FiSearch,
  FiInfo,
  FiCheckCircle,
  FiXCircle,
  FiExternalLink,
  FiPlus,
  FiServer,
  FiCpu,
  FiHardDrive,
  FiGlobe,
  FiBox,
  FiCode,
  FiLayers,
  FiActivity,
  FiTerminal,
  FiFolder,
  FiSettings,
  FiChevronDown,
  FiUser,
  FiChevronUp
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

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

const ServerTypeBadge = styled.span`
  background: ${props => props.$type === 'java' ? '#1e3a8a' : '#166534'};
  color: ${props => props.$type === 'java' ? '#a5b4fc' : '#bbf7d0'};
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 12px 8px 32px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  width: 220px;
  color: #fff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  &::placeholder {
    color: #6b7280;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 12px;
  color: #6b7280;
  width: 16px;
  height: 16px;
`;

const CategoryFilter = styled.select`
  padding: 8px 12px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
  }
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

const PluginGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
`;

const PluginCard = styled.div`
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
`;

const PluginHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const PluginName = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  color: #fff;
  line-height: 1.3;
  max-width: 70%;
`;

const PluginVersion = styled.span`
  background: #1e3a8a;
  color: #a5b4fc;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const PluginDescription = styled.p`
  color: #a4aabc;
  margin-bottom: 12px;
  font-size: 0.8rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PluginMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.75rem;
  color: #6b7280;
`;

const PluginAuthor = styled.span`
  font-style: italic;
`;

const PluginType = styled.span`
  background: ${props => 
    props.$type === 'plugin' ? '#1e3a8a' : 
    props.$type === 'script' ? '#831843' : 
    props.$type === 'addon' ? '#166534' :
    props.$type === 'worlds' ? '#9a3412' :
    '#374151'
  };
  color: ${props => 
    props.$type === 'plugin' ? '#a5b4fc' : 
    props.$type === 'script' ? '#f9a8d4' : 
    props.$type === 'addon' ? '#bbf7d0' :
    props.$type === 'worlds' ? '#fed7aa' :
    '#d1d5db'
  };
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const PluginActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => props.$variant === 'install' ? `
    background: #10b981;
    color: white;
    
    &:hover:not(:disabled) {
      background: #059669;
    }
  ` : props.$variant === 'uninstall' ? `
    background: #ef4444;
    color: white;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  ` : props.$variant === 'enable' ? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  ` : props.$variant === 'disable' ? `
    background: #6b7280;
    color: white;
    
    &:hover:not(:disabled) {
      background: #4b5563;
    }
  ` : props.$variant === 'download' ? `
    background: #8b5cf6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #7c3aed;
    }
  ` : props.$variant === 'info' ? `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover:not(:disabled) {
      background: #565d81;
    }
  ` : ''}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #991b1b;
  color: #ef4444;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 4px solid #ef4444;
  font-size: 0.9rem;
`;

const DownloadLinks = styled.div`
  margin-top: 10px;
  padding: 8px;
  background: #2e3245;
  border-radius: 6px;
  font-size: 0.75rem;
`;

const DownloadLink = styled.a`
  display: block;
  color: #3b82f6;
  text-decoration: none;
  margin-bottom: 4px;
  font-size: 0.75rem;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryIcon = styled.span`
  margin-right: 6px;
`;

const ExpandableSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #3a3f57;
  display: ${props => props.$expanded ? 'block' : 'none'};
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  margin-top: 5px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SmallIcon = styled.span`
  display: flex;
  align-items: center;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

// Kategorie dostępne w systemie
const CATEGORIES = [
  { value: 'all', label: 'All Addons', icon: <FiPackage /> },
  { value: 'plugin', label: 'Plugins', icon: <FiBox /> },
  { value: 'addon', label: 'Addons', icon: <FiLayers /> },
  { value: 'script', label: 'Scripts', icon: <FiCode /> },
  { value: 'worlds', label: 'Worlds', icon: <FiGlobe /> },
  { value: 'resourcepack', label: 'Resource Packs', icon: <FiDownload /> },
  { value: 'behaviorpack', label: 'Behavior Packs', icon: <FiCpu /> }
];

function PluginManager() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addons, setAddons] = useState([]);
  const [installedAddons, setInstalledAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [installing, setInstalling] = useState({});
  const [expandedAddons, setExpandedAddons] = useState({});

  useEffect(() => {
    fetchServer();
    fetchAddons();
    fetchInstalledAddons();
  }, [serverId, activeTab]);

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      console.error('Error fetching server:', error);
      setError('Failed to load server information');
    }
  };

  const fetchAddons = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Pobierz wszystkie aktywne addony z bazy
      const response = await api.get('/addons');
      const allAddons = response.data.filter(addon => addon.is_active);
      
      setAddons(allAddons);
      
    } catch (error) {
      console.error('Error fetching addons:', error);
      setError('Failed to load addons from database');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalledAddons = async () => {
    try {
      // Pobierz zainstalowane addony dla tego serwera
      const response = await api.get(`/servers/${serverId}/installed-addons`);
      setInstalledAddons(response.data);
    } catch (error) {
      console.error('Error fetching installed addons:', error);
      // Fallback do lokalnej listy jeśli endpoint nie istnieje
      const simulatedInstalled = addons.filter(addon => addon.is_installed);
      setInstalledAddons(simulatedInstalled);
    }
  };

  const isAddonInstalled = (addonId) => {
    return installedAddons.some(addon => addon.id === addonId);
  };

  const isAddonCompatible = (addon) => {
    if (!server || !addon.minecraft_version) return true;
    
    // Prosta logika kompatybilności
    const serverVersion = server.version;
    const addonVersion = addon.minecraft_version;
    
    return serverVersion === addonVersion;
  };

  const handleInstallAddon = async (addon) => {
    try {
      setInstalling(prev => ({ ...prev, [addon.id]: true }));
      
      // Sprawdź kompatybilność
      if (!isAddonCompatible(addon)) {
        toast.warning(`This ${addon.type} is for Minecraft ${addon.minecraft_version}, but your server is running ${server.version}`);
        return;
      }
      
      toast.success(`Installing ${addon.name}...`);
      
      // Wywołaj endpoint instalacji
      await api.post(`/servers/${serverId}/addons/${addon.id}/install`);
      
      // Odśwież listę zainstalowanych
      await fetchInstalledAddons();
      
      toast.success(`${addon.name} ${addon.type === 'worlds' ? 'world' : addon.type} installed successfully!`);
      
    } catch (error) {
      console.error('Error installing addon:', error);
      toast.error(error.response?.data?.error || `Failed to install ${addon.name}`);
    } finally {
      setInstalling(prev => ({ ...prev, [addon.id]: false }));
    }
  };

  const handleUninstallAddon = async (addonId) => {
    if (!window.confirm('Are you sure you want to uninstall this addon?')) {
      return;
    }
    
    try {
      setInstalling(prev => ({ ...prev, [addonId]: true }));
      
      // Wywołaj endpoint odinstalowania
      await api.post(`/servers/${serverId}/addons/${addonId}/uninstall`);
      
      // Odśwież listę zainstalowanych
      await fetchInstalledAddons();
      
      toast.success('Addon uninstalled successfully');
      
    } catch (error) {
      console.error('Error uninstalling addon:', error);
      toast.error(error.response?.data?.error || 'Failed to uninstall addon');
    } finally {
      setInstalling(prev => ({ ...prev, [addonId]: false }));
    }
  };

  const handleToggleAddon = async (addonId, enable) => {
    try {
      setInstalling(prev => ({ ...prev, [addonId]: true }));
      
      const endpoint = enable ? 'enable' : 'disable';
      const response = await api.post(`/servers/${serverId}/addons/${addonId}/${endpoint}`);
      
      // Odśwież listę zainstalowanych
      await fetchInstalledAddons();
      
      toast.success(response.data.message);
      
    } catch (error) {
      console.error('Error toggling addon:', error);
      toast.error(error.response?.data?.error || 'Failed to update addon status');
    } finally {
      setInstalling(prev => ({ ...prev, [addonId]: false }));
    }
  };
  
  const getDownloadLinks = (addon) => {
    if (addon.type === 'addon') {
      const links = [];
      if (addon.behavior_pack_url) {
        links.push({ 
          url: addon.behavior_pack_url, 
          label: '📦 Behavior Pack',
          type: 'behavior' 
        });
      }
      if (addon.resource_pack_url) {
        links.push({ 
          url: addon.resource_pack_url, 
          label: '🎨 Resource Pack',
          type: 'resource' 
        });
      }
      return links;
    }
    // Dla pluginów i skryptów użyj download_url
    return [{ 
      url: addon.download_url, 
      label: '📥 Download',
      type: 'download' 
    }];
  };

  const handleDownloadAddon = (addon, linkType = null) => {
    let downloadUrl;
    
    if (addon.type === 'addon') {
      if (linkType === 'behavior' && addon.behavior_pack_url) {
        downloadUrl = addon.behavior_pack_url;
      } else if (linkType === 'resource' && addon.resource_pack_url) {
        downloadUrl = addon.resource_pack_url;
      } else {
        // Domyślnie pierwszy dostępny pack
        const links = getDownloadLinks(addon);
        if (links.length > 0) {
          downloadUrl = links[0].url;
        } else {
          toast.error('No download links available');
          return;
        }
      }
    } else {
      downloadUrl = addon.download_url;
    }
    
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast.info(`Downloading ${addon.name}`);
    } else {
      toast.error('Download URL not available');
    }
  };

  const toggleExpandAddon = (addonId) => {
    setExpandedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  // Filtrowanie addonów na podstawie wyszukiwania i kategorii
  const filteredMarketplaceAddons = addons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           addon.type === selectedCategory ||
                           (selectedCategory === 'resourcepack' && addon.resource_pack_url) ||
                           (selectedCategory === 'behaviorpack' && addon.behavior_pack_url);
    
    return matchesSearch && matchesCategory && !isAddonInstalled(addon.id);
  });

  const filteredInstalledAddons = installedAddons.filter(addon => {
    const matchesSearch = addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         addon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           addon.type === selectedCategory ||
                           (selectedCategory === 'resourcepack' && addon.resource_pack_url) ||
                           (selectedCategory === 'behaviorpack' && addon.behavior_pack_url);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          <SmallIcon><FiActivity /></SmallIcon> Overview
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <SmallIcon><FiTerminal /></SmallIcon> Console
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <SmallIcon><FiFolder /></SmallIcon> Files
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <SmallIcon><FiSettings /></SmallIcon> Config
        </NavTab>
        <NavTab 
          $active={true}
        >
          <SmallIcon><FiBox /></SmallIcon> Plugins
        </NavTab>
                <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> Users
        </NavTab>
      </NavTabs>

      <Header>
        <Title>
          <SmallIcon><FiPackage /></SmallIcon> Addon Manager - {server?.name}
          {server && (
            <ServerTypeBadge $type={server.type}>
              {server.type === 'java' ? <SmallIcon><FiCpu /></SmallIcon> : <SmallIcon><FiHardDrive /></SmallIcon>}
              {server.type.toUpperCase()}
            </ServerTypeBadge>
          )}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search addons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <CategoryFilter
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </CategoryFilter>
          
          <RefreshButton onClick={fetchAddons} disabled={loading}>
            <SmallIcon><FiRefreshCw /></SmallIcon> Refresh
          </RefreshButton>
        </HeaderActions>
      </Header>

      {error && (
        <ErrorMessage>
          <SmallIcon><FiXCircle /></SmallIcon>
          {error}
        </ErrorMessage>
      )}

      <Tabs>
        <Tab 
          $active={activeTab === 'marketplace'} 
          onClick={() => setActiveTab('marketplace')}
        >
          Marketplace
        </Tab>
        <Tab 
          $active={activeTab === 'installed'} 
          onClick={() => setActiveTab('installed')}
        >
          Installed Addons ({installedAddons.length})
        </Tab>
      </Tabs>

      <Content>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#a4aabc' }}>
            <LoadingSpinner style={{ marginRight: '8px' }} />
            Loading addons...
          </div>
        ) : activeTab === 'installed' ? (
          <>
            <PluginGrid>
              {filteredInstalledAddons.map(addon => (
                <PluginCard key={addon.id}>
                  {addon.image_url && (
                    <img 
                      src={addon.image_url} 
                      alt={addon.name}
                      style={{ 
                        width: '100%', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '6px', 
                        marginBottom: '10px' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <PluginHeader>
                    <PluginName>{addon.name}</PluginName>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <PluginVersion>v{addon.version}</PluginVersion>
                      <PluginType $type={addon.type}>{addon.type}</PluginType>
                    </div>
                  </PluginHeader>
                  
                  <PluginDescription>
                    {addon.description || 'No description available'}
                  </PluginDescription>
                  
                  <PluginMeta>
                    <PluginAuthor>By {addon.author || 'Unknown'}</PluginAuthor>
                    <span>MC {addon.minecraft_version}</span>
                  </PluginMeta>
                  
                  <PluginMeta>
                    <span style={{ 
                      color: addon.enabled ? '#10b981' : '#f59e0b',
                      fontWeight: '500',
                      fontSize: '0.75rem'
                    }}>
                      {addon.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </PluginMeta>
                  
                  <PluginActions>
                    {addon.type !== 'worlds' && (
                      <ActionButton 
                        $variant={addon.enabled ? 'disable' : 'enable'}
                        onClick={() => handleToggleAddon(addon.id, !addon.enabled)}
                        disabled={installing[addon.id]}
                      >
                        {installing[addon.id] ? (
                          <LoadingSpinner />
                        ) : addon.enabled ? (
                          <SmallIcon><FiXCircle /></SmallIcon>
                        ) : (
                          <SmallIcon><FiCheckCircle /></SmallIcon>
                        )}
                        {addon.enabled ? 'Disable' : 'Enable'}
                      </ActionButton>
                    )}

                    <ActionButton 
                      $variant="uninstall"
                      onClick={() => handleUninstallAddon(addon.id)}
                      disabled={installing[addon.id]}
                    >
                      {installing[addon.id] ? (
                        <LoadingSpinner />
                      ) : (
                        <SmallIcon><FiTrash2 /></SmallIcon>
                      )}
                      Uninstall
                    </ActionButton>
                    
                    <ActionButton 
                      $variant="download"
                      onClick={() => handleDownloadAddon(addon)}
                      title={addon.type === 'addon' ? 'Download main file' : 'Download'}
                    >
                      <SmallIcon><FiExternalLink /></SmallIcon> Download
                    </ActionButton>
                    
                    <ExpandButton onClick={() => toggleExpandAddon(addon.id)}>
                      <SmallIcon>
                        {expandedAddons[addon.id] ? <FiChevronUp /> : <FiChevronDown />}
                      </SmallIcon>
                      Details
                    </ExpandButton>
                  </PluginActions>
                  
                  <ExpandableSection $expanded={expandedAddons[addon.id]}>
                    {addon.type === 'addon' && (
                      <DownloadLinks>
                        <strong style={{ color: '#fff', fontSize: '0.8rem' }}>Bedrock Addon Files:</strong>
                        {getDownloadLinks(addon).map((link, index) => (
                          <DownloadLink 
                            key={index} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadAddon(addon, link.type);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {link.label}
                          </DownloadLink>
                        ))}
                        {getDownloadLinks(addon).length === 0 && (
                          <div style={{ color: '#ef4444', fontSize: '0.7rem' }}>
                            No pack files available
                          </div>
                        )}
                      </DownloadLinks>
                    )}
                  </ExpandableSection>
                </PluginCard>
              ))}
            </PluginGrid>
            
            {filteredInstalledAddons.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#a4aabc' }}>
                <SmallIcon><FiPackage size={36} style={{ marginBottom: '10px', opacity: 0.5 }} /></SmallIcon>
                <h3>No Addons Installed</h3>
                <p style={{ fontSize: '0.9rem' }}>Browse the marketplace to install addons, plugins, and scripts for your server.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <PluginGrid>
              {filteredMarketplaceAddons.map(addon => (
                <PluginCard key={addon.id}>
                  {addon.image_url && (
                    <img 
                      src={addon.image_url} 
                      alt={addon.name}
                      style={{ 
                        width: '100%', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '6px', 
                        marginBottom: '10px' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <PluginHeader>
                    <PluginName>{addon.name}</PluginName>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <PluginVersion>v{addon.version}</PluginVersion>
                      <PluginType $type={addon.type}>{addon.type}</PluginType>
                    </div>
                  </PluginHeader>
                  
                  <PluginDescription>
                    {addon.description || 'No description available'}
                  </PluginDescription>
                  
                  <PluginMeta>
                    <PluginAuthor>By {addon.author || 'Unknown'}</PluginAuthor>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span>MC {addon.minecraft_version}</span>
                      {addon.type === 'addon' && (
                        <span style={{ fontSize: '0.7rem', color: '#a4aabc' }}>
                          {addon.behavior_pack_url && addon.resource_pack_url ? 'Both packs' : 
                          addon.behavior_pack_url ? 'Behavior pack only' : 
                          addon.resource_pack_url ? 'Resource pack only' : 'No packs'}
                        </span>
                      )}
                    </div>
                  </PluginMeta>
                  
                  {!isAddonCompatible(addon) && (
                    <div style={{ 
                      background: '#fef3c7', 
                      color: '#d97706', 
                      padding: '6px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem',
                      marginBottom: '10px'
                    }}>
                      ⚠️ Incompatible with server version {server?.version}
                    </div>
                  )}
                  
                  <PluginActions>
                    <ActionButton 
                      $variant="install"
                      onClick={() => handleInstallAddon(addon)}
                      disabled={installing[addon.id] || !isAddonCompatible(addon)}
                      title={!isAddonCompatible(addon) ? `Incompatible with server version ${server?.version}` : ''}
                    >
                      {installing[addon.id] ? (
                        <LoadingSpinner />
                      ) : (
                        <SmallIcon><FiDownload /></SmallIcon>
                      )}
                      {installing[addon.id] ? 'Installing...' : 'Install'}
                    </ActionButton>
                    
                    <ActionButton 
                      $variant="download"
                      onClick={() => handleDownloadAddon(addon)}
                    >
                      <SmallIcon><FiExternalLink /></SmallIcon> Download
                    </ActionButton>
                    
                    <ExpandButton onClick={() => toggleExpandAddon(addon.id)}>
                      <SmallIcon>
                        {expandedAddons[addon.id] ? <FiChevronUp /> : <FiChevronDown />}
                      </SmallIcon>
                      Details
                    </ExpandButton>
                  </PluginActions>
                  
                  <ExpandableSection $expanded={expandedAddons[addon.id]}>
                    {addon.type === 'addon' && (
                      <DownloadLinks>
                        <strong style={{ color: '#fff', fontSize: '0.8rem' }}>Bedrock Addon Files:</strong>
                        <DownloadLink href={addon.behavior_pack_url} target="_blank" rel="noopener noreferrer">
                          📦 Behavior Pack
                        </DownloadLink>
                        <DownloadLink href={addon.resource_pack_url} target="_blank" rel="noopener noreferrer">
                          🎨 Resource Pack
                        </DownloadLink>
                      </DownloadLinks>
                    )}
                  </ExpandableSection>
                </PluginCard>
              ))}
            </PluginGrid>
            
            {filteredMarketplaceAddons.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#a4aabc' }}>
                {searchTerm || selectedCategory !== 'all' ? (
                  <>
                    <SmallIcon><FiSearch size={36} style={{ marginBottom: '10px', opacity: 0.5 }} /></SmallIcon>
                    <h3>No Addons Found</h3>
                    <p style={{ fontSize: '0.9rem' }}>No addons match your search criteria. Try a different search term or category.</p>
                  </>
                ) : (
                  <>
                    <SmallIcon><FiPlus size={36} style={{ marginBottom: '10px', opacity: 0.5 }} /></SmallIcon>
                    <h3>No Addons Available</h3>
                    <p style={{ fontSize: '0.9rem' }}>No addons are currently available in the marketplace.</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Content>
    </Container>
  );
}

export default PluginManager;
