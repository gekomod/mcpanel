import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiServer, FiLogIn, FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const float = keyframes`
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const BG = styled.div`
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  position: relative;
  background: linear-gradient(135deg, #0f1524 0%, #1a2040 50%, #0f1524 100%);
  &::before {
    content: ''; position: absolute; inset: 0;
    background-image: url(https://4kwallpapers.com/images/wallpapers/minecraft-spring-to-3840x2160-21999.jpg);
    background-size: cover; background-position: center;
    opacity: 0.12; z-index: 0;
  }
`;

const Card = styled.div`
  background: rgba(30, 36, 58, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 44px 40px;
  width: 100%; max-width: 420px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.05);
  position: relative; z-index: 1;
  animation: ${fadeUp} 0.5s ease;
`;

const LogoWrap = styled.div`text-align: center; margin-bottom: 32px;`;
const LogoCircle = styled.div`
  width: 64px; height: 64px; border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; color: white; margin: 0 auto 14px;
  animation: ${float} 3s ease-in-out infinite;
  box-shadow: 0 8px 24px rgba(59,130,246,0.4);
`;
const AppTitle = styled.h1`
  font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 4px;
`;
const AppSub = styled.p`color: #6b7293; font-size: 14px; margin: 0;`;

const Field = styled.div`margin-bottom: 18px;`;
const Label = styled.label`
  display: block; font-size: 13px; font-weight: 500;
  color: #a4aabc; margin-bottom: 7px;
`;
const InputWrap = styled.div`
  display: flex; align-items: center; gap: 10px;
  background: #1a1f35; border: 1.5px solid ${p => p.$err ? '#ef4444' : p.$focused ? '#3b82f6' : '#2a2f4a'};
  border-radius: 9px; padding: 0 14px;
  transition: border-color 0.2s;
`;
const InputIcon = styled.span`color: ${p => p.$focused ? '#3b82f6' : '#4b5268'}; font-size: 16px; flex-shrink: 0; transition: color 0.2s;`;
const Input = styled.input`
  flex: 1; background: transparent; border: none; outline: none;
  color: #fff; font-size: 15px; padding: 12px 0;
  &::placeholder { color: #3a4060; }
`;
const ToggleBtn = styled.button`
  background: none; border: none; color: #4b5268;
  cursor: pointer; padding: 4px; display: flex; align-items: center;
  &:hover { color: #a4aabc; }
`;

const ErrorBox = styled.div`
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px; padding: 11px 14px; margin-bottom: 16px;
  display: flex; align-items: center; gap: 9px;
  color: #f87171; font-size: 13.5px;
`;

const SubmitBtn = styled.button`
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white; border: none; border-radius: 9px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  transition: all 0.2s; margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(59,130,246,0.35);
  &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Hint = styled.div`
  text-align: center; color: #4b5268; font-size: 12.5px; margin-top: 10px;
  padding: 10px; border-radius: 7px;
  background: rgba(59,130,246,0.06);
  border: 1px solid rgba(59,130,246,0.12);
`;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Uzupełnij wszystkie pola');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      login(res.data.access_token, { ...res.data.user, session_id: res.data.session_id });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd logowania';
      if (err.response?.status === 423) {
        setError('Konto tymczasowo zablokowane. Spróbuj ponownie za 30 minut.');
      } else if (err.response?.status === 401) {
        setError('Nieprawidłowa nazwa użytkownika lub hasło');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BG>
      <Card>
        <LogoWrap>
          <LogoCircle><FiServer /></LogoCircle>
          <AppTitle>MCPanel</AppTitle>
          <AppSub>Panel zarządzania serwerami Minecraft</AppSub>
        </LogoWrap>

        <form onSubmit={handleSubmit} autoComplete="on">
          <Field>
            <Label>Nazwa użytkownika</Label>
            <InputWrap $focused={focusedField === 'user'} $err={error && !loading}>
              <InputIcon $focused={focusedField === 'user'}><FiUser /></InputIcon>
              <Input
                type="text" value={username} autoComplete="username"
                onChange={e => setUsername(e.target.value)}
                onFocus={() => { setFocusedField('user'); setError(''); }}
                onBlur={() => setFocusedField(null)}
                placeholder="Wpisz nazwę użytkownika"
              />
            </InputWrap>
          </Field>

          <Field>
            <Label>Hasło</Label>
            <InputWrap $focused={focusedField === 'pwd'} $err={error && !loading}>
              <InputIcon $focused={focusedField === 'pwd'}><FiLock /></InputIcon>
              <Input
                type={showPwd ? 'text' : 'password'} value={password}
                autoComplete="current-password"
                onChange={e => setPassword(e.target.value)}
                onFocus={() => { setFocusedField('pwd'); setError(''); }}
                onBlur={() => setFocusedField(null)}
                placeholder="Wpisz hasło"
              />
              <ToggleBtn type="button" onClick={() => setShowPwd(s => !s)} tabIndex={-1}>
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </ToggleBtn>
            </InputWrap>
          </Field>

          {error && (
            <ErrorBox>
              <FiAlertCircle style={{ flexShrink: 0 }} />
              {error}
            </ErrorBox>
          )}

          <SubmitBtn type="submit" disabled={loading}>
            <FiLogIn />
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </SubmitBtn>
        </form>

        <Hint>Domyślne dane: <strong style={{ color: '#a4aabc' }}>admin / admin</strong></Hint>
      </Card>
    </BG>
  );
}

export default Login;
