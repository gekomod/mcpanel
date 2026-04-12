import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token on startup
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('user'); }
      api.get('/auth/profiles')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
        });
    }
    setLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.language) {
      localStorage.setItem('preferred-language', userData.language);
    }
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const sessionId = user?.session_id;
    try {
      await api.post('/auth/logout', { session_id: sessionId });
    } catch { /* silent */ } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, [user]);

  const updateUser = useCallback((updatedData) => {
    setUser(prev => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  // Called by LanguageContext to persist language preference
  const updateUserLanguage = useCallback(async (lang) => {
    try {
      await api.put('/auth/profiles', { language: lang });
      updateUser({ language: lang });
    } catch { /* silent - non-critical */ }
  }, [updateUser]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, updateUserLanguage, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
