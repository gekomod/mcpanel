import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ServerControl from './components/ServerControl';
import Console from './components/Console';
import FileEditor from './components/FileEditor';
import UserManager from './components/UserManager';
import PluginManager from './components/PluginManager';
import Settings from './components/Settings';
import Login from './components/Login';
import Layout from './components/Layout';
import BedrockManager from './components/BedrockManager';
import AddonManager from './components/AddonManager';
import Servers from './components/Servers';
import UserAdminManager from './components/UserAdminManager';
import Support from './components/Support';
import SettingsAdmin from './components/SettingsAdmin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
					<Route path="/servers/:serverId" element={<ServerControl />} />
					<Route path="/servers/:serverId/console" element={<Console />} />
					<Route path="/servers/:serverId/files" element={<FileEditor />} />
					<Route path="/servers/:serverId/users" element={<UserManager />} />
					<Route path="/servers/:serverId/plugins" element={<PluginManager />} />
					<Route path="/servers/:serverId/settings" element={<Settings />} />
					<Route path="/servers" element={<Servers />} />
					<Route path="/support" element={<Support />} />
                    {/* Admin routes */}
                    <Route path="/admin/bedrock-versions" element={<BedrockManager />} />
                    <Route path="/admin/addons" element={<AddonManager />} />
                    <Route path="/admin/users" element={<UserAdminManager />} />
                    <Route path="/admin/settings" element={<SettingsAdmin />} />
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
