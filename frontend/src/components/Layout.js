import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FiServer, 
  FiHome, 
  FiTerminal, 
  FiFile, 
  FiUsers, 
  FiPackage, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.div.attrs(props => ({
  style: {
    transform: props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'
  }
}))`
  width: 250px;
  background: #1f2937;
  color: white;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  transition: transform 0.3s ease;
  z-index: 1000;
  
  @media (min-width: 769px) {
    transform: translateX(0) !important;
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #374151;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const Nav = styled.nav`
  padding: 20px 0;
`;

const NavItem = styled.div.attrs(props => ({
  style: {
    color: props['data-active'] ? '#3b82f6' : '#d1d5db',
    background: props['data-active'] ? '#111827' : 'transparent',
    borderRight: props['data-active'] ? '3px solid #3b82f6' : 'none'
  }
}))`
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #111827;
    color: white;
  }
`;

const MainContent = styled.div`
  flex: 1;
  margin-left: 250px;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Header = styled.header`
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  font-size: 1.2rem;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #374151;
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const Content = styled.main`
  padding: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const AdminSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #374151;
`;

const AdminLabel = styled.div`
  padding: 0 20px 10px 20px;
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pobierz ID serwera z aktualnej ścieżki
  const getCurrentServerId = () => {
    const pathParts = location.pathname.split('/');
    const serverIndex = pathParts.indexOf('servers');
    if (serverIndex !== -1 && serverIndex + 1 < pathParts.length) {
      return pathParts[serverIndex + 1];
    }
    return null;
  };

  const currentServerId = getCurrentServerId();

  // Funkcja do generowania ścieżek z aktualnym ID serwera
  const getServerPath = (path) => {
    if (currentServerId) {
      return path.replace(':serverId', currentServerId);
    }
    return '/dashboard'; // Fallback jeśli nie ma ID serwera
  };

  const navItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: `/servers/${currentServerId || ':serverId'}/console`, icon: FiTerminal, label: 'Console' },
    { path: `/servers/${currentServerId || ':serverId'}/files`, icon: FiFile, label: 'File Manager' },
    { path: `/servers/${currentServerId || ':serverId'}/users`, icon: FiUsers, label: 'User Manager' },
    { path: `/servers/${currentServerId || ':serverId'}/plugins`, icon: FiPackage, label: 'Plugins' },
    { path: `/servers/${currentServerId || ':serverId'}/settings`, icon: FiSettings, label: 'Settings' },
  ];
  
  const adminItems = [
    { path: '/admin/bedrock-versions', icon: FiPackage, label: 'Bedrock Versions' },
    { path: '/admin/addons', icon: FiPackage, label: 'Addon Manager' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    // Sprawdź czy ścieżka pasuje do aktualnej lokalizacji
    const serverPath = getServerPath(path);
    return location.pathname === serverPath || 
           location.pathname.startsWith(serverPath + '/');
  };

  return (
    <LayoutContainer>
      <Sidebar $isOpen={isSidebarOpen}>
        <SidebarHeader>
          <FiServer size={24} />
          <SidebarTitle>Minecraft Panel</SidebarTitle>
        </SidebarHeader>
        
        <Nav>
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              data-active={isActive(item.path)}
              onClick={() => {
                navigate(getServerPath(item.path));
                setIsSidebarOpen(false);
              }}
            >
              <item.icon />
              {item.label}
            </NavItem>
          ))}
          
          {/* Admin Section */}
          {user?.role === 'admin' && (
            <AdminSection>
              <AdminLabel>Admin</AdminLabel>
              {adminItems.map((item) => (
                <NavItem
                  key={item.path}
                  data-active={isActive(item.path)}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                >
                  <item.icon />
                  {item.label}
                </NavItem>
              ))}
            </AdminSection>
          )}
        </Nav>
      </Sidebar>

      <MainContent>
        <Header>
          <MenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </MenuButton>
          
          <UserInfo>
            <UserName>Hello, {user?.username}</UserName>
            <LogoutButton onClick={handleLogout}>
              <FiLogOut />
              Logout
            </LogoutButton>
          </UserInfo>
        </Header>

        <Content>
          {children}
        </Content>
      </MainContent>
    </LayoutContainer>
  );
}

export default Layout;
