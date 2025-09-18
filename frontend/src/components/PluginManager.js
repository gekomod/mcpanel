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
  FiLayers
} from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const ServerTypeBadge = styled.span`
  background: ${props => props.$type === 'java' ? '#e0e7ff' : '#dcfce7'};
  color: ${props => props.$type === 'java' ? '#3730a3' : '#166534'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 10px 15px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 15px;
  color: #6b7280;
`;

const CategoryFilter = styled.select`
  padding: 10px 15px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const Tab = styled.button`
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
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
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const PluginGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const PluginCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const PluginHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const PluginName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #374151;
`;

const PluginVersion = styled.span`
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const PluginDescription = styled.p`
  color: #6b7280;
  margin-bottom: 20px;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PluginMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 0.85rem;
  color: #6b7280;
`;

const PluginAuthor = styled.span`
  font-style: italic;
`;

const PluginType = styled.span`
  background: ${props => 
    props.$type === 'plugin' ? '#e0e7ff' : 
    props.$type === 'script' ? '#fce7f3' : 
    props.$type === 'addon' ? '#dcfce7' :
    props.$type === 'worlds' ? '#ffedd5' :
    '#f3f4f6'
  };
  color: ${props => 
    props.$type === 'plugin' ? '#3730a3' : 
    props.$type === 'script' ? '#be185d' : 
    props.$type === 'addon' ? '#166534' :
    props.$type === 'worlds' ? '#9a3412' :
    '#374151'
  };
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const PluginActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
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
    background: #6b7280;
    color: white;
    
    &:hover:not(:disabled) {
      background: #4b5563;
    }
  ` : ''}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
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
  background: #fee2e2;
  color: #dc2626;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DownloadLinks = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.8rem;
`;

const DownloadLink = styled.a`
  display: block;
  color: #3b82f6;
  text-decoration: none;
  margin-bottom: 5px;
  
  &:hover {
    text-decoration: underline;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryIcon = styled.span`
  margin-right: 8px;
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
  const [server, setServer] = useState(null);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addons, setAddons] = useState([]);
  const [installedAddons, setInstalledAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [installing, setInstalling] = useState({});

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
      <Header>
        <Title>
          <FiPackage /> Addon Manager - {server?.name}
          {server && (
            <ServerTypeBadge $type={server.type}>
              {server.type === 'java' ? <FiCpu /> : <FiHardDrive />}
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
            <FiRefreshCw /> Refresh
          </RefreshButton>
        </HeaderActions>
      </Header>

      {error && (
        <ErrorMessage>
          <FiXCircle />
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <LoadingSpinner style={{ marginRight: '10px' }} />
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
                        height: '150px', 
                        objectFit: 'cover', 
                        borderRadius: '6px', 
                        marginBottom: '15px' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <PluginHeader>
                    <PluginName>{addon.name}</PluginName>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      color: addon.enabled ? '#16a34a' : '#d97706',
                      fontWeight: '500'
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
						  <FiXCircle />
						) : (
						  <FiCheckCircle />
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
                        <FiTrash2 />
                      )}
                      Uninstall
                    </ActionButton>
                    
                    <ActionButton 
                      $variant="download"
                      onClick={() => handleDownloadAddon(addon)}
                      title={addon.type === 'addon' ? 'Download main file' : 'Download'}
                    >
                      <FiExternalLink /> Download
                    </ActionButton>
                    
                    {addon.type === 'addon' && (
                      <DownloadLinks>
                        <strong>Bedrock Addon Files:</strong>
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
                          <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                            No pack files available
                          </div>
                        )}
                      </DownloadLinks>
                    )}
                  </PluginActions>
                </PluginCard>
              ))}
            </PluginGrid>
            
            {filteredInstalledAddons.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <FiPackage size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                <h3>No Addons Installed</h3>
                <p>Browse the marketplace to install addons, plugins, and scripts for your server.</p>
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
                        height: '150px', 
                        objectFit: 'cover', 
                        borderRadius: '6px', 
                        marginBottom: '15px' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <PluginHeader>
                    <PluginName>{addon.name}</PluginName>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
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
                      padding: '8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      marginBottom: '15px'
                    }}>
                      ⚠️ Incompatible with server version {server?.version}
                    </div>
                  )}
                  
                  {addon.type === 'addon' && (
                    <DownloadLinks>
                      <strong>Bedrock Addon Files:</strong>
                      <DownloadLink href={addon.behavior_pack_url} target="_blank" rel="noopener noreferrer">
                        📦 Behavior Pack
                      </DownloadLink>
                      <DownloadLink href={addon.resource_pack_url} target="_blank" rel="noopener noreferrer">
                        🎨 Resource Pack
                      </DownloadLink>
                    </DownloadLinks>
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
                        <FiDownload />
                      )}
                      {installing[addon.id] ? 'Installing...' : 'Install'}
                    </ActionButton>
                    
                    <ActionButton 
                      $variant="download"
                      onClick={() => handleDownloadAddon(addon)}
                    >
                      <FiExternalLink /> Download
                    </ActionButton>
                    
                    <ActionButton $variant="info">
                      <FiInfo /> Details
                    </ActionButton>
                  </PluginActions>
                </PluginCard>
              ))}
            </PluginGrid>
            
            {filteredMarketplaceAddons.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                {searchTerm || selectedCategory !== 'all' ? (
                  <>
                    <FiSearch size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <h3>No Addons Found</h3>
                    <p>No addons match your search criteria. Try a different search term or category.</p>
                  </>
                ) : (
                  <>
                    <FiPlus size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <h3>No Addons Available</h3>
                    <p>No addons are currently available in the marketplace.</p>
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
