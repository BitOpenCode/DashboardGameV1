import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Settings, User, Mail, Lock } from 'lucide-react';
import ChangePasswordConfirmation from './ChangePasswordConfirmation';
import AvatarSelection from './AvatarSelection';

interface ProfileSettingsProps {
  user: {
    email: string;
    name?: string;
    role?: string;
    avatar_id?: number;
    avatar_name?: string;
    avatar_image?: string;
    avatar_rarity?: string;
  } | null;
  onBack: () => void;
  onProfileUpdate?: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onBack, onProfileUpdate }) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType] = useState<'success' | 'error'>('success');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);

  const handleChangePassword = async () => {
    if (!user?.email) {
      setMessage('Ошибка: email пользователя не найден');
      setMessageType('error');
      return;
    }

    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setMessage('Ошибка: пользователь не авторизован');
        setMessageType('error');
        return;
      }

      // Отправляем запрос на отправку кода подтверждения
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/change-password-request-dashecos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          resend: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowChangePassword(true);
        setMessage('');
      } else {
        setMessage(data.error || 'Ошибка отправки кода подтверждения');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Ошибка отправки кода:', error);
      setMessage('Ошибка сети. Попробуйте еще раз.');
      setMessageType('error');
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    setMessage('Пароль успешно изменен!');
    setMessageType('success');
  };

  // Если открыт экран изменения пароля, показываем его
  if (showChangePassword) {
    return (
      <ChangePasswordConfirmation
        email={user?.email || ''}
        onBack={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
        isDark={isDark}
      />
    );
  }

  // Если открыт экран выбора аватара, показываем его
  if (showAvatarSelection) {
    return (
      <AvatarSelection
        onBack={() => {
          setShowAvatarSelection(false);
          onProfileUpdate?.(); // Обновляем профиль после выбора аватара
        }}
        isDark={isDark}
        user={user}
      />
    );
  }



  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-lg transition-colors duration-300">
      {/* Заголовок с кнопкой назад */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg mr-4 transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Настройки профиля
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Управление настройками аккаунта
          </p>
        </div>
      </div>

      {/* Информация о пользователе */}
      <div className={`mb-6 p-4 rounded-xl ${
        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center space-x-3 mb-3">
          <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {user?.name || 'Имя не указано'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Mail className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {user?.email}
          </span>
        </div>
      </div>

      {/* Настройки аватара */}
      <div className={`mb-6 rounded-xl p-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Настройки аватара
        </h3>
        <div className="flex items-center space-x-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            {user?.avatar_image ? (
              <img 
                src={user.avatar_image} 
                alt={user.avatar_name || 'Аватар'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
              {user?.avatar_name ? user.avatar_name : 'Текущий аватар'}
            </p>
            {user?.avatar_rarity && (
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                Редкость: {user.avatar_rarity}
              </p>
            )}
            <button 
              onClick={() => setShowAvatarSelection(true)}
              className={`px-4 py-2 rounded-lg text-sm ${
                isDark ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-orange-500 text-white hover:bg-orange-600'
              } transition-colors`}
            >
              Изменить аватар
            </button>
          </div>
        </div>
      </div>

      {/* Изменение пароля */}
      <div className={`rounded-xl p-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Изменить пароль
        </h3>
        <div className="space-y-4">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Мы отправим код подтверждения на ваш email: <strong>{user?.email}</strong>
          </p>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${
              messageType === 'success' 
                ? (isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-50 text-orange-600')
                : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600')
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Lock className="w-5 h-5" />
            <span>{isLoading ? 'Отправка кода...' : 'Отправить код подтверждения'}</span>
          </button>
        </div>
      </div>




    </div>
  );
};

export default ProfileSettings; 