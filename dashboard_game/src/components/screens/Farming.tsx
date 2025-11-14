import React from 'react';
import { ArrowLeft, Gamepad2, Clock, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface FarmingProps {
  onBack: () => void;
}

const Farming: React.FC<FarmingProps> = ({ onBack }) => {
  const { isDark } = useTheme();

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Фарминг
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Coming Soon */}
      <div className={`rounded-2xl p-8 text-center shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gamepad2 className="w-10 h-10 text-white" />
        </div>
        
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Скоро!
        </h2>
        
        <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Игровая система фарминга DashEcos Coin
        </p>
        
        <div className="space-y-4">
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Star className="w-5 h-5 text-yellow-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Мини-игры для заработка монет
            </span>
          </div>
          
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Clock className="w-5 h-5 text-blue-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Ежедневные задания
            </span>
          </div>
          
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Gamepad2 className="w-5 h-5 text-orange-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Интерактивные активности
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Farming;
