import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  FiPlay, FiStopCircle, FiRefreshCw, FiSettings, FiCopy,
  FiPower, FiTerminal, FiDownload, FiCpu, FiHardDrive,
  FiServer, FiUsers, FiActivity, FiFolder, FiBox,
  FiUser, FiAlertTriangle, FiAlertCircle, FiInfo,
  FiClock, FiWifi, FiShield, FiZap, FiDatabase, FiArrowUp, FiCheckCircle
} from 'react-icons/fi';
import { FaWrench } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProgressBar from './ProgressBar';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

// ─── animations ─────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const spin   = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;
const pulse  = keyframes`0%,100%{opacity:1}50%{opacity:.5}`;

// ─── primitives ──────────────────────────────────────────────────────────────
const Page = styled.div`padding:15px 20px;color:#a4aabc;animation:${fadeIn} .3s ease;`;

const Tabs = styled.div`
  display:flex;background:#2e3245;border-radius:8px;
  padding:6px;margin-bottom:16px;gap:4px;overflow-x:auto;
  &::-webkit-scrollbar{height:3px}
`;
const Tab = styled.div`
  padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:500;
  font-size:13px;color:${p=>p.$active?'#fff':'#a4aabc'};
  background:${p=>p.$active?'#3b82f6':'transparent'};
  display:flex;align-items:center;gap:6px;white-space:nowrap;
  transition:all .2s;
  &:hover{background:${p=>p.$active?'#3b82f6':'#35394e'};color:#fff;}
`;

// action bar
const ActionBar = styled.div`
  display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;
`;
const ActionBtn = styled.button`
  display:flex;align-items:center;gap:7px;padding:10px 18px;
  border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;
  transition:all .2s;
  background:${p=>({
    start:'rgba(16,185,129,.15)',stop:'rgba(248,113,113,.15)',
    restart:'rgba(251,191,36,.15)',neutral:'#35394e',danger:'rgba(239,68,68,.15)'
  }[p.$v]||'#35394e')};
  color:${p=>({
    start:'#10b981',stop:'#f87171',restart:'#fbbf24',neutral:'#a4aabc',danger:'#ef4444'
  }[p.$v]||'#a4aabc')};
  border:1px solid ${p=>({
    start:'rgba(16,185,129,.3)',stop:'rgba(248,113,113,.3)',
    restart:'rgba(251,191,36,.3)',neutral:'#3a3f57',danger:'rgba(239,68,68,.3)'
  }[p.$v]||'#3a3f57')};
  &:hover:not(:disabled){filter:brightness(1.2);transform:translateY(-1px);}
  &:disabled{opacity:.4;cursor:not-allowed;transform:none;}
`;
const SpinIcon = styled.span`display:inline-flex;animation:${spin} .8s linear infinite;`;

// layout
const Grid = styled.div`
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px;
  @media(max-width:1100px){grid-template-columns:1fr;}
`;
const Col = styled.div`display:flex;flex-direction:column;gap:18px;`;

// card
const Card = styled.div`
  background:#2e3245;border-radius:10px;border:1px solid #3a3f57;overflow:hidden;
`;
const CardHead = styled.div`
  padding:14px 18px;border-bottom:1px solid #3a3f57;
  display:flex;justify-content:space-between;align-items:center;
`;
const CardTitle = styled.span`font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;`;
const CardBody = styled.div`padding:18px;`;

// status badge
const StatusBadge = styled.span`
  padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;
  text-transform:uppercase;letter-spacing:.05em;
  background:${p=>({
    running:'rgba(16,185,129,.2)',stopped:'rgba(248,113,113,.2)',
    starting:'rgba(251,191,36,.2)',stopping:'rgba(251,191,36,.2)',
    restarting:'rgba(99,102,241,.2)',downloading:'rgba(59,130,246,.2)',
    error:'rgba(239,68,68,.2)'
  }[p.$s]||'rgba(107,114,128,.2)')};
  color:${p=>({
    running:'#10b981',stopped:'#f87171',starting:'#fbbf24',
    stopping:'#fbbf24',restarting:'#818cf8',downloading:'#60a5fa',error:'#ef4444'
  }[p.$s]||'#9ca3af')};
  ${p=>['starting','stopping','restarting','downloading'].includes(p.$s) && css`animation:${pulse} 1.5s ease infinite;`}
`;

// info grid
const InfoGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;`;
const InfoItem = styled.div`
  background:#35394e;border-radius:8px;padding:12px 14px;
`;
const InfoLabel = styled.div`font-size:11px;color:#6b7293;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;`;
const InfoValue = styled.div`
  font-size:14px;color:#fff;font-weight:500;
  display:flex;align-items:center;gap:8px;word-break:break-all;
`;
const CopyBtn = styled.button`
  background:none;border:none;color:#6b7293;cursor:pointer;padding:2px;
  display:flex;align-items:center;flex-shrink:0;
  &:hover{color:#fff;}
`;

