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
  const { t } = useLanguage();
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
      setBackups(response.data.backups || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setError(t('backup.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (creatingBackup) return;

    setCreatingBackup(true);
    try {
      await api.post(`/servers/${serverId}/backups`);
      toast.success(t('backup.create.success'));
      
      setTimeout(fetchBackups, 2000);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(t('backup.create.error'));
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupName) => {
    if (restoringBackup) return;

    if (!window.confirm(t('backup.restore.confirm', { name: backupName }))) {
      return;
    }

    setRestoringBackup(backupName);
    try {
      await api.post(`/servers/${serverId}/backups/${backupName}/restore`);
      toast.success(t('backup.restore.success'));
      
      setTimeout(fetchBackups, 2000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(t('backup.restore.error'));
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleDeleteBackup = async (backupName) => {
    if (deletingBackup) return;

    setDeletingBackup(backupName);
    try {
      await api.delete(`/servers/${serverId}/backups/${backupName}`);
      toast.success(t('backup.delete.success'));
      
      setBackups(backups.filter(backup => backup.name !== backupName));
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(t('backup.delete.error'));
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
    if (!dateString) return t('common.unknown');
    if (typeof dateString === 'number') {
      return new Date(dateString * 1000).toLocaleString();
    }
    if (dateString.includes('_')) {
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
          <FiActivity /> {t('page.dashboard')}
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/console`)}>
          <FiTerminal /> {t('nav.console')}
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/files`)}>
          <FiFolder /> {t('nav.files')}
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/settings`)}>
          <FiSettings /> {t('page.server.settings')}
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/plugins`)}>
          <FiBox /> {t('nav.plugins')}
        </NavTab>
        <NavTab onClick={() => navigate(`/servers/${serverId}/users`)}>
          <FiUser /> {t('nav.users')}
        </NavTab>
        <NavTab $active={true}>
          <FiDownload /> {t('nav.backups')}
        </NavTab>
      </NavTabs>

      {error && (
        <ErrorMessage>
          <FiAlertCircle />
          {error}
          <ActionButton $variant="secondary" onClick={fetchBackups} style={{ marginLeft: 'auto' }}>
            <FiRefreshCw /> {t('common.retry')}
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
            <StatLabel>{t('backup.stats.total')}</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#10b981">
            <FiCheckCircle />
          </StatIcon>
          <StatInfo>
            <StatValue>{getCompletedBackups()}</StatValue>
            <StatLabel>{t('backup.stats.completed')}</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="#f59e0b">
            <FiClock />
          </StatIcon>
          <StatInfo>
            <StatValue>{formatFileSize(getTotalBackupSize())}</StatValue>
            <StatLabel>{t('backup.stats.totalSize')}</StatLabel>
          </StatInfo>
        </StatCard>
      </BackupStats>

      <BackupActions>
        <ActionButton 
          onClick={handleCreateBackup} 
          disabled={creatingBackup}
        >
          {creatingBackup ? <LoadingSpinner /> : <FiPlus />}
          {t('backup.actions.create')}
        </ActionButton>

        <ActionButton $variant="secondary" onClick={fetchBackups}>
          <FiRefreshCw /> {t('backup.actions.refresh')}
        </ActionButton>
      </BackupActions>

      <BackupsList>
        <BackupsHeader>
          <BackupsTitle>{t('backup.list.title')}</BackupsTitle>
          <div style={{ color: '#a4aabc', fontSize: '14px' }}>
            {t('backup.list.count', { count: backups.length })}
          </div>
        </BackupsHeader>

        {backups.length === 0 ? (
          <EmptyState>
            <FiHardDrive size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>{t('backup.list.empty.title')}</h3>
            <p>{t('backup.list.empty.description')}</p>
          </EmptyState>
        ) : (
          backups.map((backup) => (
            <BackupItem key={backup.name}>
              <BackupName>
                <FiHardDrive />
                {backup.name}
              </BackupName>
              
              <BackupSize>
                {backup.size ? formatFileSize(backup.size) : t('common.unknown')}
              </BackupSize>
              
              <BackupDate>
                {backup.created_at_formatted || formatDate(backup.created_at)}
              </BackupDate>
              
              <BackupStatus $status={backup.status || 'completed'}>
                {t(`backup.status.${backup.status || 'completed'}`)}
              </BackupStatus>
              
              <BackupActionsSmall>
                <IconButton
                  onClick={() => handleRestoreBackup(backup.name)}
                  disabled={restoringBackup === backup.name || (backup.status && backup.status !== 'completed')}
                  title={t('backup.actions.restore')}
                >
                  <FiUpload />
                </IconButton>
                
                <IconButton
                  onClick={() => confirmDeleteBackup(backup.name)}
                  disabled={deletingBackup === backup.name}
                  title={t('backup.actions.delete')}
                >
                  <FiTrash2 />
                </IconButton>
              </BackupActionsSmall>
            </BackupItem>
          ))
        )}
      </BackupsList>

      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{t('backup.delete.confirm.title')}</ModalTitle>
            <p style={{ color: '#a4aabc', lineHeight: '1.5' }}>
              {t('backup.delete.confirm.message', { name: backupToDelete })}
            </p>
            
            <ModalActions>
              <ActionButton 
                $variant="secondary" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setBackupToDelete(null);
                }}
              >
                {t('common.cancel')}
              </ActionButton>
              
              <ActionButton 
                $variant="danger" 
                onClick={() => handleDeleteBackup(backupToDelete)}
                disabled={deletingBackup}
              >
                {deletingBackup ? <LoadingSpinner /> : <FiTrash2 />}
                {t('backup.actions.delete')}
              </ActionButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default BackupServer;
