import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiUser,
  FiShield,
  FiActivity,
  FiTerminal,
  FiFolder,
  FiSettings,
  FiRefreshCw,
  FiBox,
  FiDownload,
  FiList
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Container = styled.div`
  padding: 20px;
  margin: 0 auto;
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

const HeaderActions = styled.div`
  display: flex;
  gap: 15px;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 10px 15px 10px 40px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  width: 250px;
  background: #35394e;
  color: #fff;
  
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
  left: 15px;
  color: #6b7280;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #059669;
  }
`;

const Content = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  background: #35394e;
  border-radius: 6px;
  padding: 5px;
`;

const Tab = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  background: ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? 'white' : '#a4aabc'};
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.active ? '#3b82f6' : '#3a3f57'};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
`;

const TableHeader = styled.thead`
  background: #35394e;
`;

const TableHeaderCell = styled.th`
  padding: 12px 15px;
  text-align: left;
  font-weight: 500;
  color: #a4aabc;
  border-bottom: 1px solid #3a3f57;
`;

const TableRow = styled.tr`
  &:hover {
    background: #35394e;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #3a3f57;
  color: #fff;
`;

const ActionCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #3a3f57;
  text-align: right;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  
  ${props => props.variant === 'edit' ? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  ` : props.variant === 'delete' ? `
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  ` : props.variant === 'whitelist' ? `
    background: #10b981;
    color: white;
    
    &:hover {
      background: #059669;
    }
  ` : props.variant === 'permissions' ? `
    background: #8b5cf6;
    color: white;
    
    &:hover {
      background: #7c3aed;
    }
  ` : ''}
