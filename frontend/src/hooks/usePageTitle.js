// hooks/usePageTitle.js
import { useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiServer, 
  FiTerminal, 
  FiFile, 
  FiSettings, 
  FiPackage,
  FiGrid,
  FiUser,
  FiUsers,
  FiDownload,
  FiBox
} from 'react-icons/fi';
import { ImQuestion } from "react-icons/im";

const routeConfig = {
  '/': {
    title: 'Dashboard',
    icon: FiHome
  },
  '/servers': {
    title: 'Twoje Serwery',
    icon: FiServer
  },
  '/servers/:id': {
    title: 'Zarządzanie Serwerem',
    icon: FiServer
  },
  '/servers/:id/console': {
    title: 'Konsola',
    icon: FiTerminal
  },
  '/servers/:id/files': {
    title: 'Pliki',
    icon: FiFile
  },
  '/servers/:id/settings': {
    title: 'Ustawienia',
    icon: FiSettings
  },
  '/servers/:id/plugins': {
    title: 'Pluginy',
    icon: FiPackage
  },
  '/servers/:id/users': {
    title: 'Użytkownicy',
    icon: FiUsers
  },
  '/servers/:id/backups': {
    title: 'Backup Manager',
    icon: FiDownload
  },
  '/dashboard': {
    title: 'Panel Sterowania',
    icon: FiGrid
  },
  '/settings': {
    title: 'Ustawienia Systemu',
    icon: FiSettings
  },
  '/plugins': {
    title: 'Marketplace Pluginów',
    icon: FiPackage
  },
  '/profile': {
    title: 'Profil Użytkownika',
    icon: FiUser
  },
  '/support': {
    title: 'Support',
    icon: ImQuestion
  },
  '/admin/bedrock-versions': {
    title: 'Zarządzanie Wersjami Bedrock',
    icon: FiBox
  },
  '/admin/addons': {
    title: 'Addon Manager',
    icon: FiPackage
  },
  '/admin/users': {
    title: 'Users',
    icon: FiUsers
  },
  '/admin/settings': {
    title: 'Settings',
    icon: FiSettings
  }
};

export const usePageTitle = () => {
  const location = useLocation();
  
  // Znajdź pasującą ścieżkę
  const findMatchingPath = () => {
    // Sprawdź dokładne dopasowanie
    if (routeConfig[location.pathname]) {
      return routeConfig[location.pathname];
    }
    
    // Sprawdź ścieżki z parametrami (np. /servers/123)
    for (const path in routeConfig) {
      if (path.includes(':')) {
        const pathPattern = path.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${pathPattern}$`);
        if (regex.test(location.pathname)) {
          return routeConfig[path];
        }
      }
    }
    
    return {
      title: 'Strona Główna',
      icon: FiHome
    };
  };

  return findMatchingPath();
};

// Alternatywna wersja zwracająca tylko tytuł (dla kompatybilności wstecznej)
export const usePageTitleOnly = () => {
  const { title } = usePageTitle();
  return title;
};
