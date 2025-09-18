import React from 'react';
import styled from 'styled-components';
import { FiDownload, FiCheckCircle, FiXCircle, FiLoader, FiPackage } from 'react-icons/fi';

const ProgressContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  border-left: 4px solid ${props => {
    switch (props.$status) {
      case 'downloading': return '#3b82f6';
      case 'extracting': return '#f59e0b';
      case 'starting': return '#8b5cf6';
      case 'complete': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const Spinner = styled.span`
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  &.spinner {
    animation: spin 1s linear infinite;
    display: inline-block;
  }
`;

const ProgressIcon = styled.div`
  font-size: 1.5rem;
  color: ${props => {
    switch (props.$status) {
      case 'downloading': return '#3b82f6';
      case 'extracting': return '#f59e0b';
      case 'starting': return '#8b5cf6';
      case 'complete': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  
  ${props => ['downloading', 'extracting', 'starting'].includes(props.$status) && `
    animation: spin 1s linear infinite;
  `}
`;

const ProgressTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #374151;
`;

const ProgressMessage = styled.p`
  margin: 0 0 15px 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: ${props => {
    switch (props.$status) {
      case 'downloading': return '#3b82f6';
      case 'extracting': return '#f59e0b';
      case 'starting': return '#8b5cf6';
      case 'complete': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 0.8rem;
  color: #6b7280;
`;

const ProgressPercentage = styled.span`
  font-weight: 600;
  color: #374151;
`;

const ProgressSize = styled.span`
  font-family: 'Monaco', 'Menlo', monospace;
`;

const CancelButton = styled.button`
  margin-top: 15px;
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: #dc2626;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 10px;
  
  ${props => {
    switch (props.$status) {
      case 'downloading': return `
        background: #dbeafe;
        color: #1d4ed8;
      `;
      case 'extracting': return `
        background: #fef3c7;
        color: #d97706;
      `;
      case 'starting': return `
        background: #ede9fe;
        color: #7c3aed;
      `;
      case 'complete': return `
        background: #dcfce7;
        color: #16a34a;
      `;
      case 'error': return `
        background: #fee2e2;
        color: #dc2626;
      `;
      default: return `
        background: #f3f4f6;
        color: #6b7280;
      `;
    }
  }}
`;

function ProgressBar({ progress, status, message, totalSize, downloadedSize, onCancel }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
        return <FiPackage />;
      case 'fetching_manifest':
      case 'downloading':
        return <FiDownload className="spinner" />;
      case 'extracting':
        return <FiLoader className="spinner" />;
      case 'starting':
        return <FiLoader className="spinner" />;
      case 'complete':
        return <FiCheckCircle />;
      case 'error':
        return <FiXCircle />;
      default:
        return <FiDownload />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'preparing': return 'Preparing';
      case 'fetching_manifest': return 'Fetching Info';
      case 'downloading': return 'Downloading';
      case 'extracting': return 'Extracting';
      case 'starting': return 'Starting';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return status;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedTime = () => {
    if (status !== 'downloading' || progress <= 0 || progress >= 100 || !totalSize || !downloadedSize) {
      return null;
    }
    
    const downloaded = downloadedSize;
    const total = totalSize;
    const remainingBytes = total - downloaded;
    const bytesPerSecond = downloaded / (progress / 100 * 10); // Estimate based on progress
    const secondsRemaining = remainingBytes / bytesPerSecond;
    
    if (secondsRemaining < 60) {
      return `${Math.ceil(secondsRemaining)}s`;
    } else {
      return `${Math.ceil(secondsRemaining / 60)}m`;
    }
  };

  return (
    <ProgressContainer $status={status}>
      <ProgressHeader>
        <ProgressIcon $status={status}>
          {getStatusIcon()}
        </ProgressIcon>
        <ProgressTitle>
          Server Installation
          <StatusBadge $status={status}>
            {getStatusIcon()}
            {getStatusText()}
          </StatusBadge>
        </ProgressTitle>
      </ProgressHeader>
      
      <ProgressMessage>{message}</ProgressMessage>
      
      <ProgressBarWrapper>
        <ProgressBarFill 
          $progress={progress} 
          $status={status}
        />
      </ProgressBarWrapper>
      
      <ProgressInfo>
        <div>
          <ProgressPercentage>{Math.round(progress)}%</ProgressPercentage>
          {status === 'downloading' && totalSize > 0 && (
            <ProgressSize>
              {' '}({formatFileSize(downloadedSize)} / {formatFileSize(totalSize)})
            </ProgressSize>
          )}
        </div>
        
        {status === 'downloading' && (
          <div>
            {getEstimatedTime() ? `${getEstimatedTime()} remaining` : 'Calculating...'}
          </div>
        )}
      </ProgressInfo>

      {/* Przycisk anulowania - pokazuj tylko gdy jest funkcja onCancel i status pozwala na anulowanie */}
      {onCancel && ['downloading', 'extracting', 'starting', 'preparing'].includes(status) && (
        <CancelButton onClick={onCancel}>
          <FiXCircle /> Anuluj
        </CancelButton>
      )}
    </ProgressContainer>
  );
}

export default ProgressBar;
