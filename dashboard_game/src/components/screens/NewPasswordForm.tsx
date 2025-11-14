import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

interface NewPasswordFormProps {
  email: string;
  resetCode: string;
  onSubmit: (newPassword: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

const NewPasswordForm: React.FC<NewPasswordFormProps> = ({
  email,
  resetCode,
  onSubmit,
  onBack,
  isLoading
}) => {
  const { isDark } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    await onSubmit(newPassword);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-orange-500/20' : 'bg-orange-500/10'
          }`}>
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            Новый пароль
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Придумайте новый пароль для аккаунта
          </p>
          <p className={`text-sm font-medium text-orange-500 ${
            isDark ? 'text-orange-500' : 'text-orange-600'
          }`}>
            {email}
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Новый пароль */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Придумайте новый пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
                placeholder="Минимум 6 символов"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Укажите новый пароль повторно
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
                placeholder="Повторите пароль"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Ошибка */}
          {error && (
            <div className={`p-3 rounded-lg text-sm text-center ${
              isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600'
            }`}>
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Обновление...' : 'Подтвердить новый пароль'}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              className={`w-full px-4 py-3 text-sm ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              } hover:underline transition-colors flex items-center justify-center space-x-2`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Вернуться к вводу кода</span>
            </button>
          </div>
        </form>

        {/* Подсказка */}
        <div className={`mt-6 p-3 rounded-lg text-xs text-center ${
          isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'
        }`}>
          После изменения пароля вы сможете войти в систему
        </div>
      </div>
    </div>
  );
};

export default NewPasswordForm; 