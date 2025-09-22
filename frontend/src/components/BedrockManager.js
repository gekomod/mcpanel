import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPackage, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCheckCircle,
  FiXCircle,
  FiSearch
} from 'react-icons/fi';
import api from '../services/api';

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

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AdminControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #2e3245;
  border-radius: 8px;
  border: 1px solid #3a3f57;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: #35394e;
  border-radius: 6px;
  padding: 8px 12px;
  width: 300px;
  
  input {
    background: transparent;
    border: none;
    color: #fff;
    padding: 5px;
    width: 100%;
    outline: none;
  }
`;

const AddButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #059669;
  }
`;

const Content = styled.div`
  background: #2e3245;
  border-radius: 10px;
  border: 1px solid #3a3f57;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #222b43;
`;

const TableHeaderCell = styled.th`

  text-align: left;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid #3a3f57;
`;

const TableRow = styled.tr`
  &:hover {
    background: #35394e;
  }
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #3a3f57;
  color: #a4aabc;
`;

const ActionCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #3a3f57;
  text-align: right;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  
  ${props => props.$variant === 'edit' ? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  ` : props.$variant === 'delete' ? `
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  ` : props.$variant === 'toggle' ? `
    background: ${props.$active ? '#10b981' : '#6b7280'};
    color: white;
    
    &:hover {
      background: ${props.$active ? '#059669' : '#4b5563'};
    }
  ` : ''}
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.$active ? `
    background-color: #065f46;
    color: #10b981;
  ` : `
    background-color: #7c2d2d;
    color: #f87171;
  `}
`;

const ModalOverlay = styled.div.attrs(props => ({
  style: {
    display: props.$isOpen ? 'flex' : 'none'
  }
}))`
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
  padding: 20px;
`;

const Modal = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 30px;
  width: 500px;
  max-width: 100%;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3f57;
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
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  font-size: 24px;
  cursor: pointer;
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

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #7c2d2d;
  color: #f87171;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #a4aabc;
`;

function BedrockManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    version: '',
    download_url: '',
    release_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const response = await api.get('/bedrock-versions/all');
      setVersions(response.data);
    } catch (error) {
      console.error('Error fetching bedrock versions:', error);
      setError('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVersion = () => {
    setEditingVersion(null);
    setFormData({ 
      version: '', 
      download_url: '',
      release_date: new Date().toISOString().split('T')[0],
      is_active: true
    });
    setShowModal(true);
    setError('');
  };

  const handleEditVersion = (version) => {
    setEditingVersion(version);
    setFormData({
      version: version.version,
      download_url: version.download_url,
      release_date: version.release_date,
      is_active: version.is_active
    });
    setShowModal(true);
    setError('');
  };

  const handleSaveVersion = async () => {
    if (!formData.version || !formData.download_url) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingVersion) {
        await api.put(`/bedrock-versions/${editingVersion.id}`, formData);
      } else {
        await api.post('/bedrock-versions', formData);
      }
      
      setShowModal(false);
      fetchVersions();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save version');
    }
  };

  const handleDeleteVersion = async (version) => {
    if (!window.confirm(`Are you sure you want to delete version ${version.version}?`)) {
      return;
    }

    try {
      await api.delete(`/bedrock-versions/${version.id}`);
      fetchVersions();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete version');
    }
  };

  const handleToggleVersion = async (version) => {
    try {
      await api.put(`/bedrock-versions/${version.id}`, {
        is_active: !version.is_active
      });
      fetchVersions();
    } catch (error) {
      alert('Failed to toggle version status');
    }
  };

  const filteredVersions = versions.filter(version => 
    version.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.download_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>
            <FiPackage /> Zarządzanie Wersjami Bedrock
          </Title>
        </Header>
        <Content>
          <EmptyState>Loading versions...</EmptyState>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <AdminControls>
        <SearchBox>
          <FiSearch style={{ color: '#a4aabc', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Szukaj wersji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        <AddButton onClick={handleAddVersion}>
          <FiPlus /> Dodaj nową wersję
        </AddButton>
      </AdminControls>

      <Content>
        {versions.length === 0 ? (
          <EmptyState>
            No Bedrock versions found. Add your first version!
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Wersja</TableHeaderCell>
                <TableHeaderCell>URL do pobrania</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Data wydania</TableHeaderCell>
                <TableHeaderCell style={{ textAlign: 'right' }}>Akcje</TableHeaderCell>
              </tr>
            </TableHeader>
            
            <tbody>
              {filteredVersions.map(version => (
                <TableRow key={version.id}>
                  <TableCell>
                    <strong style={{ color: '#fff' }}>{version.version}</strong>
                  </TableCell>
                  <TableCell>
                    <div style={{ 
                      maxWidth: '200px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {version.download_url}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge $active={version.is_active}>
                      {version.is_active ? <FiCheckCircle /> : <FiXCircle />}
                      {version.is_active ? 'Aktywna' : 'Nieaktywna'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {new Date(version.release_date).toLocaleDateString()}
                  </TableCell>
                  <ActionCell>
                    <ActionButton
                      $variant="toggle"
                      $active={version.is_active}
                      onClick={() => handleToggleVersion(version)}
                    >
                      {version.is_active ? <FiXCircle /> : <FiCheckCircle />}
                      {version.is_active ? 'Deaktywuj' : 'Aktywuj'}
                    </ActionButton>
                    
                    <ActionButton
                      $variant="edit"
                      onClick={() => handleEditVersion(version)}
                    >
                      <FiEdit /> Edytuj
                    </ActionButton>
                    
                    <ActionButton
                      $variant="delete"
                      onClick={() => handleDeleteVersion(version)}
                    >
                      <FiTrash2 /> Usuń
                    </ActionButton>
                  </ActionCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Content>

      {/* Add/Edit Modal */}
      <ModalOverlay $isOpen={showModal} onClick={() => setShowModal(false)}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              {editingVersion ? 'Edytuj Wersję' : 'Dodaj Nową Wersję'}
            </ModalTitle>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
          </ModalHeader>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGroup>
            <Label>Numer Wersji *</Label>
            <Input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="np. 1.20.15"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>URL do pobrania *</Label>
            <Input
              type="url"
              value={formData.download_url}
              onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
              placeholder="https://example.com/bedrock-server.zip"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Data wydania</Label>
            <Input
              type="date"
              value={formData.release_date}
              onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Aktywna wersja
            </Label>
          </FormGroup>
          
          <ModalActions>
            <CancelButton onClick={() => setShowModal(false)}>
              Anuluj
            </CancelButton>
            <SaveButton onClick={handleSaveVersion}>
              {editingVersion ? 'Zapisz' : 'Dodaj'} Wersję
            </SaveButton>
          </ModalActions>
        </Modal>
      </ModalOverlay>
    </Container>
  );
}

export default BedrockManager;
