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
import { useLanguage } from '../context/LanguageContext';

const routeConfig = {
  '/': {
    translationKey: 'page.dashboard',
    icon: FiHome
  },
  '/dashboard': {
    translationKey: 'page.dashboard',
    icon: FiGrid
  },
  '/servers': {
    translationKey: 'page.servers',
    icon: FiServer
  },
  '/servers/:id': {
    translationKey: 'page.server.management',
    icon: FiServer
  },
  '/servers/:id/console': {
    translationKey: 'page.console',
    icon: FiTerminal
  },
  '/servers/:id/files': {
    translationKey: 'page.files',
    icon: FiFile
  },
  '/servers/:id/settings': {
    translationKey: 'page.server.settings',
    icon: FiSettings
  },
  '/servers/:id/plugins': {
    translationKey: 'page.plugins',
    icon: FiPackage
  },
  '/servers/:id/users': {
    translationKey: 'page.server.users',
    icon: FiUsers
  },
  '/servers/:id/backups': {
    translationKey: 'page.backups',
    icon: FiDownload
  },
  '/user-settings': {
    translationKey: 'page.account',
    icon: FiUser
  },
  '/support': {
    translationKey: 'page.support',
    icon: ImQuestion
  },
  '/admin/bedrock-versions': {
    translationKey: 'page.bedrock',
    icon: FiBox
  },
  '/admin/addons': {
    translationKey: 'page.addons',
    icon: FiPackage
  },
  '/admin/users': {
    translationKey: 'page.users',
    icon: FiUsers
  },
  '/admin/settings': {
    translationKey: 'page.settings',
    icon: FiSettings
  }
};

const defaultConfig = {
  translationKey: 'page.dashboard',
  icon: FiHome
};

export const usePageTitle = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const findMatchingPath = () => {
    if (routeConfig[location.pathname]) {
      const config = routeConfig[location.pathname];
      return {
        title: t(config.translationKey),
        icon: config.icon
      };
    }
    
    for (const path in routeConfig) {
      if (path.includes(':')) {
        const pathPattern = path.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${pathPattern}$`);
        if (regex.test(location.pathname)) {
          const config = routeConfig[path];
          return {
            title: t(config.translationKey),
            icon: config.icon
          };
        }
      }
    }
    
    return {
      title: t(defaultConfig.translationKey),
      icon: defaultConfig.icon
    };
  };

  return findMatchingPath();
};

export const usePageTitleOnly = () => {
  const { title } = usePageTitle();
  return title;
};
