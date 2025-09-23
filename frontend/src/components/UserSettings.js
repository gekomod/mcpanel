import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ChangePassword from './ChangePassword';
import { useAuth } from '../context/AuthContext'; 
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';

import { 
  FiUsers
} from 'react-icons/fi';
import { FaShieldAlt, FaBell, FaCog } from "react-icons/fa";

// Komponent Modal z shouldForwardProp
const Modal = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$show',
})`
  display: ${props => props.$show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  align-items: center;
  justify-content: center;
`;

const SettingsContainer = styled.div`
  padding: 20px 30px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin-bottom: 25px;
`;

const Title = styled.h1`
  color: #fff;
  font-size: 24px;
  font-weight: 700;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: #a4aabc;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 25px;
  
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
    gap: 25px;
  }
`;

const Section = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 25px;
  border: 1px solid #3a3f57;
  height: fit-content;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
`;

const SectionTitle = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 600;
`;

const SectionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #fff;
`;

const FormInput = styled.input`
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

const FormSelect = styled.select`
  width: 100%;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  font-size: 14px;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

// Button z shouldForwardProp dla wszystkich specjalnych props
const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$primary', '$secondary', '$danger'].includes(prop),
})`
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
  font-size: 14px;
  
  ${props => props.$primary && `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `}
  
  ${props => props.$secondary && `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover {
      background: #565d81;
    }
  `}
  
  ${props => props.$danger && `
    background: #dc2626;
    color: white;
    
    &:hover {
      background: #b91c1c;
    }
  `}
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
`;

const CheckboxLabel = styled.label`
  color: #fff;
  font-weight: 500;
`;

const CheckboxDescription = styled.p`
  font-size: 12px;
  color: #a4aabc;
  margin-left: 30px;
  margin-top: -10px;
  margin-bottom: 15px;
`;

const SecurityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #3a3f57;
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const SecurityInfo = styled.div`
  flex: 1;
`;

const SecurityTitle = styled.div`
  font-weight: 600;
  color: #fff;
  margin-bottom: 5px;
`;

const SecurityDescription = styled.div`
  font-size: 14px;
  color: #a4aabc;
`;

const SecurityStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 15px;
  
  @media (max-width: 768px) {
    margin-right: 0;
    align-self: flex-end;
  }
`;

// StatusBadge z shouldForwardProp
const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => !['$active', '$inactive'].includes(prop),
})`
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => props.$active && `
    background-color: #065f46;
    color: #10b981;
  `}
  
  ${props => props.$inactive && `
    background-color: #7c2d2d;
    color: #f87171;
  `}
`;

const Row = styled.div`
  display: contents;
  
  @media (min-width: 992px) {
    &:nth-child(odd) .section-column:first-child {
      margin-right: 12.5px;
    }
    
    &:nth-child(odd) .section-column:last-child {
      margin-left: 12.5px;
    }
    
    &:nth-child(even) .section-column:first-child {
      margin-right: 12.5px;
    }
    
    &:nth-child(even) .section-column:last-child {
      margin-left: 12.5px;
    }
  }
`;

// Konfiguracja toast
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark",
};

