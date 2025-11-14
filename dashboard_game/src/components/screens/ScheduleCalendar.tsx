import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Calendar from '../Calendar';
import ScheduleDetails from '../ScheduleDetails';



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
  created_by_id?: number; // ID пользователя, который создал расписание
  created_by_name?: string; // Имя пользователя, который создал расписание
  updated_by_id?: number; // ID пользователя, который последний раз редактировал
  updated_by_name?: string; // Имя пользователя, который последний раз редактировал
  online_link?: string; // Ссылка для просмотра онлайн
  recorded_lesson_link?: string; // Ссылка для просмотра записанной лекции
  target_group?: string; // Целевая группа для расписания
}

const ScheduleCalendar: React.FC = () => {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Функция для безопасной установки выбранной даты
  const handleDateSelect = (date: Date) => {
    if (date && date instanceof Date) {
      setSelectedDate(date);
    } else {
      console.error('ScheduleCalendar: получена некорректная дата:', date);
    }
  };
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [deletingItem, setDeletingItem] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для фильтров
  const [showOnlyMyClasses, setShowOnlyMyClasses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  // Функция для правильного отображения даты без сдвига часового пояса
  const formatDateWithoutTimezone = (dateString: string) => {
    try {
      console.log('Форматируем дату:', dateString, 'тип:', typeof dateString);
      
      if (!dateString) {
        return 'Дата не указана';
      }
      
      // Проверяем, если дата уже в формате YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        console.log('Дата в формате YYYY-MM-DD:', dateString, '-> результат:', date.toLocaleDateString('ru-RU'));
        return date.toLocaleDateString('ru-RU');
      }
      
      // Если дата содержит время, берем только дату
      if (dateString.includes('T')) {
        const dateOnly = dateString.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        console.log('Дата с временем:', dateString, '-> результат:', date.toLocaleDateString('ru-RU'));
        return date.toLocaleDateString('ru-RU');
      }
      
      // Пробуем парсить как есть
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Неверная дата:', dateString);
        return 'Неверная дата';
      }
      
      console.log('Дата парсится как есть:', dateString, '-> результат:', date.toLocaleDateString('ru-RU'));
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      console.error('Ошибка форматирования даты:', dateString, error);
      return 'Ошибка даты';
    }
  };

  // Функция проверки прав на редактирование/удаление расписания
  const canEditSchedule = (item: ScheduleItem): boolean => {
    if (isAdmin) return true; // Администратор может редактировать все
    if (isTeacher && item.created_by_id === user?.id) return true; // Учитель может редактировать только свое
    return false; // Ученики не могут редактировать
  };

  const canDeleteSchedule = (item: ScheduleItem): boolean => {
    if (isAdmin) return true; // Администратор может удалять все
    if (isTeacher && item.created_by_id === user?.id) return true; // Учитель может удалять только свое
    return false; // Ученики не могут удалять
  };

  // Функция для фильтрации расписания
  const getFilteredScheduleData = () => {
    let filtered = scheduleData;

    // Фильтр "только мои занятия" или "все занятия"
    if (showOnlyMyClasses && (isTeacher || isAdmin)) {
      // Показываем только занятия, созданные текущим пользователем
      filtered = filtered.filter(item => item.created_by_id === user?.id);
    }
    // Если showOnlyMyClasses = false, показываем все занятия (фильтр не применяется)

    // Поиск по названию
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по типу занятия
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.class_type === filterType);
    }

    return filtered;
  };

  // Загружаем данные расписания при открытии экрана
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Получаем JWT токен из localStorage (если есть)
        const token = localStorage.getItem('dashecos_token');
        
        // Загружаем расписание для всех пользователей
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedules-take', {
          headers
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
        
        // Логируем данные для отладки
        console.log('Данные с сервера schedules-take:', data);
        console.log('Пользователь:', user);
        console.log('Student group пользователя:', user?.student_group);
        
        let schedulesData = [];
        
        if (data.success && data.schedules) {
          schedulesData = data.schedules;
        } else if (data.schedules) {
          schedulesData = data.schedules;
        } else if (data.data) {
          schedulesData = data.data;
        } else if (Array.isArray(data)) {
          schedulesData = data;
        }
        
        // Фильтруем пустые или неполные расписания
        const validSchedules = schedulesData.filter(schedule => 
          schedule && 
          schedule.id && 
          schedule.title && 
          schedule.teacher &&
          schedule.date
        );
        
        // Дополнительная фильтрация по группам (если вебхук не фильтрует)
        let filteredSchedules = validSchedules;
        
        if (user && user.role !== 'admin') {
          // Для не-админов фильтруем по student_group
          filteredSchedules = validSchedules.filter(schedule => {
            // Показываем расписания для всех (target_group = 'all') или для группы пользователя
            return schedule.target_group === 'all' || schedule.target_group === user.student_group;
          });
          
          console.log('Фильтрация по группам:');
          console.log('- Всего расписаний:', validSchedules.length);
          console.log('- После фильтрации по группам:', filteredSchedules.length);
          console.log('- Группа пользователя:', user.student_group);
          console.log('- Расписания с target_group = "all":', validSchedules.filter(s => s.target_group === 'all').length);
          console.log('- Расписания с target_group = "' + user.student_group + '":', validSchedules.filter(s => s.target_group === user.student_group).length);
        }
        
        console.log('Отфильтрованные расписания:', filteredSchedules);
        setScheduleData(filteredSchedules);
      } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        
        // Проверяем различные типы ошибок
        if (error instanceof Error) {
          if (error.message.includes('403')) {
            setError('Время сессии истекло. Пожалуйста, войдите в систему заново.');
          } else if (error.message.includes('401')) {
            setError('Чтобы просматривать расписание зарегистрируйтесь или войдите в личный кабинет');
          } else {
            setError(error.message);
          }
        } else {
          setError('Неизвестная ошибка');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleData();
  }, [user]);

  // Блокировка скролла основного экрана при открытии модального окна
  useEffect(() => {
    if (isEditingMode) {
      // Блокируем скролл основного экрана
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Восстанавливаем скролл
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Очистка при размонтировании компонента
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isEditingMode]);

  // Автоматически включаем фильтр "только мои занятия" для учителей
  useEffect(() => {
    if (isTeacher) {
      setShowOnlyMyClasses(true);
    }
  }, [isTeacher]);





  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Расписание
          </h2>

        </div>
        
        {(isAdmin || isTeacher) && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowScheduleEditor(!showScheduleEditor)}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 text-sm flex items-center justify-center space-x-2 ${
                showScheduleEditor 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700' 
                  : 'bg-gradient-to-r from-[#94c356] to-[#7ba045] text-white hover:from-[#7ba045] hover:to-[#94c356]'
              }`}
            >
              {showScheduleEditor ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="whitespace-nowrap">Скрыть список</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="whitespace-nowrap">Редактировать расписание</span>
                </>
              )}
            </button>
            {showScheduleEditor && (
              <button
                onClick={() => {
                  setEditingItem({
                    teacher: isTeacher ? user?.name || '' : '',
                    lesson_link: '',
                    recorded_lesson_link: '',
                    target_group: 'all'
                  } as ScheduleItem);
                  setIsEditingMode(true);
                  console.log('Добавить новое занятие');
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 text-sm flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Добавить занятие</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Форма редактирования/добавления занятия */}
      {editingItem && isEditingMode && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-2 pb-20 px-4 transition-all duration-300">
          <div className={`w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl shadow-sm transition-all duration-300 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {editingItem.id ? 'Редактировать занятие' : 'Добавить новое занятие'}
                </h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsEditingMode(false);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Назад к списку
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Название занятия *
                  </label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Введите название занятия"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Учитель
                  </label>
                  <input
                    type="text"
                    value={editingItem.teacher || (isTeacher ? user?.name || '' : '')}
                    onChange={(e) => setEditingItem({...editingItem, teacher: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Введите имя учителя"
                    readOnly={isTeacher}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Аудитория
                  </label>
                  <input
                    type="text"
                    value={editingItem.room || ''}
                    onChange={(e) => setEditingItem({...editingItem, room: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Введите номер аудитории"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Тип занятия
                  </label>
                  <input
                    type="text"
                    value={editingItem.class_type || ''}
                    onChange={(e) => setEditingItem({...editingItem, class_type: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Например: Йога, Силовая"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Уровень
                  </label>
                  <select
                    value={editingItem.level || ''}
                    onChange={(e) => setEditingItem({...editingItem, level: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Выберите уровень</option>
                    <option value="Начинающий">Начинающий</option>
                    <option value="Средний">Средний</option>
                    <option value="Продвинутый">Продвинутый</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Максимум участников
                  </label>
                  <input
                    type="number"
                    value={editingItem.max_participants || ''}
                    onChange={(e) => setEditingItem({...editingItem, max_participants: parseInt(e.target.value) || 0})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Введите количество"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Дата *
                  </label>
                  <input
                    type="date"
                    value={editingItem.date ? editingItem.date.split('T')[0] : ''}
                    onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Время начала *
                  </label>
                  <input
                    type="time"
                    value={editingItem.start_time || ''}
                    onChange={(e) => setEditingItem({...editingItem, start_time: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Время окончания *
                  </label>
                  <input
                    type="time"
                    value={editingItem.end_time || ''}
                    onChange={(e) => setEditingItem({...editingItem, end_time: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                

                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Статус
                  </label>
                  <select
                    value={editingItem.is_active !== undefined ? editingItem.is_active.toString() : 'true'}
                    onChange={(e) => setEditingItem({...editingItem, is_active: e.target.value === 'true'})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="true">Активно</option>
                    <option value="false">Неактивно</option>
                  </select>
                </div>
              </div>

              {/* Поля для ссылок - только для админов и учителей */}
              {(isAdmin || isTeacher) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ссылка для просмотра онлайн
                    </label>
                    <input
                      type="url"
                      value={editingItem.lesson_link || ''}
                      onChange={(e) => setEditingItem({...editingItem, lesson_link: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="https://zoom.us/j/... или https://meet.google.com/..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ссылка для просмотра записанной лекции
                    </label>
                    <input
                      type="url"
                      value={editingItem.recorded_lesson_link || ''}
                      onChange={(e) => setEditingItem({...editingItem, recorded_lesson_link: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="https://youtube.com/watch?v=... или https://drive.google.com/..."
                    />
                  </div>
                </div>
              )}

              {/* Поле выбора группы - только для админов */}
              {isAdmin && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Целевая группа *
                  </label>
                  <select
                    value={editingItem.target_group || 'all'}
                    onChange={(e) => setEditingItem({...editingItem, target_group: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Все группы</option>
                    <option value="group_1">Группа 1</option>
                    <option value="group_2">Группа 2</option>
                    <option value="group_3">Группа 3</option>
                    <option value="group_4">Группа 4</option>
                    <option value="group_5">Группа 5</option>
                    <option value="group_6">Группа 6</option>
                    <option value="group_7">Группа 7</option>
                    <option value="group_8">Группа 8</option>
                    <option value="group_9">Группа 9</option>
                    <option value="group_10">Группа 10</option>
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsEditingMode(false);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    // Валидация обязательных полей
                    if (!editingItem.title || !editingItem.date || !editingItem.start_time || !editingItem.end_time) {
                      alert('Пожалуйста, заполните все обязательные поля (отмечены *)');
                      return;
                    }
                    
                    try {
                      setIsSaving(true);
                      
                      // Получаем JWT токен
                      const token = localStorage.getItem('dashecos_token');
                      if (!token) {
                        alert('Ошибка: пользователь не авторизован');
                        return;
                      }

                      let response;
                      let data;

                      if (editingItem.id) {
                        // Редактирование существующего занятия
                        response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedule-edit', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            ...editingItem,
                            created_by: user?.id // Добавляем ID создателя
                          })
                        });
                      } else {
                        // Создание нового занятия
                        response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedule-write', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            ...editingItem,
                            created_by: user?.id // Добавляем ID создателя
                          })
                        });
                      }

                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }

                      data = await response.json();
                      
                      if (data.success) {
                        alert(editingItem.id ? 'Занятие успешно обновлено!' : 'Занятие успешно создано!');
                        
                        // Обновляем список занятий
                        if (editingItem.id) {
                                                  // Обновляем существующее занятие
                        setScheduleData(prevData => 
                          prevData.map(schedule => 
                            schedule.id === editingItem.id ? { ...editingItem, created_by: user?.id } : schedule
                          )
                        );
                        } else {
                          // После успешного создания перезагружаем данные с сервера
                          // чтобы получить правильный ID и created_by из базы
                          const fetchResponse = await fetch('https://n8n.bitcoinlimb.com/webhook/schedules-take', {
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          
                          if (fetchResponse.ok) {
                            const fetchData = await fetchResponse.json();
                            if (fetchData.success && fetchData.schedules) {
                              setScheduleData(fetchData.schedules);
                            } else if (fetchData.schedules) {
                              setScheduleData(fetchData.schedules);
                            } else if (fetchData.data) {
                              setScheduleData(fetchData.data);
                            } else if (Array.isArray(fetchData)) {
                              setScheduleData(fetchData);
                            }
                          }
                          
                          // Показываем список занятий после создания
                          setShowScheduleEditor(true);
                        }
                        
                        setEditingItem(null);
                        setIsEditingMode(false);
                      } else {
                        alert(`Ошибка: ${data.error || 'Неизвестная ошибка'}`);
                      }
                    } catch (error) {
                      console.error('Ошибка сохранения занятия:', error);
                      alert(`Ошибка сохранения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-[#94c356] hover:bg-[#7ba045] text-white'
                  }`}
                >
                  {isSaving 
                    ? (editingItem.id ? 'Сохранение...' : 'Создание...') 
                    : (editingItem.id ? 'Сохранить изменения' : 'Создать занятие')
                  }
                </button>
              </div>
              

            </div>
          </div>
        </div>
      )}

      {/* Список всех занятий для редактирования (для админов и учителей) */}
      {showScheduleEditor && (isAdmin || isTeacher) && !isEditingMode && (
        <div className="mb-6">
          <div className="mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Все занятия для редактирования
            </h3>
            
            {/* Фильтры */}
            <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Переключатель фильтра занятий */}
                <div className="flex items-center space-x-3">
                  <select
                    value={showOnlyMyClasses ? 'my' : 'all'}
                    onChange={(e) => setShowOnlyMyClasses(e.target.value === 'my')}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent text-sm ${
                      isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Все занятия</option>
                    <option value="my">Только мои занятия</option>
                  </select>
                </div>

                {/* Поиск по названию */}
                <div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по названию..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent text-sm ${
                      isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Фильтр по типу занятия */}
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent text-sm ${
                      isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Все типы</option>
                    <option value="Йога">Йога</option>
                    <option value="Силовая">Силовая</option>
                    <option value="Кардио">Кардио</option>
                    <option value="Пилатес">Пилатес</option>
                    <option value="Стретчинг">Стретчинг</option>
                  </select>
                </div>
              </div>

              {/* Счетчик показанных занятий */}
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {showOnlyMyClasses ? (
                    <>Показано <span className="font-semibold text-[#94c356]">{getFilteredScheduleData().length}</span> из <span className="font-semibold">{scheduleData.filter(item => item.created_by_id === user?.id).length}</span> моих занятий</>
                  ) : (
                    <>Показано <span className="font-semibold text-[#94c356]">{getFilteredScheduleData().length}</span> из <span className="font-semibold">{scheduleData.length}</span> всех занятий</>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {getFilteredScheduleData().length > 0 ? (
              getFilteredScheduleData().map((item) => (
                <div key={item.id} className={`rounded-xl p-4 shadow-sm transition-colors duration-300 min-h-[200px] ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {item.title}
                      </h4>
                      <div className={`text-sm mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.teacher && (
                          <p><span className="font-medium">Учитель:</span> {item.teacher}</p>
                        )}
                        {item.room && (
                          <p><span className="font-medium">Аудитория:</span> {item.room}</p>
                        )}
                        {item.class_type && (
                          <p><span className="font-medium">Тип:</span> {item.class_type}</p>
                        )}
                        {item.level && (
                          <p><span className="font-medium">Уровень:</span> {item.level}</p>
                        )}
                        <p><span className="font-medium">Дата:</span> {formatDateWithoutTimezone(item.date)}</p>
                        <p><span className="font-medium">Время:</span> {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}</p>
                        {(item.participants > 0 || item.max_participants > 0) && (
                          <p><span className="font-medium">Участники:</span> {item.participants || 0}/{item.max_participants || '∞'}</p>
                        )}
                        <p><span className="font-medium">Статус:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            item.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.is_active ? 'Активно' : 'Неактивно'}
                          </span>
                        </p>

                        {/* Отображение ссылок, если они есть */}
                        {(item.lesson_link || item.recorded_lesson_link) && (
                          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                            <p className="font-medium mb-2">Ссылки:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.lesson_link && (
                                <a
                                  href={item.lesson_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-3 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center space-x-1`}
                                >
                                  <span>🔗</span>
                                  <span>Смотреть онлайн</span>
                                </a>
                              )}
                              {item.recorded_lesson_link && (
                                <a
                                  href={item.recorded_lesson_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-3 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center space-x-1`}
                                >
                                  <span>📹</span>
                                  <span>Запись урока</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {canEditSchedule(item) && (
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditingMode(true);
                            console.log('Редактировать занятие:', item.id);
                          }}
                          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                          title="Редактировать"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {canDeleteSchedule(item) && (
                        <button
                          onClick={async () => {
                            if (confirm(`Вы уверены, что хотите удалить занятие "${item.title}"?`)) {
                              try {
                                setDeletingItem(item.id);
                                
                                // Получаем JWT токен
                                const token = localStorage.getItem('dashecos_token');
                                if (!token) {
                                  alert('Ошибка: пользователь не авторизован');
                                  return;
                                }

                                // Отправляем запрос на удаление
                                const response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedule-delete', {
                                  method: 'DELETE',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({
                                    id: item.id
                                  })
                                });

                                if (!response.ok) {
                                  throw new Error(`HTTP error! status: ${response.status}`);
                                }

                                const data = await response.json();
                                
                                if (data.success) {
                                  alert('Занятие успешно удалено!');
                                  // Обновляем список занятий
                                  setScheduleData(prevData => prevData.filter(schedule => schedule.id !== item.id));
                                } else {
                                  alert(`Ошибка удаления: ${data.error || 'Неизвестная ошибка'}`);
                                }
                              } catch (error) {
                                console.error('Ошибка удаления занятия:', error);
                                alert(`Ошибка удаления: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                              } finally {
                                setDeletingItem(null);
                              }
                            }
                          }}
                          disabled={deletingItem === item.id}
                          className={`p-2 rounded-lg transition-colors ${
                            deletingItem === item.id
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                          title="Удалить"
                        >
                          {deletingItem === item.id ? (
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {scheduleData.length === 0 ? (
                  <div>
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-lg font-semibold mb-2">Занятия не найдены</p>
                    <p className="text-sm">В данный момент нет запланированных занятий</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg font-semibold mb-2">По вашему запросу ничего не найдено</p>
                    <p className="text-sm">Попробуйте изменить фильтры поиска</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}



      {!isEditingMode && (
        <>
          {selectedDate ? (
            <ScheduleDetails 
              date={selectedDate}
              scheduleData={scheduleData}
              onBack={() => setSelectedDate(null)}
            />
          ) : (
            <div className="space-y-6">
              {/* Admin/Teacher Controls - только если не выбрана дата */}
              {(isAdmin || isTeacher) && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {isAdmin ? 'Управление расписанием' : 'Мои занятия'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {isAdmin ? 'Полный контроль над расписанием института' : 'Управление вашими занятиями'}
                    </p>
                  </div>
                </div>
              )}

              {/* Calendar */}
              <Calendar 
                onDateSelect={handleDateSelect}
                scheduleData={scheduleData}
              />

              {/* Error Display */}
              {error && (
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
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#94c356]"></div>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Загрузка расписания...
                  </p>
                </div>
              )}

              {/* User Hint */}
              <div className={`bg-gradient-to-r from-[#94c356]/10 to-[#7ba045]/10 rounded-xl p-4 border border-[#94c356]/20`}>
                <h3 className="font-semibold mb-2 text-[#94c356]">📅 Подсказка</h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Нажмите на любой день в календаре, чтобы увидеть информацию о занятиях, времени проведения и учителе.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScheduleCalendar; 