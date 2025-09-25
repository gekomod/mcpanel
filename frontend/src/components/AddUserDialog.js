import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const DialogOverlay = styled.div`
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

const DialogContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
  }
`;

const PasswordInputWrapper = styled.div`
  position: relative;
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #374151;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.9rem;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 0.9rem;
  margin-top: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  ${props => props.$variant === 'primary' ? `
    background: #10b981;
    color: white;
    
    &:hover:not(:disabled) {
      background: #059669;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

function AddUserDialog({ isOpen, onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useLanguage(); // Dodaj hook tłumaczeń

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', formData);
      
      setSuccess(t('user.add.success') || 'User created successfully!');
      setFormData({ username: '', email: '', password: '' });
      
      // Callback to refresh users list
      if (onUserAdded) {
        onUserAdded();
      }
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.error || t('user.add.error') || 'Failed to create user';
      setError(errorMessage);
      toast.error(errorMessage); // Dodaj toast error
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: '', email: '', password: '' });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <DialogOverlay onClick={handleClose}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            <FiUserPlus />
            {t('user.add.title') || 'Add New User'}
          </DialogTitle>
          <CloseButton onClick={handleClose}>
            <FiX />
          </CloseButton>
        </DialogHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">{t('user.username') || 'Username'} *</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder={t('user.username.placeholder') || 'Enter username'}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">{t('user.email') || 'Email'} *</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder={t('user.email.placeholder') || 'user@example.com'}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">{t('user.password') || 'Password'} *</Label>
            <PasswordInputWrapper>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder={t('user.password.placeholder') || 'Enter password'}
                minLength="6"
              />
              <TogglePasswordButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? t('user.password.hide') || 'Hide password' : t('user.password.show') || 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </TogglePasswordButton>
            </PasswordInputWrapper>
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <ButtonGroup>
            <Button
              type="button"
              onClick={handleClose}
              disabled={loading}
            >
              <FiX /> {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              $variant="primary"
              disabled={loading || !formData.username || !formData.email || !formData.password}
            >
              {loading ? (
                t('user.add.creating') || 'Creating...'
              ) : (
                <>
                  <FiUserPlus /> {t('user.add.create') || 'Create User'}
                </>
              )}
            </Button>
          </ButtonGroup>
        </Form>
      </DialogContent>
    </DialogOverlay>
  );
}

export default AddUserDialog;
