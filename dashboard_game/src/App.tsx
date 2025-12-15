import { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import Home from './components/screens/Home';
import Dashboard from './components/screens/Dashboard';
import Profile from './components/screens/Profile';
import UserManagement from './components/screens/UserManagement';
import EventsManagement from './components/screens/EventsManagement';
import UserMessages from './components/screens/UserMessages';
import EmailConfirmation from './components/screens/EmailConfirmation';
import PasswordReset from './components/screens/PasswordReset';
import ThemeToggle from './components/ThemeToggle';
import { LOGO_PATH } from './utils/paths';

function App() {
  const { isDark } = useTheme();
  const [activeScreen, setActiveScreen] = useState<'home' | 'dashboard' | 'profile' | 'email-confirmation' | 'password-reset' | 'user-management' | 'events-management' | 'user-messages'>(() => {
    const savedScreen = localStorage.getItem('ecos_active_screen');
    return (savedScreen as 'home' | 'dashboard' | 'profile' | 'email-confirmation' | 'password-reset' | 'user-management' | 'events-management' | 'user-messages') || 'dashboard';
  });

  const [isLoading, setIsLoading] = useState(true);
  
  const [emailConfirmationData, setEmailConfirmationData] = useState<{
    email: string;
    onConfirm: (code: string) => Promise<void>;
    onResend: (code: string) => Promise<void>;
    onBack: () => void;
  } | null>(null);

  const forceGoToLogin = (confirmedEmail?: string) => {
    setActiveScreen('profile');
    setEmailConfirmationData(null);
    localStorage.setItem('ecos_active_screen', 'profile');
    if (confirmedEmail) {
      localStorage.setItem('ecos_confirmed_email', confirmedEmail);
    }
  };

  const goToPasswordReset = () => {
    setActiveScreen('password-reset');
    localStorage.setItem('ecos_active_screen', 'password-reset');
  };

  useEffect(() => {
    console.log('App component mounted');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('ecos_active_screen', activeScreen);
    }, [activeScreen]);

  useEffect(() => {
    const isModalOpen = activeScreen === 'email-confirmation' || activeScreen === 'password-reset';
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeScreen]);
 
  useEffect(() => {
    const handleStorageChange = () => {
      const savedScreen = localStorage.getItem('ecos_active_screen');
      if (savedScreen && savedScreen !== activeScreen) {
        setActiveScreen(savedScreen as 'home' | 'dashboard' | 'profile' | 'email-confirmation');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeScreen]);

  const renderScreen = () => {
    let mainScreen;
    switch (activeScreen) {
      case 'home':
        mainScreen = <Home />;
        break;
      case 'dashboard':
        mainScreen = <Dashboard />;
        break;
      case 'profile':
        mainScreen = <Profile 
          onShowEmailConfirmation={(data) => {
            setEmailConfirmationData(data);
            setActiveScreen('email-confirmation');
          }}
          onForceGoToLogin={forceGoToLogin}
          onGoToPasswordReset={goToPasswordReset}
        />;
        break;
      case 'user-management':
        mainScreen = <UserManagement />;
        break;
      case 'events-management':
        mainScreen = <EventsManagement />;
        break;
      case 'user-messages':
        mainScreen = <UserMessages />;
        break;
      default:
        mainScreen = <Dashboard />;
    }

    if (activeScreen === 'email-confirmation' && emailConfirmationData) {
      return (
        <>
          {mainScreen}
          <EmailConfirmation
            email={emailConfirmationData.email}
            onConfirm={emailConfirmationData.onConfirm}
            onResend={emailConfirmationData.onResend}
            onBack={() => {
              setActiveScreen('profile');
            }}
            isLoading={false}
          />
        </>
      );
    }

    if (activeScreen === 'password-reset') {
      return (
        <>
          <Profile 
            onShowEmailConfirmation={(data) => {
              setEmailConfirmationData(data);
              setActiveScreen('email-confirmation');
            }}
            onForceGoToLogin={forceGoToLogin}
            onGoToPasswordReset={goToPasswordReset}
          />
          <PasswordReset onBack={() => setActiveScreen('profile')} />
        </>
      );
    }

    return mainScreen;
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
        <div className={`text-center p-8 ${isDark ? 'neu-card' : 'bg-white rounded-2xl shadow-xl'}`}>
          <div className="w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`font-mono text-sm tracking-wider ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            {isDark ? 'INITIALIZING SYSTEM...' : 'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-[#1a1a1a]' 
        : 'bg-gray-100'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 transition-colors duration-300 ${
        isDark 
          ? 'neu-header' 
          : 'bg-white shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl overflow-hidden ${
                isDark ? 'neu-card-sm' : 'shadow-lg'
              }`}>
                <img 
                  src={LOGO_PATH} 
                  alt="ECOS Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                ECOS
              </h1>
                <p className={`text-xs font-mono ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  {isDark ? 'TACTICAL DASHBOARD' : 'Mining Game'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isDark && (
            <div className="flex items-center space-x-2">
                  <div className="neu-status neu-status-active"></div>
                  <span className="text-xs text-neutral-400 font-mono">ONLINE</span>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24 md:pb-8">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeScreen={activeScreen} onScreenChange={setActiveScreen} />
    </div>
  );
}

export default App;
