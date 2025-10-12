// services/databaseApi.js
import api from './api';

export const databaseApi = {
  // Statystyki bazy danych
  getStats: async () => {
    const response = await api.get('/database/stats');
    return response.data;
  },

  // Lista tabel
  getTables: async () => {
    const response = await api.get('/database/tables');
    return response.data;
  },

  // Wykonanie zapytania SQL
  executeQuery: async (query) => {
    const response = await api.post('/database/query', { query });
    return response.data;
  },

  // Eksport bazy danych
  exportDatabase: async () => {
    const response = await api.get('/database/export', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Import bazy danych
  importDatabase: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/database/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Tworzenie kopii zapasowej
  createBackup: async () => {
    const response = await api.post('/database/backup');
    return response.data;
  },

  // Czyszczenie bazy danych
  clearDatabase: async () => {
    const response = await api.post('/database/clear');
    return response.data;
  },

  // Operacje na wierszach
  addRow: async (table, data) => {
    const response = await api.post('/database/row', {
      table,
      data
    });
    return response.data;
  },

  updateRow: async (table, id, data) => {
    const response = await api.put('/database/row', {
      table,
      id,
      data
    });
    return response.data;
  },

  deleteRow: async (table, id) => {
    const response = await api.delete('/database/row', {
      data: { table, id }
    });
    return response.data;
  },

  // Operacje na tabelach
  createTable: async (tableData) => {
    const response = await api.post('/database/tables', tableData);
    return response.data;
  },

  deleteTable: async (tableName) => {
    const response = await api.delete(`/database/tables/${tableName}`);
    return response.data;
  },

  // Struktura tabeli
  getTableStructure: async (tableName) => {
    const response = await api.get(`/database/tables/${tableName}/structure`);
    return response.data;
  },

  // Dane tabeli
  getTableData: async (tableName, page = 1, limit = 50) => {
    const response = await api.get(`/database/tables/${tableName}/data`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Lista kopii zapasowych
  getBackups: async () => {
    const response = await api.get('/database/backups');
    return response.data;
  },

  // Przywracanie kopii zapasowej
  restoreBackup: async (backupId) => {
    const response = await api.post(`/database/backups/${backupId}/restore`);
    return response.data;
  },

  // Usuwanie kopii zapasowej
  deleteBackup: async (backupId) => {
    const response = await api.delete(`/database/backups/${backupId}`);
    return response.data;
  }
};

export default databaseApi;
