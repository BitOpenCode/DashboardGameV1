import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface EmailConfirmationProps {
  email: string;
  onConfirm: (code: string) => Promise<void>;
  onResend: (code: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

const EmailConfirmation: React.FC<EmailConfirmationProps> = ({
  email,
  onConfirm,
  onResend,
  onBack,
  isLoading
}) => {
  const { isDark } = useTheme();
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleConfirm = async () => {
    if (confirmationCode.trim()) {
      await onConfirm(confirmationCode);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    await onResend(confirmationCode);
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
            isDark ? 'bg-orange-600/20' : 'bg-orange-500/10'
          }`}>
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-800'
          }`}>
            Подтверждение Email
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Код подтверждения отправлен на
          </p>
          <p className={`text-sm font-medium text-orange-600`}>
            {email}
          </p>
        </div>

        {/* Форма подтверждения */}
        <div className="space-y-6">
          {/* Поле ввода кода */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Введите 6-значный код
            </label>
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-center text-xl font-mono tracking-widest ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Кнопки действий */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isLoading || !confirmationCode.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:from-orange-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Проверка...' : 'Подтвердить код'}
            </button>
            
            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full px-4 py-3 border border-orange-600 text-orange-600 rounded-xl font-medium hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Отправка...' : 'Отправить код повторно'}
            </button>
            
            <button
              onClick={onBack}
              className={`w-full px-4 py-3 text-sm ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
              } hover:underline transition-colors`}
            >
              ← Вернуться к регистрации
            </button>
          </div>
        </div>

        {/* Подсказка */}
        <div className={`mt-6 p-3 rounded-lg text-xs text-center ${
          isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'
        }`}>
          Код действителен в течение 30 минут
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation; 