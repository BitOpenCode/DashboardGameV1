import React from 'react';
import { ArrowLeft, CheckSquare, Heart, Share2, UserPlus, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TasksProps {
  onBack: () => void;
}

const Tasks: React.FC<TasksProps> = ({ onBack }) => {
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
          Задания
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Coming Soon */}
      <div className={`rounded-2xl p-8 text-center shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="w-20 h-20 bg-gradient-to-r from-[#94c356] to-[#7ba045] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckSquare className="w-10 h-10 text-white" />
        </div>
        
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Скоро!
        </h2>
        
        <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Система заданий для заработка DashEcos Coin
        </p>
        
        <div className="space-y-4">
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Heart className="w-5 h-5 text-red-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Поставить лайк в социальных сетях
            </span>
          </div>
          
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Share2 className="w-5 h-5 text-blue-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Поделиться в социальных сетях
            </span>
          </div>
          
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <UserPlus className="w-5 h-5 text-green-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Пригласить друзей
            </span>
          </div>
          
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Star className="w-5 h-5 text-yellow-500" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Ежедневные активности
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