// resource bars
const ResRow = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:12px;&:last-child{margin-bottom:0}`;
const ResName = styled.span`font-size:13px;color:#a4aabc;min-width:60px;`;
const ResBar = styled.div`flex:1;height:6px;background:#35394e;border-radius:3px;overflow:hidden;`;
const ResFill = styled.div`
  height:100%;border-radius:3px;transition:width .5s ease;
  width:${p=>p.$pct||0}%;
  background:${p=>p.$color||'#3b82f6'};
`;
const ResVal = styled.span`font-size:13px;color:#fff;min-width:55px;text-align:right;font-weight:500;`;

// mini console
const MiniConsole = styled.div`
  background:#0d1117;border-radius:8px;padding:12px;
  height:220px;overflow-y:auto;font-family:monospace;font-size:12px;line-height:1.5;
  &::-webkit-scrollbar{width:5px;}
  &::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px;}
`;
const LogLine = styled.div`
  color:${p=>({ERROR:'#f87171',WARN:'#fbbf24',INFO:'#60a5fa',JOIN:'#34d399',LEAVE:'#f87171',CMD:'#fbbf24'}[p.$t]||'#a4aabc')};
  margin-bottom:2px;word-break:break-all;
`;
const CmdRow = styled.div`display:flex;gap:8px;padding:8px 0 0;`;
const CmdInput = styled.input`
  flex:1;background:#1a1f35;border:1px solid #2a2f4a;border-radius:6px;
  color:#e6edf3;font-size:13px;padding:8px 12px;outline:none;font-family:monospace;
  &:focus{border-color:#3b82f6;}
  &:disabled{opacity:.4;cursor:not-allowed;}
`;
const CmdBtn = styled.button`
  padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:6px;
  cursor:pointer;font-size:13px;font-weight:500;white-space:nowrap;
  &:disabled{opacity:.4;cursor:not-allowed;}
  &:hover:not(:disabled){background:#2563eb;}
`;

