import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
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
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 15px;
  text-align: left;
  font-weight: 500;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #f3f4f6;
`;

const ActionCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #f3f4f6;
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
  ` : ''}
`;

const PermissionBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 5px;
  
  ${props => props.active ? `
    background: #dcfce7;
    color: #16a34a;
  ` : `
    background: #f3f4f6;
    color: #6b7280;
  `}
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
  border-radius: 10px;
  padding: 25px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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

const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  
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
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #e5e7eb;
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
`;

function UserManager() {
  const { serverId } = useParams();
  const [server, setServer] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  useEffect(() => {
    fetchServer();
    fetchServerUsers();
    fetchAvailableUsers();
  }, [serverId]);

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      console.error('Error fetching server:', error);
    }
  };

  const fetchServerUsers = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/users`);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching server users:', error);
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Używamy endpointu /auth/users zamiast /users
      const response = await api.get('/auth/users');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching available users:', error);
      // Fallback - przykładowi użytkownicy
      setAvailableUsers([
        { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
        { id: 2, username: 'user1', email: 'user1@example.com', role: 'user' },
        { id: 3, username: 'user2', email: 'user2@example.com', role: 'user' }
      ]);
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

  const openEditModal = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <Title>
          <FiUsers /> User Manager - {server?.name}
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
          
          <AddButton onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add User
          </AddButton>
        </HeaderActions>
      </Header>

      <Content>
        {loading ? (
          <div>Loading users...</div>
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
                  <TableCell colSpan="3" style={{ textAlign: 'center', padding: '30px' }}>
                    {searchTerm ? 'No users match your search' : 'No users have access to this server'}
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        )}
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
    </Container>
  );
}

export default UserManager;
