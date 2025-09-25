import React, { useState } from 'react';
import styled from 'styled-components';
import { FiServer, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f35 0%, #2d3748 100%);
  padding: 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url(https://4kwallpapers.com/images/wallpapers/minecraft-spring-to-3840x2160-21999.jpg);
    background-size: cover;
    background-position: center;
    opacity: 0.2;
    z-index: 0;
  }
`;

const LoginCard = styled.div`
  background: #2e3245;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  border: 1px solid #3a3f57;
  position: relative;
  z-index: 1;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const LogoIcon = styled.div`
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 10px;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #fff;
  margin-bottom: 5px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #a4aabc;
  font-size: 0.9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #a4aabc;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  color: #fff;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  &::placeholder {
    color: #6b7293;
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-top: 10px;
  border: 1px solid rgba(220, 38, 38, 0.3);
`;

const CredentialsNote = styled.div`
  margin-top: 20px;
  text-align: center;
  color: #6b7293;
  font-size: 0.9rem;
  padding: 10px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.error || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoIcon>
            <FiServer />
          </LogoIcon>
          <Title>{t('app.name')}</Title>
          <Subtitle>{t('login.subtitle')}</Subtitle>
        </Logo>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>{t('login.username')}</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.username.placeholder')}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('login.password')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.password.placeholder')}
              required
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading}>
            <FiLogIn />
            {loading ? t('login.loading') : t('login.button')}
          </Button>
        </Form>

        <CredentialsNote>
          {t('login.credentials.note')}
        </CredentialsNote>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
