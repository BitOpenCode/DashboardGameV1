import React from 'react';
import { ArrowLeft, Clock, MapPin, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ScheduleItem {
  id: number;
  title: string;
  teacher: string;
  room: string;
  class_type: string;
  level: string;
  participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lesson_link?: string; // Ссылка для просмотра онлайн
  recorded_lesson_link?: string; // Ссылка для просмотра записанной лекции
}

interface ScheduleDetailsProps {
  date: Date;
  onBack: () => void;
  scheduleData: ScheduleItem[];
}

const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({ date, onBack, scheduleData }) => {
  const { isDark } = useTheme();
  
  // Проверяем, что date существует
  if (!date) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Ошибка: дата не выбрана</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Вернуться к календарю
        </button>
      </div>
    );
  }
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('ru-RU', options);
  };



  // Фильтруем занятия для выбранной даты
  // Используем локальную дату без сдвига часового пояса
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const selectedDateString = `${year}-${month}-${day}`; // YYYY-MM-DD
  

  
  // Проверяем, что scheduleData существует
  if (!scheduleData || !Array.isArray(scheduleData)) {
    console.error('ScheduleDetails: scheduleData некорректен:', scheduleData);
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Ошибка: данные расписания не загружены</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Вернуться к календарю
        </button>
      </div>
    );
  }
  
  const scheduleForDate = scheduleData.filter(item => {
    if (!item.date) {
      return false;
    }
    
    let itemDateString: string;
    if (typeof item.date === 'string') {
      // Убираем время и часовой пояс, оставляем только дату
      itemDateString = item.date.split('T')[0];
    } else {
      // Если item.date не строка, пропускаем элемент
      return false;
    }
    
    return itemDateString === selectedDateString && item.is_active !== false;
  });

  const getTypeColor = (type: string) => {
    const colors = {
      'Йога': 'bg-purple-100 text-purple-600',
      'Силовая': 'bg-orange-100 text-orange-600',
      'Кардио': 'bg-red-100 text-red-600',
      'Пилатес': 'bg-blue-100 text-blue-600',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'Начинающий': 'bg-green-100 text-green-600',
      'Средний': 'bg-yellow-100 text-yellow-600',
      'Продвинутый': 'bg-red-100 text-red-600',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg shadow-sm hover:shadow-md transition-all ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
        <div>
          <h2 className={`text-xl font-bold capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {formatDate(date)}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Расписание занятий</p>
        </div>
      </div>

      {/* Schedule List */}
      {scheduleForDate.length > 0 ? (
        <div className="space-y-4">
          {scheduleForDate.map((class_) => (
            <div key={class_.id} className={`rounded-xl p-6 shadow-sm transition-colors duration-300 min-h-[250px] ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Time and Title */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {class_.start_time?.substring(0, 5)} - {class_.end_time?.substring(0, 5)}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{class_.title}</h3>
                </div>

              </div>

              {/* Tags */}
              {(class_.class_type || class_.level) && (
                <div className="flex items-center space-x-2 mb-4">
                  {class_.class_type && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(class_.class_type)}`}>
                      {class_.class_type}
                    </span>
                  )}
                  {class_.level && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(class_.level)}`}>
                      {class_.level}
                    </span>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 mb-4">
                {class_.teacher && (
                  <div className={`flex items-center space-x-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <User className="w-4 h-4" />
                    <span>Тренер: <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{class_.teacher}</span></span>
                  </div>
                )}
                {class_.room && (
                  <div className={`flex items-center space-x-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="w-4 h-4" />
                    <span>{class_.room}</span>
                  </div>
                )}
              </div>

              {/* Участники убраны - не отслеживаем количество */}

              {/* Ссылки на онлайн просмотр и запись урока */}
              {(class_.lesson_link || class_.recorded_lesson_link) && (
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex flex-wrap gap-2">
                    {class_.lesson_link && (
                      <a
                        href={class_.lesson_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3 py-2 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center space-x-2`}
                      >
                        <span>🔗</span>
                        <span>Смотреть онлайн</span>
                      </a>
                    )}
                    {class_.recorded_lesson_link && (
                      <a
                        href={class_.recorded_lesson_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center space-x-2`}
                      >
                        <span>📹</span>
                        <span>Запись урока</span>
                      </a>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-6xl mb-4">📅</div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            На этот день занятий не запланировано
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Расписание будет добавлено администратором или учителем
          </p>
        </div>
      )}

    </div>
  );
};

export default ScheduleDetails;