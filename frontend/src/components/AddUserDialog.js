import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiX, FiUserPlus, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`;

const Overlay = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,.75);
  display:flex;align-items:center;justify-content:center;z-index:9999;
  animation:${fadeIn} .2s ease;padding:20px;
`;
const Modal = styled.div`
  background:#2e3245;border-radius:14px;padding:28px 32px;
  width:100%;max-width:440px;border:1px solid #3a3f57;
  box-shadow:0 20px 60px rgba(0,0,0,.5);
  animation:${slideUp} .25s ease;
`;
const Head = styled.div`
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #3a3f57;
`;
const Title = styled.h2`
  font-size:18px;font-weight:700;color:#fff;margin:0;
  display:flex;align-items:center;gap:10px;
`;
const CloseBtn = styled.button`
  background:none;border:none;color:#6b7293;cursor:pointer;padding:4px;
  display:flex;align-items:center;border-radius:6px;
  &:hover{color:#fff;background:#35394e;}
`;

const Field = styled.div`margin-bottom:16px;`;
const Label = styled.label`
  display:block;font-size:13px;font-weight:500;color:#a4aabc;margin-bottom:6px;
`;
const InputWrap = styled.div`
  display:flex;align-items:center;gap:10px;
  background:#1a1f35;border:1.5px solid ${p=>p.$focus?'#3b82f6':'#2a2f4a'};
  border-radius:9px;padding:0 14px;transition:border-color .2s;
`;
const IIcon = styled.span`color:#4b5268;font-size:15px;flex-shrink:0;`;
const Input = styled.input`
  flex:1;background:transparent;border:none;outline:none;
  color:#fff;font-size:14px;padding:11px 0;
  &::placeholder{color:#3a4060;}
`;
const ToggleBtn = styled.button`
  background:none;border:none;color:#4b5268;cursor:pointer;
  display:flex;align-items:center;padding:2px;
  &:hover{color:#a4aabc;}
`;

const ErrBox = styled.div`
  background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);
  border-radius:8px;padding:10px 13px;margin-bottom:14px;
  display:flex;align-items:center;gap:8px;color:#f87171;font-size:13px;
`;
const OkBox = styled.div`
  background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);
  border-radius:8px;padding:10px 13px;margin-bottom:14px;
  display:flex;align-items:center;gap:8px;color:#10b981;font-size:13px;
`;

const BtnRow = styled.div`
  display:flex;justify-content:flex-end;gap:10px;
  margin-top:22px;padding-top:16px;border-top:1px solid #3a3f57;
`;
const CancelBtn = styled.button`
  padding:9px 18px;background:#35394e;color:#a4aabc;border:none;border-radius:8px;
  cursor:pointer;font-size:14px;transition:all .2s;
  &:hover{background:#3d4260;color:#fff;}
`;
const SubmitBtn = styled.button`
  padding:9px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;
  cursor:pointer;font-size:14px;font-weight:500;
  display:flex;align-items:center;gap:7px;transition:all .2s;
  &:hover:not(:disabled){background:#2563eb;}
  &:disabled{opacity:.5;cursor:not-allowed;}
`;

function AddUserDialog({ isOpen, onClose, onUserAdded }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [focus, setFocus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setForm({ username: '', email: '', password: '' });
    setError(''); setSuccess(''); setFocus(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Wszystkie pola są wymagane'); return;
    }
    if (form.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Użytkownik utworzony!');
      toast.success(`Użytkownik "${form.username}" dodany`);
      if (onUserAdded) onUserAdded();
      setTimeout(() => { reset(); onClose(); }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd tworzenia użytkownika';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const F = (field) => ({
    value: form[field],
    onChange: handleChange(field),
    onFocus: () => setFocus(field),
    onBlur: () => setFocus(null),
  });

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Head>
          <Title><FiUserPlus size={18} /> Nowy użytkownik</Title>
          <CloseBtn onClick={handleClose}><FiX size={20} /></CloseBtn>
        </Head>

        {error && <ErrBox><FiAlertCircle size={15} /> {error}</ErrBox>}
        {success && <OkBox><FiCheck size={15} /> {success}</OkBox>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <Field>
            <Label>Nazwa użytkownika *</Label>
            <InputWrap $focus={focus === 'username'}>
              <IIcon><FiUser size={15} /></IIcon>
              <Input type="text" placeholder="np. jankowalski" {...F('username')} />
            </InputWrap>
          </Field>

          <Field>
            <Label>Adres email *</Label>
            <InputWrap $focus={focus === 'email'}>
              <IIcon><FiMail size={15} /></IIcon>
              <Input type="email" placeholder="jan@example.com" {...F('email')} />
            </InputWrap>
          </Field>

          <Field>
            <Label>Hasło * (min. 6 znaków)</Label>
            <InputWrap $focus={focus === 'password'}>
              <IIcon><FiLock size={15} /></IIcon>
              <Input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange('password')}
                onFocus={() => setFocus('password')}
                onBlur={() => setFocus(null)}
              />
              <ToggleBtn type="button" onClick={() => setShowPwd(s => !s)} tabIndex={-1}>
                {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </ToggleBtn>
            </InputWrap>
          </Field>

          <BtnRow>
            <CancelBtn type="button" onClick={handleClose}>Anuluj</CancelBtn>
            <SubmitBtn type="submit" disabled={loading}>
              {loading ? 'Tworzenie...' : <><FiCheck size={14} /> Utwórz</>}
            </SubmitBtn>
          </BtnRow>
        </form>
      </Modal>
    </Overlay>
  );
}

export default AddUserDialog;
