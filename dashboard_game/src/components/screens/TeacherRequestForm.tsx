import React, { useState } from 'react';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';

interface TeacherRequestFormProps {
  onBack: () => void;
  isDark: boolean;
}

const TeacherRequestForm: React.FC<TeacherRequestFormProps> = ({ onBack, isDark }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Пожалуйста, напишите сообщение для заявки');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден. Пожалуйста, войдите в систему.');
        return;
      }

      console.log('Отправляем заявку на:', 'https://n8n.bitcoinlimb.com/webhook/teacher-request-submit');
      console.log('Данные заявки:', { request_message: message.trim() });
      
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/teacher-request-submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_message: message.trim()
        })
      });

      console.log('Ответ от сервера:', response);
      console.log('Статус:', response.status);
      console.log('Статус текст:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка HTTP:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Данные ответа:', data);
      
      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || 'Ошибка отправки заявки');
      }
    } catch (error) {
      console.error('Детали ошибки:', error);
      setError(`Ошибка отправки заявки: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold mb-4 text-[#94c356]">Заявка отправлена!</h2>
            <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Ваша заявка на роль аналитика успешно отправлена администратору. 
              Мы рассмотрим её в ближайшее время и уведомим вас о решении.
            </p>
            <button
              onClick={onBack}
              className="bg-[#94c356] hover:bg-[#7ba045] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Вернуться в профиль
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Заявка на роль аналитика
          </h1>
          <div className="w-9"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">👨‍🏫</div>
          <h2 className="text-xl font-bold mb-2">Стать учителем</h2>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Расскажите о себе и своих навыках, чтобы получить роль аналитика
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`rounded-xl p-4 ${isDark ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'} shadow-sm`}>
            <div className="flex items-start space-x-3">
              <div className="text-red-600 text-lg">❌</div>
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Ошибка</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Сообщение для администратора *
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Расскажите о своем опыте, образовании, навыках и почему вы хотите стать учителем..."
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent resize-none ${
                  isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isSubmitting}
              />
              <div className="absolute bottom-3 right-3">
                <MessageSquare className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Минимум 50 символов. Опишите ваш опыт и мотивацию.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Что написать в заявке?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ваш опыт в фитнесе и спорте</li>
              <li>• Образование и сертификации</li>
              <li>• Специализация (йога, силовые тренировки, кардио и т.д.)</li>
              <li>• Почему хотите стать учителем</li>
              <li>• Ваши планы и цели как аналитика</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || message.trim().length < 50}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              isSubmitting || message.trim().length < 50
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-[#94c356] hover:bg-[#7ba045] text-white hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Отправка...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Отправить заявку</span>
              </>
            )}
          </button>
        </form>

        <div className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>После отправки заявки администратор рассмотрит её и уведомит вас о решении</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherRequestForm;
