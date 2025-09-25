import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FiSave, 
  FiBell, 
  FiShield, 
  FiDatabase, 
  FiGlobe,
  FiUser,
  FiServer,
  FiLock,
  FiX
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const SettingsContainer = styled.div`
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
    border-radius: 3px;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SettingsSidebar = styled.div`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #3a3f57;
  height: fit-content;
`;

const SettingsMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 8px;
  background: ${props => props.$active ? '#222b43' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#a4aabc'};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  
  &:hover {
    background: #222b43;
    color: #fff;
  }
  
  svg {
    font-size: 18px;
  }
`;

const SettingsContent = styled.div`
  background: linear-gradient(145deg, #2e3245, #272b3c);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #3a3f57;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3f57;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FormGroup = styled.div`
  margin-bottom: 25px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #fff;
`;

const Input = styled.input`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #a4aabc;
  transition: color 0.3s ease;
  
  &:hover {
    color: #fff;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #3a3f57;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.$variant === 'primary' && `
    background: linear-gradient(to right, #3b82f6, #8b5cf6);
    color: white;
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover {
      background: #565d81;
    }
  `}
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const InfoText = styled.p`
  color: #a4aabc;
  font-size: 14px;
  margin-top: 5px;
`;

const DangerZone = styled.div`
  background: rgba(124, 45, 45, 0.1);
  border: 1px solid #7c2d2d;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
`;

const DangerZoneTitle = styled.h4`
  color: #f87171;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DangerButton = styled.button`
  padding: 12px 20px;
  background: #7c2d2d;
  color: #f87171;
  border: 1px solid #9a3a3a;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  
  &:hover {
    background: #9a3a3a;
  }
`;

// Toast Notification Styles
const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Toast = styled.div`
  background: #2e3245;
  border: 1px solid ${props => {
    switch(props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#3a3f57';
    }
  }};
  border-left: 4px solid ${props => {
    switch(props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#3b82f6';
    }
  }};
  border-radius: 8px;
  padding: 15px;
  min-width: 300px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ToastIcon = styled.div`
  color: ${props => {
    switch(props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#3b82f6';
    }
  }};
  font-size: 20px;
  flex-shrink: 0;
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.h4`
  margin: 0 0 5px 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

const ToastMessage = styled.p`
  margin: 0;
  color: #a4aabc;
  font-size: 14px;
  line-height: 1.4;
`;

const ToastClose = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  flex-shrink: 0;
  
  &:hover {
    color: #fff;
  }
`;

// Confirmation Modal Styles
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
  z-index: 9999;
  padding: 20px;
`;

const Modal = styled.div`
  background: #2e3245;
  border-radius: 12px;
  padding: 25px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
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
  color: #fff;
  font-size: 18px;
  font-weight: 600;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  cursor: pointer;
  font-size: 20px;
  
  &:hover {
    color: #fff;
  }
`;

const ModalMessage = styled.p`
  margin: 0 0 25px 0;
  color: #a4aabc;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' && `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `}
  
  ${props => props.$variant === 'secondary' && `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover {
      background: #565d81;
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background: #7c2d2d;
    color: #f87171;
    
    &:hover {
      background: #9a3a3a;
    }
  `}
`;

function SettingsAdmin() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('ogolne');
  const [settings, setSettings] = useState({
    // Ogólne ustawienia
    language: 'pl',
    theme: 'dark',
    timezone: 'Europe/Warsaw',
    
    // Powiadomienia
    emailNotifications: true,
    pushNotifications: false,
    serverAlerts: true,
    maintenanceAlerts: true,
    
    // Bezpieczeństwo
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 60,
    
    // Zaawansowane
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 10,
    consoleHistory: 1000,
    
    // API
    apiEnabled: false,
    apiKey: 'sb_*******',
    apiRateLimit: 100
  });

  const [toasts, setToasts] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const showToast = (title, message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirmationDialog = (config) => {
    setConfirmationConfig(config);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (confirmationConfig.onConfirm) {
      confirmationConfig.onConfirm();
    }
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    if (confirmationConfig.onCancel) {
      confirmationConfig.onCancel();
    }
    setShowConfirmation(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    showToast(t('user.settings.success.profileSaved'), t('user.settings.success.notificationsSaved'), 'success');
  };

  const handleReset = () => {
    showConfirmationDialog({
      title: t('server.settings.resetToDefault'),
      message: t('user.settings.warning.deleteAccount'),
      onConfirm: () => {
        showToast(t('common.info'), t('user.settings.success.profileSaved'), 'info');
      }
    });
  };

  const regenerateApiKey = () => {
    showConfirmationDialog({
      title: t('server.settings.regenerateApiKey'),
      message: t('user.settings.warning.deleteAccount'),
      onConfirm: () => {
        const newApiKey = 'sb_' + Math.random().toString(36).substring(2, 15);
        setSettings(prev => ({
          ...prev,
          apiKey: newApiKey
        }));
        showToast(t('common.success'), t('user.settings.success.profileSaved'), 'success');
      }
    });
  };

  const handleLogoutAll = () => {
    showConfirmationDialog({
      title: t('nav.logout'),
      message: t('user.settings.warning.deleteAccount'),
      variant: 'danger',
      onConfirm: () => {
        showToast(t('common.success'), t('user.settings.success.profileSaved'), 'success');
      }
    });
  };

  const menuItems = [
    { id: 'ogolne', label: t('server.settings.general'), icon: <FiGlobe /> },
    { id: 'powiadomienia', label: t('server.settings.notifications'), icon: <FiBell /> },
    { id: 'bezpieczenstwo', label: t('server.settings.security'), icon: <FiShield /> },
    { id: 'zaawansowane', label: t('server.settings.advanced'), icon: <FiDatabase /> },
    { id: 'api', label: 'API', icon: <FiServer /> }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'ogolne':
        return (
          <>
            <SectionTitle><FiGlobe /> {t('server.settings.general')}</SectionTitle>
            
            <FormGroup>
              <Label>{t('user.settings.profile.language')}</Label>
              <Select name="language" value={settings.language} onChange={handleInputChange}>
                <option value="pl">{t('languages.polish')}</option>
                <option value="en">{t('languages.english')}</option>
                <option value="de">{t('languages.german')}</option>
                <option value="fr">{t('languages.french')}</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>{t('server.settings.theme')}</Label>
              <Select name="theme" value={settings.theme} onChange={handleInputChange}>
                <option value="dark">{t('server.settings.dark')}</option>
                <option value="light">{t('server.settings.light')}</option>
                <option value="auto">{t('server.settings.auto')}</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>{t('server.settings.timezone')}</Label>
              <Select name="timezone" value={settings.timezone} onChange={handleInputChange}>
                <option value="Europe/Warsaw">Europe/Warsaw (CET)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </Select>
            </FormGroup>
          </>
        );
      
      case 'powiadomienia':
        return (
          <>
            <SectionTitle><FiBell /> {t('server.settings.notifications')}</SectionTitle>
            
            <CheckboxGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleInputChange}
                />
                {t('user.settings.notifications.email')}
              </CheckboxLabel>
              
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={handleInputChange}
                />
                {t('server.settings.pushNotifications')}
              </CheckboxLabel>
              
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="serverAlerts"
                  checked={settings.serverAlerts}
                  onChange={handleInputChange}
                />
                {t('user.settings.notifications.serverStatus')}
              </CheckboxLabel>
              
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="maintenanceAlerts"
                  checked={settings.maintenanceAlerts}
                  onChange={handleInputChange}
                />
                {t('server.settings.maintenanceAlerts')}
              </CheckboxLabel>
            </CheckboxGroup>
          </>
        );
      
      case 'bezpieczenstwo':
        return (
          <>
            <SectionTitle><FiShield /> {t('server.settings.security')}</SectionTitle>
            
            <CheckboxGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onChange={handleInputChange}
                />
                {t('user.settings.security.2fa')}
              </CheckboxLabel>
              
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="loginAlerts"
                  checked={settings.loginAlerts}
                  onChange={handleInputChange}
                />
                {t('server.settings.loginAlerts')}
              </CheckboxLabel>
            </CheckboxGroup>
            
            <FormGroup>
              <Label>{t('server.settings.sessionTimeout')}</Label>
              <Input
                type="number"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleInputChange}
                min="5"
                max="1440"
              />
              <InfoText>{t('server.settings.sessionTimeoutDesc')}</InfoText>
            </FormGroup>
          </>
        );
      
      case 'zaawansowane':
        return (
          <>
            <SectionTitle><FiDatabase /> {t('server.settings.advanced')}</SectionTitle>
            
            <CheckboxGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="autoBackup"
                  checked={settings.autoBackup}
                  onChange={handleInputChange}
                />
                {t('server.settings.autoBackup')}
              </CheckboxLabel>
            </CheckboxGroup>
            
            <TwoColumnLayout>
              <FormGroup>
                <Label>{t('server.settings.backupInterval')}</Label>
                <Input
                  type="number"
                  name="backupInterval"
                  value={settings.backupInterval}
                  onChange={handleInputChange}
                  min="1"
                  max="168"
                  disabled={!settings.autoBackup}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>{t('server.settings.maxBackups')}</Label>
                <Input
                  type="number"
                  name="maxBackups"
                  value={settings.maxBackups}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  disabled={!settings.autoBackup}
                />
                <InfoText>{t('server.settings.maxBackupsDesc')}</InfoText>
              </FormGroup>
            </TwoColumnLayout>
            
            <FormGroup>
              <Label>{t('server.settings.consoleHistory')}</Label>
              <Input
                type="number"
                name="consoleHistory"
                value={settings.consoleHistory}
                onChange={handleInputChange}
                min="100"
                max="10000"
              />
            </FormGroup>
          </>
        );
      
      case 'api':
        return (
          <>
            <SectionTitle><FiServer /> {t('server.settings.api')}</SectionTitle>
            
            <CheckboxGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="apiEnabled"
                  checked={settings.apiEnabled}
                  onChange={handleInputChange}
                />
                {t('server.settings.apiEnabled')}
              </CheckboxLabel>
            </CheckboxGroup>
            
            <FormGroup>
              <Label>{t('server.settings.apiKey')}</Label>
              <Input
                type="text"
                value={settings.apiKey}
                disabled
              />
              <InfoText>{t('server.settings.apiKeyDesc')}</InfoText>
              <Button 
                $variant="secondary" 
                onClick={regenerateApiKey}
                style={{ marginTop: '10px' }}
              >
                <FiLock /> {t('server.settings.regenerateApiKey')}
              </Button>
            </FormGroup>
            
            <FormGroup>
              <Label>{t('server.settings.apiRateLimit')}</Label>
              <Input
                type="number"
                name="apiRateLimit"
                value={settings.apiRateLimit}
                onChange={handleInputChange}
                min="10"
                max="1000"
                disabled={!settings.apiEnabled}
              />
            </FormGroup>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <SettingsContainer>
        <SettingsGrid>
          <SettingsSidebar>
            {menuItems.map(item => (
              <SettingsMenuItem
                key={item.id}
                $active={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
              >
                {item.icon}
                {item.label}
              </SettingsMenuItem>
            ))}
          </SettingsSidebar>

          <SettingsContent>
            {renderSection()}
            
            <FormActions>
              <Button $variant="secondary" onClick={handleReset}>
                {t('server.settings.resetToDefault')}
              </Button>
              <Button $variant="primary" onClick={handleSave}>
                <FiSave /> {t('common.save')}
              </Button>
            </FormActions>

            {activeSection === 'bezpieczenstwo' && (
              <DangerZone>
                <DangerZoneTitle>
                  <FiUser /> {t('server.settings.dangerZone')}
                </DangerZoneTitle>
                <p style={{ color: '#a4aabc', marginBottom: '15px' }}>
                  {t('server.settings.dangerZoneDesc')}
                </p>
                <DangerButton onClick={handleLogoutAll}>
                  {t('server.settings.logoutAllDevices')}
                </DangerButton>
              </DangerZone>
            )}
          </SettingsContent>
        </SettingsGrid>
      </SettingsContainer>

      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} $type={toast.type}>
            <ToastIcon $type={toast.type}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '⚠'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </ToastIcon>
            <ToastContent>
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastMessage>{toast.message}</ToastMessage>
            </ToastContent>
            <ToastClose onClick={() => removeToast(toast.id)}>
              <FiX />
            </ToastClose>
          </Toast>
        ))}
      </ToastContainer>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <ModalTitle>{confirmationConfig.title || t('common.confirmation')}</ModalTitle>
              <ModalClose onClick={handleCancel}>
                <FiX />
              </ModalClose>
            </ModalHeader>
            <ModalMessage>{confirmationConfig.message}</ModalMessage>
            <ModalActions>
              <ModalButton $variant="secondary" onClick={handleCancel}>
                {t('common.cancel')}
              </ModalButton>
              <ModalButton 
                $variant={confirmationConfig.variant === 'danger' ? 'danger' : 'primary'} 
                onClick={handleConfirm}
              >
                {t('common.confirm')}
              </ModalButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </>
  );
}

export default SettingsAdmin;