function UserSettings() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    username: '',
    language: 'pl'
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    server_status: true,
    backup_notifications: false,
    security_alerts: true
  });

  const [loading, setLoading] = useState(false);

  // Pobierz dane użytkownika przy załadowaniu komponentu
  useEffect(() => {
    fetchUserData();
    fetchNotificationSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/user/profile');
      const userData = response.data;
      setProfileData({
        fullName: userData.full_name || '',
        email: userData.email || '',
        username: userData.username || '',
        language: userData.language || 'pl'
      });
    } catch (error) {
      toast.error('❌ Błąd podczas ładowania danych profilu', toastConfig);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await api.get('/user/notifications');
      setNotificationSettings(response.data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/user/profile', {
        full_name: profileData.fullName,
        email: profileData.email,
        username: profileData.username,
        language: profileData.language
      });
      toast.success('✅ Zmiany profilu zostały zapisane!', toastConfig);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Błąd podczas zapisywania zmian';
      toast.error(`❌ ${errorMessage}`, toastConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    try {
      await api.put('/user/notifications', notificationSettings);
      toast.success('🔔 Ustawienia powiadomień zostały zapisane!', toastConfig);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Błąd podczas zapisywania ustawień';
      toast.error(`❌ ${errorMessage}`, toastConfig);
    }
  };

  const exportData = async () => {
    try {
      const response = await api.post('/user/export-data');
      toast.info(`📦 ${response.data.message}`, {
        ...toastConfig,
        autoClose: 5000
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Błąd podczas eksportu danych';
      toast.error(`❌ ${errorMessage}`, toastConfig);
    }
  };

  const openDeleteAccountModal = () => {
    toast.warning('🚧 Funkcja usuwania konta zostanie zaimplementowana w przyszłej wersji.', toastConfig);
  };

  const open2FAModal = async () => {
    try {
      const response = await api.post('/user/generate-2fa-secret');
      // Tutaj otwórz modal z kodem QR i sekretem
      toast.info('🔐 Skonfiguruj uwierzytelnianie dwuskładnikowe', toastConfig);
      // W rzeczywistej aplikacji tutaj otworzyłbyś modal z danymi 2FA
    } catch (error) {
      toast.error('❌ Błąd podczas generowania sekretu 2FA', toastConfig);
    }
  };

  const openSessionsModal = async () => {
    try {
      const response = await api.get('/user/sessions');
      // Tutaj otwórz modal z listą sesji
      toast.info(`🔐 Masz ${response.data.length} aktywnych sesji`, toastConfig);
    } catch (error) {
      toast.error('❌ Błąd podczas pobierania sesji', toastConfig);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <SettingsContainer>
      <SettingsGrid>
        <Row>
          <div className="section-column">
            <Section>
              <SectionHeader>
                <SectionTitle>Profil</SectionTitle>
                <SectionIcon>
                  <FiUsers />
                </SectionIcon>
              </SectionHeader>
              
              <form onSubmit={handleProfileSubmit}>
                <FormGroup>
                  <FormLabel htmlFor="fullName">Imię i nazwisko</FormLabel>
                  <FormInput 
                    type="text" 
                    id="fullName" 
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel htmlFor="email">Adres e-mail</FormLabel>
                  <FormInput 
                    type="email" 
                    id="email" 
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel htmlFor="username">Nazwa użytkownika</FormLabel>
                  <FormInput 
                    type="text" 
                    id="username" 
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    disabled={loading}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel htmlFor="language">Język</FormLabel>
                  <FormSelect 
                    id="language" 
                    name="language"
                    value={profileData.language}
                    onChange={handleProfileChange}
                    disabled={loading}
                  >
                    <option value="pl">Polski</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </FormSelect>
                </FormGroup>
                
                <FormActions>
                  <Button $primary type="submit" disabled={loading}>
                    {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                  </Button>
                </FormActions>
              </form>
            </Section>
          </div>

          <div className="section-column">
            <Section>
              <SectionHeader>
                <SectionTitle>Bezpieczeństwo</SectionTitle>
                <SectionIcon>
                  <FaShieldAlt />
                </SectionIcon>
              </SectionHeader>
              
              <SecurityItem>
                <SecurityInfo>
                  <SecurityTitle>Hasło</SecurityTitle>
                  <SecurityDescription>Zaktualizuj swoje hasło regularnie, aby zachować bezpieczeństwo konta</SecurityDescription>
                </SecurityInfo>
                <SecurityStatus>
                  <StatusBadge $active>Aktywne</StatusBadge>
                  <ChangePassword />
                </SecurityStatus>
              </SecurityItem>
              
              <SecurityItem>
                <SecurityInfo>
                  <SecurityTitle>Uwierzytelnianie dwuskładnikowe (2FA)</SecurityTitle>
                  <SecurityDescription>Dodatkowa warstwa bezpieczeństwa dla Twojego konta</SecurityDescription>
                </SecurityInfo>
                <SecurityStatus>
                  <StatusBadge $inactive>Nieaktywne</StatusBadge>
                  <Button $secondary onClick={open2FAModal}>Włącz</Button>
                </SecurityStatus>
              </SecurityItem>
              
              <SecurityItem>
                <SecurityInfo>
                  <SecurityTitle>Sesje logowania</SecurityTitle>
                  <SecurityDescription>Zarządzaj aktywnymi sesjami na różnych urządzeniach</SecurityDescription>
                </SecurityInfo>
                <SecurityStatus>
                  <Button $secondary onClick={openSessionsModal}>Zarządzaj</Button>
                </SecurityStatus>
              </SecurityItem>
            </Section>
          </div>
        </Row>

        <Row>
          <div className="section-column">
            <Section>
              <SectionHeader>
                <SectionTitle>Powiadomienia</SectionTitle>
                <SectionIcon>
                  <FaBell />
                </SectionIcon>
              </SectionHeader>
              
              <CheckboxGroup>
                <input 
                  type="checkbox" 
                  id="emailNotifications" 
                  checked={notificationSettings.email_notifications}
                  onChange={() => handleNotificationChange('email_notifications')}
                />
                <CheckboxLabel htmlFor="emailNotifications">Powiadomienia e-mail</CheckboxLabel>
              </CheckboxGroup>
              <CheckboxDescription>Otrzymuj powiadomienia o ważnych zdarzeniach na swoim serwerze</CheckboxDescription>
              
              <CheckboxGroup>
                <input 
                  type="checkbox" 
                  id="serverStatus" 
                  checked={notificationSettings.server_status}
                  onChange={() => handleNotificationChange('server_status')}
                />
                <CheckboxLabel htmlFor="serverStatus">Status serwera</CheckboxLabel>
              </CheckboxGroup>
              <CheckboxDescription>Powiadomienia o zmianach statusu serwera (online/offline)</CheckboxDescription>
              
              <CheckboxGroup>
                <input 
                  type="checkbox" 
                  id="backupNotifications" 
                  checked={notificationSettings.backup_notifications}
                  onChange={() => handleNotificationChange('backup_notifications')}
                />
                <CheckboxLabel htmlFor="backupNotifications">Powiadomienia o backupach</CheckboxLabel>
              </CheckboxGroup>
              <CheckboxDescription>Powiadomienia o ukończeniu backupów serwera</CheckboxDescription>
              
              <CheckboxGroup>
                <input 
                  type="checkbox" 
                  id="securityAlerts" 
                  checked={notificationSettings.security_alerts}
                  onChange={() => handleNotificationChange('security_alerts')}
                />
                <CheckboxLabel htmlFor="securityAlerts">Alerty bezpieczeństwa</CheckboxLabel>
              </CheckboxGroup>
              <CheckboxDescription>Powiadomienia o podejrzanych aktywnościach na koncie</CheckboxDescription>
              
              <FormActions>
                <Button $primary onClick={handleNotificationSave}>Zapisz ustawienia</Button>
              </FormActions>
            </Section>
          </div>

          <div className="section-column">
            <Section>
              <SectionHeader>
                <SectionTitle>Zarządzanie kontem</SectionTitle>
                <SectionIcon>
                  <FaCog />
                </SectionIcon>
              </SectionHeader>
              
              <FormGroup>
                <FormLabel>Eksport danych</FormLabel>
                <p style={{marginBottom: '15px', fontSize: '14px', color: '#a4aabc'}}>
                  Pobierz kopię wszystkich swoich danych związanych z kontem i serwerami.
                </p>
                <Button $secondary onClick={exportData}>Eksportuj dane</Button>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Usunięcie konta</FormLabel>
                <p style={{marginBottom: '15px', fontSize: '14px', color: '#a4aabc'}}>
                  Usunięcie konta jest nieodwracalne. Wszystkie dane i serwery zostaną trwale usunięte.
                </p>
                <Button $danger onClick={openDeleteAccountModal}>Usuń konto</Button>
              </FormGroup>
            </Section>
          </div>
        </Row>
      </SettingsGrid>
    </SettingsContainer>
  );
}

export default UserSettings;