// quick tasks
const TaskGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;padding:14px;`;
const TaskBtn = styled.button`
  display:flex;flex-direction:column;align-items:center;gap:7px;
  padding:14px 10px;border-radius:9px;border:1px solid #3a3f57;
  background:#35394e;color:#a4aabc;cursor:pointer;font-size:12px;font-weight:500;
  transition:all .2s;
  &:hover{background:#3d4260;color:#fff;transform:translateY(-2px);}
  &:disabled{opacity:.4;cursor:not-allowed;transform:none;}
  svg{font-size:18px;}
`;

// player list
const PlayerItem = styled.div`
  display:flex;align-items:center;gap:10px;padding:8px 0;
  border-bottom:1px solid #3a3f57;&:last-child{border-bottom:none;}
`;
const PlayerAvatar = styled.div`
  width:28px;height:28px;border-radius:6px;
  background:linear-gradient(135deg,#3b82f6,#6366f1);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:12px;font-weight:700;
`;

const AlertBanner = styled.div`
  display:flex;align-items:center;gap:10px;padding:12px 16px;
  background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);
  border-radius:8px;color:#fbbf24;font-size:13.5px;margin-bottom:16px;
`;

// ─── Update panel styles ──────────────────────────────────────────────────────
const UpdateCard = styled.div`
  background:#2e3245;border-radius:10px;border:1px solid #3a3f57;overflow:hidden;margin-bottom:18px;
`;
const UpdateHead = styled.div`
  padding:14px 18px;border-bottom:1px solid #3a3f57;
  display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;
`;
const UpdateTitle = styled.span`font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;`;
const UpdateBody = styled.div`padding:16px 18px;`;
const UpdateRow = styled.div`display:flex;align-items:center;gap:12px;flex-wrap:wrap;`;
const VerBox = styled.div`
  background:#1a1f35;border-radius:8px;padding:10px 16px;flex:1;min-width:140px;
`;
const VerLabel = styled.div`font-size:11px;color:#6b7293;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;`;
const VerVal = styled.div`font-size:16px;font-weight:700;color:#fff;`;
const Arrow = styled.div`font-size:22px;color:#3b82f6;font-weight:700;`;
const UpdateBtn = styled.button`
  display:flex;align-items:center;gap:7px;padding:10px 20px;
  background:${p=>p.$disabled?'#35394e':'linear-gradient(135deg,#3b82f6,#6366f1)'};
  color:${p=>p.$disabled?'#6b7293':'#fff'};
  border:none;border-radius:8px;cursor:${p=>p.$disabled?'not-allowed':'pointer'};
  font-size:14px;font-weight:600;white-space:nowrap;
  transition:all .2s;box-shadow:${p=>p.$disabled?'none':'0 4px 16px rgba(59,130,246,.35)'};
  &:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
  &:disabled{opacity:.5;}
`;
const CheckBtn = styled.button`
  display:flex;align-items:center;gap:6px;padding:8px 14px;
  background:#35394e;color:#a4aabc;border:1px solid #3a3f57;
  border-radius:8px;cursor:pointer;font-size:13px;
  &:hover{background:#3d4260;color:#fff;}
  &:disabled{opacity:.5;cursor:not-allowed;}
`;
const UpdateNote = styled.div`font-size:12px;color:#6b7293;margin-top:10px;line-height:1.5;`;
const UpToDate = styled.div`
  display:flex;align-items:center;gap:8px;
  color:#10b981;font-size:13px;font-weight:500;
`;

// ─── helpers ─────────────────────────────────────────────────────────────────
const ANSI = /\x1b\[[0-9;]*[mGKHF]/g;
const stripAnsi = s => s.replace(ANSI, '');

const classifyLog = (line) => {
  if (/\[ERROR|EXCEPTION|FATAL/i.test(line)) return 'ERROR';
  if (/\[WARN/i.test(line)) return 'WARN';
  if (/joined the game|logged in/i.test(line)) return 'JOIN';
  if (/left the game|lost connection|disconnected/i.test(line)) return 'LEAVE';
  if (line.startsWith('>')) return 'CMD';
  if (/\[INFO/i.test(line)) return 'INFO';
  return null;
};

// ─── Manual update form styled ───────────────────────────────────────────────
const ManualForm = styled.div`display:flex;flex-direction:column;gap:12px;`;
const ManualHint = styled.div`font-size:12px;color:#6b7293;line-height:1.5;margin-bottom:4px;`;
const ManualRow = styled.div`display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;`;
const ManualField = styled.div`display:flex;flex-direction:column;gap:5px;flex:1;min-width:160px;`;
const ManualLabel = styled.label`font-size:12px;color:#a4aabc;font-weight:500;`;
const ManualInput = styled.input`
  background:#1a1f35;border:1.5px solid #2a2f4a;border-radius:8px;
  color:#fff;font-size:13px;padding:8px 12px;outline:none;
  &:focus{border-color:#3b82f6;}
  &::placeholder{color:#4b5268;}
`;

function ManualUpdateSection({ serverId, server, onUpdateStarted }) {
  const [ver, setVer] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const autoUrl = ver
    ? `https://minecraft.azureedge.net/bin-linux/bedrock-server-${ver}.zip`
    : '';

  const start = async () => {
    const targetVer = ver.trim();
    const targetUrl = (url.trim() || autoUrl).trim();
    if (!targetVer) { toast.error('Wpisz numer wersji'); return; }
    if (!targetUrl) { toast.error('Brak URL do pobrania'); return; }
    if (targetVer === server.version) { toast.info('Serwer jest już na tej wersji'); return; }
    if (!window.confirm(
      `Zaktualizować "${server.name}" z ${server.version} → ${targetVer}?\n` +
      `URL: ${targetUrl}\n\n` +
      `Dane serwera (worlds/, server.properties) zostaną zachowane.`
    )) return;
    setBusy(true);
    try {
      await api.post(`/servers/${serverId}/update-bedrock`, {
        version: targetVer,
        download_url: targetUrl,
      });
      onUpdateStarted();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Błąd uruchamiania aktualizacji');
      setBusy(false);
    }
  };

  return (
    <ManualForm>
      <ManualHint>
        Kliknij „Sprawdź aktualizacje" aby automatycznie wykryć najnowszą wersję, lub wpisz wersję ręcznie poniżej.
        URL do ZIP zostanie wygenerowany automatycznie na podstawie numeru wersji.
        Przykład: <code style={{color:'#60a5fa'}}>1.21.62.01</code>
      </ManualHint>
      <ManualRow>
        <ManualField>
          <ManualLabel>Numer wersji *</ManualLabel>
          <ManualInput
            placeholder="np. 1.21.62.01"
            value={ver}
            onChange={e => setVer(e.target.value.trim())}
          />
        </ManualField>
        <ManualField>
          <ManualLabel>URL ZIP (opcjonalnie — auto z wersji)</ManualLabel>
          <ManualInput
            placeholder={autoUrl || 'https://minecraft.azureedge.net/bin-linux/...'}
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </ManualField>
        <UpdateBtn onClick={start} disabled={busy || !ver.trim()}>
          {busy ? <SpinIcon><FiRefreshCw size={14}/></SpinIcon> : <FiArrowUp size={14}/>}
          Aktualizuj ręcznie
        </UpdateBtn>
      </ManualRow>
      {ver && (
        <ManualHint style={{color:'#4b5268'}}>
          URL: {autoUrl}
        </ManualHint>
      )}
    </ManualForm>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
function ServerControl() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [server, setServer]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setAction]  = useState(null); // 'start'|'stop'|'restart'|'install'|null
  const [perf, setPerf]             = useState(null);
  const [diskGB, setDiskGB]         = useState(null);
  const [consoleLogs, setConsole]   = useState([]);
  const [consoleInput, setCmd]      = useState('');
  const [backups, setBackups]       = useState([]);
  const [hasFiles, setHasFiles]     = useState(false);
  const [downloadProg, setDlProg]   = useState(null);
  const [players, setPlayers]       = useState([]);

  // Bedrock update state
  const [latestBedrock, setLatestBedrock]   = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updating, setUpdating]             = useState(false);
  const [updateProg, setUpdateProg]         = useState(null);
  const updatePollRef = useRef(null);

  const consoleRef = useRef(null);
  const pollRef    = useRef(null);
  const perfRef    = useRef(null);
  const cmdHistory = useRef([]);
  const histIdx    = useRef(-1);

  // ── fetch helpers ──────────────────────────────────────────────────────────
  const fetchServer = useCallback(async () => {
    try {
      const r = await api.get(`/servers/${serverId}`);
      setServer(r.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [serverId]);

  const fetchPerf = useCallback(async () => {
    try {
      const r = await api.get(`/servers/${serverId}/performance`);
      setPerf(r.data);
    } catch { setPerf(null); }
  }, [serverId]);

  const fetchDisk = useCallback(async () => {
    try {
      const r = await api.get(`/servers/${serverId}/size`);
      setDiskGB(r.data.size_gb ?? 0);
    } catch { setDiskGB(0); }
  }, [serverId]);

  const fetchConsole = useCallback(async () => {
    if (!server || server.status !== 'running') return;
    try {
      const ep = server.type === 'bedrock'
        ? `/servers/${serverId}/realtime-output`
        : `/servers/${serverId}/logs`;
      const r = await api.get(ep);
      const raw = r.data?.logs || r.data?.output || '';
      const lines = stripAnsi(raw).split('\n').filter(Boolean).slice(-300);
      setConsole(lines);
      // scroll
      setTimeout(() => {
        if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }, 0);
    } catch { /* silent */ }
  }, [serverId, server]);

  const fetchBackups = useCallback(async () => {
    try {
      const r = await api.get(`/servers/${serverId}/backups`);
      setBackups(r.data.backups || []);
    } catch { setBackups([]); }
  }, [serverId]);

  const checkFiles = useCallback(async () => {
    try {
      const r = await api.get(`/servers/${serverId}/files/check`);
      setHasFiles(r.data.hasFiles || false);
    } catch { setHasFiles(false); }
  }, [serverId]);

  const checkDownload = useCallback(async () => {
    try {
      const r = await api.get(`/servers/${serverId}/download-progress`);
      setDlProg(r.data);
    } catch { /* silent */ }
  }, [serverId]);

  // ── initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchServer();
    fetchDisk();
    fetchBackups();
    checkFiles();
  }, [fetchServer, fetchDisk, fetchBackups, checkFiles]);

  // ── polling when running ───────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(pollRef.current);
    clearInterval(perfRef.current);
    if (server?.status === 'running') {
      fetchConsole();
      fetchPerf();
      pollRef.current = setInterval(fetchConsole, 2500);
      perfRef.current = setInterval(fetchPerf, 5000);
    } else {
      setConsole([]);
      setPerf(null);
    }
    return () => { clearInterval(pollRef.current); clearInterval(perfRef.current); };
  }, [server?.status, fetchConsole, fetchPerf]);

  // ── extract players from logs ──────────────────────────────────────────────
  useEffect(() => {
    const joined = new Set();
    consoleLogs.forEach(line => {
      // Bedrock: "Player Spawned: <nick> xuid: ..."
      const bj = line.match(/Player Spawned: (\S+)/);
      // Bedrock: "Player disconnected: <nick>," lub "Player disconnected: <nick> xuid"
      const bl = line.match(/Player disconnected: ([^,\s]+)/);
      // Java: "<nick> joined the game" / "<nick> logged in"
      const jm = line.match(/(\S+) joined the game|(\S+) logged in/);
      // Java: "<nick> left the game" / "<nick> lost connection"
      const lm = line.match(/(\S+) left the game|(\S+) lost connection/);

      if (bj) joined.add(bj[1]);
      if (bl) joined.delete(bl[1]);
      if (jm) joined.add(jm[1] || jm[2]);
      if (lm) joined.delete(lm[1] || lm[2]);
    });
    setPlayers([...joined]);
  }, [consoleLogs]);

  // ── server action ──────────────────────────────────────────────────────────
  const handleAction = async (action) => {
    setAction(action);
    const labels = { start: 'Uruchamianie', stop: 'Zatrzymywanie', restart: 'Restartowanie', install: 'Instalowanie' };
    const tid = toast.loading(`${labels[action] || action}...`);
    try {
      const endpoint = action === 'install'
        ? `/servers/${serverId}/install`
        : `/servers/${serverId}/${action}`;
      await api.post(endpoint);

      const nextStatus = { start: 'starting', stop: 'stopping', restart: 'restarting', install: 'downloading' }[action];
      setServer(prev => prev ? { ...prev, status: nextStatus } : prev);

      toast.update(tid, {
        render: `✅ ${labels[action]} zlecono`, type: 'success', isLoading: false, autoClose: 3000
      });

      // Poll aż zmieni status
      let attempts = 0;
      const pollStatus = setInterval(async () => {
        attempts++;
        try {
          const r = await api.get(`/servers/${serverId}`);
          const st = r.data.status;
          setServer(r.data);
          const targetOk = {
            start: st === 'running', stop: st === 'stopped',
            restart: st === 'running', install: r.data.has_files
          }[action];
          if (targetOk || attempts > 60) {
            clearInterval(pollStatus);
            setAction(null);
            if (action === 'install') { checkFiles(); checkDownload(); }
          }
        } catch { clearInterval(pollStatus); setAction(null); }
      }, 2500);

    } catch (err) {
      const msg = err.response?.data?.error || 'Nieznany błąd';
      toast.update(tid, { render: `❌ ${msg}`, type: 'error', isLoading: false, autoClose: 5000 });
      setAction(null);
    }
  };

  // ── send console command ───────────────────────────────────────────────────
  const sendCmd = async () => {
    const cmd = consoleInput.trim();
    if (!cmd || server?.status !== 'running') return;
    cmdHistory.current = [cmd, ...cmdHistory.current.slice(0, 49)];
    histIdx.current = -1;
    setCmd('');
    setConsole(prev => [...prev, `> ${cmd}`]);
    try {
      await api.post(`/servers/${serverId}/command`, { command: cmd });
      setTimeout(fetchConsole, 800);
    } catch (err) {
      setConsole(prev => [...prev, `[BŁĄD] ${err.response?.data?.error || 'Nie można wysłać komendy'}`]);
    }
  };

  const handleCmdKey = (e) => {
    if (e.key === 'Enter') { sendCmd(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx.current + 1, cmdHistory.current.length - 1);
      histIdx.current = next;
      setCmd(cmdHistory.current[next] || '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx.current - 1, -1);
      histIdx.current = next;
      setCmd(next < 0 ? '' : cmdHistory.current[next]);
    }
  };

  // ── backup ─────────────────────────────────────────────────────────────────
  const createBackup = async () => {
    const tid = toast.loading('Tworzenie backupu...');
    try {
      await api.post(`/servers/${serverId}/backups`);
      toast.update(tid, { render: '✅ Backup utworzony', type: 'success', isLoading: false, autoClose: 3000 });
      fetchBackups();
    } catch (err) {
      toast.update(tid, { render: `❌ ${err.response?.data?.error || 'Błąd backupu'}`, type: 'error', isLoading: false, autoClose: 5000 });
    }
  };

  // ── Bedrock update logic ───────────────────────────────────────────────────
  const checkUpdate = useCallback(async () => {
    setCheckingUpdate(true);
    setLatestBedrock(null);
    try {
      const r = await api.get('/bedrock/latest-version');
      setLatestBedrock(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Nie można sprawdzić wersji Bedrock');
    } finally {
      setCheckingUpdate(false);
    }
  }, []);

  const doUpdate = useCallback(async () => {
    if (!latestBedrock) return;
    const { version, download_url_linux } = latestBedrock;
    if (!window.confirm(
      `Zaktualizować serwer "${server.name}" z ${server.version} → ${version}?\n\n` +
      `• Serwer zostanie zatrzymany\n` +
      `• Dane (worlds/, server.properties) zostaną zachowane\n` +
      `• Po aktualizacji serwer pozostanie zatrzymany`
    )) return;

    setUpdating(true);
    setUpdateProg({ status: 'preparing', progress: 0, message: 'Rozpoczynanie aktualizacji...' });

    try {
      await api.post(`/servers/${serverId}/update-bedrock`, {
        version,
        download_url: download_url_linux,
      });

      // Poll postępu aktualizacji (ten sam endpoint co pobieranie)
      clearInterval(updatePollRef.current);
      updatePollRef.current = setInterval(async () => {
        try {
          const r = await api.get(`/servers/${serverId}/download-progress`);
          const prog = r.data;
          setUpdateProg(prog);

          if (prog.status === 'complete') {
            clearInterval(updatePollRef.current);
            setUpdating(false);
            setLatestBedrock(null);
            toast.success(`✅ Serwer zaktualizowany do wersji ${version}!`);
            fetchServer(); // odśwież — nowa wersja w bazie
          } else if (prog.status === 'error') {
            clearInterval(updatePollRef.current);
            setUpdating(false);
            toast.error(`❌ Błąd aktualizacji: ${prog.message}`);
          }
        } catch { /* silent */ }
      }, 1500);

      // Timeout bezpieczeństwa 10 minut
      setTimeout(() => {
        clearInterval(updatePollRef.current);
        setUpdating(prev => { if (prev) return false; return prev; });
      }, 600000);

    } catch (err) {
      setUpdating(false);
      setUpdateProg(null);
      toast.error(err.response?.data?.error || 'Błąd aktualizacji');
    }
  }, [latestBedrock, server, serverId, fetchServer]);

  // Cleanup update poll on unmount
  useEffect(() => () => clearInterval(updatePollRef.current), []);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Skopiowano!', { autoClose: 1500 });
  };

  // ── tabs ───────────────────────────────────────────────────────────────────
  const tabs = [
    { label: 'Przegląd', icon: FiActivity, path: null, active: true },
    { label: 'Konsola', icon: FiTerminal, path: `/servers/${serverId}/console` },
    { label: 'Pliki', icon: FiFolder, path: `/servers/${serverId}/files` },
    { label: 'Konfiguracja', icon: FiSettings, path: `/servers/${serverId}/settings` },
    { label: 'Pluginy', icon: FiBox, path: `/servers/${serverId}/plugins` },
    { label: 'Użytkownicy', icon: FiUser, path: `/servers/${serverId}/users` },
    { label: 'Backup', icon: FiDownload, path: `/servers/${serverId}/backups` },
  ];

  if (loading) return <Page><div style={{ color: '#6b7293', padding: 40, textAlign: 'center' }}>Ładowanie serwera...</div></Page>;
  if (!server) return <Page><div style={{ color: '#f87171', padding: 40 }}>Serwer nie znaleziony.</div></Page>;

  const isRunning = server.status === 'running';
  const isBusy = !!actionLoading;
  const inTransition = ['starting', 'stopping', 'restarting', 'downloading'].includes(server.status);

  return (
    <Page>
      {/* Tabs */}
      <Tabs>
        {tabs.map(tab => (
          <Tab key={tab.label} $active={tab.active} onClick={() => tab.path && navigate(tab.path)}>
            <tab.icon size={14} /> {tab.label}
          </Tab>
        ))}
      </Tabs>

      {/* Warning: not installed */}
      {!hasFiles && server.status === 'stopped' && (
        <AlertBanner>
          <FiAlertTriangle />
          Serwer nie jest zainstalowany. Kliknij „Zainstaluj" aby pobrać pliki.
        </AlertBanner>
      )}

      {/* Progress bar for downloads */}
      {downloadProg && downloadProg.status !== 'idle' && (
        <ProgressBar
          progress={downloadProg.progress}
          status={downloadProg.status}
          message={downloadProg.message}
          totalSize={downloadProg.total_size || 0}
          downloadedSize={downloadProg.downloaded_size || 0}
          onCancel={() => handleAction('stop')}
        />
      )}

      {/* Action bar */}
      <ActionBar>
        {!hasFiles ? (
          <ActionBtn $v="start" onClick={() => handleAction('install')} disabled={isBusy}>
            {actionLoading === 'install' ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiDownload />}
            Zainstaluj serwer
          </ActionBtn>
        ) : (
          <ActionBtn $v="start" onClick={() => handleAction('start')} disabled={isRunning || isBusy}>
            {actionLoading === 'start' ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiPlay />}
            Uruchom
          </ActionBtn>
        )}
        <ActionBtn $v="restart" onClick={() => handleAction('restart')} disabled={!isRunning || isBusy}>
          {actionLoading === 'restart' ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiRefreshCw />}
          Restartuj
        </ActionBtn>
        <ActionBtn $v="stop" onClick={() => handleAction('stop')} disabled={!isRunning || isBusy}>
          {actionLoading === 'stop' ? <SpinIcon><FiRefreshCw /></SpinIcon> : <FiStopCircle />}
          Zatrzymaj
        </ActionBtn>
        <ActionBtn $v="neutral" onClick={() => navigate(`/servers/${serverId}/console`)} disabled={!isRunning}>
          <FiTerminal /> Pełna konsola
        </ActionBtn>
        <ActionBtn $v="neutral" onClick={() => navigate(`/servers/${serverId}/settings`)}>
          <FiSettings /> Ustawienia
        </ActionBtn>
        <ActionBtn $v="neutral" onClick={fetchServer}>
          <FiRefreshCw /> Odśwież
        </ActionBtn>
      </ActionBar>

      {/* ── Bedrock Update Panel (tylko dla serwerów Bedrock) ── */}
      {server.type === 'bedrock' && hasFiles && (
        <UpdateCard>
          <UpdateHead>
            <UpdateTitle><FiArrowUp size={15} /> Aktualizacja Bedrock Server</UpdateTitle>
            <CheckBtn onClick={checkUpdate} disabled={checkingUpdate || updating}>
              {checkingUpdate
                ? <><SpinIcon><FiRefreshCw size={13}/></SpinIcon> Sprawdzanie...</>
                : <><FiRefreshCw size={13}/> Sprawdź aktualizacje</>}
            </CheckBtn>
          </UpdateHead>
          <UpdateBody>
            {/* Progress bar aktualizacji */}
            {updating && updateProg && (
              <ProgressBar
                progress={updateProg.progress || 0}
                status={updateProg.status === 'error' ? 'error' : updateProg.status || 'downloading'}
                message={updateProg.message || ''}
                totalSize={updateProg.total_size || 0}
                downloadedSize={updateProg.downloaded_size || 0}
              />
            )}

            {/* Wynik sprawdzenia — jest nowa wersja */}
            {!updating && latestBedrock && latestBedrock.version !== server.version && (
              <>
                <UpdateRow>
                  <VerBox>
                    <VerLabel>Aktualna wersja</VerLabel>
                    <VerVal style={{ color: '#f87171' }}>{server.version}</VerVal>
                  </VerBox>
                  <Arrow>→</Arrow>
                  <VerBox>
                    <VerLabel>Najnowsza wersja</VerLabel>
                    <VerVal style={{ color: '#10b981' }}>{latestBedrock.version}</VerVal>
                  </VerBox>
                  <UpdateBtn onClick={doUpdate} disabled={updating}>
                    <FiArrowUp size={15} />
                    Aktualizuj do {latestBedrock.version}
                  </UpdateBtn>
                </UpdateRow>
                <UpdateNote>
                  ⚠️ Serwer zostanie <strong>zatrzymany</strong> podczas aktualizacji.
                  Dane świata (worlds/), server.properties, allowlist i uprawnienia zostaną <strong>zachowane</strong>.
                  Po aktualizacji uruchom serwer ręcznie.
                </UpdateNote>
              </>
            )}

            {/* Już najnowsza */}
            {!updating && latestBedrock && latestBedrock.version === server.version && (
              <UpToDate>
                <FiCheckCircle size={16} />
                Serwer jest na najnowszej wersji ({server.version})
              </UpToDate>
            )}

            {/* Stan domyślny — ręczne podanie URL */}
            {!updating && !latestBedrock && !checkingUpdate && (
              <ManualUpdateSection serverId={serverId} server={server}
                onUpdateStarted={() => {
                  setUpdating(true);
                  setUpdateProg({ status: 'preparing', progress: 0, message: 'Uruchamianie...' });
                  // poll
                  clearInterval(updatePollRef.current);
                  updatePollRef.current = setInterval(async () => {
                    try {
                      const r = await api.get(`/servers/${serverId}/download-progress`);
                      const p = r.data;
                      setUpdateProg(p);
                      if (p.status === 'complete') {
                        clearInterval(updatePollRef.current);
                        setUpdating(false);
                        toast.success('✅ Serwer zaktualizowany!');
                        fetchServer();
                      } else if (p.status === 'error') {
                        clearInterval(updatePollRef.current);
                        setUpdating(false);
                        toast.error(`❌ ${p.message}`);
                      }
                    } catch { /* silent */ }
                  }, 1500);
                }}
              />
            )}
          </UpdateBody>
        </UpdateCard>
      )}

      <Grid>
        {/* Left column */}
        <Col>
          {/* Server Info */}
          <Card>
            <CardHead>
              <CardTitle><FiServer /> Informacje o serwerze</CardTitle>
              <StatusBadge $s={server.status}>{server.status}</StatusBadge>
            </CardHead>
            <CardBody>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Adres IP</InfoLabel>
                  <InfoValue>
                    {server.address || `localhost:${server.port}`}
                    <CopyBtn onClick={() => copy(server.address || `localhost:${server.port}`)}><FiCopy size={13} /></CopyBtn>
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Port</InfoLabel>
                  <InfoValue>{server.port}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Typ / Wersja</InfoLabel>
                  <InfoValue>{(server.type||'java').toUpperCase()} {server.version}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Implementacja</InfoLabel>
                  <InfoValue>{server.implementation || 'vanilla'}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Ostatnie uruchomienie</InfoLabel>
                  <InfoValue style={{ fontSize: 12 }}>
                    {server.last_started ? new Date(server.last_started).toLocaleString('pl') : 'Nigdy'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>PID procesu</InfoLabel>
                  <InfoValue>
                    {server.pid || '—'}
                    {server.pid && <CopyBtn onClick={() => copy(String(server.pid))}><FiCopy size={13} /></CopyBtn>}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Gracze</InfoLabel>
                  <InfoValue>{players.length} / {server.max_players || 20}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Dysk</InfoLabel>
                  <InfoValue>{diskGB != null ? `${Number(diskGB).toFixed(2)} GB` : '—'}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </CardBody>
          </Card>

          {/* Resources */}
          <Card>
            <CardHead><CardTitle><FiCpu /> Zasoby systemowe</CardTitle></CardHead>
            <CardBody>
              {!isRunning ? (
                <div style={{ color: '#6b7293', fontSize: 13 }}>Serwer jest zatrzymany — brak danych wydajności.</div>
              ) : (
                <>
                  <ResRow>
                    <ResName>CPU</ResName>
                    <ResBar><ResFill $pct={perf?.cpu_percent||0} $color="#6366f1" /></ResBar>
                    <ResVal>{perf?.cpu_percent ?? 0}%</ResVal>
                  </ResRow>
                  <ResRow>
                    <ResName>RAM</ResName>
                    <ResBar><ResFill $pct={perf?.memory_percent||0} $color="#3b82f6" /></ResBar>
                    <ResVal>{perf?.memory_percent ?? 0}%</ResVal>
                  </ResRow>
                  <ResRow>
                    <ResName>Dysk</ResName>
                    <ResBar><ResFill $pct={perf?.disk_percent||0} $color="#ef4444" /></ResBar>
                    <ResVal>{diskGB != null ? `${Number(diskGB).toFixed(1)}GB` : `${perf?.disk_percent ?? 0}%`}</ResVal>
                  </ResRow>
                </>
              )}
            </CardBody>
          </Card>

          {/* Online players */}
          <Card>
            <CardHead>
              <CardTitle><FiUsers /> Gracze online ({players.length})</CardTitle>
            </CardHead>
            <CardBody>
              {players.length === 0 ? (
                <div style={{ color: '#6b7293', fontSize: 13 }}>
                  {isRunning ? 'Brak graczy online.' : 'Serwer jest zatrzymany.'}
                </div>
              ) : (
                players.map(name => (
                  <PlayerItem key={name}>
                    <PlayerAvatar>{name.charAt(0).toUpperCase()}</PlayerAvatar>
                    <span style={{ color: '#e2e8f0', fontSize: 14 }}>{name}</span>
                  </PlayerItem>
                ))
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Right column */}
        <Col>
          {/* Mini Console */}
          <Card>
            <CardHead>
              <CardTitle><FiTerminal /> Konsola (mini)</CardTitle>
              <span style={{ fontSize: 12, color: '#6b7293', cursor: 'pointer' }}
                onClick={() => navigate(`/servers/${serverId}/console`)}>
                Otwórz pełną →
              </span>
            </CardHead>
            <CardBody style={{ padding: '12px 14px' }}>
              <MiniConsole ref={consoleRef}>
                {consoleLogs.length === 0 ? (
                  <span style={{ color: '#4b5268' }}>
                    {isRunning ? 'Oczekiwanie na logi...' : 'Serwer jest zatrzymany.'}
                  </span>
                ) : (
                  consoleLogs.map((line, i) => (
                    <LogLine key={i} $t={classifyLog(line)}>{line}</LogLine>
                  ))
                )}
              </MiniConsole>
              <CmdRow>
                <CmdInput
                  value={consoleInput}
                  onChange={e => setCmd(e.target.value)}
                  onKeyDown={handleCmdKey}
                  placeholder={isRunning ? 'Komenda (↑↓ historia)...' : 'Serwer zatrzymany'}
                  disabled={!isRunning}
                />
                <CmdBtn onClick={sendCmd} disabled={!isRunning || !consoleInput.trim()}>Wyślij</CmdBtn>
              </CmdRow>
            </CardBody>
          </Card>

          {/* Quick tasks */}
          <Card>
            <CardHead><CardTitle><FiZap /> Szybkie zadania</CardTitle></CardHead>
            <TaskGrid>
              <TaskBtn onClick={createBackup} disabled={isRunning}>
                <FiDownload /> Backup
              </TaskBtn>
              <TaskBtn onClick={() => navigate(`/servers/${serverId}/backups`)}>
                <FiDatabase /> Backupy
              </TaskBtn>
              <TaskBtn onClick={() => navigate(`/servers/${serverId}/plugins`)}>
                <FiBox /> Pluginy
              </TaskBtn>
              <TaskBtn onClick={() => navigate(`/servers/${serverId}/files`)}>
                <FiFolder /> Pliki
              </TaskBtn>
              <TaskBtn onClick={() => navigate(`/servers/${serverId}/users`)}>
                <FiUsers /> Użytkownicy
              </TaskBtn>
              <TaskBtn onClick={() => navigate(`/servers/${serverId}/settings`)}>
                <FiSettings /> Ustawienia
              </TaskBtn>
            </TaskGrid>
          </Card>

          {/* Backups */}
          <Card>
            <CardHead>
              <CardTitle><FiDownload /> Ostatnie backupy</CardTitle>
              <span style={{ fontSize: 12, color: '#6b7293', cursor: 'pointer' }}
                onClick={() => navigate(`/servers/${serverId}/backups`)}>
                Wszystkie →
              </span>
            </CardHead>
            <CardBody>
              {backups.length === 0 ? (
                <div style={{ color: '#6b7293', fontSize: 13 }}>Brak backupów.</div>
              ) : (
                backups.slice(0, 4).map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #3a3f57', fontSize: 13 }}>
                    <span style={{ color: '#e2e8f0' }}>{b.name || b}</span>
                    <span style={{ color: '#6b7293' }}>{b.size ? `${(b.size / 1024 / 1024).toFixed(1)} MB` : ''}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </Col>
      </Grid>
    </Page>
  );
}

export default ServerControl;
