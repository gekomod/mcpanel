import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  FiServer, FiPlay, FiStopCircle, FiRefreshCw, FiPlus,
  FiSettings, FiTrash2, FiAlertCircle, FiDownload,
  FiCheckCircle, FiUsers, FiUserPlus, FiCpu, FiHardDrive,
  FiTerminal, FiFolder, FiPackage, FiClock, FiZap,
  FiWifi, FiWifiOff
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import AddServer from './AddServer';
import AddUserDialog from './AddUserDialog';
import { useLanguage } from '../context/LanguageContext';

// ─── animations ────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

// ─── styled ────────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 20px;
  color: #a4aabc;
  animation: ${fadeIn} 0.3s ease;
`;
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;
const PageTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;
const BtnGroup = styled.div`display: flex; gap: 10px; flex-wrap: wrap;`;
const Btn = styled.button`
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  background: ${p => p.$secondary ? '#35394e' : '#3b82f6'};
  color: white;
  border: none; border-radius: 8px; cursor: pointer;
  font-size: 14px; font-weight: 500;
  transition: background 0.2s, transform 0.1s;
  &:hover { background: ${p => p.$secondary ? '#3d4260' : '#2563eb'}; }
  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// stats
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;
const StatCard = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #3a3f57;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: ${fadeIn} 0.3s ease;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
`;
const StatLeft = styled.div``;
const StatLabel = styled.div`font-size: 13px; color: #a4aabc; margin-bottom: 6px;`;
const StatValue = styled.div`font-size: 30px; font-weight: 700; color: #fff;`;
const StatSub = styled.div`font-size: 12px; color: #6b7293; margin-top: 3px;`;
const StatIcon = styled.div`
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`;

// server list
const Card = styled.div`
  background: #2e3245;
  border-radius: 10px;
  border: 1px solid #3a3f57;
  overflow: hidden;
  margin-bottom: 24px;
`;
const CardHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #3a3f57;
  display: flex; justify-content: space-between; align-items: center;
`;
const CardTitle = styled.div`
  font-size: 15px; font-weight: 600; color: #fff;
  display: flex; align-items: center; gap: 8px;
