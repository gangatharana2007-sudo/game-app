import React, { createContext, useContext, useEffect, useState } from 'react';

export type MotionMode = 'full' | 'reduced' | 'off';

interface MotionContextType {
  motionMode: MotionMode;
  setMotionMode: (mode: MotionMode) => void;
  devToolsOpen: boolean;
  setDevToolsOpen: (open: boolean) => void;
  toggleDevTools: () => void;
}

const STORAGE_KEY = 'nexora_motion_effects';

const MotionContext = createContext<MotionContextType | undefined>(undefined);

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [motionMode, setMotionModeState] = useState<MotionMode>(() => {
    if (typeof window === 'undefined') return 'full';
    const saved = localStorage.getItem(STORAGE_KEY) as MotionMode | null;
    if (saved && (saved === 'full' || saved === 'reduced' || saved === 'off')) {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'reduced';
    }
    return 'full';
  });

  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // Sync to document attribute & localStorage
  const setMotionMode = (mode: MotionMode) => {
    setMotionModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
      document.documentElement.setAttribute('data-motion-mode', mode);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-motion-mode', motionMode);
    }
  }, [motionMode]);

  // Listen to system prefers-reduced-motion changes if user hasn't explicitly set localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setMotionMode(e.matches ? 'reduced' : 'full');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Developer hotkey: Alt + M to toggle the developer debug preview panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setDevToolsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDevTools = () => setDevToolsOpen((prev) => !prev);

  return (
    <MotionContext.Provider
      value={{
        motionMode,
        setMotionMode,
        devToolsOpen,
        setDevToolsOpen,
        toggleDevTools,
      }}
    >
      {children}
    </MotionContext.Provider>
  );
};

export const useMotion = () => {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotion must be used within MotionProvider');
  }
  return context;
};
