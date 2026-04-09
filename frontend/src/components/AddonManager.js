import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiPackage, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiDownload,
  FiSearch,
  FiFilter,
  FiX,
  FiCheck,
  FiExternalLink,
  FiGrid,
  FiList,
  FiUser
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Styled components matching the HTML style
const Container = styled.div`
  padding: 20px 30px;
  flex: 1;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin-bottom: 25px;
`;

const PageTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: #a4aabc;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
`;

const AddButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #2563eb;
  }
`;

const Filters = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchInput = styled.input`
  width: 100%;
  background: #2e3245;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 10px 15px 10px 40px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: #6b7293;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #a4aabc;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  background: #2e3245;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 10px 15px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const AddonsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const AddonCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid #3a3f57;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const AddonCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const AddonCardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const AddonStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.active ? '#065f46' : '#7c2d2d'};
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.active ? '#10b981' : '#f87171'};
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#10b981' : '#f87171'};
`;

const AddonCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const AddonDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AddonDetailLabel = styled.span`
  font-size: 12px;
  color: #a4aabc;
  font-weight: 500;
`;

const AddonDetailValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

const AddonDescription = styled.p`
  color: #a4aabc;
  line-height: 1.5;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AddonCardFooter = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #3a3f57;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AddonAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #a4aabc;
`;

const ManageAddonBtn = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: #2563eb;
  }
`;

const InstallAddonCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 2px dashed #3a3f57;
  min-height: 200px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: #3b82f6;
  }
`;

const InstallAddonIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

const InstallAddonText = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  margin: 0;
`;

const InstallAddonDescription = styled.p`
  font-size: 14px;
  color: #a4aabc;
  text-align: center;
  margin: 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseModal = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  font-size: 24px;
  cursor: pointer;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #fff;
`;

const FormInput = styled.input`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Btn = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
  font-size: 14px;
`;

const BtnPrimary = styled(Btn)`
  background: #3b82f6;
  color: white;
  
  &:hover {
    background: #2563eb;
  }
