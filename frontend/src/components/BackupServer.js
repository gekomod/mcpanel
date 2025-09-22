import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiDownload, 
  FiUpload, 
  FiTrash2, 
  FiClock, 
  FiHardDrive,
  FiPlus,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiActivity,
  FiTerminal,
  FiFolder,
  FiSettings,
  FiBox,
  FiUser
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

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
  justify-content: space-between;
  align-items: center;
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

const BackupStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const StatCard = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$color || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #a4aabc;
`;

const BackupActions = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.$variant === 'danger') return '#dc2626';
    if (props.$variant === 'secondary') return '#4a5070';
    return '#3b82f6';
  }};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  min-width: 160px;
  
  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$variant === 'danger') return '#b91c1c';
      if (props.$variant === 'secondary') return '#565d81';
      return '#2563eb';
    }};
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const BackupsList = styled.div`
  background: #2e3245;
  border-radius: 8px;
  overflow: hidden;
`;

const BackupsHeader = styled.div`
  background: #35394e;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3a3f57;
`;

const BackupsTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const BackupItem = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #3a3f57;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #35394e;
  }
`;

const BackupName = styled.div`
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackupSize = styled.div`
  color: #a4aabc;
  font-size: 14px;
`;

const BackupDate = styled.div`
  color: #a4aabc;
  font-size: 14px;
`;

const BackupStatus = styled.div`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.$status === 'completed' ? `
    background: #065f46;
    color: #10b981;
  ` : props.$status === 'failed' ? `
    background: #991b1b;
    color: #ef4444;
  ` : `
    background: #4a5070;
    color: #a4aabc;
  `}
