import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { MotionProvider } from './context/MotionContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { OfflineBanner } from './components/OfflineBanner.js';
import { AnimatedArenaBackground } from './components/AnimatedArenaBackground.js';
import { MotionDevInspector } from './components/MotionEffectsSelector.js';

// 20 Core Pages
import { LandingPage } from './pages/LandingPage.js';
import { AuthPage } from './pages/AuthPage.js';
import { PlayerDashboard } from './pages/PlayerDashboard.js';
import { TournamentDiscoveryPage } from './pages/TournamentDiscoveryPage.js';
import { TournamentDetailsPage } from './pages/TournamentDetailsPage.js';
import { TournamentRegistrationPage } from './pages/TournamentRegistrationPage.js';
import { TeamsPage } from './pages/TeamsPage.js';
import { MatchSchedulePage } from './pages/MatchSchedulePage.js';
import { PreMatchLobbyPage } from './pages/PreMatchLobbyPage.js';
import { LiveGamePage } from './pages/LiveGamePage.js';
import { ResultPage } from './pages/ResultPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { MatchHistoryPage } from './pages/MatchHistoryPage.js';
import { DisputesPage } from './pages/DisputesPage.js';
import { OrganizerDashboard } from './pages/OrganizerDashboard.js';
import { ModeratorDashboard } from './pages/ModeratorDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { RulesPolicyPage } from './pages/RulesPolicyPage.js';
import { PrivacyConsentPage } from './pages/PrivacyConsentPage.js';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pageParams, setPageParams] = useState<any>({
    tournamentId: 'tourn_active_apex_1',
    matchId: 'match_tourn_active_apex_1_r1_m1',
  });

  const handleNavigate = (page: string, params?: any) => {
    if (params) {
      setPageParams((prev: any) => ({ ...prev, ...params }));
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthPage onNavigate={handleNavigate} />;
      case 'player-dashboard':
        return <PlayerDashboard onNavigate={handleNavigate} />;
      case 'tournaments':
        return <TournamentDiscoveryPage onNavigate={handleNavigate} />;
      case 'tournament-details':
        return (
          <TournamentDetailsPage
            tournamentId={pageParams.tournamentId || 'tourn_active_apex_1'}
            onNavigate={handleNavigate}
          />
        );
      case 'tournament-registration':
        return (
          <TournamentRegistrationPage
            tournamentId={pageParams.tournamentId || 'tourn_active_apex_1'}
            onNavigate={handleNavigate}
          />
        );
      case 'teams':
        return <TeamsPage onNavigate={handleNavigate} />;
      case 'my-matches':
        return <MatchSchedulePage onNavigate={handleNavigate} />;
      case 'match-room':
      case 'pre-match-lobby':
        return (
          <PreMatchLobbyPage
            matchId={pageParams.matchId || 'match_tourn_active_apex_1_r1_m1'}
            onNavigate={handleNavigate}
          />
        );
      case 'live-game':
        return (
          <LiveGamePage
            matchId={pageParams.matchId || 'match_tourn_active_apex_1_r1_m1'}
            onNavigate={handleNavigate}
          />
        );
      case 'result-page':
        return (
          <ResultPage
            matchId={pageParams.matchId || 'match_tourn_active_apex_1_r1_m1'}
            onNavigate={handleNavigate}
          />
        );
      case 'leaderboard':
        return <LeaderboardPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'match-history':
        return <MatchHistoryPage onNavigate={handleNavigate} />;
      case 'disputes':
        return <DisputesPage onNavigate={handleNavigate} />;
      case 'organizer-dashboard':
        return <OrganizerDashboard onNavigate={handleNavigate} />;
      case 'moderator-dashboard':
        return <ModeratorDashboard onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'rules':
        return <RulesPolicyPage />;
      case 'privacy':
        return <PrivacyConsentPage />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black relative">
      {/* Reusable GPU-accelerated Animated Arena Background (Layer 0) */}
      <AnimatedArenaBackground currentPage={currentPage} />

      {/* Main Content Surfaces (Layer 10, strictly above background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <OfflineBanner />
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1">{renderPage()}</main>
        <Footer onNavigate={handleNavigate} />
        <MotionDevInspector currentPage={currentPage} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <MotionProvider>
            <AppContent />
          </MotionProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
