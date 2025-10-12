import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { 
  RiDatabase2Line, 
  RiAddLine, 
  RiRefreshLine, 
  RiDownloadLine, 
  RiUploadLine, 
  RiDeleteBinLine, 
  RiFileCopyLine,
  RiSearchLine,
  RiEditLine,
  RiTableLine,
  RiHistoryLine,
  RiSaveLine,
  RiCloseLine,
  RiLayoutColumnLine,
  RiFileExcelLine,
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiArrowLeftRightLine,
  RiSettingsLine,
  RiServerLine,
  RiShieldCheckLine,
  RiEyeLine,
  RiEyeOffLine
} from 'react-icons/ri';
import { 
  FaDatabase,
  FaTable,
  FaHistory
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Global styles with professional design
const GlobalStyles = createGlobalStyle`
  .database-manager {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --secondary-color: #1e293b;
    --background-dark: #0f172a;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
    --border-color: #334155;
    --success-color: #059669;
    --warning-color: #d97706;
    --danger-color: #dc2626;
    --card-hover: #1e293b;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .fade-in { animation: fadeIn 0.4s ease-out; }
  .slide-in { animation: slideIn 0.3s ease-out; }
`;

const MainContainer = styled.div`
  color: var(--text-secondary);
  line-height: 1.6;
  position: relative;
  padding: 24px 32px;
  overflow-y: auto;
  min-height: 100vh;
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const DatabaseCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
`;

const DatabaseCard = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), #7c3aed);
  }

  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary-color);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const DatabaseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const DatabaseTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
`;

const DatabaseIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
`;

const DatabaseValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-feature-settings: 'tnum';
`;

const DatabaseSubtitle = styled.div`
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const Progress = styled.div`
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--primary-color), #7c3aed);
  transition: width 0.5s ease;
  width: ${props => props.$percentage || 0}%;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
`;

const DatabaseActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
`;

const ActionButton = styled.button`
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 20px 16px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);

    &::before {
      left: 100%;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ActionIcon = styled.div`
  font-size: 24px;
  transition: transform 0.3s ease;
  
  ${ActionButton}:hover & {
    transform: scale(1.1);
  }
`;

// Modal styles for Create Table
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: var(--secondary-color);
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.5);
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ModalBody = styled.div`
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const ColumnDefinition = styled.div`
  background: var(--background-dark);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ColumnTitle = styled.span`
  font-weight: 600;
  color: var(--text-primary);
`;

const ColumnFields = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  align-items: end;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
`;

const CheckboxInput = styled.input`
  width: 16px;
  height: 16px;
`;

const ModalFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(30, 41, 59, 0.5);
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$variant === 'primary' && `
    background: var(--primary-color);
    color: white;

    &:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
  `}

  ${props => props.$variant === 'secondary' && `
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);

    &:hover {
      background: var(--border-color);
      transform: translateY(-1px);
    }
  `}

  ${props => props.$variant === 'danger' && `
    background: var(--danger-color);
    color: white;

    &:hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const QuerySection = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
`;

const QueryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const QueryTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const QueryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const QueryInput = styled.textarea`
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s ease;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const QueryButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const QueryButton = styled.button`
  padding: 10px 20px;
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$primary && `
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  `}

  &:hover {
    background: var(--border-color);
    transform: translateY(-1px);
  }

  ${props => props.$primary && `
    &:hover {
      background: var(--primary-dark);
      border-color: var(--primary-dark);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultsSection = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const ResultsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  max-width: 100%;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--secondary-color);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
    
    &:hover {
      background: #475569;
    }
  }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--background-dark);
  table-layout: fixed;
  min-width: 600px;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  font-weight: 600;
  background: rgba(37, 99, 235, 0.1);
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  
  &:last-child {
    text-align: right;
    min-width: 120px;
    max-width: 120px;
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(37, 99, 235, 0.05);
  }
  
  &:last-child {
    td {
      border-bottom: none;
      
      &:first-child {
        border-bottom-left-radius: 8px;
      }
      
      &:last-child {
        border-bottom-right-radius: 8px;
      }
    }
  }
