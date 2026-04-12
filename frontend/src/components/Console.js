import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FiTerminal, FiSend, FiTrash2, FiRefreshCw, FiAlertCircle,
  FiActivity, FiFolder, FiSettings, FiUser, FiDownload,
  FiBox, FiCopy, FiPause, FiPlay, FiChevronDown
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-toastify';

// ─── animations ────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const spin = keyframes`from { transform:rotate(0) } to { transform:rotate(360deg) }`;
const blink = keyframes`0%,100%{opacity:1}50%{opacity:0}`;

// ─── styles ────────────────────────────────────────────────────────────────
const Page = styled.div`padding: 15px 20px; color: #a4aabc; animation: ${fadeIn} 0.3s ease;`;

const Tabs = styled.div`
  display: flex; background: #2e3245; border-radius: 8px;
  padding: 6px; margin-bottom: 16px; gap: 4px; overflow-x: auto;
`;
const Tab = styled.div`
  padding: 8px 16px; border-radius: 6px; cursor: pointer;
  font-weight: 500; font-size: 13px; color: #a4aabc;
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap; transition: all 0.2s;
  background: ${p => p.$active ? '#3b82f6' : 'transparent'};
  color: ${p => p.$active ? 'white' : '#a4aabc'};
  &:hover { background: ${p => p.$active ? '#3b82f6' : '#35394e'}; color: ${p => p.$active ? 'white' : '#fff'}; }
`;

const StatusBar = styled.div`
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 16px; padding: 10px 16px;
  background: #2e3245; border-radius: 8px; border: 1px solid #3a3f57;
  flex-wrap: wrap;
`;
const StatusLabel = styled.span`font-size: 13px; color: #a4aabc;`;
const StatusVal = styled.span`
  font-size: 13px; font-weight: 600;
  color: ${p => p.$running ? '#10b981' : '#f87171'};
`;
const StatusDot = styled.span`
  width: 8px; height: 8px; border-radius: 50%;
  background: ${p => p.$running ? '#10b981' : '#4b5268'};
  display: inline-block;
`;

const ConsoleBox = styled.div`
  background: #0d1117; border-radius: 10px; overflow: hidden;
  border: 1px solid #3a3f57; margin-bottom: 14px;
  display: flex; flex-direction: column;
  height: ${p => p.$fullscreen ? 'calc(100vh - 220px)' : '520px'};
  transition: height 0.3s ease;
`;
const ConsoleToolbar = styled.div`
  background: #161b22; padding: 10px 14px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #30363d;
`;
const ToolbarLeft = styled.div`display: flex; align-items: center; gap: 10px;`;
const ToolbarTitle = styled.span`
  font-size: 13px; font-weight: 600; color: #e6edf3;
  display: flex; align-items: center; gap: 7px;
`;
const ToolbarRight = styled.div`display: flex; gap: 6px;`;
const TBtn = styled.button`
  background: ${p => p.$active ? '#3b82f6' : '#21262d'};
  border: 1px solid ${p => p.$active ? '#3b82f6' : '#30363d'};
  color: ${p => p.$active ? '#fff' : '#8b949e'}; border-radius: 6px;
  padding: 5px 10px; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; gap: 5px;
  transition: all 0.2s;
  &:hover { border-color: #58a6ff; color: #58a6ff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const Spin = styled.span`display:inline-flex;animation:${spin} 0.8s linear infinite;`;

const ConsoleOutput = styled.div`
  flex: 1; overflow-y: auto; padding: 12px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace;
  font-size: 13px; line-height: 1.55; color: #e6edf3;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #0d1117; }
  &::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
`;

// Kolorowanie logów Minecraft
const getLineColor = (line) => {
  if (/\[WARN/i.test(line) || /warning/i.test(line)) return '#fbbf24';
  if (/\[ERROR/i.test(line) || /exception/i.test(line) || /fatal/i.test(line)) return '#f87171';
  if (/\[INFO.*joined/i.test(line) || /logged in/i.test(line)) return '#34d399';
  if (/\[INFO.*left/i.test(line) || /disconnected/i.test(line)) return '#f87171';
  if (/\[INFO.*Done/i.test(line)) return '#60a5fa';
  if (line.startsWith('>')) return '#fbbf24';
  return null;
};

const LogLine = styled.div`
  margin-bottom: 2px;
  white-space: pre-wrap;
  word-break: break-all;
  color: ${p => p.$color || '#e6edf3'};
  ${p => p.$command && 'background: rgba(251,191,36,0.06); padding: 1px 4px; border-radius: 3px;'}
`;
const Ts = styled.span`color: #6e7681; margin-right: 8px; font-size: 11px; user-select: none;`;
const Cursor = styled.span`
  display: inline-block; width: 8px; height: 13px;
  background: #58a6ff; margin-left: 2px; vertical-align: text-bottom;
  animation: ${blink} 1s step-end infinite;
`;

