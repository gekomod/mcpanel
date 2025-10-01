import axios from 'axios';

// Automatyczne wykrywanie adresu API
const getApiBaseUrl = () => {
  // 1. Sprawdź zmienną środowiskową
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Automatyczne wykrywanie na podstawie hostname
  const { hostname, protocol, port } = window.location;
  
  // Dla localhost - użyj standardowego portu backendu
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }
  
  // Dla innych domen - zakładamy że API jest pod /api
  // Jeśli frontend jest na example.com, to API będzie na example.com/api
  return `${protocol}//${hostname}${port ? `:5000` : ''}`;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // WAŻNE dla CORS
  timeout: 15000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Ustaw Content-Type warunkowo. Nie ustawiaj dla FormData (upload plików).
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  config.headers['Accept'] = 'application/json';
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (401 === error.response.status) {
    localStorage.removeItem('access_token');
    window.location.replace(`/`);
  } else {
    return Promise.reject(error);
  }
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 422) {
      console.error('Validation error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
