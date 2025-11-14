import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { EventItem } from '../types/events';
import { Calendar, Clock, MapPin, Globe, ExternalLink, Edit, Trash2 } from 'lucide-react';

interface EventsListProps {
  onEditEvent?: (event: EventItem) => void;
  onDeleteEvent?: (eventId: number) => void;
}

const EventsList: React.FC<EventsListProps> = ({ onEditEvent, onDeleteEvent }) => {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Загружаем события
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('dashecos_token');
        if (!token) {
          throw new Error('Пользователь не авторизован');
        }

        const response = await fetch('https://n8n.bitcoinlimb.com/webhook/events-take', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // Проверяем на 403 ошибку (истекшая сессия)
          if (response.status === 403) {
            throw new Error('Время сессии истекло. Пожалуйста, войдите в систему заново.');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        console.log('Ответ от вебхука events-take:', data);
        
        // Проверяем различные форматы ответа
        let eventsData = [];
        if (data.success && data.events) {
          eventsData = data.events;
        } else if (data.events) {
          eventsData = data.events;
        } else if (data.data) {
          eventsData = data.data;
        } else if (Array.isArray(data)) {
          eventsData = data;
        } else if (data && typeof data === 'object') {
          // Если ответ - объект, ищем массив событий в его свойствах
          const keys = Object.keys(data);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              eventsData = data[key];
              break;
            }
          }
        }
        
        setEvents(eventsData);
              } catch (error) {
          console.error('Ошибка загрузки событий:', error);
          if (error instanceof Error && error.message === 'Пользователь не авторизован') {
            setError('Для просмотра событий необходимо зарегистрироваться или войти в аккаунт');
          } else if (error instanceof Error && error.message.includes('401')) {
            setError('Ошибка авторизации. Попробуйте войти заново');
          } else {
            setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
          }
        } finally {
          setIsLoading(false);
        }
    };

    fetchEvents();
  }, []);

  // Функция для форматирования даты
  const formatDateWithoutTimezone = (dateString: string) => {
    try {
      // Если дата уже в формате YYYY-MM-DD, используем её как есть
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      // Если дата содержит время, убираем его
      const dateOnly = dateString.split('T')[0];
      const [year, month, day] = dateOnly.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Ошибка форматирования даты:', dateString, error);
      return 'Неверная дата';
    }
  };

  // Функция для форматирования времени
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Убираем секунды
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#94c356]"></div>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Загрузка событий...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl p-4 ${isDark ? 'bg-red-900/20 border border-red-600/30' : 'bg-red-50 border border-red-200'} shadow-sm`}>
        <div className="text-center">
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
          {error.includes('Время сессии истекло') && (
            <button
              onClick={logout}
              className={`mt-3 px-4 py-2 rounded-lg ${isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
              Войти заново
            </button>
          )}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="text-4xl mb-4">📅</div>
        <p className="text-lg font-medium">Событий пока не запланировано</p>
        <p className="text-sm mt-2">Используйте кнопку "Добавить событие" для создания первого события</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className={`rounded-xl p-6 shadow-sm transition-colors duration-300 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* Заголовок и тип события */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {event.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  {event.event_type === 'online' ? (
                    <Globe className="w-4 h-4 text-blue-500" />
                  ) : (
                    <MapPin className="w-4 h-4 text-green-500" />
                  )}
                  <span className={event.event_type === 'online' ? 'text-blue-600' : 'text-green-600'}>
                    {event.event_type === 'online' ? 'Онлайн' : 'Офлайн'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Кнопки редактирования для админа */}
            {isAdmin && onEditEvent && onDeleteEvent && (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onEditEvent(event)}
                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Дата и время */}
          <div className="flex items-center space-x-4 mb-3 text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {formatDateWithoutTimezone(event.event_date)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {formatTime(event.start_time)}
              </span>
            </div>
          </div>

          {/* Описание */}
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {event.description}
          </p>

          {/* Кнопка присоединения */}
          {event.show_button && event.event_link && (
            <div className="flex justify-start">
              <a
                href={event.event_link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#94c356] hover:bg-[#7ba045] text-white font-medium transition-colors`}
              >
                <span>{event.button_text}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventsList;