`;
const RefreshBtn = styled.button`
  background: none; border: none; color: #6b7293;
  cursor: pointer; padding: 6px; border-radius: 6px;
  display: flex; align-items: center;
  transition: color 0.2s, background 0.2s;
  &:hover { color: #fff; background: #35394e; }
`;
const SpinIcon = styled.span`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;
`;

const ServerItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #3a3f57;
  transition: background 0.15s;
  cursor: pointer;
  &:last-child { border-bottom: none; }
  &:hover { background: #222b43; }
`;
const ServerMain = styled.div`flex: 1; min-width: 0;`;
const ServerNameRow = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
`;
const ServerName = styled.span`
  font-size: 15px; font-weight: 600; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const StatusBadge = styled.span`
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  background: ${p => ({
    running: 'rgba(16,185,129,0.2)',
    stopped: 'rgba(248,113,113,0.2)',
    starting: 'rgba(251,191,36,0.2)',
    stopping: 'rgba(251,191,36,0.2)',
    restarting: 'rgba(99,102,241,0.2)',
    downloading: 'rgba(59,130,246,0.2)',
    error: 'rgba(239,68,68,0.2)',
  }[p.$status] || 'rgba(107,114,128,0.2)')};
  color: ${p => ({
    running: '#10b981',
    stopped: '#f87171',
    starting: '#fbbf24',
    stopping: '#fbbf24',
    restarting: '#818cf8',
    downloading: '#60a5fa',
    error: '#ef4444',
  }[p.$status] || '#9ca3af')};
  ${p => ['starting','stopping','restarting','downloading'].includes(p.$status) && css`
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
`;
const PingDot = styled.span`
  width: 8px; height: 8px; border-radius: 50%;
  background: ${p => p.$online ? '#10b981' : '#4b5268'};
  display: inline-block; flex-shrink: 0;
`;
const ServerMeta = styled.div`
  display: flex; align-items: center; gap: 14px;
  font-size: 12px; color: #6b7293; flex-wrap: wrap;
`;
const MetaItem = styled.span`
  display: flex; align-items: center; gap: 4px;
`;
const ActionGroup = styled.div`
  display: flex; gap: 6px; align-items: center;
  flex-shrink: 0; margin-left: 14px;
`;
const IconBtn = styled.button`
  width: 34px; height: 34px;
  border: none; border-radius: 7px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; transition: background 0.2s, color 0.2s;
  background: ${p => ({
    start: 'rgba(16,185,129,0.15)',
    stop: 'rgba(248,113,113,0.15)',
    restart: 'rgba(251,191,36,0.15)',
    settings: 'rgba(107,114,128,0.15)',
    delete: 'rgba(239,68,68,0.12)',
    console: 'rgba(59,130,246,0.15)',
    files: 'rgba(139,92,246,0.15)',
  }[p.$variant] || '#35394e')};
  color: ${p => ({
    start: '#10b981',
    stop: '#f87171',
    restart: '#fbbf24',
    settings: '#9ca3af',
    delete: '#ef4444',
    console: '#60a5fa',
    files: '#a78bfa',
  }[p.$variant] || '#a4aabc')};
  &:hover:not(:disabled) {
    filter: brightness(1.3);
    transform: scale(1.07);
  }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

// empty state
const Empty = styled.div`
  text-align: center; padding: 60px 20px; color: #6b7293;
`;
const EmptyIcon = styled.div`font-size: 48px; margin-bottom: 16px; opacity: 0.4;`;
const EmptyText = styled.div`font-size: 16px; margin-bottom: 20px;`;

// quick actions
const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px 20px;
`;
const QuickBtn = styled.button`
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px; border-radius: 10px;
  background: #35394e; border: 1px solid #3a3f57;
  color: #a4aabc; cursor: pointer; font-size: 13px; font-weight: 500;
  transition: all 0.2s;
  &:hover { background: #3d4260; color: #fff; transform: translateY(-2px); }
  svg { font-size: 20px; }
`;

// Confirm dialog
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; animation: ${fadeIn} 0.2s ease;
`;
const Modal = styled.div`
  background: #2e3245; border-radius: 12px; padding: 28px 32px;
  border: 1px solid #3a3f57; max-width: 440px; width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
`;
const ModalTitle = styled.div`
  font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 12px;
  display: flex; align-items: center; gap: 10px;
`;
const ModalText = styled.div`color: #a4aabc; margin-bottom: 24px; line-height: 1.5;`;
const ModalBtns = styled.div`display: flex; gap: 12px; justify-content: flex-end;`;

// ─── helpers ───────────────────────────────────────────────────────────────
const statusLabel = {
  running: 'URUCHOMIONY', stopped: 'ZATRZYMANY',
  starting: 'URUCHAMIANIE...', stopping: 'ZATRZYMYWANIE...',
  restarting: 'RESTARTOWANIE...', downloading: 'POBIERANIE...',
  error: 'BŁĄD',
};

function ConfirmModal({ message, title, onConfirm, onCancel }) {
  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={e => e.stopPropagation()}>
        <ModalTitle><FiAlertCircle color="#f87171" />{title || 'Potwierdź'}</ModalTitle>
        <ModalText>{message}</ModalText>
        <ModalBtns>
          <Btn $secondary onClick={onCancel}>Anuluj</Btn>
          <Btn style={{ background: '#dc2626' }} onClick={onConfirm}>Usuń</Btn>
        </ModalBtns>
      </Modal>
    </Overlay>
  );
}

// ─── main component ────────────────────────────────────────────────────────
function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverSizes, setServerSizes] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [showAddServer, setShowAddServer] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const navigate = useNavigate();
  const { t } = useLanguage();
  const pollRef = useRef(null);

  const fetchServers = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get('/servers');
      setServers(res.data || []);
    } catch {
      if (!silent) toast.error('Nie udało się pobrać listy serwerów');
    } finally {
      if (!silent) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Pobierz rozmiary w tle (nie blokują renderu)
  const fetchSizes = useCallback(async (list) => {
    for (const s of list) {
      try {
        const res = await api.get(`/servers/${s.id}/size`);
        setServerSizes(prev => ({ ...prev, [s.id]: res.data.size_gb || 0 }));
      } catch { /* ignoruj */ }
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  useEffect(() => {
    if (servers.length > 0) fetchSizes(servers);
  }, [servers, fetchSizes]);

  // Auto-refresh co 10s
  useEffect(() => {
    pollRef.current = setInterval(() => fetchServers(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchServers]);

  const handleAction = useCallback(async (serverId, action) => {
    setActionLoading(prev => ({ ...prev, [`${serverId}_${action}`]: true }));
    const labels = { start: 'Uruchamianie', stop: 'Zatrzymywanie', restart: 'Restartowanie' };
    const toastId = toast.loading(`${labels[action] || action}...`);
    try {
      await api.post(`/servers/${serverId}/${action}`);
      toast.update(toastId, {
        render: `✅ Serwer ${action === 'start' ? 'uruchomiony' : action === 'stop' ? 'zatrzymany' : 'zrestartowany'}`,
        type: 'success', isLoading: false, autoClose: 3000,
      });
      // Optymistyczna aktualizacja statusu
      const nextStatus = { start: 'starting', stop: 'stopping', restart: 'restarting' }[action];
      setServers(prev => prev.map(s => s.id === serverId ? { ...s, status: nextStatus } : s));
      // Odśwież po 4s
      setTimeout(() => fetchServers(true), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Nieznany błąd';
      toast.update(toastId, { render: `❌ ${msg}`, type: 'error', isLoading: false, autoClose: 5000 });
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[`${serverId}_${action}`]; return n; });
    }
  }, [fetchServers]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    const toastId = toast.loading('Usuwanie serwera...');
    try {
      await api.delete(`/servers/${id}`);
      toast.update(toastId, { render: '✅ Serwer usunięty', type: 'success', isLoading: false, autoClose: 3000 });
      setServers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd usuwania';
      toast.update(toastId, { render: `❌ ${msg}`, type: 'error', isLoading: false, autoClose: 5000 });
    }
  }, [confirmDelete]);

  const isLoading = (serverId, action) => actionLoading[`${serverId}_${action}`];
  const anyLoading = (serverId) => Object.keys(actionLoading).some(k => k.startsWith(`${serverId}_`));

  const running = servers.filter(s => s.status === 'running').length;
  const stopped = servers.filter(s => s.status === 'stopped').length;
  const totalPlayers = servers.reduce((a, s) => a + (s.player_count || 0), 0);
  const totalSize = Object.values(serverSizes).reduce((a, v) => a + v, 0);

  if (loading) {
    return (
      <Page>
        <Row><PageTitle><FiServer /> Pulpit</PageTitle></Row>
        <StatsGrid>
          {[0,1,2,3].map(i => <StatCard key={i} style={{ opacity: 0.4 }}><StatLeft><StatLabel>Ładowanie...</StatLabel><StatValue>—</StatValue></StatLeft></StatCard>)}
        </StatsGrid>
      </Page>
    );
  }

  return (
    <Page>
      <Row>
        <PageTitle><FiServer /> Pulpit</PageTitle>
        <BtnGroup>
          <Btn $secondary onClick={() => setShowAddUser(true)}>
            <FiUserPlus /> Dodaj użytkownika
          </Btn>
          <Btn onClick={() => setShowAddServer(true)}>
            <FiPlus /> Nowy serwer
          </Btn>
        </BtnGroup>
      </Row>

      {/* Statystyki */}
      <StatsGrid>
        <StatCard>
          <StatLeft>
            <StatLabel>Wszystkie serwery</StatLabel>
            <StatValue>{servers.length}</StatValue>
            <StatSub>zarejestrowane</StatSub>
          </StatLeft>
          <StatIcon $bg="rgba(59,130,246,0.15)" $color="#3b82f6"><FiServer /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLeft>
            <StatLabel>Uruchomione</StatLabel>
            <StatValue>{running}</StatValue>
            <StatSub>aktywne</StatSub>
          </StatLeft>
          <StatIcon $bg="rgba(16,185,129,0.15)" $color="#10b981"><FiCheckCircle /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLeft>
            <StatLabel>Zatrzymane</StatLabel>
            <StatValue>{stopped}</StatValue>
            <StatSub>nieaktywne</StatSub>
          </StatLeft>
          <StatIcon $bg="rgba(248,113,113,0.15)" $color="#f87171"><FiStopCircle /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLeft>
            <StatLabel>Gracze online</StatLabel>
            <StatValue>{totalPlayers}</StatValue>
            <StatSub>na wszystkich serwerach</StatSub>
          </StatLeft>
          <StatIcon $bg="rgba(139,92,246,0.15)" $color="#8b5cf6"><FiUsers /></StatIcon>
        </StatCard>
        <StatCard>
          <StatLeft>
            <StatLabel>Zajęte miejsce</StatLabel>
            <StatValue>{totalSize.toFixed(1)}<span style={{ fontSize: 16, fontWeight: 400 }}> GB</span></StatValue>
            <StatSub>łącznie</StatSub>
          </StatLeft>
          <StatIcon $bg="rgba(251,191,36,0.15)" $color="#fbbf24"><FiHardDrive /></StatIcon>
        </StatCard>
      </StatsGrid>

      {/* Lista serwerów */}
      <Card>
        <CardHeader>
          <CardTitle><FiServer /> Serwery ({servers.length})</CardTitle>
          <RefreshBtn onClick={() => fetchServers()} title="Odśwież">
            {refreshing ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiRefreshCw />}
          </RefreshBtn>
        </CardHeader>

        {servers.length === 0 ? (
          <Empty>
            <EmptyIcon><FiServer /></EmptyIcon>
            <EmptyText>Brak serwerów. Utwórz pierwszy!</EmptyText>
            <Btn onClick={() => setShowAddServer(true)}><FiPlus /> Nowy serwer</Btn>
          </Empty>
        ) : (
          servers.map(server => {
            const st = server.status;
            const isRunning = st === 'running';
            const inTransition = ['starting', 'stopping', 'restarting', 'downloading'].includes(st);
            const busy = anyLoading(server.id) || inTransition;
            const size = serverSizes[server.id];

            return (
              <ServerItem key={server.id} onClick={() => navigate(`/servers/${server.id}`)}>
                <ServerMain>
                  <ServerNameRow>
                    <PingDot $online={isRunning} />
                    <ServerName>{server.name}</ServerName>
                    <StatusBadge $status={st}>{statusLabel[st] || st}</StatusBadge>
                  </ServerNameRow>
                  <ServerMeta>
                    <MetaItem><FiCpu style={{ fontSize: 11 }} />{(server.type || 'java').toUpperCase()} {server.version}</MetaItem>
                    <MetaItem>Port: {server.port}</MetaItem>
                    <MetaItem><FiUsers style={{ fontSize: 11 }} />{server.player_count || 0}/{server.max_players || 20}</MetaItem>
                    {size != null && <MetaItem><FiHardDrive style={{ fontSize: 11 }} />{size.toFixed(1)} GB</MetaItem>}
                    {server.address && <MetaItem><FiWifi style={{ fontSize: 11 }} />{server.address}</MetaItem>}
                  </ServerMeta>
                </ServerMain>

                <ActionGroup onClick={e => e.stopPropagation()}>
                  <IconBtn $variant="console" title="Konsola" onClick={() => navigate(`/servers/${server.id}/console`)}>
                    <FiTerminal />
                  </IconBtn>
                  <IconBtn $variant="files" title="Pliki" onClick={() => navigate(`/servers/${server.id}/files`)}>
                    <FiFolder />
                  </IconBtn>
                  <IconBtn $variant="start" title="Uruchom"
                    onClick={() => handleAction(server.id, 'start')}
                    disabled={isRunning || busy}>
                    {isLoading(server.id, 'start') ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiPlay />}
                  </IconBtn>
                  <IconBtn $variant="stop" title="Zatrzymaj"
                    onClick={() => handleAction(server.id, 'stop')}
                    disabled={!isRunning || busy}>
                    {isLoading(server.id, 'stop') ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiStopCircle />}
                  </IconBtn>
                  <IconBtn $variant="restart" title="Restartuj"
                    onClick={() => handleAction(server.id, 'restart')}
                    disabled={!isRunning || busy}>
                    {isLoading(server.id, 'restart') ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiRefreshCw />}
                  </IconBtn>
                  <IconBtn $variant="settings" title="Ustawienia"
                    onClick={() => navigate(`/servers/${server.id}/settings`)}>
                    <FiSettings />
                  </IconBtn>
                  <IconBtn $variant="delete" title="Usuń"
                    disabled={busy}
                    onClick={() => setConfirmDelete({ id: server.id, name: server.name })}>
                    <FiTrash2 />
                  </IconBtn>
                </ActionGroup>
              </ServerItem>
            );
          })
        )}
      </Card>

      {/* Szybkie akcje */}
      <Card>
        <CardHeader><CardTitle><FiZap /> Szybkie akcje</CardTitle></CardHeader>
        <QuickGrid>
          <QuickBtn onClick={() => setShowAddServer(true)}>
            <FiPlus /> Nowy serwer
          </QuickBtn>
          <QuickBtn onClick={() => {
            const stopped = servers.filter(s => s.status === 'stopped');
            if (!stopped.length) { toast.info('Brak zatrzymanych serwerów'); return; }
            stopped.forEach(s => handleAction(s.id, 'start'));
          }}>
            <FiPlay /> Start wszystkich
          </QuickBtn>
          <QuickBtn onClick={() => {
            const running = servers.filter(s => s.status === 'running');
            if (!running.length) { toast.info('Brak uruchomionych serwerów'); return; }
            running.forEach(s => handleAction(s.id, 'restart'));
          }}>
            <FiRefreshCw /> Restart wszystkich
          </QuickBtn>
          <QuickBtn onClick={() => {
            const running = servers.filter(s => s.status === 'running');
            if (!running.length) { toast.info('Brak uruchomionych serwerów'); return; }
            running.forEach(s => handleAction(s.id, 'stop'));
          }}>
            <FiStopCircle /> Stop wszystkich
          </QuickBtn>
          <QuickBtn onClick={() => navigate('/admin/users')}>
            <FiUsers /> Zarządzaj użytkownikami
          </QuickBtn>
          <QuickBtn onClick={() => navigate('/admin/agents')}>
            <FiCpu /> Agenci
          </QuickBtn>
        </QuickGrid>
      </Card>

      {/* Modals */}
      {confirmDelete && (
        <ConfirmModal
          title="Usuń serwer"
          message={`Czy na pewno chcesz usunąć serwer "${confirmDelete.name}"? Tej operacji nie można cofnąć.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      <AddServer isOpen={showAddServer} onClose={() => setShowAddServer(false)}
        onServerAdded={() => { toast.success('Serwer utworzony!'); fetchServers(); }} />
      <AddUserDialog isOpen={showAddUser} onClose={() => setShowAddUser(false)}
        onUserAdded={() => toast.success('Użytkownik dodany!')} />
    </Page>
  );
}

export default Dashboard;
