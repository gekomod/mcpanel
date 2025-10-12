import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FiServer, 
  FiHome, 
  FiTerminal, 
  FiActivity,
  FiFile, 
  FiUsers, 
  FiPackage, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiBox,
  FiShield,
  FiHelpCircle,
  FiMessageSquare,
  FiUser,
  FiGlobe
} from 'react-icons/fi';
import { FcDatabase } from "react-icons/fc";
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: transparent;
  position: relative;
  width: 100%;
`;

const Sidebar = styled.div`
  width: 250px;
  padding: 20px 0;
  background-color: transparent;
  color: #a4aabc;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
  
  @media (max-width: 768px) {
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.3s ease;
    background: #1f2937;
  }
`;

const SidebarHeader = styled.div`
  padding: 0 20px 20px;
  border-bottom: 1px solid #3a3f57;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const LogoIcon = styled.div`
  font-size: 28px;
  color: #3b82f6;
`;

const LogoText = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const Nav = styled.nav`
  padding: 0 15px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
`;

const UserName = styled.div`
  font-weight: bold;
  color: #fff;
`;

const MenuCategory = styled.div`
  font-size: 12px;
  color: #6b7293;
  text-transform: uppercase;
  font-weight: 600;
  margin: 20px 0 10px 15px;
  letter-spacing: 0.05em;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li`
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  font-size: 15px;
  color: ${props => props.$isActive ? '#fff' : '#a4aabc'};
  background: ${props => props.$isActive ? '#222b43' : 'transparent'};

  &:hover {
    background: #222b43;
    color: #fff;
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

  padding: 16px 24px;
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
  color: #a4aabc;
  cursor: pointer;
  font-size: 1.2rem;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #a4aabc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  
  &:hover {
    background: #222b43;
    color: #fff;
  }
`;

const Content = styled.main`
  padding: 10px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const AdminSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #3a3f57;
`;

const PageTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  
  &:hover {
    background: #222b43;
  }
  
  select {
    cursor: pointer;
  }
`;

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t, language, languages, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentServerId = () => {
    const pathParts = location.pathname.split('/');
    const serverIndex = pathParts.indexOf('servers');
    if (serverIndex !== -1 && serverIndex + 1 < pathParts.length) {
      return pathParts[serverIndex + 1];
    }
    return null;
  };

  const currentServerId = getCurrentServerId();

  const mainItems = [
    { path: '/dashboard', icon: FiHome, label: t('nav.dashboard') },
    { path: '/servers', icon: FiServer, label: t('nav.servers') },
    { path: `/servers/${currentServerId || ':serverId'}/console`, icon: FiTerminal, label: t('nav.console') },
  ];
  
  const managementItems = [
    { path: '/instances', icon: FiPackage, label: t('nav.instances') },
    { path: '/resources', icon: FiActivity, label: t('nav.resources') },
    { path: '/tasks', icon: FiSettings, label: t('nav.tasks') },
    { path: '/admin/database', icon: FcDatabase, label: t('nav.database') },
  ];
  
  const adminItems = [
    { path: '/admin/users', icon: FiUsers, label: t('nav.users') },
    { path: '/admin/agents', icon: FiServer, label: t('nav.agents') },
    { path: '/admin/bedrock-versions', icon: FiBox, label: t('nav.bedrock') },
    { path: '/admin/addons', icon: FiPackage, label: t('nav.addons') },
    { path: '/permissions', icon: FiShield, label: t('nav.permissions') },
    { path: '/admin/settings', icon: FiSettings, label: t('nav.settings') },
    { path: '/support', icon: FiHelpCircle, label: t('nav.support') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const { title, icon: Icon } = usePageTitle();

  return (
    <LayoutContainer>
      <Sidebar $isOpen={isSidebarOpen}>
        <SidebarHeader>
          <LogoIcon>
            <FiServer />
          </LogoIcon>
          <LogoText>{t('app.name')}</LogoText>
        </SidebarHeader>
        
        <Nav>
          <MenuCategory>{t('menu.main')}</MenuCategory>
          <MenuList>
            {mainItems.map((item) => (
              <MenuItem
                key={item.path}
                $isActive={isActive(item.path)}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </MenuItem>
            ))}
          </MenuList>

          <MenuCategory>{t('menu.management')}</MenuCategory>
          <MenuList>
            {managementItems.map((item) => (
              <MenuItem
                key={item.path}
                $isActive={isActive(item.path)}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </MenuItem>
            ))}
          </MenuList>

          <MenuCategory>{t('menu.administration')}</MenuCategory>
          <MenuList>
            {adminItems.map((item) => (
              <MenuItem
                key={item.path}
                $isActive={isActive(item.path)}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </MenuItem>
            ))}
          </MenuList>
        </Nav>
      </Sidebar>

      <MainContent>
        <Content>
        <Header>
      	  <MenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </MenuButton>
        <PageTitle>{Icon && <Icon style={{ marginRight: '10px' }} />}
        {title}</PageTitle>
<UserInfo> 
              <LanguageSelector>
                <FiGlobe />
                <select 
                  value={language} 
                  onChange={(e) => changeLanguage(e.target.value)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#a4aabc',
                    outline: 'none'
                  }}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </LanguageSelector>

  <UserAvatar>{user?.username?.charAt(0)?.toUpperCase() || 'U'}</UserAvatar>
  <UserName>{user?.username || 'User'}</UserName>
  
  <LogoutButton 
    onClick={() => navigate('/user-settings')}
    style={{ background: 'transparent' }}
  >
    <FiUser />
    {t('nav.account')}
  </LogoutButton>
  
  <LogoutButton onClick={handleLogout}>
    <FiLogOut />
    {t('nav.logout')}
  </LogoutButton>
</UserInfo>
	</Header>
          {children}
        </Content>
      </MainContent>
    </LayoutContainer>
  );
}

export default Layout;
