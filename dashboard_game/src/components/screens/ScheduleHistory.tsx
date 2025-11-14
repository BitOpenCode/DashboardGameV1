import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Calendar, User, BookOpen, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduleItem {
  id: string;
  title: string;
  teacher: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  class_type: string;
  level: string;
  participants: number;
  max_participants: number;
  target_group?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  created_by_id?: number;
  updated_by_id?: number;
  updated_by_name?: string;
  update_reason?: string;
}

interface ScheduleHistoryProps {
  onBack: () => void;
  isDark: boolean;
}

const ScheduleHistory: React.FC<ScheduleHistoryProps> = ({ onBack, isDark }) => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const [filteredSchedules, setFilteredSchedules] = useState<ScheduleItem[]>(schedules);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    teacher: '',
    classType: '',
    creator: '',
    updateReason: '',
    searchQuery: ''
  });

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchSchedules();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, schedules]);

  const fetchSchedules = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      
      if (!token) {
        console.error('Токен не найден');
        setSchedules([]);
        setFilteredSchedules([]);
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedules-take', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Полученные данные расписаний:', data);

      let schedulesData = [];
      
      if (data.success && Array.isArray(data.schedules)) {
        schedulesData = data.schedules;
      } else if (Array.isArray(data)) {
        schedulesData = data;
      } else if (data.schedules && Array.isArray(data.schedules)) {
        schedulesData = data.schedules;
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
        
        console.log('ScheduleHistory - Фильтрация по группам:');
        console.log('- Всего расписаний:', validSchedules.length);
        console.log('- После фильтрации по группам:', filteredSchedules.length);
        console.log('- Группа пользователя:', user.student_group);
      }
      
      setSchedules(filteredSchedules);
      setFilteredSchedules(filteredSchedules);
    } catch (error) {
      console.error('Ошибка загрузки расписаний:', error);
      setSchedules([]);
      setFilteredSchedules([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // Фильтр по поисковому запросу
    if (filters.searchQuery) {
      filtered = filtered.filter(schedule =>
        schedule.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        schedule.teacher.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        schedule.room.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        (schedule.created_by_name && schedule.created_by_name.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
        (schedule.update_reason && schedule.update_reason.toLowerCase().includes(filters.searchQuery.toLowerCase()))
      );
    }

    // Фильтр по учителю
    if (filters.teacher) {
      filtered = filtered.filter(schedule =>
        schedule.teacher.toLowerCase().includes(filters.teacher.toLowerCase())
      );
    }

    // Фильтр по типу занятия
    if (filters.classType) {
      filtered = filtered.filter(schedule =>
        schedule.class_type.toLowerCase().includes(filters.classType.toLowerCase())
      );
    }

    // Фильтр по создателю
    if (filters.creator) {
      filtered = filtered.filter(schedule =>
        schedule.created_by_name && schedule.created_by_name.toLowerCase().includes(filters.creator.toLowerCase())
      );
    }

    // Фильтр по причине изменения
    if (filters.updateReason) {
      filtered = filtered.filter(schedule =>
        schedule.update_reason && schedule.update_reason.toLowerCase().includes(filters.updateReason.toLowerCase())
      );
    }

    // Фильтр по дате создания
    if (filters.dateFrom) {
      filtered = filtered.filter(schedule =>
        new Date(schedule.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(schedule =>
        new Date(schedule.created_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredSchedules(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      teacher: '',
      classType: '',
      creator: '',
      updateReason: '',
      searchQuery: ''
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указана';
    
    // Убираем T00:00:00.000Z и форматируем только дату
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueTeachers = () => {
    return [...new Set(schedules.map(s => s.teacher))];
  };

  const getUniqueClassTypes = () => {
    return [...new Set(schedules.map(s => s.class_type))];
  };

  const getUniqueCreators = () => {
    return [...new Set(schedules.map(s => s.created_by_name).filter(Boolean))];
  };

  const getUniqueUpdateReasons = () => {
    return [...new Set(schedules.map(s => s.update_reason).filter(Boolean))];
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
            История изменений расписаний
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={fetchSchedules}
              disabled={isLoadingData}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
              title="Обновить данные"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>



        {/* Filters */}
        {showFilters && (
          <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Фильтры</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-[#94c356] hover:underline"
              >
                Очистить все
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Фильтр по дате создания */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Дата создания (от)
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Дата создания (до)
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Фильтр по учителю */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Учитель
                </label>
                <select
                  value={filters.teacher}
                  onChange={(e) => setFilters(prev => ({ ...prev, teacher: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Все учителя</option>
                  {getUniqueTeachers().map(teacher => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
              </div>

              {/* Фильтр по типу занятия */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Тип занятия
                </label>
                <select
                  value={filters.classType}
                  onChange={(e) => setFilters(prev => ({ ...prev, classType: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Все типы</option>
                  {getUniqueClassTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Фильтр по создателю */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Создатель
                </label>
                <select
                  value={filters.creator}
                  onChange={(e) => setFilters(prev => ({ ...prev, creator: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Все создатели</option>
                  {getUniqueCreators().map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>

              {/* Фильтр по причине изменения */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Причина изменения
                </label>
                <select
                  value={filters.updateReason}
                  onChange={(e) => setFilters(prev => ({ ...prev, updateReason: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Все причины</option>
                  {getUniqueUpdateReasons().map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {isLoadingData ? 'Загрузка...' : `Найдено: ${filteredSchedules.length} из ${schedules.length} расписаний`}
        </div>



        {/* Schedules List */}
        <div className="space-y-4">
                      {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`rounded-xl p-4 min-h-[300px] ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                {/* Заголовок карточки */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-[#94c356]">{schedule.title}</h3>
                    <div className="space-y-2">
                      {schedule.teacher && (
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{schedule.teacher}</span>
                        </div>
                      )}
                      {(schedule.class_type || schedule.level) && (
                        <div className="flex items-center space-x-2 text-sm">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span>
                            {schedule.class_type && schedule.level 
                              ? `${schedule.class_type} - ${schedule.level}`
                              : schedule.class_type || schedule.level
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-bold text-[#94c356] mb-1">
                      {formatDate(schedule.date)}
                    </div>
                    <div className="text-xs bg-[#94c356]/10 text-[#94c356] px-2 py-1 rounded-full font-medium">
                      {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}
                    </div>
                  </div>
                </div>

                {/* Основная информация */}
                {(schedule.room || schedule.participants > 0 || schedule.max_participants > 0) && (
                  <div className={`grid gap-3 mb-4 ${
                    (schedule.room && (schedule.participants > 0 || schedule.max_participants > 0)) 
                      ? 'grid-cols-2' 
                      : 'grid-cols-1'
                  }`}>
                    {schedule.room && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="text-xs text-gray-500 mb-1">Зал</div>
                        <div className="font-semibold">{schedule.room}</div>
                      </div>
                    )}
                    {(schedule.participants > 0 || schedule.max_participants > 0) && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="text-xs text-gray-500 mb-1">Участники</div>
                        <div className="font-semibold">{schedule.participants}/{schedule.max_participants}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Дополнительная информация */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-gray-500 mb-1">Создано</div>
                    <div className="font-semibold text-sm">{formatDate(schedule.created_at)}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-gray-500 mb-1">Группа</div>
                    <div className="font-semibold text-sm">
                      {schedule.target_group === 'all' ? 'Все группы' : 
                       schedule.target_group ? `Группа ${schedule.target_group.replace('group_', '')}` : 
                       'Не указана'}
                    </div>
                  </div>
                </div>

                {/* Информация о создателе */}
                <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-600 font-medium">Создано</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {schedule.created_by_name && schedule.created_by_name.trim() !== '' ? (
                        <div className="text-xs text-blue-600">
                          <span className="font-medium">Кем:</span> {schedule.created_by_name}
                          {schedule.created_by_id && (
                            <span className="text-gray-500 ml-1">(ID: {schedule.created_by_id})</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Не указано</div>
                      )}
                      <div className="text-xs text-blue-600">
                        <span className="font-medium">Когда:</span> {formatDate(schedule.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Информация об изменениях */}
                {schedule.updated_at !== schedule.created_at && (
                  <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-orange-900/20 border border-orange-700/30' : 'bg-orange-50 border border-orange-200'}`}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-xs text-orange-600 font-medium">Изменено</span>
                      </div>
                      <div className="ml-4 space-y-1">
                        {schedule.updated_by_name && schedule.updated_by_name.trim() !== '' ? (
                          <div className="text-xs text-orange-600">
                            <span className="font-medium">Кем:</span> {schedule.updated_by_name}
                            {schedule.updated_by_id && (
                              <span className="text-gray-500 ml-1">(ID: {schedule.updated_by_id})</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Не указано</div>
                        )}
                        <div className="text-xs text-orange-600">
                          <span className="font-medium">Когда:</span> {formatDate(schedule.updated_at)}
                        </div>
                        {schedule.update_reason && (
                          <div className="text-xs text-orange-600">
                            <span className="font-medium">Причина:</span> {schedule.update_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Статус */}
                <div className={`p-3 rounded-lg ${schedule.is_active ? 
                  (isDark ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200') :
                  (isDark ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200')
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${schedule.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-medium ${schedule.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      Статус: {schedule.is_active ? 'Активно' : 'Неактивно'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {isLoadingData ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-lg">Загрузка расписаний...</p>
              <p className="text-sm">Пожалуйста, подождите</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-6xl mb-4">📅</div>
              <p className="text-lg font-semibold mb-2">Нет истории изменений расписаний</p>
              <p className="text-sm">Расписания были удалены из календаря</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScheduleHistory;
