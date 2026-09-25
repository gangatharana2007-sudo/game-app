import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-50 text-xs py-2 px-4 flex items-center justify-center gap-2 font-semibold shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-950 border-b border-emerald-500/40 text-emerald-300'
          : 'bg-rose-950 border-b border-rose-500/40 text-rose-200 animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Connection restored. Synchronizing tournament telemetry with authoritative server...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-rose-400" />
          <span>Network connection disconnected. Grace period timer is running. Reconnecting...</span>
        </>
      )}
    </div>
  );
};
