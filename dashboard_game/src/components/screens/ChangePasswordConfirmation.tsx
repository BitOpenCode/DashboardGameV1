import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordConfirmationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
  isDark: boolean;
}

const ChangePasswordConfirmation: React.FC<ChangePasswordConfirmationProps> = ({
  email,
  onBack,
  onSuccess,
  isDark
}) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  // Проверка совпадения паролей в реальном времени
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordError = newPassword && confirmPassword && !passwordsMatch ? 'Пароли не совпадают' : '';

  const handleVerifyCode = async () => {
    if (!confirmationCode || confirmationCode.length !== 6) {
      setError('Введите 6-значный код подтверждения');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (!passwordsMatch) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Ошибка: пользователь не авторизован');
        return;
      }

      // Отправляем запрос на изменение пароля сразу
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/change-password-confirm-dashecos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email,
          code: confirmationCode,
          newPassword: newPassword,
          action: 'password_reset_confirm'
        })
      });

      if (!response.ok) {
        if (response.status === 0) {
          throw new Error('CORS ошибка - сервер недоступен');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Неверный ответ от сервера');
      }

      if (data.success) {
        alert('Пароль успешно изменен!');
        onSuccess();
      } else {
        setError(data.error || 'Ошибка изменения пароля');
      }
    } catch (error) {
      console.error('Ошибка изменения пароля:', error);
      if (error.message.includes('CORS')) {
        setError('Ошибка CORS. Проверьте настройки сервера.');
      } else {
        setError(`Ошибка: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Ошибка: пользователь не авторизован');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/change-password-request-dashecos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email,
          resend: true
        })
      });

      if (!response.ok) {
        if (response.status === 0) {
          throw new Error('CORS ошибка - сервер недоступен');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Неверный ответ от сервера');
      }

      if (data.success) {
        alert('Код подтверждения отправлен повторно на ваш email!');
        setError('');
      } else {
        setError(data.error || 'Ошибка отправки кода');
      }
    } catch (error) {
      console.error('Ошибка отправки кода:', error);
      if (error.message.includes('CORS')) {
        setError('Ошибка CORS. Проверьте настройки сервера.');
      } else {
        setError(`Ошибка: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            Изменение пароля
          </h1>
          <div className="w-9"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Code Verification and Password Input Step */}
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-xl font-bold mb-2">Подтвердите ваш email</h2>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Мы отправили 6-значный код подтверждения на <strong>{email}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Код подтверждения
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Введите 6-значный код"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg tracking-widest ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                maxLength={6}
              />
            </div>

            {/* Поля для ввода нового пароля */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Новый пароль
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Впишите новый пароль повторно
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Показываем ошибку несовпадения паролей в реальном времени */}
            {passwordError && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-sm text-red-600">{passwordError}</p>
              </div>
            )}

            {error && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : `${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`
                }`}
              >
                {isLoading ? 'Отправка...' : 'Отправить код повторно'}
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || confirmationCode.length !== 6 || !newPassword || !confirmPassword || !passwordsMatch || newPassword.length < 6}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  isLoading || confirmationCode.length !== 6 || !newPassword || !confirmPassword || !passwordsMatch || newPassword.length < 6
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isLoading ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordConfirmation;