const ScrollDownBtn = styled.button`
  position: absolute; bottom: 80px; right: 28px;
  background: #3b82f6; border: none; border-radius: 50%;
  width: 36px; height: 36px; cursor: pointer; color: white;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'all' : 'none'};
  transition: opacity 0.2s;
`;

const InputRow = styled.div`display: flex; gap: 10px; align-items: center;`;
const InputWrap = styled.div`
  flex: 1; display: flex; align-items: center;
  background: #161b22; border: 1px solid ${p => p.$focused ? '#58a6ff' : '#30363d'};
  border-radius: 8px; padding: 0 14px; transition: border-color 0.2s;
`;
const Prompt = styled.span`color: #58a6ff; font-family: monospace; font-size: 14px; margin-right: 8px; flex-shrink: 0;`;
const CmdInput = styled.input`
  flex: 1; background: transparent; border: none; outline: none;
  color: #e6edf3; font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px; padding: 11px 0;
  &::placeholder { color: #4b5268; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;
const SendBtn = styled.button`
  padding: 0 20px; background: #3b82f6; color: white;
  border: none; border-radius: 8px; cursor: pointer; height: 42px;
  display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 500;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #2563eb; }
  &:disabled { background: #1d2a3a; color: #4b5268; cursor: not-allowed; }
`;

const ErrorBanner = styled.div`
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px; padding: 12px 16px; margin-bottom: 14px;
  display: flex; align-items: center; gap: 10px; color: #f87171;
`;

// ─── ANSI strip ─────────────────────────────────────────────────────────────
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[mGKHF]/g, '');

// ─── Component ──────────────────────────────────────────────────────────────
function Console() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [server, setServer] = useState(null);
  const [lines, setLines] = useState([]);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lineCount, setLineCount] = useState(200);

  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);
  const lastLogRef = useRef('');

  // Fetch server info
  const fetchServer = useCallback(async () => {
    try {
      const res = await api.get(`/servers/${serverId}`);
      setServer(res.data);
      setError(null);
    } catch {
      setError('Nie można załadować informacji o serwerze');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (paused) return;
    try {
      const isBedrock = server?.type === 'bedrock';
      const endpoint = isBedrock
        ? `/servers/${serverId}/realtime-output`
        : `/servers/${serverId}/logs`;
      const res = await api.get(endpoint);
      const raw = res.data?.logs || res.data?.output || '';

      if (raw === lastLogRef.current) return; // brak zmian
      lastLogRef.current = raw;

      const clean = stripAnsi(raw);
      const newLines = clean.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .slice(-lineCount)
        .map(msg => ({
          msg,
          ts: new Date(),
          color: getLineColor(msg),
          command: msg.startsWith('>')
        }));
      setLines(newLines);
    } catch { /* ignoruj fetch errors w tle */ }
  }, [serverId, server, paused, lineCount]);

  useEffect(() => { fetchServer(); }, [fetchServer]);

  // Start polling po załadowaniu serwera
  useEffect(() => {
    if (!server) return;
    fetchLogs();
    if (server.status === 'running') {
      pollRef.current = setInterval(fetchLogs, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [server, fetchLogs]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const handleScroll = () => {
    if (!outputRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = outputRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setShowScrollBtn(!atBottom);
    if (atBottom) setAutoScroll(true);
    else setAutoScroll(false);
  };

  const scrollToBottom = () => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
    setAutoScroll(true);
  };

  const sendCommand = async () => {
    const cmd = command.trim();
    if (!cmd || server?.status !== 'running') return;
    setHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setCommand('');
    setLines(prev => [...prev, { msg: `> ${cmd}`, ts: new Date(), color: '#fbbf24', command: true }]);
    try {
      await api.post(`/servers/${serverId}/command`, { command: cmd });
      setTimeout(fetchLogs, 800);
    } catch (err) {
      const msg = err.response?.data?.error || 'Błąd wysyłania komendy';
      setLines(prev => [...prev, { msg: `[BŁĄD] ${msg}`, ts: new Date(), color: '#f87171' }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { sendCommand(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setCommand(history[next] || '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setCommand(next === -1 ? '' : history[next]);
    }
  };

  const copyAll = () => {
    const text = lines.map(l => `[${l.ts.toLocaleTimeString()}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Skopiowano do schowka');
  };

  const tabs = [
    { label: 'Przegląd', icon: FiActivity, path: `/servers/${serverId}` },
    { label: 'Konsola', icon: FiTerminal, path: null, active: true },
    { label: 'Pliki', icon: FiFolder, path: `/servers/${serverId}/files` },
    { label: 'Konfiguracja', icon: FiSettings, path: `/servers/${serverId}/settings` },
    { label: 'Pluginy', icon: FiBox, path: `/servers/${serverId}/plugins` },
    { label: 'Użytkownicy', icon: FiUser, path: `/servers/${serverId}/users` },
    { label: 'Backup', icon: FiDownload, path: `/servers/${serverId}/backups` },
  ];

  if (loading) return <Page><div style={{ color: '#6b7293', padding: 40, textAlign: 'center' }}>Ładowanie konsoli...</div></Page>;

  const isRunning = server?.status === 'running';

  return (
    <Page>
      <Tabs>
        {tabs.map(tab => (
          <Tab key={tab.label} $active={tab.active} onClick={() => tab.path && navigate(tab.path)}>
            <tab.icon size={14} /> {tab.label}
          </Tab>
        ))}
      </Tabs>

      <StatusBar>
        <StatusDot $running={isRunning} />
        <StatusLabel>Serwer:</StatusLabel>
        <StatusVal $running={isRunning}>{server?.name}</StatusVal>
        <StatusLabel>Status:</StatusLabel>
        <StatusVal $running={isRunning}>{server?.status?.toUpperCase()}</StatusVal>
        <StatusLabel>Typ:</StatusLabel>
        <StatusVal $running>{(server?.type || 'java').toUpperCase()} {server?.version}</StatusVal>
        <StatusLabel>Port:</StatusLabel>
        <StatusVal $running>{server?.port}</StatusVal>
        <StatusLabel>Gracze:</StatusLabel>
        <StatusVal $running>{server?.player_count || 0}/{server?.max_players || 20}</StatusVal>
      </StatusBar>

      {error && (
        <ErrorBanner>
          <FiAlertCircle /> {error}
        </ErrorBanner>
      )}

      {!isRunning && (
        <ErrorBanner>
          <FiAlertCircle />
          Serwer jest zatrzymany — konsola niedostępna. Uruchom serwer z poziomu pulpitu.
        </ErrorBanner>
      )}

      <div style={{ position: 'relative' }}>
        <ConsoleBox $fullscreen={fullscreen}>
          <ConsoleToolbar>
            <ToolbarLeft>
              <ToolbarTitle>
                <FiTerminal color="#58a6ff" />
                {server?.name} — Konsola
              </ToolbarTitle>
              <TBtn $active={!paused} onClick={() => setPaused(false)} disabled={!isRunning} title="Wznów odświeżanie">
                <FiPlay size={11} /> Live
              </TBtn>
              <TBtn $active={paused} onClick={() => setPaused(true)} title="Zatrzymaj odświeżanie">
                <FiPause size={11} /> Pauza
              </TBtn>
            </ToolbarLeft>
            <ToolbarRight>
              <TBtn onClick={fetchLogs} disabled={!isRunning} title="Odśwież">
                <FiRefreshCw size={11} />
              </TBtn>
              <TBtn onClick={copyAll} title="Kopiuj logi">
                <FiCopy size={11} /> Kopiuj
              </TBtn>
              <TBtn onClick={() => setLines([])} title="Wyczyść widok">
                <FiTrash2 size={11} /> Wyczyść
              </TBtn>
              <TBtn
                onClick={() => {
                  setLineCount(prev => prev === 200 ? 500 : 200);
                  fetchLogs();
                }}
                title="Liczba linii"
              >
                {lineCount} linii
              </TBtn>
              <TBtn onClick={() => setFullscreen(f => !f)} title="Pełny ekran">
                {fullscreen ? '⊡' : '⊞'}
              </TBtn>
            </ToolbarRight>
          </ConsoleToolbar>

          <ConsoleOutput ref={outputRef} onScroll={handleScroll}>
            {lines.length === 0 ? (
              <div style={{ color: '#4b5268', padding: '20px 0' }}>
                {isRunning ? 'Oczekiwanie na logi...' : 'Serwer nie jest uruchomiony.'}
                <Cursor />
              </div>
            ) : (
              lines.map((line, i) => (
                <LogLine key={i} $color={line.color} $command={line.command}>
                  <Ts>[{line.ts.toLocaleTimeString()}]</Ts>
                  {line.msg}
                </LogLine>
              ))
            )}
          </ConsoleOutput>
        </ConsoleBox>

        <ScrollDownBtn $visible={showScrollBtn} onClick={scrollToBottom} title="Przewiń na dół">
          <FiChevronDown />
        </ScrollDownBtn>
      </div>

      <InputRow>
        <InputWrap $focused={inputFocused}>
          <Prompt>$</Prompt>
          <CmdInput
            ref={inputRef}
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={isRunning ? 'Wpisz komendę... (↑↓ historia)' : 'Serwer nie jest uruchomiony'}
            disabled={!isRunning}
            autoComplete="off"
            spellCheck={false}
          />
        </InputWrap>
        <SendBtn onClick={sendCommand} disabled={!isRunning || !command.trim()}>
          <FiSend /> Wyślij
        </SendBtn>
      </InputRow>
    </Page>
  );
}

export default Console;
