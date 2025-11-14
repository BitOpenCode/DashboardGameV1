import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, KeyRound } from 'lucide-react';

interface PasswordResetCodeProps {
  email: string;
  onConfirm: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

const PasswordResetCode: React.FC<PasswordResetCodeProps> = ({
  email,
  onConfirm,
  onResend,
  onBack,
  isLoading,
  error
}) => {
  const { isDark } = useTheme();
  const [resetCode, setResetCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleConfirm = async () => {
    if (resetCode.trim()) {
      await onConfirm(resetCode);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    await onResend();
    setIsResending(false);
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
            <KeyRound className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            Введите код восстановления
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Код отправлен на
          </p>
          <p className={`text-sm font-medium text-orange-500 ${
            isDark ? 'text-orange-500' : 'text-orange-600'
          }`}>
            {email}
          </p>
        </div>

                  {/* Форма ввода кода */}
          <div className="space-y-6">
            {/* Поле ввода кода */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                6-значный код восстановления
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-center text-xl font-mono tracking-widest ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className={`p-3 rounded-lg text-sm text-center ${
                isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600'
              }`}>
                {error}
              </div>
            )}

          {/* Кнопки действий */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isLoading || !resetCode.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Проверка...' : 'Подтвердить код'}
            </button>
            
            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full px-4 py-3 border border-orange-500 text-orange-500 rounded-xl font-medium hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Отправка...' : 'Отправить код повторно'}
            </button>
            
            <button
              onClick={onBack}
              className={`w-full px-4 py-3 text-sm ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              } hover:underline transition-colors flex items-center justify-center space-x-2`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Вернуться к восстановлению</span>
            </button>
          </div>
        </div>

        {/* Подсказка */}
        <div className={`mt-6 p-3 rounded-lg text-xs text-center ${
          isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'
        }`}>
          Код действителен в течение 15 минут
        </div>
      </div>
    </div>
  );
};

export default PasswordResetCode; 