`;

const BackupActionsSmall = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a3f57;
    color: #fff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #a4aabc;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
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
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 25px;
  width: 90%;
  max-width: 500px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #fff;
  font-size: 18px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

function BackupServer() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);
  const [deletingBackup, setDeletingBackup] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);

  useEffect(() => {
    fetchBackups();
  }, [serverId]);

  const fetchBackups = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/backups`);
      // Poprawiona struktura - response.data.backups zamiast response.data
      setBackups(response.data.backups || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setError('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (creatingBackup) return;

    setCreatingBackup(true);
    try {
      await api.post(`/servers/${serverId}/backups`);
      toast.success('Backup creation started');
      
      // Refresh backups list after a short delay
      setTimeout(fetchBackups, 2000);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupName) => {
    if (restoringBackup) return;

    if (!window.confirm(`Are you sure you want to restore backup "${backupName}"? This will replace the current world and server files.`)) {
      return;
    }

    setRestoringBackup(backupName);
    try {
      await api.post(`/servers/${serverId}/backups/${backupName}/restore`);
      toast.success('Backup restoration started');
      
      // Refresh backups list after restoration
      setTimeout(fetchBackups, 2000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleDeleteBackup = async (backupName) => {
    if (deletingBackup) return;

    setDeletingBackup(backupName);
    try {
      // Użyj poprawnego endpointu DELETE
      await api.delete(`/servers/${serverId}/backups/${backupName}`);
      toast.success('Backup deleted successfully');
      
      // Remove backup from local state
      setBackups(backups.filter(backup => backup.name !== backupName));
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    } finally {
      setDeletingBackup(null);
      setShowDeleteModal(false);
      setBackupToDelete(null);
    }
  };

  const confirmDeleteBackup = (backupName) => {
    setBackupToDelete(backupName);
    setShowDeleteModal(true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    // Obsłuż różne formaty daty
    if (typeof dateString === 'number') {
      return new Date(dateString * 1000).toLocaleString();
    }
    if (dateString.includes('_')) {
      // Format timestamp: backup_servername_20241231_120000.zip
      return dateString.replace('backup_', '').replace(/_/g, ' ').replace('.zip', '');
    }
    return new Date(dateString).toLocaleString();
  };

  const getTotalBackupSize = () => {
    return backups.reduce((total, backup) => total + (backup.size || 0), 0);
  };

  const getCompletedBackups = () => {
    return backups.filter(backup => backup.status === 'completed').length;
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <LoadingSpinner />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <NavTabs>
        <NavTab onClick={() => navigate(`/servers/${serverId}`)}>
          <FiActivity /> Overview
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/console`)}>
          <FiTerminal /> Console
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/files`)}>
          <FiFolder /> Files
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/settings`)}>
          <FiSettings /> Config
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/plugins`)}>
          <FiBox /> Plugins
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/users`)}>
          <FiUser /> Users
        </NavTab>
        <NavTab $active={true}>
          <FiDownload /> Backups
        </NavTab>
      </NavTabs>

      {error && (
        <ErrorMessage>
          <FiAlertCircle />
          {error}
          <ActionButton $variant="secondary" onClick={fetchBackups} style={{ marginLeft: 'auto' }}>
            <FiRefreshCw /> Retry
          </ActionButton>
        </ErrorMessage>
      )}

      <BackupStats>
        <StatCard>
          <StatIcon $color="#3b82f6">
            <FiHardDrive />
          </StatIcon>
          <StatInfo>
            <StatValue>{backups.length}</StatValue>
            <StatLabel>Total Backups</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#10b981">
            <FiCheckCircle />
          </StatIcon>
          <StatInfo>
            <StatValue>{getCompletedBackups()}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#f59e0b">
            <FiClock />
          </StatIcon>
          <StatInfo>
            <StatValue>{formatFileSize(getTotalBackupSize())}</StatValue>
            <StatLabel>Total Size</StatLabel>
          </StatInfo>
        </StatCard>
      </BackupStats>

      <BackupActions>
        <ActionButton 
          onClick={handleCreateBackup} 
          disabled={creatingBackup}
        >
          {creatingBackup ? <LoadingSpinner /> : <FiPlus />}
          Create New Backup
        </ActionButton>

        <ActionButton $variant="secondary" onClick={fetchBackups}>
          <FiRefreshCw /> Refresh List
        </ActionButton>
        
        <ActionButton onClick={fetchBackups}>
          <FiRefreshCw /> Refresh
        </ActionButton>
      </BackupActions>

      <BackupsList>
        <BackupsHeader>
          <BackupsTitle>Available Backups</BackupsTitle>
          <div style={{ color: '#a4aabc', fontSize: '14px' }}>
            {backups.length} backup{backups.length !== 1 ? 's' : ''}
          </div>
        </BackupsHeader>

        {backups.length === 0 ? (
          <EmptyState>
            <FiHardDrive size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>No Backups Found</h3>
            <p>Create your first backup to get started.</p>
          </EmptyState>
        ) : (
          backups.map((backup) => (
            <BackupItem key={backup.name}>
              <BackupName>
                <FiHardDrive />
                {backup.name}
              </BackupName>
              
              <BackupSize>
                {backup.size ? formatFileSize(backup.size) : 'Unknown'}
              </BackupSize>
              
              <BackupDate>
                {backup.created_at_formatted || formatDate(backup.created_at)}
              </BackupDate>
              
              <BackupStatus $status={backup.status || 'completed'}>
                {backup.status || 'completed'}
              </BackupStatus>
              
              <BackupActionsSmall>
                <IconButton
                  onClick={() => handleRestoreBackup(backup.name)}
                  disabled={restoringBackup === backup.name || (backup.status && backup.status !== 'completed')}
                  title="Restore Backup"
                >
                  <FiUpload />
                </IconButton>
                
                <IconButton
                  onClick={() => confirmDeleteBackup(backup.name)}
                  disabled={deletingBackup === backup.name}
                  title="Delete Backup"
                >
                  <FiTrash2 />
                </IconButton>
              </BackupActionsSmall>
            </BackupItem>
          ))
        )}
      </BackupsList>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete Backup</ModalTitle>
            <p style={{ color: '#a4aabc', lineHeight: '1.5' }}>
              Are you sure you want to delete backup "<strong>{backupToDelete}</strong>"? 
              This action cannot be undone.
            </p>
            
            <ModalActions>
              <ActionButton 
                $variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setBackupToDelete(null);
                }}
              >
                Cancel
              </ActionButton>
              
              <ActionButton 
                $variant="danger" 
                onClick={() => handleDeleteBackup(backupToDelete)}
                disabled={deletingBackup}
              >
                {deletingBackup ? <LoadingSpinner /> : <FiTrash2 />}
                Delete
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default BackupServer;