`;

const PermissionBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 5px;
  margin-bottom: 5px;
  
  ${props => props.active ? `
    background: #065f46;
    color: #10b981;
  ` : `
    background: #3a3f57;
    color: #a4aabc;
  `}
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => props.status === 'online' ? `
    background: #065f46;
    color: #10b981;
  ` : props.status === 'offline' ? `
    background: #424752;
    color: #a4aabc;
  ` : props.status === 'banned' ? `
    background: #7f1d1d;
    color: #ef4444;
  ` : `
    background: #3a3f57;
    color: #a4aabc;
  `}
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 25px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a4aabc;
  
  &:hover {
    color: #fff;
  }
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

const Select = styled.select`
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  background: #35394e;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  background: #35394e;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #a4aabc;
  
  &:hover {
    color: #fff;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
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
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #3a3f57;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #a4aabc;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #3b82f6;
`;

function UserManager() {
  const { serverId } = useParams();
  const [server, setServer] = useState(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [playerPermissions, setPlayerPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [activeTabs, setActiveTabs] = useState('server_users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [gamertagMap, setGamertagMap] = useState({});
  const [newUser, setNewUser] = useState({
    username: '',
    permissions: {
      can_start: false,
      can_stop: false,
      can_restart: false,
      can_edit_files: false,
      can_manage_users: false,
      can_install_plugins: false
    }
  });
  const [newWhitelistUser, setNewWhitelistUser] = useState({
    username: ''
  });
  const [playerPerms, setPlayerPerms] = useState({
    username: '',
    permission: 'member',
    xuid: ''
  });
  const [fetchingXuid, setFetchingXuid] = useState(false);

  useEffect(() => {
    fetchServer();
    fetchData();
  }, [serverId, activeTabs]);

  const fetchXuidFromGamertag = async (gamertag) => {
    try {
      setFetchingXuid(true);
      const response = await fetch(`https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(gamertag)}`);
      
      if (!response.ok) {
        throw new Error(t('user.manager.error.fetch.xuid', { gamertag }));
      }
      
      const data = await response.json();
      return data.xuid;
    } catch (error) {
      console.error('Error fetching XUID:', error);
      throw new Error(t('user.manager.error.fetch.xuid', { gamertag }));
    } finally {
      setFetchingXuid(false);
    }
  };
  
  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      console.error('Error fetching server:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTabs === 'server_users') {
        await fetchServerUsers();
      } else if (activeTabs === 'whitelist') {
        await fetchWhitelist();
      } else if (activeTabs === 'player_permissions') {
        await fetchPlayerPermissions();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerUsers = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching server users:', error);
    }
  };

  const fetchWhitelist = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/files/read?path=whitelist.json`);
      if (response.data.content) {
        const whitelistData = JSON.parse(response.data.content);
        setWhitelist(whitelistData || []);
      } else {
        setWhitelist([]);
      }
    } catch (error) {
      console.error('Error fetching whitelist:', error);
      setWhitelist([]);
    }
  };
  
  const fetchGamertagFromXuid = async (xuid) => {
    try {
      const response = await fetch(`https://api.geysermc.org/v2/xbox/gamertag/${xuid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch gamertag: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.gamertag;
    } catch (error) {
      console.error('Error fetching gamertag:', error);
      return null;
    }
  };
  
  const fetchGamertagsForPlayers = async (players) => {
    const newGamertagMap = { ...gamertagMap };
    
    for (const player of players) {
      if (player.xuid && !newGamertagMap[player.xuid]) {
        try {
          const gamertag = await fetchGamertagFromXuid(player.xuid);
          if (gamertag) {
            newGamertagMap[player.xuid] = gamertag;
          }
        } catch (error) {
          console.error(`Error fetching gamertag for XUID ${player.xuid}:`, error);
        }
      }
    }
    
    setGamertagMap(newGamertagMap);
  };

  const fetchPlayerPermissions = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/files/read?path=permissions.json`);
      
      if (response.data.content && response.data.content.trim() !== '') {
        try {
          const permissionsData = JSON.parse(response.data.content);
          
          if (Array.isArray(permissionsData)) {
            const formattedPermissions = permissionsData.map((item, index) => ({
              id: `${item.xuid}-${index}`,
              name: item.xuid || 'Unknown',
              permission: item.permission || 'member',
              xuid: item.xuid || 'Unknown'
            }));
            
            setPlayerPermissions(formattedPermissions);
            fetchGamertagsForPlayers(formattedPermissions);
          } else {
            console.warn('Permissions data is not an array:', permissionsData);
            setPlayerPermissions([]);
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          setPlayerPermissions([]);
        }
      } else {
        setPlayerPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching player permissions:', error);
      if (error.response?.status === 404) {
        setPlayerPermissions([]);
      } else {
        setPlayerPermissions([]);
      }
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching available users:', error);
      setAvailableUsers([]);
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post(`/servers/${serverId}/users`, {
        username: newUser.username,
        permissions: newUser.permissions
      });
      
      setShowAddModal(false);
      setNewUser({
        username: '',
        permissions: {
          can_start: false,
          can_stop: false,
          can_restart: false,
          can_edit_files: false,
          can_manage_users: false,
          can_install_plugins: false
        }
      });
      
      fetchServerUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      alert(t('user.manager.error.add.user'));
    }
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/servers/${serverId}/users/${selectedUser.user_id}`, {
        permissions: selectedUser.permissions
      });
      
      setShowEditModal(false);
      setSelectedUser(null);
      fetchServerUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(t('user.manager.error.edit.user'));
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm(t('user.manager.confirm.remove.user'))) {
      return;
    }
    
    try {
      await api.delete(`/servers/${serverId}/users/${userId}`);
      fetchServerUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      alert(t('user.manager.error.remove.user'));
    }
  };

  const handleAddToWhitelist = async () => {
    try {
      setFetchingXuid(true);
      const xuid = await fetchXuidFromGamertag(newWhitelistUser.username);
      
      const currentWhitelist = [...whitelist];
      
      if (currentWhitelist.some(user => user.name === newWhitelistUser.username)) {
        alert(t('user.manager.error.add.whitelist'));
        return;
      }
      
      currentWhitelist.push({
        uuid: xuid,
        name: newWhitelistUser.username
      });
      
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'whitelist.json',
        content: JSON.stringify(currentWhitelist, null, 2)
      });
      
      setShowWhitelistModal(false);
      setNewWhitelistUser({ username: '' });
      fetchWhitelist();
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      alert(error.message || t('user.manager.error.add.whitelist'));
    } finally {
      setFetchingXuid(false);
    }
  };

  const handleRemoveFromWhitelist = async (username) => {
    if (!window.confirm(t('user.manager.confirm.remove.whitelist', { username }))) {
      return;
    }
    
    try {
      const updatedWhitelist = whitelist.filter(user => user.name !== username);
      
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'whitelist.json',
        content: JSON.stringify(updatedWhitelist, null, 2)
      });
      
      fetchWhitelist();
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      alert(t('user.manager.error.remove.whitelist'));
    }
  };

  const handleSavePlayerPermissions = async () => {
    try {
      setFetchingXuid(true);
      const xuid = await fetchXuidFromGamertag(playerPerms.username);
      
      const response = await api.get(`/servers/${serverId}/files/read?path=permissions.json`);
      let currentPermissions = [];
      
      if (response.data.content) {
        currentPermissions = JSON.parse(response.data.content);
      }
      
      const userIndex = currentPermissions.findIndex(p => p.xuid === xuid);
      
      if (userIndex !== -1) {
        currentPermissions[userIndex] = {
          permission: playerPerms.permission,
          xuid: xuid
        };
      } else {
        currentPermissions.push({
          permission: playerPerms.permission,
          xuid: xuid
        });
      }
      
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'permissions.json',
        content: JSON.stringify(currentPermissions, null, 2)
      });
      
      setShowPermissionsModal(false);
      setPlayerPerms({
        username: '',
        permission: 'member',
        xuid: ''
      });
      fetchPlayerPermissions();
    } catch (error) {
      console.error('Error saving player permissions:', error);
      alert(error.message || t('user.manager.error.save.permissions'));
    } finally {
      setFetchingXuid(false);
    }
  };

  const handleRemovePlayerPermissions = async (xuid) => {
    if (!window.confirm(t('user.manager.confirm.remove.permissions'))) {
      return;
    }
    
    try {
      const response = await api.get(`/servers/${serverId}/files/read?path=permissions.json`);
      let currentPermissions = [];
      
      if (response.data.content) {
        currentPermissions = JSON.parse(response.data.content);
      }
      
      const updatedPermissions = currentPermissions.filter(p => p.xuid !== xuid);
      
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'permissions.json',
        content: JSON.stringify(updatedPermissions, null, 2)
      });
      
      fetchPlayerPermissions();
    } catch (error) {
      console.error('Error removing player permissions:', error);
      alert(t('user.manager.error.remove.permissions'));
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const openWhitelistModal = () => {
    setNewWhitelistUser({ username: '' });
    setShowWhitelistModal(true);
  };

  const openPermissionsModal = (player = null) => {
    if (player) {
      setPlayerPerms({
        username: player.xuid,
        permission: player.permission || 'member',
        xuid: player.xuid
      });
    } else {
      setPlayerPerms({
        username: '',
        permission: 'member',
        xuid: ''
      });
    }
    setShowPermissionsModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWhitelist = whitelist.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlayerPermissions = playerPermissions.filter(player => 
    player.xuid ||
    (gamertagMap[player.xuid] && gamertagMap[player.xuid].toLowerCase().includes(searchTerm.toLowerCase())) ||
    player.permission.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderServerUsers = () => (
    <>
      <Header>
        <Title>
          <FiUsers /> {t('user.manager.server.users')} - {server?.name}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder={t('user.manager.search.users')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <AddButton onClick={() => {
            fetchAvailableUsers();
            setShowAddModal(true);
          }}>
            <FiPlus /> {t('user.manager.add.user')}
          </AddButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingSpinner>
          <div>{t('common.loading')}</div>
        </LoadingSpinner>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>{t('user.manager.table.username')}</TableHeaderCell>
              <TableHeaderCell>{t('user.manager.table.permissions')}</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>{t('user.manager.table.actions')}</TableHeaderCell>
            </tr>
          </TableHeader>
          
          <tbody>
            {filteredUsers.map(user => (
              <TableRow key={user.user_id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <div>
                    <PermissionBadge active={user.permissions.can_start}>
                      <FiUserCheck /> {t('user.manager.permissions.start')}
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_stop}>
                      <FiUserCheck /> {t('user.manager.permissions.stop')}
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_restart}>
                      <FiUserCheck /> {t('user.manager.permissions.restart')}
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_edit_files}>
                      <FiUserCheck /> {t('user.manager.permissions.edit.files')}
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_manage_users}>
                      <FiUserCheck /> {t('user.manager.permissions.manage.users')}
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_install_plugins}>
                      <FiUserCheck /> {t('user.manager.permissions.install.plugins')}
                    </PermissionBadge>
                  </div>
                </TableCell>
                <ActionCell>
                  <ActionButton 
                    variant="edit" 
                    onClick={() => openEditModal(user)}
                  >
                    <FiEdit /> {t('common.edit')}
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleRemoveUser(user.user_id)}
                  >
                    <FiTrash2 /> {t('user.manager.remove.user')}
                  </ActionButton>
                </ActionCell>
              </TableRow>
            ))}
            
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>
                    {searchTerm ? t('user.manager.empty.search') : t('user.manager.empty.users')}
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      )}
    </>
  );

  const renderWhitelist = () => (
    <>
      <Header>
        <Title>
          <FiUserCheck /> {t('user.manager.whitelist')} - {server?.name}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder={t('user.manager.search.whitelist')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <AddButton onClick={openWhitelistModal}>
            <FiPlus /> {t('user.manager.add.whitelist')}
          </AddButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingSpinner>
          <div>{t('common.loading')}</div>
        </LoadingSpinner>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>{t('user.manager.table.gamertag')}</TableHeaderCell>
              <TableHeaderCell>{t('user.manager.table.xuid')}</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>{t('user.manager.table.actions')}</TableHeaderCell>
            </tr>
          </TableHeader>
          
          <tbody>
            {filteredWhitelist.map(user => (
              <TableRow key={user.name}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.uuid || t('common.none')}</TableCell>
                <ActionCell>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleRemoveFromWhitelist(user.name)}
                  >
                    <FiTrash2 /> {t('user.manager.remove.whitelist')}
                  </ActionButton>
                </ActionCell>
              </TableRow>
            ))}
            
            {filteredWhitelist.length === 0 && (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>
                    {searchTerm ? t('user.manager.empty.search') : t('user.manager.empty.whitelist')}
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      )}
    </>
  );

  const renderPlayerPermissions = () => (
    <>
      <Header>
        <Title>
          <FiShield /> {t('user.manager.player.permissions')} - {server?.name}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder={t('user.manager.search.permissions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ActionButton 
            variant="whitelist" 
            onClick={() => fetchGamertagsForPlayers(playerPermissions)}
            style={{ marginRight: '10px' }}
          >
            <FiRefreshCw /> {t('user.manager.refresh.gamertags')}
          </ActionButton>
          
          <AddButton onClick={() => openPermissionsModal()}>
            <FiPlus /> {t('user.manager.add.permissions')}
          </AddButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingSpinner>
          <div>{t('common.loading')}</div>
        </LoadingSpinner>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>{t('user.manager.table.xuid')}</TableHeaderCell>
              <TableHeaderCell>{t('user.manager.table.gamertag')}</TableHeaderCell>
              <TableHeaderCell>{t('user.manager.table.permission.level')}</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>{t('user.manager.table.actions')}</TableHeaderCell>
            </tr>
          </TableHeader>
          
          <tbody>
            {filteredPlayerPermissions.map(player => (
              <TableRow key={player.id || player.xuid}>
                <TableCell>{player.xuid}</TableCell>
                <TableCell>
                  {gamertagMap[player.xuid] ? (
                    <div>
                      <div>{gamertagMap[player.xuid]}</div>
                      <div style={{ fontSize: '0.8rem', color: '#a4aabc', marginTop: '2px' }}>
                        ({t('user.manager.table.xuid')}: {player.xuid})
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      {t('common.loading')}...
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={player.permission}>
                    {player.permission.toUpperCase()}
                  </StatusBadge>
                </TableCell>
                <ActionCell>
                  <ActionButton 
                    variant="edit" 
                    onClick={() => openPermissionsModal(player)}
                  >
                    <FiEdit /> {t('common.edit')}
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleRemovePlayerPermissions(player.xuid)}
                  >
                    <FiTrash2 /> {t('user.manager.remove.permissions')}
                  </ActionButton>
                </ActionCell>
              </TableRow>
            ))}
            
            {filteredPlayerPermissions.length === 0 && (
              <TableRow>
                <TableCell colSpan="4">
                  <EmptyState>
                    {searchTerm ? t('user.manager.empty.search') : t('user.manager.empty.permissions')}
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      )}
    </>
  );

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={activeTab === 'overview'} 
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          <FiActivity /> {t('page.dashboard')}
        </NavTab>
        <NavTab 
          $active={activeTab === 'console'} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> {t('nav.console')}
        </NavTab>
        <NavTab 
          $active={activeTab === 'files'} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> {t('nav.files')}
        </NavTab>
        <NavTab 
          $active={activeTab === 'config'} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <FiSettings /> {t('page.server.settings')}
        </NavTab>
        <NavTab 
          $active={activeTab === 'plugins'} 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> {t('nav.plugins')}
        </NavTab>
        <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUsers /> {t('nav.users')}
        </NavTab>
                <NavTab 
          $active={activeTab === 'backups'} 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> {t('page.backups') || 'Backups'}
        </NavTab>
      </NavTabs>

      <TabsContainer>
        <Tab 
          active={activeTabs === 'server_users'} 
          onClick={() => setActiveTabs('server_users')}
        >
          <FiUsers /> {t('user.manager.server.users')}
        </Tab>
        <Tab 
          active={activeTabs === 'whitelist'} 
          onClick={() => setActiveTabs('whitelist')}
        >
          <FiUserCheck /> {t('user.manager.whitelist')}
        </Tab>
        <Tab 
          active={activeTabs === 'player_permissions'} 
          onClick={() => setActiveTabs('player_permissions')}
        >
          <FiShield /> {t('user.manager.player.permissions')}
        </Tab>
      </TabsContainer>

      <Content>
        {activeTabs === 'server_users' && renderServerUsers()}
        {activeTabs === 'whitelist' && renderWhitelist()}
        {activeTabs === 'player_permissions' && renderPlayerPermissions()}
      </Content>

      {showAddModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>{t('user.manager.modal.add.user')}</ModalTitle>
              <ModalClose onClick={() => setShowAddModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>{t('user.manager.username')}</Label>
              <Select
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              >
                <option value="">{t('user.manager.select.user')}</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.username}>
                    {user.username}
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.manager.permissions')}</Label>
              <CheckboxGroup>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={newUser.permissions.can_start}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: { ...newUser.permissions, can_start: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.start')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={newUser.permissions.can_stop}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: { ...newUser.permissions, can_stop: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.stop')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={newUser.permissions.can_restart}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: { ...newUser.permissions, can_restart: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.restart')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={newUser.permissions.can_edit_files}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: { ...newUser.permissions, can_edit_files: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.edit.files')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={newUser.permissions.can_manage_users}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: { ...newUser.permissions, can_manage_users: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.manage.users')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={newUser.permissions.can_install_plugins}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: { ...newUser.permissions, can_install_plugins: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.install.plugins')}
                </CheckboxLabel>
              </CheckboxGroup>
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowAddModal(false)}>
                {t('common.cancel')}
              </CancelButton>
              <SaveButton 
                onClick={handleAddUser}
                disabled={!newUser.username}
              >
                {t('user.manager.add.user')}
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {showEditModal && selectedUser && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>{t('user.manager.modal.edit.user', { username: selectedUser.username })}</ModalTitle>
              <ModalClose onClick={() => setShowEditModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>{t('user.manager.form.permissions')}</Label>
              <CheckboxGroup>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={selectedUser.permissions.can_start}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: { ...selectedUser.permissions, can_start: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.start')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={selectedUser.permissions.can_stop}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: { ...selectedUser.permissions, can_stop: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.stop')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={selectedUser.permissions.can_restart}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: { ...selectedUser.permissions, can_restart: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.restart')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={selectedUser.permissions.can_edit_files}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: { ...selectedUser.permissions, can_edit_files: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.edit.files')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={selectedUser.permissions.can_manage_users}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: { ...selectedUser.permissions, can_manage_users: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.manage.users')}
                </CheckboxLabel>
                
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={selectedUser.permissions.can_install_plugins}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: { ...selectedUser.permissions, can_install_plugins: e.target.checked }
                    })}
                  />
                  {t('user.manager.permissions.install.plugins')}
                </CheckboxLabel>
              </CheckboxGroup>
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowEditModal(false)}>
                {t('common.cancel')}
              </CancelButton>
              <SaveButton onClick={handleUpdateUser}>
                {t('common.save')}
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {showWhitelistModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>{t('user.manager.modal.add.whitelist')}</ModalTitle>
              <ModalClose onClick={() => setShowWhitelistModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>{t('user.manager.table.gamertag')}</Label>
              <Input
                type="text"
                placeholder={t('user.manager.table.gamertag')}
                value={newWhitelistUser.username}
                onChange={(e) => setNewWhitelistUser({ username: e.target.value })}
              />
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowWhitelistModal(false)}>
                {t('common.cancel')}
              </CancelButton>
              <SaveButton 
                onClick={handleAddToWhitelist}
                disabled={!newWhitelistUser.username || fetchingXuid}
              >
                {fetchingXuid ? t('common.loading') : t('user.manager.add.whitelist')}
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {showPermissionsModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>
                {playerPerms.xuid ? t('user.manager.modal.edit.permissions') : t('user.manager.modal.add.permissions')}
              </ModalTitle>
              <ModalClose onClick={() => setShowPermissionsModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>{t('user.manager.table.gamertag')}</Label>
              <Input
                type="text"
                placeholder={t('user.manager.table.gamertag')}
                value={playerPerms.username}
                onChange={(e) => setPlayerPerms({ ...playerPerms, username: e.target.value })}
                disabled={!!playerPerms.xuid}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.manager.permission.level')}</Label>
              <Select
                value={playerPerms.permission}
                onChange={(e) => setPlayerPerms({ ...playerPerms, permission: e.target.value })}
              >
                <option value="member">{t('user.manager.permission.member')}</option>
                <option value="operator">{t('user.manager.permission.operator')}</option>
                <option value="admin">{t('user.manager.permission.admin')}</option>
                <option value="custom">{t('user.manager.permission.custom')}</option>
              </Select>
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowPermissionsModal(false)}>
                {t('common.cancel')}
              </CancelButton>
              <SaveButton 
                onClick={handleSavePlayerPermissions}
                disabled={!playerPerms.username || fetchingXuid}
              >
                {fetchingXuid ? t('common.loading') : t('common.save')}
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default UserManager;