`;

const EditableCell = styled.input`
  background: transparent;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 8px 10px;
  color: var(--text-primary);
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: nowrap;
`;

const SmallButton = styled.button`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
  
  ${props => props.$variant === 'edit' && `
    background: var(--primary-color);
    color: white;
    
    &:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }
  `}
  
  ${props => props.$variant === 'delete' && `
    background: rgba(220, 38, 38, 0.2);
    color: var(--danger-color);
    
    &:hover {
      background: rgba(220, 38, 38, 0.3);
      transform: translateY(-1px);
    }
  `}
  
  ${props => props.$variant === 'save' && `
    background: rgba(5, 150, 105, 0.2);
    color: var(--success-color);
    
    &:hover {
      background: rgba(5, 150, 105, 0.3);
      transform: translateY(-1px);
    }
  `}
  
  ${props => props.$variant === 'cancel' && `
    background: var(--border-color);
    color: var(--text-secondary);
    
    &:hover {
      background: #475569;
      transform: translateY(-1px);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const NavTabs = styled.div`
  display: flex;
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 24px;
  gap: 4px;
  border: 1px solid var(--border-color);
`;

const NavTab = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  ${props => props.$active && `
    background: var(--primary-color);
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  `}
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-color)' : 'var(--card-hover)'};
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  font-size: 16px;
  
  &::before {
    content: "📊";
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
    opacity: 0.7;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: var(--primary-color);
  font-size: 16px;
  
  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary-color);
    border-top: 2px solid transparent;
    border-radius: 50%;
    margin-left: 10px;
    animation: spin 1s linear infinite;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--border-color);
`;

const PageTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  ${props => props.$active ? `
    background: rgba(5, 150, 105, 0.2);
    color: var(--success-color);
  ` : `
    background: rgba(220, 38, 38, 0.2);
    color: var(--danger-color);
  `}
`;

const ExportImportSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const ExportImportCard = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid var(--border-color);
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const CardIcon = styled.div`
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 15px;
  transition: all 0.3s ease;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
`;

const CardDescription = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const FormatOptions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FormatButton = styled.button`
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: var(--background-dark);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--border-color);
    transform: translateY(-1px);
  }
  
  ${props => props.$active && `
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  `}
`;

const ExportImportButton = styled.button`
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Demo data
const DEMO_DATA = [
  { id: 1, username: 'admin', email: 'admin@example.com', created_at: '2023-05-12', status: 'Aktywny' },
  { id: 2, username: 'user1', email: 'user1@example.com', created_at: '2023-06-03', status: 'Aktywny' },
  { id: 3, username: 'user2', email: 'user2@example.com', created_at: '2023-07-15', status: 'Nieaktywny' }
];

const DEMO_TABLES = [
  { name: 'users', rows: 150, size: '2.1 MB', created_at: '2023-01-15' },
  { name: 'products', rows: 89, size: '1.5 MB', created_at: '2023-02-20' },
  { name: 'orders', rows: 234, size: '3.2 MB', created_at: '2023-03-10' }
];

