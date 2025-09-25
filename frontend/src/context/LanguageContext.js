// context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { translations, defaultLanguage, languages } from '../services/locales';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { user, updateUserLanguage } = useAuth();
  const [language, setLanguage] = useState(defaultLanguage);

  // Initialize language from user preferences or localStorage
  useEffect(() => {
    const initializeLanguage = () => {
      // Priority 1: User's language preference from auth context
      if (user?.language) {
        setLanguage(user.language);
        localStorage.setItem('preferred-language', user.language);
        return;
      }
      
      // Priority 2: Language from localStorage
      const savedLanguage = localStorage.getItem('preferred-language');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
        return;
      }
      
      // Priority 3: Browser language or default
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) {
        setLanguage(browserLang);
        localStorage.setItem('preferred-language', browserLang);
      } else {
        setLanguage(defaultLanguage);
        localStorage.setItem('preferred-language', defaultLanguage);
      }
    };

    initializeLanguage();
  }, [user]);

const t = (key, params = {}) => {
  try {
    let translation;

    if (translations[language] && translations[language][key] !== undefined) {
      translation = translations[language][key];
    } else if (translations[defaultLanguage] && translations[defaultLanguage][key] !== undefined) {
      translation = translations[defaultLanguage][key];
    } else {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
      });
    }
    
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
};

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      localStorage.setItem('preferred-language', newLanguage);
      
      // Update language in user profile if user is logged in
      if (user && updateUserLanguage) {
        updateUserLanguage(newLanguage);
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    languages,
    t,
    changeLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
