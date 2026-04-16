'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'ta' | 'hi'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations = {
  en: {
    'welcome': 'Welcome',
    'login': 'Login',
    'register': 'Register',
    'username': 'Username',
    'password': 'Password',
    'email': 'Email',
    'full_name': 'Full Name',
  },
  ta: {
    'welcome': 'Welcome',
    'login': 'Login',
    'register': 'Register',
    'username': 'Username',
    'password': 'Password',
    'email': 'Email',
    'full_name': 'Full Name',
  },
  hi: {
    'welcome': 'Welcome',
    'login': 'Login',
    'register': 'Register',
    'username': 'Username',
    'password': 'Password',
    'email': 'Email',
    'full_name': 'Full Name',
  },
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['en', 'ta', 'hi'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  return (
    <I18nContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      t,
    }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}



