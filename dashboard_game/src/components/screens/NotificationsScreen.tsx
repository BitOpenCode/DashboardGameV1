import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'event';
  image_url?: string;
  link_url?: string;
  show_button: boolean;
  button_text: string;
  is_published: boolean;
  created_at: string;
  created_by: string;
}

interface NotificationsScreenProps {
  onBack: () => void;
  isDark: boolean;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, isDark }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('dashecos_token');
    console.log('Токен найден:', token ? 'Да' : 'Нет');
    console.log('Токен (первые 20 символов):', token ? token.substring(0, 20) + '...' : 'Нет');
    
    if (!token) {
      setError('Необходимо войти в систему');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Отправляем запрос на news-get-published...');
      
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/news-get-published', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Ответ получен:', response.status, response.statusText);

      if (response.ok) {
        console.log('Ответ успешный, парсим JSON...');
        const data = await response.json();
        console.log('Данные получены:', data);
        
        // Проверяем различные форматы ответа (как в EventsList)
        let notificationsData = [];
        if (data.success && data.notifications) {
          notificationsData = data.notifications;
        } else if (data.notifications) {
          notificationsData = data.notifications;
        } else if (data.data) {
          notificationsData = data.data;
        } else if (Array.isArray(data)) {
          notificationsData = data;  // ← Наш случай!
        } else if (data && typeof data === 'object') {
          // Если ответ - объект, ищем массив новостей в его свойствах
          const keys = Object.keys(data);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              notificationsData = data[key];
              break;
            }
          }
        }
        
        console.log('Устанавливаем уведомления:', notificationsData);
        setNotifications(notificationsData);
      } else {
        console.log('HTTP ошибка:', response.status, response.statusText);
        console.log('Response headers:', response.headers);
        
        // Проверяем на 403 ошибку (истекшая сессия)
        if (response.status === 403) {
          setError('Время сессии истекло. Пожалуйста, войдите в систему заново.');
        } else {
          setError(`Ошибка соединения с сервером: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err);
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCardExpansion = (notificationId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedCards(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17v-3a5 5 0 00-5-5H5a5 5 0 00-5 5v3h15z" />
        </svg>;
      case 'success':
        return <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17v-3a5 5 0 00-5-5H5a5 5 0 00-5 5v3h15z" />
        </svg>;
      default:
        return <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17v-3a5 5 0 00-5-5H5a5 5 0 00-5 5v3h15z" />
        </svg>;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-l-[#94c356] bg-gray-50 dark:bg-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'event':
        return 'Событие';
      case 'warning':
        return 'Предупреждение';
      case 'success':
        return 'Успех';
      default:
        return 'Информация';
    }
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg ${isDark ? 'text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Уведомления
          </h1>
          <div className="w-10"></div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#94c356] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Загрузка уведомлений...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg ${isDark ? 'text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Уведомления
        </h1>
        <button
          onClick={fetchNotifications}
          className={`p-2 rounded-lg ${isDark ? 'text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className={`text-center py-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <p className="text-lg font-medium mb-2">{error}</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={fetchNotifications}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Попробовать снова
              </button>
              {error.includes('Время сессии истекло') && (
                <button
                  onClick={logout}
                  className={`ml-2 px-4 py-2 rounded-lg ${isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
                >
                  Войти заново
                </button>
              )}
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17v-3a5 5 0 00-5-5H5a5 5 0 00-5 5v3h15z" />
            </svg>
            <p className="text-lg font-medium mb-2">Нет уведомлений</p>
            <p className="text-sm opacity-75">У вас пока нет новых уведомлений</p>
          </div>
        ) : (
          <div className="space-y-4">
                        {notifications
              .filter(notification => notification && notification.id && notification.message) // Фильтруем неполные новости
              .map((notification) => {
                const isExpanded = expandedCards.has(notification.id);
                const shouldTruncate = notification.message.length > 120;
              
              return (
                <div
                  key={notification.id}
                  className={`p-6 rounded-2xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl ${
                    getNotificationColor(notification.type)
                  } ${isDark ? 'text-white' : 'text-gray-800'} min-h-[200px] flex flex-col`}
                >
                  {/* Header с типом */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTypeName(notification.type).toLowerCase() === 'event' ? 'bg-blue-500' : getTypeName(notification.type).toLowerCase() === 'warning' ? 'bg-yellow-500' : getTypeName(notification.type).toLowerCase() === 'success' ? 'bg-green-500' : 'bg-gray-500'}`}>
                        {getTypeName(notification.type)}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleCardExpansion(notification.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      title={isExpanded ? 'Свернуть' : 'Развернуть'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Заголовок */}
                  <h3 className="font-bold text-xl mb-4 flex-1 text-gray-900 dark:text-white">
                    {notification.title || 'Без заголовка'}
                  </h3>
                  
                  {/* Изображение (если есть) */}
                  {notification.image_url && (
                    <div className="mb-4">
                      <img 
                        src={notification.image_url} 
                        alt="Изображение новости"
                        className="w-full h-40 object-cover rounded-xl shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Текст новости */}
                  <div className="mb-3 flex-1">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {isExpanded ? notification.message : truncateText(notification.message)}
                    </p>
                    
                    {/* Показать кнопку "Читать далее" если текст обрезан */}
                    {shouldTruncate && !isExpanded && (
                      <button
                        onClick={() => toggleCardExpansion(notification.id)}
                        className={`mt-2 text-sm font-medium ${isDark ? 'text-[#94c356] hover:text-[#7ba045]' : 'text-[#94c356] hover:text-[#7ba045]'}`}
                      >
                        Читать далее
                      </button>
                    )}
                  </div>
                  
                  {/* Кнопка действия (если настроена) */}
                  {notification.show_button && notification.link_url && (
                    <div className="mt-auto mb-3">
                      <a
                        href={notification.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 ${
                          isDark 
                            ? 'bg-[#94c356] text-white hover:bg-[#7ba045]' 
                            : 'bg-[#94c356] text-white hover:bg-[#7ba045]'
                        }`}
                      >
                        <span>{notification.button_text}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  
                  {/* Footer с датой */}
                  <div className="flex items-center justify-end text-xs opacity-75 mt-auto pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{notification.created_at ? formatDate(notification.created_at) : 'Дата не указана'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
