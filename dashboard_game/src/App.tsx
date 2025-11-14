import { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import Navigation from './components/Navigation';
import Home from './components/screens/Home';
import Dashboard from './components/screens/Dashboard';
import Profile from './components/screens/Profile';
import UserManagement from './components/screens/UserManagement';
import EventsManagement from './components/screens/EventsManagement';
import UserMessages from './components/screens/UserMessages';
import TeacherRequests from './components/screens/TeacherRequests';
import EmailConfirmation from './components/screens/EmailConfirmation';
import PasswordReset from './components/screens/PasswordReset';
import ThemeToggle from './components/ThemeToggle';
import { LOGO_PATH } from './utils/paths';

function App() {
  const { isDark } = useTheme();
  const [activeScreen, setActiveScreen] = useState<'home' | 'dashboard' | 'profile' | 'email-confirmation' | 'password-reset' | 'user-management' | 'events-management' | 'user-messages' | 'teacher-requests'>(() => {
    // Восстанавливаем активный экран из localStorage
    const savedScreen = localStorage.getItem('ecos_active_screen');
    return (savedScreen as 'home' | 'dashboard' | 'profile' | 'email-confirmation' | 'password-reset' | 'user-management' | 'events-management' | 'user-messages' | 'teacher-requests') || 'dashboard';
  });


  const [isLoading, setIsLoading] = useState(true);
  
  // Состояние для экрана подтверждения Email
  const [emailConfirmationData, setEmailConfirmationData] = useState<{
    email: string;
    onConfirm: (code: string) => Promise<void>;
    onResend: (code: string) => Promise<void>;
    onBack: () => void;
  } | null>(null);

  // Функция для принудительного перехода к экрану входа
  const forceGoToLogin = (confirmedEmail?: string) => {
    setActiveScreen('profile');
    setEmailConfirmationData(null);
    localStorage.setItem('ecos_active_screen', 'profile');
    // Сохраняем подтвержденный email для автозаполнения формы входа
    if (confirmedEmail) {
      localStorage.setItem('ecos_confirmed_email', confirmedEmail);
    }
  };

  // Функция для перехода к экрану восстановления пароля
  const goToPasswordReset = () => {
    setActiveScreen('password-reset');
    localStorage.setItem('ecos_active_screen', 'password-reset');
  };

  useEffect(() => {
    console.log('App component mounted');
    setIsLoading(false);
  }, []);

  // Сохраняем активный экран в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('ecos_active_screen', activeScreen);
    }, [activeScreen]);

  // Блокируем скролл body при открытых модалках
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
 
  // Слушаем изменения в localStorage для обновления активного экрана
  useEffect(() => {
    const handleStorageChange = () => {
      const savedScreen = localStorage.getItem('ecos_active_screen');
      if (savedScreen && savedScreen !== activeScreen) {
        setActiveScreen(savedScreen as 'home' | 'mining' | 'dashboard' | 'profile' | 'email-confirmation');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeScreen]);

  const renderScreen = () => {
    
    // Определяем основной экран
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
      case 'teacher-requests':
        mainScreen = <TeacherRequests />;
        break;
      default:
        mainScreen = <Dashboard />;
    }

    // Если активен экран подтверждения или восстановления, показываем модальное окно поверх основного
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-orange-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка ECOS Mining Game...</p>
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-50 via-orange-50 to-blue-50'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-md shadow-sm sticky top-0 z-40 transition-colors duration-300 ${
        isDark ? 'bg-gray-900/80' : 'bg-white/80'
      }`}>
        <div className="max-w-md mx-auto px-4 py-4 md:max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-600 shadow-lg">
                <img 
                  src={LOGO_PATH} 
                  alt="ECOS Mining Game Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                ECOS
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-8">
        {renderScreen()}
      </main>

      {/* Bottom Navigation - всегда видна */}
      <Navigation activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      

    </div>
  );
}

export default App;