function DatabaseAdminManager() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [databaseStats, setDatabaseStats] = useState({
    size: '24.5 MB',
    freeSpace: '25.5 MB',
    tables: 12,
    activeTables: 8,
    inactiveTables: 4,
    lastBackup: '2 godziny temu',
    nextBackup: 'za 22 godziny'
  });
  const [query, setQuery] = useState('SELECT name FROM sqlite_master WHERE type="table";');
  const [queryResults, setQueryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState(DEMO_TABLES);
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTable, setNewTable] = useState({
    name: '',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, nullable: false }
    ]
  });
  const [newRowData, setNewRowData] = useState({});
  const [addingNewRow, setAddingNewRow] = useState(false);
  const [currentTable, setCurrentTable] = useState('');
  const [exportFormat, setExportFormat] = useState('sql');
  const [importFormat, setImportFormat] = useState('sql');

  useEffect(() => {
    fetchDatabaseStats();
    fetchTables();
  }, []);

  // Create Table Modal Functions
  const addColumn = () => {
    setNewTable(prev => ({
      ...prev,
      columns: [...prev.columns, { name: '', type: 'TEXT', primaryKey: false, autoIncrement: false, nullable: true }]
    }));
  };

  const removeColumn = (index) => {
    if (newTable.columns.length <= 1) {
      toast.error('Tabela musi mieć przynajmniej jedną kolumnę');
      return;
    }
    
    setNewTable(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const updateColumn = (index, field, value) => {
    setNewTable(prev => ({
      ...prev,
      columns: prev.columns.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      )
    }));
  };

  const createTable = async () => {
    if (!newTable.name.trim()) {
      toast.error('Nazwa tabeli jest wymagana');
      return;
    }

    // Validate columns
    for (let col of newTable.columns) {
      if (!col.name.trim()) {
        toast.error('Wszystkie kolumny muszą mieć nazwę');
        return;
      }
    }

    try {
      setLoading(true);
      await api.post('/database/tables', newTable);
      toast.success(`Tabela "${newTable.name}" utworzona pomyślnie`);
      setShowCreateTableModal(false);
      setNewTable({
        name: '',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, nullable: false }
        ]
      });
      fetchTables();
      fetchDatabaseStats();
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Błąd podczas tworzenia tabeli');
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const response = await api.get('/database/stats');
      setDatabaseStats(response.data);
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast.error(t('database.action.error') || 'Błąd podczas pobierania statystyk bazy danych');
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api.get('/database/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables(DEMO_TABLES);
      toast.error(t('database.action.error') || 'Błąd podczas pobierania listy tabel');
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Proszę wprowadzić zapytanie SQL');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/database/query', { query });
      setQueryResults(response.data.results || response.data);
      toast.success((t('database.query.execute') || 'Zapytanie wykonane') + ' - ' + (t('common.success') || 'Sukces'));
    } catch (error) {
      console.error('Error executing query:', error);
      
      // Fallback to demo data
      if (query.toLowerCase().includes('select * from users')) {
        setQueryResults(DEMO_DATA);
        toast.info('Wyświetlam dane demonstracyjne');
      } else if (query.toLowerCase().includes('select name from sqlite_master')) {
        setQueryResults(tables.map(table => ({ name: table.name })));
        toast.info('Wyświetlam listę tabel');
      } else {
        setQueryResults([]);
        toast.error(t('database.query.error') || 'Błąd podczas wykonywania zapytania');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    toast.info(t('database.query.clear') || 'Wyczyszczono zapytanie');
  };

  const handleDatabaseAction = async (action) => {
    try {
      switch (action) {
        case 'refresh':
          await fetchDatabaseStats();
          await fetchTables();
          toast.success(t('database.action.refresh.success') || 'Dane odświeżone');
          break;
        case 'newTable':
          setShowCreateTableModal(true);
          break;
        case 'export':
          await exportDatabase();
          break;
        case 'import':
          await importDatabase();
          break;
        case 'backup':
          await createBackup();
          break;
        case 'clear':
          if (window.confirm(t('database.action.clear.confirm') || 'Czy na pewno chcesz wyczyścić bazę danych?')) {
            await clearDatabase();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(t('database.action.error') || 'Wystąpił błąd');
    }
  };

  const exportDatabase = async () => {
    try {
      const response = await api.get('/database/export', {
        responseType: 'blob',
        params: { format: exportFormat }
      });
      
      const extension = exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'sql';
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_export_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Baza danych wyeksportowana w formacie ${exportFormat.toUpperCase()} pomyślnie`);
    } catch (error) {
      console.error('Error exporting database:', error);
      toast.error('Błąd podczas eksportowania bazy danych');
    }
  };

  const importDatabase = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = importFormat === 'json' ? '.json' : importFormat === 'csv' ? '.csv' : '.sql';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', importFormat);

      try {
        setLoading(true);
        await api.post('/database/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`Baza danych zaimportowana z formatu ${importFormat.toUpperCase()} pomyślnie`);
        fetchDatabaseStats();
        fetchTables();
      } catch (error) {
        console.error('Error importing database:', error);
        toast.error('Błąd podczas importowania bazy danych');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const createBackup = async () => {
    try {
      await api.post('/database/backup');
      toast.success('Kopia zapasowa utworzona pomyślnie');
      fetchDatabaseStats();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Błąd podczas tworzenia kopii zapasowej');
    }
  };

  const clearDatabase = async () => {
    try {
      await api.post('/database/clear');
      toast.success('Baza danych wyczyszczona pomyślnie');
      fetchDatabaseStats();
      fetchTables();
      setQueryResults([]);
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error('Błąd podczas czyszczenia bazy danych');
    }
  };

  const startEditing = (row, index) => {
    setEditingRow(index);
    setEditedData({ ...row });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const saveEditing = async () => {
    try {
      await api.put(`/database/tables/${currentTable}/rows/${editedData.id}`, editedData);
      setQueryResults(prev => prev.map((row, index) => 
        index === editingRow ? editedData : row
      ));
      toast.success('Wiersz zaktualizowany pomyślnie');
      setEditingRow(null);
      setEditedData({});
    } catch (error) {
      console.error('Error updating row:', error);
      toast.error('Błąd podczas aktualizacji wiersza');
    }
  };

  const deleteRow = async (id, index) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wiersz?')) return;

    try {
      await api.delete(`/database/tables/${currentTable}/rows/${id}`);
      setQueryResults(prev => prev.filter((_, i) => i !== index));
      toast.success('Wiersz usunięty pomyślnie');
    } catch (error) {
      console.error('Error deleting row:', error);
      toast.error('Błąd podczas usuwania wiersza');
    }
  };

  const addNewRow = async () => {
    try {
      const response = await api.post(`/database/tables/${currentTable}/rows`, newRowData);
      setQueryResults(prev => [...prev, response.data]);
      setAddingNewRow(false);
      setNewRowData({});
      toast.success('Nowy wiersz dodany pomyślnie');
    } catch (error) {
      console.error('Error adding row:', error);
      toast.error('Błąd podczas dodawania wiersza');
    }
  };

  const handleTableClick = (tableName) => {
    setCurrentTable(tableName);
    setQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
    setActiveTab('queries');
  };

  const deleteTable = async (tableName) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć tabelę "${tableName}"?`)) return;

    try {
      await api.delete(`/database/tables/${tableName}`);
      setTables(prev => prev.filter(table => table.name !== tableName));
      toast.success(`Tabela "${tableName}" usunięta pomyślnie`);
      fetchDatabaseStats();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Błąd podczas usuwania tabeli');
    }
  };

  const renderQueryResults = () => {
    if (!queryResults || queryResults.length === 0) {
      return <EmptyState>{t('database.results.empty') || 'Brak wyników'}</EmptyState>;
    }

    const columns = Object.keys(queryResults[0]);

    return (
      <TableContainer>
        <DataTable>
          <thead>
            <tr>
              {columns.map(column => (
                <TableHeaderCell key={column} title={column}>
                  {column}
                </TableHeaderCell>
              ))}
              <TableHeaderCell style={{ textAlign: 'right' }}>
                <SmallButton 
                  $variant="save" 
                  onClick={() => setAddingNewRow(true)}
                  disabled={addingNewRow || !currentTable}
                >
                  <RiAddLine size={12} /> {t('database.row.add') || 'Dodaj'}
                </SmallButton>
              </TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {addingNewRow && (
              <TableRow>
                {columns.map(column => (
                  <TableCell key={column}>
                    <EditableCell
                      value={newRowData[column] || ''}
                      onChange={(e) => setNewRowData(prev => ({
                        ...prev,
                        [column]: e.target.value
                      }))}
                      placeholder={column}
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <ActionButtons>
                    <SmallButton $variant="save" onClick={addNewRow}>
                      <RiSaveLine size={12} /> {t('common.save') || 'Zapisz'}
                    </SmallButton>
                    <SmallButton $variant="cancel" onClick={() => setAddingNewRow(false)}>
                      <RiCloseLine size={12} /> {t('common.cancel') || 'Anuluj'}
                    </SmallButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            )}
            
            {queryResults.map((row, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell key={column} title={String(row[column])}>
                    {editingRow === index ? (
                      <EditableCell
                        value={editedData[column] || ''}
                        onChange={(e) => setEditedData(prev => ({
                          ...prev,
                          [column]: e.target.value
                        }))}
                      />
                    ) : (
                      column === 'status' ? (
                        <StatusBadge $active={row[column] === 'Aktywny'}>
                          {row[column]}
                        </StatusBadge>
                      ) : (
                        String(row[column]).length > 30 ? 
                          `${String(row[column]).substring(0, 30)}...` : 
                          row[column]
                      )
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <ActionButtons>
                    {editingRow === index ? (
                      <>
                        <SmallButton $variant="save" onClick={saveEditing}>
                          <RiSaveLine size={12} /> {t('common.save') || 'Zapisz'}
                        </SmallButton>
                        <SmallButton $variant="cancel" onClick={cancelEditing}>
                          <RiCloseLine size={12} /> {t('common.cancel') || 'Anuluj'}
                        </SmallButton>
                      </>
                    ) : (
                      <>
                        <SmallButton $variant="edit" onClick={() => startEditing(row, index)}>
                          <RiEditLine size={12} /> {t('common.edit') || 'Edytuj'}
                        </SmallButton>
                        <SmallButton $variant="delete" onClick={() => deleteRow(row.id, index)}>
                          <RiDeleteBinLine size={12} /> {t('common.delete') || 'Usuń'}
                        </SmallButton>
                      </>
                    )}
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </TableContainer>
    );
  };

  const renderTablesList = () => {
    if (tables.length === 0) {
      return <EmptyState>{t('database.tables.empty') || 'Brak tabel'}</EmptyState>;
    }

    return (
      <TableContainer>
        <DataTable>
          <thead>
            <tr>
              <TableHeaderCell>{t('database.tables.name') || 'Nazwa'}</TableHeaderCell>
              <TableHeaderCell>{t('database.tables.rows') || 'Wiersze'}</TableHeaderCell>
              <TableHeaderCell>{t('database.tables.size') || 'Rozmiar'}</TableHeaderCell>
              <TableHeaderCell>{t('database.tables.created') || 'Utworzono'}</TableHeaderCell>
              <TableHeaderCell style={{ textAlign: 'right' }}>{t('common.actions') || 'Akcje'}</TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {tables.map(table => (
              <TableRow key={table.name}>
                <TableCell>{table.name}</TableCell>
                <TableCell>{table.rows}</TableCell>
                <TableCell>{table.size}</TableCell>
                <TableCell>{table.created_at ? new Date(table.created_at).toLocaleDateString('pl-PL') : '-'}</TableCell>
                <TableCell>
                  <ActionButtons>
                    <SmallButton 
                      $variant="edit"
                      onClick={() => handleTableClick(table.name)}
                    >
                      <RiEyeLine size={12} /> {t('common.view') || 'Widok'}
                    </SmallButton>
                    <SmallButton 
                      $variant="delete" 
                      onClick={() => deleteTable(table.name)}
                    >
                      <RiDeleteBinLine size={12} /> {t('common.delete') || 'Usuń'}
                    </SmallButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </DataTable>
      </TableContainer>
    );
  };

  const renderExportImport = () => (
    <ExportImportSection>
      <ExportImportCard className="fade-in">
        <CardIcon className="card-icon">
          <RiDownloadLine />
        </CardIcon>
        <CardTitle>Eksport Bazy Danych</CardTitle>
        <CardDescription>
          Wyeksportuj całą bazę danych lub wybrane tabele w wybranym formacie
        </CardDescription>
        
        <FormatOptions>
          <FormatButton 
            $active={exportFormat === 'sql'}
            onClick={() => setExportFormat('sql')}
          >
            <RiFileTextLine /> SQL
          </FormatButton>
          <FormatButton 
            $active={exportFormat === 'json'}
            onClick={() => setExportFormat('json')}
          >
            <RiFileExcelLine /> JSON
          </FormatButton>
          <FormatButton 
            $active={exportFormat === 'csv'}
            onClick={() => setExportFormat('csv')}
          >
            <RiFileExcelLine /> CSV
          </FormatButton>
        </FormatOptions>
        
        <ExportImportButton onClick={exportDatabase}>
          <RiDownloadLine className="button-icon" />
          Eksportuj jako {exportFormat.toUpperCase()}
        </ExportImportButton>
      </ExportImportCard>

      <ExportImportCard className="fade-in">
        <CardIcon className="card-icon">
          <RiUploadLine />
        </CardIcon>
        <CardTitle>Import Bazy Danych</CardTitle>
        <CardDescription>
          Zaimportuj dane z pliku w wybranym formacie do istniejącej bazy danych
        </CardDescription>
        
        <FormatOptions>
          <FormatButton 
            $active={importFormat === 'sql'}
            onClick={() => setImportFormat('sql')}
          >
            <RiFileTextLine /> SQL
          </FormatButton>
          <FormatButton 
            $active={importFormat === 'json'}
            onClick={() => setImportFormat('json')}
          >
            <RiFileExcelLine /> JSON
          </FormatButton>
          <FormatButton 
            $active={importFormat === 'csv'}
            onClick={() => setImportFormat('csv')}
          >
            <RiFileExcelLine /> CSV
          </FormatButton>
        </FormatOptions>
        
        <ExportImportButton onClick={importDatabase}>
          <RiUploadLine className="button-icon" />
          Importuj z {importFormat.toUpperCase()}
        </ExportImportButton>
      </ExportImportCard>
    </ExportImportSection>
  );

  const renderCreateTableModal = () => {
    if (!showCreateTableModal) return null;

    return (
      <ModalOverlay onClick={() => setShowCreateTableModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              <RiTableLine />
              Utwórz Nową Tabelę
            </ModalTitle>
            <Button $variant="secondary" onClick={() => setShowCreateTableModal(false)}>
              <RiCloseLine />
            </Button>
          </ModalHeader>
          
          <ModalBody>
            <FormGroup>
              <FormLabel>Nazwa Tabeli *</FormLabel>
              <FormInput
                type="text"
                value={newTable.name}
                onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                placeholder="np. users, products, orders..."
              />
            </FormGroup>

            <FormGroup>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <FormLabel>Kolumny</FormLabel>
                <Button $variant="primary" onClick={addColumn} style={{ padding: '8px 16px' }}>
                  <RiAddLine /> Dodaj Kolumnę
                </Button>
              </div>

              {newTable.columns.map((column, index) => (
                <ColumnDefinition key={index}>
                  <ColumnHeader>
                    <ColumnTitle>Kolumna #{index + 1}</ColumnTitle>
                    {newTable.columns.length > 1 && (
                      <Button 
                        $variant="danger" 
                        onClick={() => removeColumn(index)}
                        style={{ padding: '6px 12px' }}
                      >
                        <RiCloseLine />
                      </Button>
                    )}
                  </ColumnHeader>
                  
                  <ColumnFields>
                    <div>
                      <FormLabel>Nazwa</FormLabel>
                      <FormInput
                        type="text"
                        value={column.name}
                        onChange={(e) => updateColumn(index, 'name', e.target.value)}
                        placeholder="nazwa_kolumny"
                      />
                    </div>
                    
                    <div>
                      <FormLabel>Typ</FormLabel>
                      <FormSelect
                        value={column.type}
                        onChange={(e) => updateColumn(index, 'type', e.target.value)}
                      >
                        <option value="INTEGER">INTEGER</option>
                        <option value="TEXT">TEXT</option>
                        <option value="REAL">REAL</option>
                        <option value="BLOB">BLOB</option>
                        <option value="NUMERIC">NUMERIC</option>
                        <option value="BOOLEAN">BOOLEAN</option>
                        <option value="DATE">DATE</option>
                        <option value="DATETIME">DATETIME</option>
                      </FormSelect>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <CheckboxLabel>
                        <CheckboxInput
                          type="checkbox"
                          checked={column.primaryKey}
                          onChange={(e) => updateColumn(index, 'primaryKey', e.target.checked)}
                        />
                        Klucz główny
                      </CheckboxLabel>
                      
                      <CheckboxLabel>
                        <CheckboxInput
                          type="checkbox"
                          checked={column.autoIncrement}
                          onChange={(e) => updateColumn(index, 'autoIncrement', e.target.checked)}
                          disabled={column.type !== 'INTEGER'}
                        />
                        Auto-increment
                      </CheckboxLabel>
                      
                      <CheckboxLabel>
                        <CheckboxInput
                          type="checkbox"
                          checked={column.nullable}
                          onChange={(e) => updateColumn(index, 'nullable', e.target.checked)}
                          disabled={column.primaryKey}
                        />
                        Nullable
                      </CheckboxLabel>
                    </div>
                  </ColumnFields>
                </ColumnDefinition>
              ))}
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button $variant="secondary" onClick={() => setShowCreateTableModal(false)}>
              Anuluj
            </Button>
            <Button $variant="primary" onClick={createTable} disabled={loading}>
              {loading ? 'Tworzenie...' : 'Utwórz Tabelę'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    );
  };

  return (
    <>
      <GlobalStyles />
      <MainContainer className="database-manager">
        <PageHeader className="fade-in">
          <PageTitle>
            <RiDatabase2Line />
            {t('database.title') || 'Zarządzanie Bazą Danych'}
            <RiShieldCheckLine style={{ fontSize: '20px', color: 'var(--success-color)' }} />
          </PageTitle>
        </PageHeader>

        <NavTabs className="fade-in">
          <NavTab 
            $active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            <RiLayoutColumnLine />
            {t('database.tabs.overview') || 'Przegląd'}
          </NavTab>
          <NavTab 
            $active={activeTab === 'queries'} 
            onClick={() => setActiveTab('queries')}
          >
            <RiSearchLine />
            {t('database.tabs.queries') || 'Zapytania SQL'}
          </NavTab>
          <NavTab 
            $active={activeTab === 'tables'} 
            onClick={() => setActiveTab('tables')}
          >
            <RiTableLine />
            {t('database.tabs.tables') || 'Zarządzanie Tabelami'}
          </NavTab>
          <NavTab 
            $active={activeTab === 'export'} 
            onClick={() => setActiveTab('export')}
          >
            <RiArrowLeftRightLine />
            {t('database.tabs.export') || 'Eksport/Import'}
          </NavTab>
        </NavTabs>

        <ContentLayout>
          {activeTab === 'overview' && (
            <>
              <DatabaseCards>
                <DatabaseCard className="fade-in">
                  <DatabaseHeader>
                    <DatabaseTitle>
                      <DatabaseIcon>
                        <FaDatabase />
                      </DatabaseIcon>
                      Rozmiar Bazy Danych
                    </DatabaseTitle>
                    <RiServerLine style={{ color: 'var(--text-muted)', fontSize: '18px' }} />
                  </DatabaseHeader>
                  <DatabaseValue>{databaseStats.size}</DatabaseValue>
                  <DatabaseSubtitle>Wolne miejsce: {databaseStats.freeSpace}</DatabaseSubtitle>
                  <ProgressBar>
                    <Progress $percentage={49} />
                  </ProgressBar>
                  <ProgressInfo>
                    <span>0 MB</span>
                    <span>49% wykorzystane</span>
                  </ProgressInfo>
                </DatabaseCard>

                <DatabaseCard className="fade-in">
                  <DatabaseHeader>
                    <DatabaseTitle>
                      <DatabaseIcon>
                        <FaTable />
                      </DatabaseIcon>
                      Liczba Tabel
                    </DatabaseTitle>
                    <RiSettingsLine style={{ color: 'var(--text-muted)', fontSize: '18px' }} />
                  </DatabaseHeader>
                  <DatabaseValue>{databaseStats.tables}</DatabaseValue>
                  <DatabaseSubtitle>
                    Aktywne: {databaseStats.activeTables} | Nieaktywne: {databaseStats.inactiveTables}
                  </DatabaseSubtitle>
                  <ProgressBar>
                    <Progress $percentage={67} />
                  </ProgressBar>
                  <ProgressInfo>
                    <span>0</span>
                    <span>67% aktywnych</span>
                  </ProgressInfo>
                </DatabaseCard>

                <DatabaseCard className="fade-in">
                  <DatabaseHeader>
                    <DatabaseTitle>
                      <DatabaseIcon>
                        <FaHistory />
                      </DatabaseIcon>
                      Ostatnia Kopia
                    </DatabaseTitle>
                    <RiShieldCheckLine style={{ color: 'var(--success-color)', fontSize: '18px' }} />
                  </DatabaseHeader>
                  <DatabaseValue>{databaseStats.lastBackup}</DatabaseValue>
                  <DatabaseSubtitle>Następna kopia: {databaseStats.nextBackup}</DatabaseSubtitle>
                  <ProgressBar>
                    <Progress $percentage={8} />
                  </ProgressBar>
                  <ProgressInfo>
                    <span>0h</span>
                    <span>8% cyklu kopii</span>
                  </ProgressInfo>
                </DatabaseCard>
              </DatabaseCards>

              <DatabaseActions>
                {[
                  { action: 'newTable', icon: RiAddLine, text: 'Nowa Tabela', description: 'Utwórz nową tabelę w bazie' },
                  { action: 'refresh', icon: RiRefreshLine, text: 'Odśwież', description: 'Odśwież statystyki' },
                  { action: 'backup', icon: RiFileCopyLine, text: 'Kopia Zapasowa', description: 'Utwórz backup bazy' },
                  { action: 'export', icon: RiDownloadLine, text: 'Eksportuj', description: 'Eksportuj dane' },
                  { action: 'import', icon: RiUploadLine, text: 'Importuj', description: 'Importuj dane' },
                  { action: 'clear', icon: RiDeleteBinLine, text: 'Wyczyść', description: 'Wyczyść bazę danych' },
                ].map(({ action, icon: Icon, text, description }) => (
                  <ActionButton 
                    key={action}
                    onClick={() => handleDatabaseAction(action)}
                    className="fade-in"
                  >
                    <ActionIcon>
                      <Icon />
                    </ActionIcon>
                    <span style={{ fontWeight: '600' }}>{text}</span>
                    <span style={{ fontSize: '12px', opacity: '0.8' }}>{description}</span>
                  </ActionButton>
                ))}
              </DatabaseActions>
            </>
          )}

          {activeTab === 'queries' && (
            <>
              <QuerySection className="fade-in">
                <QueryHeader>
                  <QueryTitle>
                    <RiSearchLine />
                    {t('database.query.editor') || 'Edytor Zapytań SQL'}
                  </QueryTitle>
                </QueryHeader>
                <QueryContainer>
                  <QueryInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('database.query.placeholder') || 'Wpisz zapytanie SQL tutaj...'}
                  />
                  <QueryButtons>
                    <QueryButton onClick={clearQuery}>
                      <RiCloseLine className="button-icon" />
                      {t('database.query.clear') || 'Wyczyść'}
                    </QueryButton>
                    <QueryButton $primary onClick={executeQuery} disabled={loading}>
                      {loading ? (
                        <>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid transparent', 
                            borderTop: '2px solid currentColor', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite',
                            marginRight: '8px'
                          }} />
                          {t('database.query.executing') || 'Wykonywanie...'}
                        </>
                      ) : (
                        <>
                          <RiCheckboxCircleLine className="button-icon" />
                          {t('database.query.execute') || 'Wykonaj Zapytanie'}
                        </>
                      )}
                    </QueryButton>
                  </QueryButtons>
                </QueryContainer>
              </QuerySection>

              <ResultsSection className="fade-in">
                <ResultsHeader>
                  <ResultsTitle>
                    <RiTableLine />
                    {t('database.results.title') || 'Wyniki Zapytania'}
                  </ResultsTitle>
                  <div>
                    {t('database.results.found') || 'Znaleziono'}: {queryResults.length} {t('database.results.records') || 'rekordów'}
                  </div>
                </ResultsHeader>
                {loading ? (
                  <LoadingSpinner className="fade-in">
                    {t('database.results.loading') || 'Ładowanie...'}
                  </LoadingSpinner>
                ) : (
                  renderQueryResults()
                )}
              </ResultsSection>
            </>
          )}

          {activeTab === 'tables' && (
            <ResultsSection className="fade-in">
              <ResultsHeader>
                <ResultsTitle>
                  <RiTableLine />
                  {t('database.tables.title') || 'Tabele w Bazie Danych'}
                </ResultsTitle>
              </ResultsHeader>
              {renderTablesList()}
            </ResultsSection>
          )}

          {activeTab === 'export' && (
            <ResultsSection className="fade-in">
              <ResultsHeader>
                <ResultsTitle>
                  <RiArrowLeftRightLine />
                  {t('database.export.title') || 'Eksport i Import Danych'}
                </ResultsTitle>
              </ResultsHeader>
              {renderExportImport()}
            </ResultsSection>
          )}
        </ContentLayout>

        {renderCreateTableModal()}
      </MainContainer>
    </>
  );
}

export default DatabaseAdminManager;
