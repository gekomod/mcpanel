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
  { value: 'all', label: 'plugin.manager.category.all', icon: <FiPackage /> },
  { value: 'plugin', label: 'plugin.manager.category.plugin', icon: <FiBox /> },
  { value: 'addon', label: 'plugin.manager.category.addon', icon: <FiLayers /> },
  { value: 'script', label: 'plugin.manager.category.script', icon: <FiCode /> },
  { value: 'worlds', label: 'plugin.manager.category.worlds', icon: <FiGlobe /> },
  { value: 'resourcepack', label: 'plugin.manager.category.resourcepack', icon: <FiDownload /> },
  { value: 'behaviorpack', label: 'plugin.manager.category.behaviorpack', icon: <FiCpu /> }
];

function PluginManager() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      setError(t('plugin.manager.error.server'));
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
      setError(t('plugin.manager.error.fetch'));
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
        toast.warning(t('plugin.manager.compatibility.title', {
          type: addon.type,
          addonVersion: addon.minecraft_version,
          serverVersion: server.version
        }));
        return;
      }
      
      toast.success(t('plugin.manager.installation.start', { name: addon.name }));
      
      // Wywołaj endpoint instalacji
      await api.post(`/servers/${serverId}/addons/${addon.id}/install`);
      
      // Odśwież listę zainstalowanych
      await fetchInstalledAddons();
      
      toast.success(t('plugin.manager.installation.success', { 
        name: addon.name, 
        type: addon.type === 'worlds' ? t('plugin.manager.addon.type.worlds') : t(`plugin.manager.addon.type.${addon.type}`)
      }));
      
    } catch (error) {
      console.error('Error installing addon:', error);
      toast.error(error.response?.data?.error || t('plugin.manager.installation.error', { name: addon.name }));
    } finally {
      setInstalling(prev => ({ ...prev, [addon.id]: false }));
    }
  };

  const handleUninstallAddon = async (addonId) => {
    if (!window.confirm(t('plugin.manager.uninstallation.confirm'))) {
      return;
    }
    
    try {
      setInstalling(prev => ({ ...prev, [addonId]: true }));
      
      // Wywołaj endpoint odinstalowania
      await api.post(`/servers/${serverId}/addons/${addonId}/uninstall`);
      
      // Odśwież listę zainstalowanych
      await fetchInstalledAddons();
      
      toast.success(t('plugin.manager.uninstallation.success'));
      
    } catch (error) {
      console.error('Error uninstalling addon:', error);
      toast.error(error.response?.data?.error || t('plugin.manager.uninstallation.error'));
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
      
      toast.success(response.data.message || t('plugin.manager.toggle.success'));
      
    } catch (error) {
      console.error('Error toggling addon:', error);
      toast.error(error.response?.data?.error || t('plugin.manager.toggle.error'));
    } finally {
      setInstalling(prev => ({ ...prev, [addonId]: false }));
    }
  };
  
	const getDownloadLinks = (addon) => {
	  if (addon.type === 'addon') {
		if (addon.pack_type === 'separate') {
		  const links = [];
		  if (addon.behavior_pack_url) {
		    links.push({ 
		      url: addon.behavior_pack_url, 
		      label: t('plugin.manager.bedrock.behaviorPack'),
		      type: 'behavior' 
		    });
		  }
		  if (addon.resource_pack_url) {
		    links.push({ 
		      url: addon.resource_pack_url, 
		      label: t('plugin.manager.bedrock.resourcePack'),
		      type: 'resource' 
		    });
		  }
		  return links;
		} else {
		  // Dla combined/single użyj download_url
		  return [{ 
		    url: addon.download_url, 
		    label: addon.pack_type === 'combined' 
		      ? t('plugin.manager.bedrock.combinedPack') 
		      : t('plugin.manager.bedrock.singlePack'),
		    type: 'download' 
		  }];
		}
	  }
	  // Dla pluginów i skryptów użyj download_url
	  return [{ 
		url: addon.download_url, 
		label: t('plugin.manager.action.download'),
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
          toast.error(t('plugin.manager.download.noLinks'));
          return;
        }
      }
    } else {
      downloadUrl = addon.download_url;
    }
    
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast.info(t('plugin.manager.download.start', { name: addon.name }));
    } else {
      toast.error(t('plugin.manager.download.error'));
    }
  };

  const toggleExpandAddon = (addonId) => {
    setExpandedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  };

  const getAddonPackInfo = (addon) => {
    if (addon.type === 'addon') {
      if (addon.behavior_pack_url && addon.resource_pack_url) {
        return t('plugin.manager.bedrock.bothPacks');
      } else if (addon.behavior_pack_url) {
        return t('plugin.manager.bedrock.behaviorOnly');
      } else if (addon.resource_pack_url) {
        return t('plugin.manager.bedrock.resourceOnly');
      }
      return t('plugin.manager.bedrock.noPacksAvailable');
    }
    return '';
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
          <SmallIcon><FiActivity /></SmallIcon> {t('plugin.manager.overview')}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <SmallIcon><FiTerminal /></SmallIcon> {t('plugin.manager.console')}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <SmallIcon><FiFolder /></SmallIcon> {t('plugin.manager.files')}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <SmallIcon><FiSettings /></SmallIcon> {t('plugin.manager.config')}
        </NavTab>
        <NavTab 
          $active={true}
        >
          <SmallIcon><FiBox /></SmallIcon> {t('plugin.manager.plugins')}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> {t('plugin.manager.users')}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> {t('plugin.manager.backups')}
        </NavTab>
      </NavTabs>

      <Header>
        <Title>
          <SmallIcon><FiPackage /></SmallIcon> {t('plugin.manager.title')} - {server?.name}
          {server && (
            <ServerTypeBadge $type={server.type}>
              {server.type === 'java' ? <SmallIcon><FiCpu /></SmallIcon> : <SmallIcon><FiHardDrive /></SmallIcon>}
              {t(`plugin.manager.server.type.${server.type}`)}
            </ServerTypeBadge>
          )}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder={t('plugin.manager.search.placeholder')}
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
                {t(category.label)}
              </option>
            ))}
          </CategoryFilter>
          
          <RefreshButton onClick={fetchAddons} disabled={loading}>
            <SmallIcon><FiRefreshCw /></SmallIcon> {t('plugin.manager.refresh')}
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
          {t('plugin.manager.tab.marketplace')}
        </Tab>
        <Tab 
          $active={activeTab === 'installed'} 
          onClick={() => setActiveTab('installed')}
        >
          {t('plugin.manager.tab.installed', { count: installedAddons.length })}
        </Tab>
      </Tabs>

      <Content>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#a4aabc' }}>
            <LoadingSpinner style={{ marginRight: '8px' }} />
            {t('plugin.manager.loading')}
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
                      <PluginVersion>{t('plugin.manager.addon.version', { version: addon.version })}</PluginVersion>
                      <PluginType $type={addon.type}>{t(`plugin.manager.addon.type.${addon.type}`)}</PluginType>
                    </div>
                  </PluginHeader>
                  
                  <PluginDescription>
                    {addon.description || t('plugin.manager.addon.noDescription')}
                  </PluginDescription>
                  
                  <PluginMeta>
                    <PluginAuthor>{t('plugin.manager.addon.author', { author: addon.author || t('plugin.manager.addon.author.unknown') })}</PluginAuthor>
                    <span>{t('plugin.manager.addon.minecraft.version', { version: addon.minecraft_version })}</span>
                  </PluginMeta>
                  
                  <PluginMeta>
                    <span style={{ 
                      color: addon.enabled ? '#10b981' : '#f59e0b',
                      fontWeight: '500',
                      fontSize: '0.75rem'
                    }}>
                      {addon.enabled ? t('plugin.manager.status.enabled') : t('plugin.manager.status.disabled')}
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
                        {addon.enabled ? t('plugin.manager.action.disable') : t('plugin.manager.action.enable')}
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
                      {t('plugin.manager.action.uninstall')}
                    </ActionButton>
                    
                    <ActionButton 
                      $variant="download"
                      onClick={() => handleDownloadAddon(addon)}
                      title={addon.type === 'addon' ? t('plugin.manager.action.download') : t('plugin.manager.action.download')}
                    >
                      <SmallIcon><FiExternalLink /></SmallIcon> {t('plugin.manager.action.download')}
                    </ActionButton>
                    
                    <ExpandButton onClick={() => toggleExpandAddon(addon.id)}>
                      <SmallIcon>
                        {expandedAddons[addon.id] ? <FiChevronUp /> : <FiChevronDown />}
                      </SmallIcon>
                      {t('plugin.manager.action.details')}
                    </ExpandButton>
                  </PluginActions>
                  
                  {addon.type === 'addon' && (
  <div style={{ fontSize: '0.7rem', color: '#a4aabc', marginBottom: '5px' }}>
    {addon.pack_type === 'separate' && '📦 Oddzielne pakiety'}
    {addon.pack_type === 'combined' && '🗂️ Plik .mcaddon'}
    {addon.pack_type === 'single' && '📁 Pojedynczy pakiet'}
  </div>
)}

                  
                  <ExpandableSection $expanded={expandedAddons[addon.id]}>
                    {addon.type === 'addon' && (
                      <DownloadLinks>
                        <strong style={{ color: '#fff', fontSize: '0.8rem' }}>{t('plugin.manager.bedrock.files')}</strong>
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
                            {t('plugin.manager.bedrock.noPacks')}
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
                <h3>{t('plugin.manager.installed.empty.title')}</h3>
                <p style={{ fontSize: '0.9rem' }}>{t('plugin.manager.installed.empty.description')}</p>
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
                      <PluginVersion>{t('plugin.manager.addon.version', { version: addon.version })}</PluginVersion>
                      <PluginType $type={addon.type}>{t(`plugin.manager.addon.type.${addon.type}`)}</PluginType>
                    </div>
                  </PluginHeader>
                  
                  <PluginDescription>
                    {addon.description || t('plugin.manager.addon.noDescription')}
                  </PluginDescription>
                  
                  <PluginMeta>
                    <PluginAuthor>{t('plugin.manager.addon.author', { author: addon.author || t('plugin.manager.addon.author.unknown') })}</PluginAuthor>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span>{t('plugin.manager.addon.minecraft.version', { version: addon.minecraft_version })}</span>
                      {addon.type === 'addon' && (
                        <span style={{ fontSize: '0.7rem', color: '#a4aabc' }}>
                          {getAddonPackInfo(addon)}
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
                      {t('plugin.manager.compatibility.warning', { version: server?.version })}
                    </div>
                  )}
                  
                  <PluginActions>
                    <ActionButton 
                      $variant="install"
                      onClick={() => handleInstallAddon(addon)}
                      disabled={installing[addon.id] || !isAddonCompatible(addon)}
                      title={!isAddonCompatible(addon) ? 
                        t('plugin.manager.compatibility.title', {
                          type: addon.type,
                          addonVersion: addon.minecraft_version,
                          serverVersion: server?.version
                        }) : ''}
                    >
                      {installing[addon.id] ? (
                        <LoadingSpinner />
                      ) : (
                        <SmallIcon><FiDownload /></SmallIcon>
                      )}
                      {installing[addon.id] ? t('plugin.manager.action.installing') : t('plugin.manager.action.install')}
                    </ActionButton>
                    
                    <ActionButton 
                      $variant="download"
                      onClick={() => handleDownloadAddon(addon)}
                    >
                      <SmallIcon><FiExternalLink /></SmallIcon> {t('plugin.manager.action.download')}
                    </ActionButton>
                    
                    <ExpandButton onClick={() => toggleExpandAddon(addon.id)}>
                      <SmallIcon>
                        {expandedAddons[addon.id] ? <FiChevronUp /> : <FiChevronDown />}
                      </SmallIcon>
                      {t('plugin.manager.action.details')}
                    </ExpandButton>
                  </PluginActions>
                  
                    {addon.type === 'addon' && (
					  <div style={{ fontSize: '0.7rem', color: '#a4aabc', marginBottom: '5px' }}>
						{addon.pack_type === 'separate' && '📦 Oddzielne pakiety'}
						{addon.pack_type === 'combined' && '🗂️ Plik .mcaddon'}
						{addon.pack_type === 'single' && '📁 Pojedynczy pakiet'}
					  </div>
					)}
                  
                  <ExpandableSection $expanded={expandedAddons[addon.id]}>
                    {addon.type === 'addon' && (
                      <DownloadLinks>
                        <strong style={{ color: '#fff', fontSize: '0.8rem' }}>{t('plugin.manager.bedrock.files')}</strong>
                        <DownloadLink href={addon.behavior_pack_url} target="_blank" rel="noopener noreferrer">
                          {t('plugin.manager.bedrock.behaviorPack')}
                        </DownloadLink>
                        <DownloadLink href={addon.resource_pack_url} target="_blank" rel="noopener noreferrer">
                          {t('plugin.manager.bedrock.resourcePack')}
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
                    <h3>{t('plugin.manager.marketplace.empty.search.title')}</h3>
                    <p style={{ fontSize: '0.9rem' }}>{t('plugin.manager.marketplace.empty.search.description')}</p>
                  </>
                ) : (
                  <>
                    <SmallIcon><FiPlus size={36} style={{ marginBottom: '10px', opacity: 0.5 }} /></SmallIcon>
                    <h3>{t('plugin.manager.marketplace.empty.default.title')}</h3>
                    <p style={{ fontSize: '0.9rem' }}>{t('plugin.manager.marketplace.empty.default.description')}</p>
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
