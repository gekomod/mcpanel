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
  FiExternalLink
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
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

const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.primary ? '#3b82f6' : props.danger ? '#ef4444' : '#f3f4f6'};
  color: ${props => props.primary || props.danger ? 'white' : '#374151'};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: ${props => props.primary ? '#2563eb' : props.danger ? '#dc2626' : '#e5e7eb'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FilterLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const AddonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
  }
`;

const AddonImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 15px;
  background: #f3f4f6;
`;

const AddonHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const AddonName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #1f2937;
`;

const AddonType = styled.span`
  background: ${props => 
    props.type === 'plugin' ? '#e0e7ff' : 
    props.type === 'script' ? '#fce7f3' : 
    '#dcfce7'
  };
  color: ${props => 
    props.type === 'plugin' ? '#3730a3' : 
    props.type === 'script' ? '#be185d' : 
    '#166534'
  };
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const AddonMeta = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #6b7280;
`;

const AddonDescription = styled.p`
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AddonActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: space-between;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => props.active ? `
    background: #dcfce7;
    color: #166534;
  ` : `
    background: #fee2e2;
    color: #dc2626;
  `}
`;

const VersionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 8px;
`;

const VersionButton = styled.button.attrs(props => ({
  style: {
    borderColor: props['data-selected'] ? '#3b82f6' : '#d1d5db',
    background: props['data-selected'] ? '#e0e7ff' : 'white',
    color: props['data-selected'] ? '#3730a3' : '#374151'
  }
}))`
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: center;
  
  &:hover {
    border-color: #3b82f6;
    background: #e0e7ff;
  }
`;

