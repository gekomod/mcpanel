import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiPackage, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiDownload,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import api from '../services/api';

const Container = styled.div`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #059669;
  }
`;

const Content = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
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
  font-size: 0.85rem;
  
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
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => props.$active ? `
    background: #dcfce7;
    color: #16a34a;
  ` : `
    background: #fef3c7;
    color: #d97706;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  width: 500px;
  max-width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
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

const Input = styled.input`
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
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 20px;
`;

function BedrockManager() {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    version: '',
    download_url: ''
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
    setFormData({ version: '', download_url: '' });
    setShowModal(true);
    setError('');
  };

  const handleEditVersion = (version) => {
    setEditingVersion(version);
    setFormData({
      version: version.version,
      download_url: version.download_url
    });
    setShowModal(true);
    setError('');
  };

  const handleSaveVersion = async () => {
    if (!formData.version || !formData.download_url) {
      setError('Please fill in all fields');
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

  if (loading) {
    return <Container>Loading versions...</Container>;
  }

  return (
    <Container>
      <Header>
        <Title>
          <FiPackage /> Bedrock Versions Management
        </Title>
        <AddButton onClick={handleAddVersion}>
          <FiPlus /> Add Version
        </AddButton>
      </Header>

      <Content>
        {versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No Bedrock versions found. Add your first version!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Version</TableHeaderCell>
                <TableHeaderCell>Download URL</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Release Date</TableHeaderCell>
                <TableHeaderCell style={{ textAlign: 'right' }}>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            
            <tbody>
              {versions.map(version => (
                <TableRow key={version.id}>
                  <TableCell>
                    <strong>{version.version}</strong>
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
                      {version.is_active ? 'Active' : 'Inactive'}
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
                      {version.is_active ? 'Deactivate' : 'Activate'}
                    </ActionButton>
                    
                    <ActionButton
                      $variant="edit"
                      onClick={() => handleEditVersion(version)}
                    >
                      <FiEdit /> Edit
                    </ActionButton>
                    
                    <ActionButton
                      $variant="delete"
                      onClick={() => handleDeleteVersion(version)}
                    >
                      <FiTrash2 /> Delete
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
              {editingVersion ? 'Edit Version' : 'Add New Version'}
            </ModalTitle>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
          </ModalHeader>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <FormGroup>
            <Label>Version Number *</Label>
            <Input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g., 1.20.15"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Download URL *</Label>
            <Input
              type="url"
              value={formData.download_url}
              onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
              placeholder="https://example.com/bedrock-server.zip"
            />
          </FormGroup>
          
          <ModalActions>
            <CancelButton onClick={() => setShowModal(false)}>
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSaveVersion}>
              {editingVersion ? 'Update' : 'Add'} Version
            </SaveButton>
          </ModalActions>
        </Modal>
      </ModalOverlay>
    </Container>
  );
}

export default BedrockManager;