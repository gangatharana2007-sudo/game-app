import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Language, translations, Translations } from '../lib/i18n.js';
import { PlayerProfile, User, UserRole } from '../types/database.js';

interface AuthContextType {
  user: User | null;
  profile: PlayerProfile | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  register: (data: { email: string; displayName: string; preferredLanguage?: 'en' | 'ta' }) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  switchDemoUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo_player_1',
    email: 'player1@demo.nexora.arena',
    displayName: 'Arun Kumar',
    role: 'player',
    emailVerified: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [profile, setProfile] = useState<PlayerProfile | null>({
    id: 'demo_player_1',
    userId: 'demo_player_1',
    anonymousAlias: 'Player-4821',
    skillRating: 1650,
    matchesPlayed: 12,
    matchesWon: 7,
    matchesLost: 5,
    tournamentWins: 1,
    fairPlayScore: 98,
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language];

  // Refresh profile from backend if user exists
  useEffect(() => {
    if (user?.id) {
      api.getProfile(user.id)
        .then((res) => {
          if (res.profile) setProfile(res.profile);
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email });
      setUser(res.user);
      setProfile(res.profile);
      if (res.profile?.preferredLanguage) {
        setLanguage(res.profile.preferredLanguage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; displayName: string; preferredLanguage?: 'en' | 'ta' }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setProfile(res.profile);
      if (data.preferredLanguage) {
        setLanguage(data.preferredLanguage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
  };

  const switchRole = async (role: UserRole) => {
    if (!user) return;
    try {
      const res = await api.switchRole(user.id, role);
      setUser(res.user);
      if (res.profile) setProfile(res.profile);
    } catch (e) {
      console.error('Role switch failed:', e);
    }
  };

  const switchDemoUser = async (userId: string) => {
    try {
      const res = await api.getProfile(userId);
      if (res.user && res.profile) {
        setUser({
          id: res.user.id!,
          email: `${userId}@demo.nexora.arena`,
          displayName: res.user.displayName || 'Demo User',
          role: (res.user.role as UserRole) || 'player',
          emailVerified: true,
          status: (res.user.status as any) || 'active',
          createdAt: res.profile.createdAt,
          updatedAt: res.profile.updatedAt,
        });
        setProfile(res.profile);
      }
    } catch (e) {
      console.error('Demo user switch failed:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        language,
        setLanguage,
        t,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