`;

const BtnSecondary = styled(Btn)`
  background: #4a5070;
  color: #cbd5e1;
  
  &:hover {
    background: #565d81;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #a4aabc;
  
  h3 {
    color: #fff;
    margin-bottom: 10px;
  }
`;

function AddonManager() {
  const { t } = useLanguage();
  const [addons, setAddons] = useState([]);
  const [filteredAddons, setFilteredAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [types, setTypes] = useState([]);
  const [minecraftVersions, setMinecraftVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  
  // Filtry
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [versionFilter, setVersionFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'plugin',
    version: '',
    minecraft_version: '',
    download_url: '',
    behavior_pack_url: '',
    resource_pack_url: '',
    image_url: '',
    description: '',
    author: '',
    is_active: true,
    is_installed: false
  });

  useEffect(() => {
    fetchAddons();
    fetchAddonTypes();
    loadMinecraftVersions();
  }, []);

  useEffect(() => {
    filterAddons();
  }, [addons, searchTerm, typeFilter, versionFilter]);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/addons');
      setAddons(response.data);
    } catch (error) {
      console.error('Error fetching addons:', error);
      toast.error(t('plugin.manager.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAddonTypes = async () => {
    try {
      const response = await api.get('/addons/types');
      setTypes(response.data.types);
    } catch (error) {
      console.error('Error fetching addon types:', error);
    }
  };

  const loadMinecraftVersions = async () => {
    setLoadingVersions(true);
    try {
      // Pobierz wersje Minecrafta z Mojang API
      const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
      const data = await response.json();
      
      const javaVersions = data.versions
        .filter(v => v.type === 'release')
        .map(v => v.id)
        .slice(0, 20);

      // Pobierz wersje Bedrock
      let bedrockVersions = [];
      try {
        const bedrockResponse = await api.get('/bedrock-versions');
        bedrockVersions = bedrockResponse.data.map(v => v.version);
      } catch (error) {
        console.error('Error loading bedrock versions:', error);
        bedrockVersions = ['1.20.15', '1.20.10', '1.20.1', '1.19.83', '1.19.70'];
      }

      // Połącz i posortuj wersje
      const allVersions = [...new Set([...javaVersions, ...bedrockVersions])];
      allVersions.sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] || 0;
          const bVal = bParts[i] || 0;
          if (aVal !== bVal) return bVal - aVal;
        }
        return 0;
      });

      setMinecraftVersions(allVersions);
    } catch (error) {
      console.error('Error loading Minecraft versions:', error);
      setMinecraftVersions([
        '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.17.1', 
        '1.16.5', '1.15.2', '1.14.4', '1.13.2', '1.12.2'
      ]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const filterAddons = () => {
    let filtered = addons;

    if (searchTerm) {
      filtered = filtered.filter(addon =>
        addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(addon => addon.type === typeFilter);
    }

    if (versionFilter) {
      filtered = filtered.filter(addon => addon.minecraft_version === versionFilter);
    }

    setFilteredAddons(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = { ...formData };
      
      if (formData.type === 'addon') {
        delete submitData.download_url;
        if (!formData.behavior_pack_url && !formData.resource_pack_url) {
          toast.error(t('plugin.manager.bedrock.noPacksAvailable'));
          return;
        }
      } else {
        delete submitData.behavior_pack_url;
        delete submitData.resource_pack_url;
        if (!formData.download_url) {
          toast.error(t('plugin.manager.download.noLinks'));
          return;
        }
      }
      
      if (editingAddon) {
        await api.put(`/addons/${editingAddon.id}`, submitData);
        toast.success(t('plugin.manager.toggle.success'));
      } else {
        await api.post('/addons', submitData);
        toast.success(t('plugin.manager.installation.success', { 
          name: formData.name, 
          type: t(`plugin.manager.addon.type.${formData.type}`) 
        }));
      }
      
      setShowModal(false);
      setEditingAddon(null);
      setFormData({
        name: '',
        type: 'plugin',
        version: '',
        minecraft_version: '',
        download_url: '',
        behavior_pack_url: '',
        resource_pack_url: '',
        image_url: '',
        description: '',
        author: '',
        is_active: true,
        is_installed: false
      });
      
      fetchAddons();
    } catch (error) {
      console.error('Error saving addon:', error);
      toast.error(error.response?.data?.error || t('plugin.manager.installation.error', { name: formData.name }));
    }
  };

  const handleEdit = (addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      type: addon.type,
      version: addon.version,
      minecraft_version: addon.minecraft_version,
      download_url: addon.download_url || '',
      behavior_pack_url: addon.behavior_pack_url || '',
      resource_pack_url: addon.resource_pack_url || '',
      image_url: addon.image_url || '',
      description: addon.description || '',
      author: addon.author || '',
      is_active: addon.is_active,
      is_installed: addon.is_installed || false
    });
    setShowModal(true);
  };

  const handleDelete = async (addon) => {
    if (!window.confirm(t('plugin.manager.uninstallation.confirm'))) {
      return;
    }

    try {
      await api.delete(`/addons/${addon.id}`);
      toast.success(t('plugin.manager.uninstallation.success'));
      fetchAddons();
    } catch (error) {
      console.error('Error deleting addon:', error);
      toast.error(t('plugin.manager.uninstallation.error'));
    }
  };

  const handleToggleStatus = async (addon) => {
    try {
      await api.put(`/addons/${addon.id}`, {
        ...addon,
        is_active: !addon.is_active
      });
      toast.success(t('plugin.manager.toggle.success'));
      fetchAddons();
    } catch (error) {
      console.error('Error toggling addon status:', error);
      toast.error(t('plugin.manager.toggle.error'));
    }
  };

  const openModal = () => {
    setEditingAddon(null);
    setFormData({
      name: '',
      type: 'plugin',
      version: '',
      minecraft_version: '',
      download_url: '',
      image_url: '',
      description: '',
      author: '',
      is_active: true
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAddon(null);
  };

  if (loading) {
    return (
      <Container>
        <EmptyState>
          <h3>{t('plugin.manager.loading')}</h3>
          <p>{t('common.loading')}</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Filters>
        <SearchBox>
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder={t('plugin.manager.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        <FilterGroup>
          <FilterSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t('plugin.manager.category.all')}</option>
            {types.map(type => (
              <option key={type} value={type}>
                {t(`plugin.manager.category.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
          >
            <option value="">{t('server.versions.loading')}</option>
            {minecraftVersions.map(version => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </FilterSelect>
          <AddButton onClick={openModal}>
            <FiPlus /> {t('plugin.manager.action.install')}
          </AddButton>
        </FilterGroup>
      </Filters>

      <AddonsGrid>
        {filteredAddons.map(addon => (
          <AddonCard key={addon.id}>
            <AddonCardHeader>
              <AddonCardTitle>{addon.name}</AddonCardTitle>
              <AddonStatus active={addon.is_active}>
                <StatusIndicator active={addon.is_active} />
                <span>{addon.is_active ? t('plugin.manager.status.enabled') : t('plugin.manager.status.disabled')}</span>
              </AddonStatus>
            </AddonCardHeader>
            
            <AddonCardDetails>
              <AddonDetail>
                <AddonDetailLabel>{t('plugin.manager.addon.type.' + addon.type)}:</AddonDetailLabel>
                <AddonDetailValue>{t(`plugin.manager.category.${addon.type}`) || addon.type}</AddonDetailValue>
              </AddonDetail>
              <AddonDetail>
                <AddonDetailLabel>{t('server.settings.version')}:</AddonDetailLabel>
                <AddonDetailValue>{t('plugin.manager.addon.version', { version: addon.version })}</AddonDetailValue>
              </AddonDetail>
              <AddonDetail>
                <AddonDetailLabel>{t('plugin.manager.addon.minecraft.version', { version: '' })}:</AddonDetailLabel>
                <AddonDetailValue>{addon.minecraft_version}</AddonDetailValue>
              </AddonDetail>
            </AddonCardDetails>
            
            {addon.description && (
              <AddonDescription>{addon.description}</AddonDescription>
            )}
            
            <AddonCardFooter>
              <AddonAuthor>
                <FiUser size={14} />
                <span>{addon.author || t('plugin.manager.addon.author.unknown')}</span>
              </AddonAuthor>
              <div style={{ display: 'flex', gap: '5px' }}>
                <ManageAddonBtn 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(addon);
                  }}
                  style={{ 
                    background: addon.is_active ? '#dc2626' : '#059669'
                  }}
                >
                  {addon.is_active ? <FiX /> : <FiCheck />}
                </ManageAddonBtn>
                <ManageAddonBtn onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(addon);
                }}>
                  <FiEdit />
                </ManageAddonBtn>
                <ManageAddonBtn 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(addon);
                  }}
                  style={{ background: '#dc2626' }}
                >
                  <FiTrash2 />
                </ManageAddonBtn>
              </div>
            </AddonCardFooter>
          </AddonCard>
        ))}
        
        <InstallAddonCard onClick={openModal}>
          <InstallAddonIcon>
            <FiPlus />
          </InstallAddonIcon>
          <InstallAddonText>{t('plugin.manager.action.install')}</InstallAddonText>
          <InstallAddonDescription>
            {t('plugin.manager.installed.empty.description')}
          </InstallAddonDescription>
        </InstallAddonCard>
      </AddonsGrid>

      {filteredAddons.length === 0 && addons.length > 0 && (
        <EmptyState>
          <h3>{t('plugin.manager.marketplace.empty.search.title')}</h3>
          <p>{t('plugin.manager.marketplace.empty.search.description')}</p>
        </EmptyState>
      )}

      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingAddon ? t('common.edit') : t('plugin.manager.action.install')}
              </ModalTitle>
              <CloseModal onClick={closeModal}>&times;</CloseModal>
            </ModalHeader>
            
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <FormLabel>{t('plugin.manager.addon.type.' + formData.type)} {t('server.settings.serverName')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={t('server.name.placeholder')}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>{t('plugin.manager.addon.type.' + formData.type)} *</FormLabel>
                <FormSelect
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="">{t('server.type')}</option>
                  {types.map(type => (
                    <option key={type} value={type}>
                      {t(`plugin.manager.category.${type}`) || type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>{t('server.settings.version')} *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  placeholder="1.0.0"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>{t('plugin.manager.addon.minecraft.version', { version: '' })} *</FormLabel>
                <FormSelect
                  value={formData.minecraft_version}
                  onChange={(e) => setFormData({...formData, minecraft_version: e.target.value})}
                  required
                >
                  <option value="">{t('server.versions.loading')}</option>
                  {minecraftVersions.map(version => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
              
              {formData.type !== 'addon' && (
                <FormGroup>
                  <FormLabel>{t('plugin.manager.action.download')} URL *</FormLabel>
                  <FormInput
                    type="url"
                    value={formData.download_url}
                    onChange={(e) => setFormData({...formData, download_url: e.target.value})}
                    placeholder="https://example.com/plugin.jar"
                    required={formData.type !== 'addon'}
                  />
                </FormGroup>
              )}
              
              {formData.type === 'addon' && (
                <>
                  <FormGroup>
                    <FormLabel>{t('plugin.manager.bedrock.behaviorPack')} URL</FormLabel>
                    <FormInput
                      type="url"
                      value={formData.behavior_pack_url}
                      onChange={(e) => setFormData({...formData, behavior_pack_url: e.target.value})}
                      placeholder="https://example.com/behavior_pack.mcpack"
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>{t('plugin.manager.bedrock.resourcePack')} URL</FormLabel>
                    <FormInput
                      type="url"
                      value={formData.resource_pack_url}
                      onChange={(e) => setFormData({...formData, resource_pack_url: e.target.value})}
                      placeholder="https://example.com/resource_pack.mcpack"
                    />
                  </FormGroup>
                </>
              )}
              
              <FormGroup>
                <FormLabel>{t('plugin.manager.addon.author', { author: '' })}</FormLabel>
                <FormInput
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  placeholder={t('plugin.manager.addon.author.unknown')}
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>{t('plugin.manager.addon.noDescription')}</FormLabel>
                <FormTextarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t('plugin.manager.addon.noDescription')}
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  {t('plugin.manager.status.enabled')}
                </FormLabel>
              </FormGroup>
              
              <FormActions>
                <BtnSecondary type="button" onClick={closeModal}>
                  {t('common.cancel')}
                </BtnSecondary>
                <BtnPrimary type="submit">
                  {editingAddon ? t('common.save') : t('plugin.manager.action.install')}
                </BtnPrimary>
              </FormActions>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default AddonManager;