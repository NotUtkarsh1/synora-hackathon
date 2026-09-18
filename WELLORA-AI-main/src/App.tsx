import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HealthOverview } from './components/HealthOverview';
import { HealthTrends } from './components/HealthTrends';
import { AiHealthGuide } from './components/AiHealthGuide';
import { IntentRouting } from './components/IntentRouting';
import { MealScanner } from './components/MealScanner';
import { FitnessOverview } from './components/FitnessOverview';
import { NutritionOverview } from './components/NutritionOverview';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { SettingsPanel } from './components/SettingsPanel';
import { FitnessCoach } from './components/FitnessCoach';
import { UserHealthProfile } from './types';

export default function App() {
  // Landing page is the first page users see
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Sub-feature 4.1: User health profile lifted state (defaults to include diabetes)
  const [userProfile, setUserProfile] = useState<UserHealthProfile>({
    name: 'Alex Rivera',
    age: 30,
    activityLevel: 'Moderate',
    conditions: ['diabetes'],
    allergies: [],
    dietaryPreferences: ['Balanced whole foods'],
  });

  // Handle opening auth dialog
  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Switch to app dashboard and optional target tab
  const handleEnterApp = (targetTab: string = 'dashboard') => {
    setCurrentView('app');
    handleSelectTab(targetTab);
  };

  // Handle section scrolling or view switching
  const handleSelectTab = (tabId: string) => {
    if (tabId === 'landing') {
      setCurrentView('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Ensure we are in dashboard view
    setCurrentView('app');
    setCurrentTab(tabId);

    if (tabId === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionMap: Record<string, string> = {
      'intent-routing': 'intent-routing-section',
      'ai-guide': 'ai-health-guide-section',
      'monitor': 'health-overview-section',
      'meal-scanner': 'meal-scanner-section',
      'fitness': 'fitness-overview-section',
      'fitness-coach': 'fitness-coach-section',
      'nutrition': 'nutrition-overview-section',
      'settings': 'settings-panel-section',
    };

    const targetId = sectionMap[tabId];
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case 'monitor':
        return 'Health Overview';
      case 'intent-routing':
        return 'Intent Routing Engine';
      case 'ai-guide':
        return 'AI Health Guide';
      case 'meal-scanner':
        return 'Meal Scanner';
      case 'fitness':
        return 'Fitness Overview';
      case 'fitness-coach':
        return 'AI Fitness Coach';
      case 'nutrition':
        return 'Nutrition Overview';
      case 'settings':
        return 'Settings & Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <TelemetryProvider>
      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccessfulAuth={() => {
          setCurrentView('app');
        }}
      />

      {currentView === 'landing' ? (
        /* Front / Landing Page (First page users see) */
        <LandingPage
          onGetStarted={() => handleOpenAuth('register')}
          onExplore={() => handleEnterApp('dashboard')}
          onNavigateAiGuide={() => handleEnterApp('ai-guide')}
          onNavigateNutrition={() => handleEnterApp('nutrition')}
          onLogin={() => handleOpenAuth('login')}
          onRegister={() => handleOpenAuth('register')}
        />
      ) : (
        /* Full Health Dashboard Application */
        <div className="min-h-screen flex bg-sage-dark text-wellness-dark font-sans selection:bg-beige-cream selection:text-wellness-dark">
          {/* Sidebar Navigation */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Main Viewport Container */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-sage-dark">
            {/* Header */}
            <Header
              title={getHeaderTitle()}
              onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
              onGoHome={() => setCurrentView('landing')}
              onOpenAuth={handleOpenAuth}
              userProfile={userProfile}
            />

            {/* Dashboard Content Canvas on Sage Green Background */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 sm:space-y-10 pb-16">
              {/* Profile & Settings (visible at top if active, or integrated otherwise) */}
              {currentTab === 'settings' && (
                <SettingsPanel userProfile={userProfile} onChange={setUserProfile} />
              )}

              {/* Section 1: Health Overview */}
              <HealthOverview />

              {/* Section 2: AI Health Guide with intent classifier & clarification */}
              <AiHealthGuide 
                userProfile={userProfile} 
                onNavigateToIntentRouting={() => handleSelectTab('intent-routing')} 
              />

              {/* Section 3: Meal Scanner */}
              <MealScanner userProfile={userProfile} />

              {/* Section 4: Intent Routing Architecture & Classifier Testbed */}
              <section id="intent-routing-section">
                <IntentRouting onNavigateToChat={() => handleSelectTab('ai-guide')} />
              </section>

              {/* Section 5: Health Trends */}
              <HealthTrends />

              {/* Section 6: Fitness Overview */}
              <FitnessOverview onNavigateToChat={() => handleSelectTab('ai-guide')} />

              {/* Section 6.5: Fitness Coach */}
              <FitnessCoach userProfile={userProfile} />

              {/* Section 7: Nutrition Overview */}
              <NutritionOverview />
            </main>
          </div>
        </div>
      )}
    </TelemetryProvider>
  );
}
