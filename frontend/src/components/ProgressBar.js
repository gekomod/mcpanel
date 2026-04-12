import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FiDownload, FiCheckCircle, FiXCircle, FiRefreshCw, FiPackage } from 'react-icons/fi';

const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;
const shimmer = keyframes`
  0%{background-position:-200% 0}
  100%{background-position:200% 0}
`;

const statusColor = (s) => ({
  downloading: '#3b82f6',
  extracting: '#f59e0b',
  starting: '#8b5cf6',
  complete: '#10b981',
  error: '#ef4444',
  preparing: '#6366f1',
}[s] || '#6b7293');

const Container = styled.div`
  background: #2e3245;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 16px;
  border: 1px solid #3a3f57;
  border-left: 4px solid ${p => statusColor(p.$s)};
`;

const Row = styled.div`
  display:flex;align-items:center;gap:12px;margin-bottom:12px;
`;
const Icon = styled.span`
  font-size:20px;color:${p=>statusColor(p.$s)};
  display:inline-flex;
  ${p=>['downloading','extracting','starting','preparing'].includes(p.$s) && css`
    animation:${spin} 1.2s linear infinite;
  `}
`;
const Info = styled.div`flex:1;`;
const TitleRow = styled.div`
  display:flex;align-items:center;justify-content:space-between;
`;
const Title = styled.span`
  font-size:14px;font-weight:600;color:#fff;
`;
const Badge = styled.span`
  padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;
  background:${p=>statusColor(p.$s)}22;color:${p=>statusColor(p.$s)};
  text-transform:uppercase;letter-spacing:.05em;
`;
const Msg = styled.div`
  font-size:13px;color:#a4aabc;margin-top:3px;
`;

const Track = styled.div`
  width:100%;height:8px;background:#35394e;border-radius:4px;overflow:hidden;
  margin-bottom:8px;
`;
const Fill = styled.div`
  height:100%;border-radius:4px;
  width:${p=>Math.max(0,Math.min(100,p.$pct||0))}%;
  background:${p=>statusColor(p.$s)};
  transition:width .4s ease;
  ${p=>['downloading','extracting'].includes(p.$s) && p.$pct < 100 && css`
    background: linear-gradient(90deg,
      ${statusColor(p.$s)} 25%,
      ${statusColor(p.$s)}88 50%,
      ${statusColor(p.$s)} 75%
    );
    background-size:200% 100%;
    animation:${shimmer} 1.5s linear infinite;
  `}
`;

const Meta = styled.div`
  display:flex;justify-content:space-between;align-items:center;
  font-size:12px;color:#6b7293;
`;
const Pct = styled.span`font-weight:700;color:#fff;`;

const CancelBtn = styled.button`
  margin-top:12px;padding:7px 16px;
  background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);
  color:#f87171;border-radius:7px;cursor:pointer;font-size:13px;
  display:flex;align-items:center;gap:6px;transition:all .2s;
  &:hover{background:rgba(239,68,68,.2);}
`;

const statusLabel = {
  preparing: 'Przygotowywanie',
  fetching_manifest: 'Pobieranie info',
  downloading: 'Pobieranie',
  extracting: 'Rozpakowywanie',
  starting: 'Uruchamianie',
  complete: 'Gotowe',
  error: 'Błąd',
};

const fmtBytes = (b) => {
  if (!b || b === 0) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b)/Math.log(k));
  return parseFloat((b/Math.pow(k,i)).toFixed(1)) + ' ' + s[i];
};

function ProgressBar({ progress = 0, status = 'downloading', message = '', totalSize = 0, downloadedSize = 0, onCancel }) {
  const pct = Math.round(Math.max(0, Math.min(100, progress)));
  const canCancel = onCancel && ['downloading','extracting','starting','preparing'].includes(status);

  const eta = (() => {
    if (status !== 'downloading' || pct <= 0 || pct >= 100 || !totalSize || !downloadedSize) return null;
    const remaining = totalSize - downloadedSize;
    const bps = downloadedSize / (pct / 100 * 10);
    const secs = remaining / bps;
    return secs < 60 ? `${Math.ceil(secs)}s` : `${Math.ceil(secs/60)}m`;
  })();

  const getIcon = () => {
    if (status === 'complete') return <FiCheckCircle />;
    if (status === 'error') return <FiXCircle />;
    if (status === 'preparing') return <FiPackage />;
    return <FiRefreshCw />;
  };

  return (
    <Container $s={status}>
      <Row>
        <Icon $s={status}>{getIcon()}</Icon>
        <Info>
          <TitleRow>
            <Title>Instalacja serwera</Title>
            <Badge $s={status}>{statusLabel[status] || status}</Badge>
          </TitleRow>
          {message && <Msg>{message}</Msg>}
        </Info>
      </Row>

      <Track>
        <Fill $pct={pct} $s={status} />
      </Track>

      <Meta>
        <div>
          <Pct>{pct}%</Pct>
          {status === 'downloading' && totalSize > 0 && (
            <span style={{marginLeft:8}}>{fmtBytes(downloadedSize)} / {fmtBytes(totalSize)}</span>
          )}
        </div>
        {eta && <span>pozostało ~{eta}</span>}
      </Meta>

      {canCancel && (
        <CancelBtn onClick={onCancel}>
          <FiXCircle size={14} /> Anuluj
        </CancelBtn>
      )}
    </Container>
  );
}

export default ProgressBar;
