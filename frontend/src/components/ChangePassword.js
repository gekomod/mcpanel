import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ChangePasswordContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

// Button z shouldForwardProp
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
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `}
  
  ${props => props.$secondary && `
    background: #4a5070;
    color: #cbd5e1;
    
    &:hover:not(:disabled) {
      background: #565d81;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Modal z shouldForwardProp
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

const ModalContent = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
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
  font-size: 20px;
  font-weight: 600;
  color: #fff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
    color: #fff;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

// Message z shouldForwardProp
const Message = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$success',
})`
  padding: 12px 15px;
  border-radius: 6px;
  margin-top: 16px;
  font-size: 14px;
  background: ${props => props.$success ? '#065f46' : '#7c2d2d'};
  color: ${props => props.$success ? '#10b981' : '#f87171'};
  border: 1px solid ${props => props.$success ? '#047857' : '#991b1b'};
`;

const LoadingSpinner = styled.div`
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user, logout } = useAuth();

  const openModal = () => {
    setShowModal(true);
    setMessage('');
    setIsSuccess(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    // Walidacja
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Wszystkie pola są wymagane');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Nowe hasło musi mieć co najmniej 6 znaków');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Nowe hasła nie są identyczne');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.post('/auth/change-password', {
		  current_password: currentPassword,
		  new_password: newPassword,
		  confirm_password: confirmPassword
		});
      
      if (result.success) {
        setIsSuccess(true);
        setMessage(result.message || 'Hasło zostało pomyślnie zmienione!');
        
        // Wyczyść pola po sukcesie
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Automatyczne zamknięcie modala po 2 sekundach
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setIsSuccess(false);
        setMessage(result.message || 'Wystąpił błąd podczas zmiany hasła');
      }
      
    } catch (error) {
      setIsSuccess(false);
      
      // Obsługa specyficznych błędów
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setMessage('Sesja wygasła. Zaloguj się ponownie.');
        setTimeout(() => {
          logout();
        }, 3000);
      } else if (error.message.includes('Obecne hasło jest nieprawidłowe')) {
        setMessage('Obecne hasło jest nieprawidłowe');
      } else {
        setMessage(error.message || 'Wystąpił błąd podczas zmiany hasła');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ChangePasswordContainer>
        <Button $secondary onClick={openModal}>Zmień hasło</Button>
      </ChangePasswordContainer>

      <Modal $show={showModal} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Zmień hasło</ModalTitle>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
          </ModalHeader>
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="currentPassword">Aktualne hasło</Label>
              <Input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Wprowadź obecne hasło"
                autoComplete="current-password"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="newPassword">Nowe hasło</Label>
              <Input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Wprowadź nowe hasło (min. 6 znaków)"
                autoComplete="new-password"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Potwierdź nowe hasło"
                autoComplete="new-password"
              />
            </FormGroup>

            {message && (
              <Message $success={isSuccess}>
                {message}
              </Message>
            )}

            <ButtonGroup>
              <Button type="button" $secondary onClick={closeModal} disabled={isLoading}>
                Anuluj
              </Button>
              <Button type="submit" $primary disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    Zmienianie...
                  </>
                ) : (
                  'Zmień hasło'
                )}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ChangePassword;