function AddonManager() {
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
    behavior_pack_url: '',  // Nowe pole
    resource_pack_url: '',  // Nowe pole
    image_url: '',
    description: '',
    author: '',
    is_active: true,
    is_installed: false  // Nowe pole
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
      toast.error('Failed to load addons');
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
      // Pobierz wersje Minecrafta z Mojang API (dla Java)
      const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
      const data = await response.json();
      
      const javaVersions = data.versions
        .filter(v => v.type === 'release')
        .map(v => v.id)
        .slice(0, 20); // Ostatnie 20 wersji

      // Pobierz wersje Bedrock z backendu lub użyj domyślnych
      let bedrockVersions = [];
      try {
        const bedrockResponse = await api.get('/bedrock-versions');
        bedrockVersions = bedrockResponse.data.map(v => v.version);
      } catch (error) {
        console.error('Error loading bedrock versions:', error);
        // Fallback do przykładowych wersji Bedrock
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
          if (aVal !== bVal) return bVal - aVal; // Sortuj malejąco
        }
        return 0;
      });

      setMinecraftVersions(allVersions);
    } catch (error) {
      console.error('Error loading Minecraft versions:', error);
      // Fallback do podstawowych wersji
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
      // Przygotuj dane do wysłania w zależności od typu
      const submitData = { ...formData };
      
      if (formData.type === 'addon') {
        // Dla Bedrock addon, download_url nie jest wymagane
        delete submitData.download_url;
        // Sprawdź czy przynajmniej jeden pack URL jest podany
        if (!formData.behavior_pack_url && !formData.resource_pack_url) {
          toast.error('Bedrock addon requires at least one pack URL');
          return;
        }
      } else {
        // Dla plugin/script, pack URLs nie są wymagane
        delete submitData.behavior_pack_url;
        delete submitData.resource_pack_url;
        if (!formData.download_url) {
          toast.error('Plugin/script requires download URL');
          return;
        }
      }
      
      if (editingAddon) {
        await api.put(`/addons/${editingAddon.id}`, submitData);
        toast.success('Addon updated successfully');
      } else {
        await api.post('/addons', submitData);
        toast.success('Addon created successfully');
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
      toast.error(error.response?.data?.error || 'Failed to save addon');
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
    if (!window.confirm(`Are you sure you want to delete "${addon.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/addons/${addon.id}`);
      toast.success('Addon deleted successfully');
      fetchAddons();
    } catch (error) {
      console.error('Error deleting addon:', error);
      toast.error('Failed to delete addon');
    }
  };

  const handleToggleStatus = async (addon) => {
    try {
      await api.put(`/addons/${addon.id}`, {
        ...addon,
        is_active: !addon.is_active
      });
      toast.success(`Addon ${!addon.is_active ? 'activated' : 'deactivated'}`);
      fetchAddons();
    } catch (error) {
      console.error('Error toggling addon status:', error);
      toast.error('Failed to update addon status');
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
        <Header>
          <Title>
            <FiPackage /> Addon Manager
          </Title>
        </Header>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading addons...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FiPackage /> Addon Manager
        </Title>
        <Actions>
          <Button primary onClick={openModal}>
            <FiPlus /> Add New
          </Button>
        </Actions>
      </Header>

      <Filters>
        <FilterGroup>
          <FilterLabel>Search</FilterLabel>
          <Input
            type="text"
            placeholder="Search addons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Type</FilterLabel>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Minecraft Version</FilterLabel>
          <Select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
          >
            <option value="">All Versions</option>
            {minecraftVersions.map(version => (
              <option key={version} value={version}>
                {version}
              </option>
            ))}
          </Select>
        </FilterGroup>
      </Filters>

      <Grid>
        {filteredAddons.map(addon => (
          <AddonCard key={addon.id}>
            {addon.image_url && (
              <AddonImage 
                src={addon.image_url} 
                alt={addon.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            
            <AddonHeader>
              <AddonName>{addon.name}</AddonName>
              <AddonType type={addon.type}>
                {addon.type}
              </AddonType>
            </AddonHeader>

            <AddonMeta>
              <span>v{addon.version}</span>
              <span>MC {addon.minecraft_version}</span>
              <StatusBadge active={addon.is_active}>
                {addon.is_active ? 'Active' : 'Inactive'}
              </StatusBadge>
            </AddonMeta>

            {addon.description && (
              <AddonDescription>{addon.description}</AddonDescription>
            )}

            {addon.author && (
              <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px' }}>
                By: {addon.author}
              </div>
            )}

            <AddonActions>
<Button 
  as="a" 
  href={addon.type === 'addon' ? (addon.behavior_pack_url || addon.resource_pack_url || '#') : addon.download_url}
  target="_blank" 
  rel="noopener noreferrer"
  title={addon.type === 'addon' ? `Behavior: ${addon.behavior_pack_url ? 'Available' : 'Not available'}\nResource: ${addon.resource_pack_url ? 'Available' : 'Not available'}` : 'Download plugin/script' }
  onClick={(e) => {
    if (addon.type === 'addon' && !addon.behavior_pack_url && !addon.resource_pack_url) {
      e.preventDefault();
      toast.error('No download links available for this addon');
    }
  }}
  style={{
    opacity: (addon.type === 'addon' && !addon.behavior_pack_url && !addon.resource_pack_url) ? 0.5 : 1
  }}
>
  <FiExternalLink /> Download
</Button>
              
              <div style={{ display: 'flex', gap: '5px' }}>
                <Button onClick={() => handleEdit(addon)}>
                  <FiEdit />
                </Button>
                <Button onClick={() => handleToggleStatus(addon)}>
                  {addon.is_active ? <FiX /> : <FiCheck />}
                </Button>
                <Button danger onClick={() => handleDelete(addon)}>
                  <FiTrash2 />
                </Button>
              </div>
            </AddonActions>
          </AddonCard>
        ))}
      </Grid>

      {filteredAddons.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          No addons found. {addons.length === 0 ? 'Create your first addon!' : 'Try changing your filters.'}
        </div>
      )}

      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingAddon ? 'Edit Addon' : 'Add New Addon'}
              </ModalTitle>
              <Button onClick={closeModal}>
                <FiX />
              </Button>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
              <FormGroup>
                <FormLabel>Name *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Type *</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <FormLabel>Version *</FormLabel>
                <FormInput
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  placeholder="1.0.0"
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Minecraft Version *</FormLabel>
                {loadingVersions ? (
                  <div style={{ padding: '10px', textAlign: 'center', color: '#6b7280' }}>
                    Loading versions...
                  </div>
                ) : (
                  <>
                    <VersionGrid>
                      {minecraftVersions.map(version => (
                        <VersionButton
                          key={version}
                          type="button"
                          data-selected={formData.minecraft_version === version}
                          onClick={() => setFormData({...formData, minecraft_version: version})}
                        >
                          {version}
                        </VersionButton>
                      ))}
                    </VersionGrid>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>
                      Selected: {formData.minecraft_version || 'None'}
                    </div>
                  </>
                )}
              </FormGroup>

              {formData.type !== 'addon' && (
                <FormGroup>
                  <FormLabel>Download URL *</FormLabel>
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
                    <FormLabel>Behavior Pack URL</FormLabel>
                    <FormInput
                      type="url"
                      value={formData.behavior_pack_url}
                      onChange={(e) => setFormData({...formData, behavior_pack_url: e.target.value})}
                      placeholder="https://example.com/behavior_pack.mcpack"
                    />
                  </FormGroup>

                  <FormGroup>
                    <FormLabel>Resource Pack URL</FormLabel>
                    <FormInput
                      type="url"
                      value={formData.resource_pack_url}
                      onChange={(e) => setFormData({...formData, resource_pack_url: e.target.value})}
                      placeholder="https://example.com/resource_pack.mcpack"
                    />
                  </FormGroup>

                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '20px' }}>
                    Note: At least one pack URL is required for Bedrock addons
                  </div>
                </>
              )}

              <FormGroup>
                <FormLabel>Image URL</FormLabel>
                <FormInput
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Author</FormLabel>
                <FormInput
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  placeholder="Author Name"
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>Description</FormLabel>
                <FormTextarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe what this addon does..."
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span style={{ marginLeft: '8px' }}>Active</span>
                </FormLabel>
              </FormGroup>
              
              {editingAddon && (
                <FormGroup>
                  <FormLabel>
                    Installation Status
                  </FormLabel>
                  <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
                    {formData.is_installed ? 'Installed' : 'Not Installed'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>
                    Installation status can be changed in the server plugin manager
                  </div>
                </FormGroup>
              )}

              <FormActions>
                <Button type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" primary>
                  {editingAddon ? 'Update' : 'Create'} Addon
                </Button>
              </FormActions>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default AddonManager;
