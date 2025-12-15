import React from 'react';
import { Home, BarChart3, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationProps {
  activeScreen: string;
  onScreenChange: (screen: any) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeScreen, onScreenChange }) => {
  const { isDark } = useTheme();

  const navItems = [
    { id: 'home', label: isDark ? 'HOME' : 'Главная', icon: Home },
    { id: 'dashboard', label: isDark ? 'DASHBOARD' : 'Дашборд', icon: BarChart3 },
    { id: 'profile', label: isDark ? 'PROFILE' : 'Профиль', icon: User }
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300 ${
      isDark 
        ? 'neu-nav' 
        : 'bg-white border-t border-gray-200 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id)}
                className={`flex flex-col items-center py-2 px-6 rounded-xl transition-all duration-200 ${
                  isDark
                    ? isActive 
                      ? 'neu-nav-item-active' 
                      : 'text-neutral-500 hover:text-orange-400'
                    : isActive 
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-500 hover:text-orange-500'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`} />
                <span className={`text-xs font-medium ${isDark ? 'tracking-wider' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
