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
  FiBox,
  FiList
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
    level: 'member',
    permissions: {}
  });

  useEffect(() => {
    fetchServer();
    fetchData();
  }, [serverId, activeTab]);

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
      if (activeTab === 'server_users') {
        await fetchServerUsers();
      } else if (activeTab === 'whitelist') {
        await fetchWhitelist();
      } else if (activeTab === 'player_permissions') {
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
      // Pobierz whitelist z pliku serwera
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

  const fetchPlayerPermissions = async () => {
    try {
      // Pobierz uprawnienia graczy z pliku permissions.json
      const response = await api.get(`/servers/${serverId}/files/read?path=permissions.json`);
      if (response.data.content) {
        const permissionsData = JSON.parse(response.data.content);
        setPlayerPermissions(permissionsData || []);
      } else {
        setPlayerPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching player permissions:', error);
      setPlayerPermissions([]);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/auth/users');
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
      alert('Failed to add user to server');
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
      alert('Failed to update user permissions');
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the server?')) {
      return;
    }
    
    try {
      await api.delete(`/servers/${serverId}/users/${userId}`);
      fetchServerUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user from server');
    }
  };

  const handleAddToWhitelist = async () => {
    try {
      // Pobierz aktualną whitelist
      const currentWhitelist = [...whitelist];
      
      // Sprawdź czy użytkownik już jest na whitelist
      if (currentWhitelist.some(user => user.name === newWhitelistUser.username)) {
        alert('User is already on the whitelist');
        return;
      }
      
      // Dodaj nowego użytkownika do whitelist
      currentWhitelist.push({
        uuid: "", // UUID zostanie wygenerowany przez serwer
        name: newWhitelistUser.username
      });
      
      // Zapisz zaktualizowaną whitelist
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'whitelist.json',
        content: JSON.stringify(currentWhitelist, null, 2)
      });
      
      setShowWhitelistModal(false);
      setNewWhitelistUser({ username: '' });
      fetchWhitelist();
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      alert('Failed to add user to whitelist');
    }
  };

  const handleRemoveFromWhitelist = async (username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from the whitelist?`)) {
      return;
    }
    
    try {
      // Filtruj whitelist, usuwając użytkownika
      const updatedWhitelist = whitelist.filter(user => user.name !== username);
      
      // Zapisz zaktualizowaną whitelist
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'whitelist.json',
        content: JSON.stringify(updatedWhitelist, null, 2)
      });
      
      fetchWhitelist();
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      alert('Failed to remove user from whitelist');
    }
  };

  const handleSavePlayerPermissions = async () => {
    try {
      // Pobierz aktualne uprawnienia
      const currentPermissions = [...playerPermissions];
      
      // Znajdź indeks użytkownika jeśli istnieje
      const userIndex = currentPermissions.findIndex(p => p.name === playerPerms.username);
      
      if (userIndex !== -1) {
        // Aktualizuj istniejące uprawnienia
        currentPermissions[userIndex] = {
          ...currentPermissions[userIndex],
          level: playerPerms.level,
          permissions: playerPerms.permissions
        };
      } else {
        // Dodaj nowe uprawnienia
        currentPermissions.push({
          name: playerPerms.username,
          level: playerPerms.level,
          permissions: playerPerms.permissions
        });
      }
      
      // Zapisz zaktualizowane uprawnienia
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'permissions.json',
        content: JSON.stringify(currentPermissions, null, 2)
      });
      
      setShowPermissionsModal(false);
      setPlayerPerms({
        username: '',
        level: 'member',
        permissions: {}
      });
      fetchPlayerPermissions();
    } catch (error) {
      console.error('Error saving player permissions:', error);
      alert('Failed to save player permissions');
    }
  };

  const handleRemovePlayerPermissions = async (username) => {
    if (!window.confirm(`Are you sure you want to remove permissions for ${username}?`)) {
      return;
    }
    
    try {
      // Filtruj uprawnienia, usuwając użytkownika
      const updatedPermissions = playerPermissions.filter(p => p.name !== username);
      
      // Zapisz zaktualizowane uprawnienia
      await api.post(`/servers/${serverId}/files/write`, {
        path: 'permissions.json',
        content: JSON.stringify(updatedPermissions, null, 2)
      });
      
      fetchPlayerPermissions();
    } catch (error) {
      console.error('Error removing player permissions:', error);
      alert('Failed to remove player permissions');
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
        username: player.name,
        level: player.level || 'member',
        permissions: player.permissions || {}
      });
    } else {
      setPlayerPerms({
        username: '',
        level: 'member',
        permissions: {}
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
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderServerUsers = () => (
    <>
      <Header>
        <Title>
          <FiUsers /> Server Users - {server?.name}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <AddButton onClick={() => {
            fetchAvailableUsers();
            setShowAddModal(true);
          }}>
            <FiPlus /> Add User
          </AddButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingSpinner>
          <div>Loading users...</div>
        </LoadingSpinner>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Username</TableHeaderCell>
              <TableHeaderCell>Permissions</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          
          <tbody>
            {filteredUsers.map(user => (
              <TableRow key={user.user_id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <div>
                    <PermissionBadge active={user.permissions.can_start}>
                      <FiUserCheck /> Start
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_stop}>
                      <FiUserCheck /> Stop
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_restart}>
                      <FiUserCheck /> Restart
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_edit_files}>
                      <FiUserCheck /> Files
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_manage_users}>
                      <FiUserCheck /> Users
                    </PermissionBadge>
                    <PermissionBadge active={user.permissions.can_install_plugins}>
                      <FiUserCheck /> Plugins
                    </PermissionBadge>
                  </div>
                </TableCell>
                <ActionCell>
                  <ActionButton 
                    variant="edit" 
                    onClick={() => openEditModal(user)}
                  >
                    <FiEdit /> Edit
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleRemoveUser(user.user_id)}
                  >
                    <FiTrash2 /> Remove
                  </ActionButton>
                </ActionCell>
              </TableRow>
            ))}
            
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>
                    {searchTerm ? 'No users match your search' : 'No users have access to this server'}
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
          <FiUserCheck /> Whitelist - {server?.name}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search whitelist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <AddButton onClick={openWhitelistModal}>
            <FiPlus /> Add to Whitelist
          </AddButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingSpinner>
          <div>Loading whitelist...</div>
        </LoadingSpinner>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Username</TableHeaderCell>
              <TableHeaderCell>UUID</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          
          <tbody>
            {filteredWhitelist.map(user => (
              <TableRow key={user.name}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.uuid || 'Not assigned'}</TableCell>
                <ActionCell>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleRemoveFromWhitelist(user.name)}
                  >
                    <FiTrash2 /> Remove
                  </ActionButton>
                </ActionCell>
              </TableRow>
            ))}
            
            {filteredWhitelist.length === 0 && (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>
                    {searchTerm ? 'No users match your search' : 'Whitelist is empty'}
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
          <FiShield /> Player Permissions - {server?.name}
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <AddButton onClick={() => openPermissionsModal()}>
            <FiPlus /> Add Permissions
          </AddButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <LoadingSpinner>
          <div>Loading player permissions...</div>
        </LoadingSpinner>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Username</TableHeaderCell>
              <TableHeaderCell>Permission Level</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          
          <tbody>
            {filteredPlayerPermissions.map(player => (
              <TableRow key={player.name}>
                <TableCell>{player.name}</TableCell>
                <TableCell>
                  <StatusBadge status={player.level}>
                    {player.level}
                  </StatusBadge>
                </TableCell>
                <ActionCell>
                  <ActionButton 
                    variant="edit" 
                    onClick={() => openPermissionsModal(player)}
                  >
                    <FiEdit /> Edit
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleRemovePlayerPermissions(player.name)}
                  >
                    <FiTrash2 /> Remove
                  </ActionButton>
                </ActionCell>
              </TableRow>
            ))}
            
            {filteredPlayerPermissions.length === 0 && (
              <TableRow>
                <TableCell colSpan="3">
                  <EmptyState>
                    {searchTerm ? 'No players match your search' : 'No custom player permissions set'}
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
          <FiActivity /> Overview
        </NavTab>
        <NavTab 
          $active={activeTab === 'console'} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> Console
        </NavTab>
        <NavTab 
          $active={activeTab === 'files'} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> Files
        </NavTab>
        <NavTab 
          $active={activeTab === 'config'} 
          onClick={() => navigate(`/servers/${serverId}/settings`)}
        >
          <FiSettings /> Config
        </NavTab>
        <NavTab 
          $active={activeTab === 'plugins'} 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> Plugins
        </NavTab>
        <NavTab 
          $active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
        >
          <FiUser /> Users
        </NavTab>
      </NavTabs>
      <TabsContainer>
        <Tab 
          active={activeTabs === 'server_users'} 
          onClick={() => setActiveTabs('server_users')}
        >
          <FiUsers /> Server Users
        </Tab>
        <Tab 
          active={activeTabs === 'whitelist'} 
          onClick={() => setActiveTabs('whitelist')}
        >
          <FiList /> Whitelist
        </Tab>
        <Tab 
          active={activeTabs === 'player_permissions'} 
          onClick={() => setActiveTabs('player_permissions')}
        >
          <FiShield /> Player Permissions
        </Tab>
      </TabsContainer>

      <Content>
        {activeTabs === 'server_users' && renderServerUsers()}
        {activeTabs === 'whitelist' && renderWhitelist()}
        {activeTabs === 'player_permissions' && renderPlayerPermissions()}
      </Content>

      {/* Add User Modal */}
      {showAddModal && (
        <ModalOverlay onClick={() => setShowAddModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add User to Server</ModalTitle>
              <ModalClose onClick={() => setShowAddModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>Select User</Label>
              <Select
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              >
                <option value="">Select a user</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.username}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Permissions</Label>
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
                  Can Start Server
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
                  Can Stop Server
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
                  Can Restart Server
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
                  Can Edit Files
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
                  Can Manage Users
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
                  Can Install Plugins
                </CheckboxLabel>
              </CheckboxGroup>
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowAddModal(false)}>
                Cancel
              </CancelButton>
              <SaveButton onClick={handleAddUser} disabled={!newUser.username}>
                Add User
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <ModalOverlay onClick={() => setShowEditModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Edit User Permissions</ModalTitle>
              <ModalClose onClick={() => setShowEditModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>User: {selectedUser.username}</Label>
            </FormGroup>
            
            <FormGroup>
              <Label>Permissions</Label>
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
                  Can Start Server
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
                  Can Stop Server
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
                  Can Restart Server
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
                  Can Edit Files
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
                  Can Manage Users
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
                  Can Install Plugins
                </CheckboxLabel>
              </CheckboxGroup>
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowEditModal(false)}>
                Cancel
              </CancelButton>
              <SaveButton onClick={handleUpdateUser}>
                Save Changes
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {/* Add to Whitelist Modal */}
      {showWhitelistModal && (
        <ModalOverlay onClick={() => setShowWhitelistModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add to Whitelist</ModalTitle>
              <ModalClose onClick={() => setShowWhitelistModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>Username</Label>
              <Input
                type="text"
                value={newWhitelistUser.username}
                onChange={(e) => setNewWhitelistUser({ username: e.target.value })}
                placeholder="Enter Minecraft username"
              />
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowWhitelistModal(false)}>
                Cancel
              </CancelButton>
              <SaveButton onClick={handleAddToWhitelist} disabled={!newWhitelistUser.username}>
                Add to Whitelist
              </SaveButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {/* Player Permissions Modal */}
{showPermissionsModal && (
  <ModalOverlay onClick={() => setShowPermissionsModal(false)}>
    <Modal onClick={(e) => e.stopPropagation()}>
      <ModalHeader>
        <ModalTitle>
          {playerPerms.username && playerPermissions.some(p => p.name === playerPerms.username) 
            ? 'Edit Player Permissions' 
            : 'Add Player Permissions'}
        </ModalTitle>
        <ModalClose onClick={() => setShowPermissionsModal(false)}>×</ModalClose>
      </ModalHeader>
      
      <FormGroup>
        <Label>Username</Label>
        <Input
          type="text"
          value={playerPerms.username}
          onChange={(e) => setPlayerPerms({ ...playerPerms, username: e.target.value })}
          placeholder="Enter Minecraft username"
          // Blokuj tylko jeśli edytujemy istniejącego gracza
          disabled={!!playerPerms.username && playerPermissions.some(p => p.name === playerPerms.username)}
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Permission Level</Label>
        <Select
          value={playerPerms.level}
          onChange={(e) => setPlayerPerms({ ...playerPerms, level: e.target.value })}
        >
          <option value="member">Member</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </Select>
      </FormGroup>
      
      <ModalActions>
        <CancelButton onClick={() => setShowPermissionsModal(false)}>
          Cancel
        </CancelButton>
        <SaveButton onClick={handleSavePlayerPermissions} disabled={!playerPerms.username}>
          Save Permissions
        </SaveButton>
      </ModalActions>
    </Modal>
  </ModalOverlay>
)}
    </Container>
  );
}

export default UserManager;
