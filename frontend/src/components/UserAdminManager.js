import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch
} from 'react-icons/fi';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const UsersTableContainer = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #3a3f57;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TableTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 8px 12px;
  width: 250px;
  
  input {
    background: transparent;
    border: none;
    color: #fff;
    padding: 0 10px;
    width: 100%;
    outline: none;
    
    &::placeholder {
      color: #6b7280;
    }
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 12px 15px;
  font-weight: 600;
  color: #a4aabc;
  border-bottom: 1px solid #3a3f57;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #222b43;
  }
`;

const TableCell = styled.td`
  padding: 12px 15px;
  border-bottom: 1px solid #3a3f57;
  color: #fff;
`;

const UsernameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatarSmall = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 12px;
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.$role === 'admin' && `
    background-color: #7c2d2d;
    color: #f87171;
  `}
  
  ${props => props.$role === 'moderator' && `
    background-color: #713f12;
    color: #fbbf24;
  `}
  
  ${props => props.$role === 'user' && `
    background-color: #065f46;
    color: #10b981;
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  ${props => props.$variant === 'edit' && `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `}
  
  ${props => props.$variant === 'delete' && `
    background: #7c2d2d;
    color: #f87171;
    
    &:hover {
      background: #9a3a3a;
    }
  `}
`;

const AddUserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  margin-left: auto;
  
  &:hover {
    background: #2563eb;
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
  width: 500px;
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
  color: #fff;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 14px;
  background: #35394e;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 14px;
  background: #35394e;
  color: #fff;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
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

function UserAdminManager() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(t('user.admin.fetch.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post('/auth/register', {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
      
      setShowAddModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      
      fetchUsers();
      alert(t('user.admin.add.success'));
    } catch (error) {
      console.error('Error adding user:', error);
      alert(t('user.admin.add.error'));
    }
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/auth/users/${selectedUser.id}`, {
        username: selectedUser.username,
        email: selectedUser.email,
        role: selectedUser.role,
        is_active: selectedUser.is_active !== undefined ? selectedUser.is_active : true
      });
      
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert(t('user.admin.edit.success'));
    } catch (error) {
      console.error('Error updating user:', error);
      alert(t('user.admin.edit.error'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('user.admin.delete.confirm'))) {
      return;
    }
    
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
      alert(t('user.admin.delete.success'));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t('user.admin.delete.error'));
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return t('user.role.admin');
      case 'moderator': return t('user.role.moderator');
      case 'user': return t('user.role.user');
      default: return role;
    }
  };

  const getStatusDisplayName = (isActive) => {
    return isActive ? t('user.status.active') : t('user.status.inactive');
  };

  return (
    <>
      <UsersTableContainer>
        <TableHeader>
          <TableTitle>{t('user.admin.title')}</TableTitle>
          <SearchBox>
            <FiSearch />
            <input
              type="text"
              placeholder={t('user.admin.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>
        </TableHeader>

        {loading ? (
          <LoadingSpinner>
            <div>{t('user.admin.loading')}</div>
          </LoadingSpinner>
        ) : (
          <UsersTable>
            <thead>
              <tr>
                <TableHeaderCell>{t('user.admin.table.username')}</TableHeaderCell>
                <TableHeaderCell>{t('user.admin.table.email')}</TableHeaderCell>
                <TableHeaderCell>{t('user.admin.table.role')}</TableHeaderCell>
                <TableHeaderCell>{t('user.admin.table.status')}</TableHeaderCell>
                <TableHeaderCell>{t('user.admin.table.created')}</TableHeaderCell>
                <TableHeaderCell style={{ textAlign: 'right' }}>{t('user.admin.table.actions')}</TableHeaderCell>
              </tr>
            </thead>
            
            <tbody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <UsernameCell>
                      <UserAvatarSmall>
                        {user.username.charAt(0).toUpperCase()}
                      </UserAvatarSmall>
                      <span>{user.username}</span>
                    </UsernameCell>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge $role={user.role}>
                      {getRoleDisplayName(user.role)}
                    </RoleBadge>
                  </TableCell>
                  <TableCell>
                    <span style={{ 
                      color: user.is_active ? '#10b981' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {getStatusDisplayName(user.is_active)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL') : t('common.none')}
                  </TableCell>
                  <TableCell>
                    <ActionButtons>
                      <ActionButton 
                        $variant="edit" 
                        onClick={() => openEditModal(user)}
                      >
                        <FiEdit /> {t('common.edit')}
                      </ActionButton>
                      <ActionButton 
                        $variant="delete" 
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FiTrash2 /> {t('common.delete')}
                      </ActionButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan="6">
                    <EmptyState>
                      {searchTerm ? t('user.admin.empty.search') : t('user.admin.empty.default')}
                    </EmptyState>
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </UsersTable>
        )}
      </UsersTableContainer>

      <AddUserButton onClick={() => setShowAddModal(true)}>
        <FiPlus /> {t('user.admin.add.button')}
      </AddUserButton>

      {/* Add User Modal */}
      {showAddModal && (
        <ModalOverlay onClick={() => setShowAddModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{t('user.admin.modal.add.title')}</ModalTitle>
              <ModalClose onClick={() => setShowAddModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>{t('user.username')}</Label>
              <Input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder={t('user.username.placeholder')}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.email')}</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder={t('user.email.placeholder')}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.password')}</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder={t('user.password.placeholder')}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.role')}</Label>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">{t('user.role.user')}</option>
                <option value="moderator">{t('user.role.moderator')}</option>
                <option value="admin">{t('user.role.admin')}</option>
              </Select>
            </FormGroup>
            
            <ModalActions>
              <CancelButton onClick={() => setShowAddModal(false)}>
                {t('common.cancel')}
              </CancelButton>
              <SaveButton 
                onClick={handleAddUser} 
                disabled={!newUser.username || !newUser.email || !newUser.password}
              >
                {t('user.admin.add.button')}
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
              <ModalTitle>{t('user.admin.modal.edit.title')}</ModalTitle>
              <ModalClose onClick={() => setShowEditModal(false)}>×</ModalClose>
            </ModalHeader>
            
            <FormGroup>
              <Label>{t('user.username')}</Label>
              <Input
                type="text"
                value={selectedUser.username}
                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                placeholder={t('user.username.placeholder')}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.email')}</Label>
              <Input
                type="email"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                placeholder={t('user.email.placeholder')}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>{t('user.role')}</Label>
              <Select
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              >
                <option value="user">{t('user.role.user')}</option>
                <option value="moderator">{t('user.role.moderator')}</option>
                <option value="admin">{t('user.role.admin')}</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>{t('user.status.title')}</Label>
              <Select
                value={selectedUser.is_active ? 'active' : 'inactive'}
                onChange={(e) => setSelectedUser({ 
                  ...selectedUser, 
                  is_active: e.target.value === 'active' 
                })}
              >
                <option value="active">{t('user.status.active')}</option>
                <option value="inactive">{t('user.status.inactive')}</option>
              </Select>
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
    </>
  );
}

export default UserAdminManager;
