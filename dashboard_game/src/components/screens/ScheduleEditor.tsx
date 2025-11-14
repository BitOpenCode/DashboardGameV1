import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, MapPin, User, Star } from 'lucide-react';

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
  created_by?: number; // ID пользователя, который создал расписание
  lesson_link?: string; // Ссылка для просмотра онлайн
  recorded_lesson_link?: string; // Ссылка для просмотра записанной лекции
  target_group?: string; // Целевая группа для расписания
}

interface ScheduleEditorProps {
  onBack: () => void;
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    teacher: '',
    room: '',
    class_type: '',
    level: '',
    max_participants: 15,
    start_time: '',
    end_time: '',
    date: '',
    lesson_link: '',
    recorded_lesson_link: '',
    target_group: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  // Функция проверки прав на редактирование/удаление расписания
  const canEditSchedule = (item: ScheduleItem): boolean => {
    if (isAdmin) return true; // Администратор может редактировать все
    if (isTeacher && item.created_by === user?.id) return true; // Учитель может редактировать только свое
    return false; // Ученики не могут редактировать
  };

  const canDeleteSchedule = (item: ScheduleItem): boolean => {
    if (isAdmin) return true; // Администратор может удалять все
    if (isTeacher && item.created_by === user?.id) return true; // Учитель может удалять только свое
    return false; // Ученики не могут удалять
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      teacher: isTeacher ? user?.name || '' : '',
      room: '',
      class_type: '',
      level: 'Начинающий',
      max_participants: 15,
      start_time: '',
      end_time: '',
      date: '',
      lesson_link: '',
      recorded_lesson_link: '',
      target_group: 'all'
    });
    setActiveTab('add');
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      teacher: item.teacher,
      room: item.room,
      class_type: item.class_type,
      level: item.level,
      max_participants: item.max_participants,
      start_time: item.start_time,
      end_time: item.end_time,
      date: item.date,
      lesson_link: item.lesson_link || '',
      recorded_lesson_link: item.recorded_lesson_link || '',
      target_group: item.target_group || 'all'
    });
    setActiveTab('edit');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это занятие?')) { return; }
    
    try {
      setIsLoading(true);
      
      // Получаем JWT токен из localStorage
      const token = localStorage.getItem('dashecos_token');
      
      if (!token) {
        alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите в систему.');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedule-delete', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: id
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Удаляем занятие из локального состояния
        setScheduleItems(prev => prev.filter(item => item.id !== id));
        alert('Занятие успешно удалено!');
      } else {
        throw new Error(result.error || 'Неизвестная ошибка при удалении');
      }
    } catch (error) {
      console.error('Ошибка при удалении занятия:', error);
      alert(`Ошибка при удалении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.teacher || !formData.room || !formData.class_type || 
        !formData.start_time || !formData.end_time || !formData.date) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      setIsLoading(true);
      
      if (activeTab === 'add') {
        // Получаем JWT токен из localStorage
        const token = localStorage.getItem('dashecos_token');
        
        if (!token) {
          alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите в систему.');
          return;
        }

        const response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedule-write', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: formData.title,
            teacher: formData.teacher,
            room: formData.room,
            class_type: formData.class_type,
            level: formData.level,
            max_participants: formData.max_participants,
            start_time: formData.start_time,
            end_time: formData.end_time,
            date: formData.date,
            rating: formData.rating,
            is_active: true,
            participants: 0,
            created_by: user?.id,
            target_group: formData.target_group,
            lesson_link: formData.lesson_link,
            recorded_lesson_link: formData.recorded_lesson_link
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Добавляем новое занятие в локальное состояние
          const newItem: ScheduleItem = {
            id: Date.now(), // Временный ID, в реальности будет из базы
            ...formData,
            participants: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user?.id
          };
          setScheduleItems(prev => [...prev, newItem]);
          
          // Показываем сообщение об успехе
          alert('Занятие успешно создано!');
        } else {
          throw new Error(result.error || 'Неизвестная ошибка');
        }
      } else if (activeTab === 'edit' && editingItem) {
        // Получаем JWT токен из localStorage
        const token = localStorage.getItem('dashecos_token');
        
        if (!token) {
          alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите в систему.');
          return;
        }

        // Отправляем данные на вебхук для редактирования занятия
        const response = await fetch('https://n8n.bitcoinlimb.com/webhook/schedule-edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: editingItem.id,
            title: formData.title,
            teacher: formData.teacher,
            room: formData.room,
            class_type: formData.class_type,
            level: formData.level,
            max_participants: formData.max_participants,
            start_time: formData.start_time,
            end_time: formData.end_time,
            date: formData.date,
            rating: formData.rating,
            is_active: true,
            created_by: user?.id
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Обновляем занятие в локальном состоянии
          setScheduleItems(prev => prev.map(item => 
            item.id === editingItem.id ? { 
              ...item, 
              ...formData,
              updated_at: new Date().toISOString()
            } : item
          ));
          alert('Занятие успешно обновлено!');
        } else {
          throw new Error(result.error || 'Неизвестная ошибка при обновлении');
        }
      }

      setActiveTab('list');
      setEditingItem(null);
    } catch (error) {
      console.error('Ошибка при сохранении занятия:', error);
      alert(`Ошибка при сохранении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Управление расписанием
        </h3>
        <button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-[#94c356] to-[#7ba045] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all hover:from-[#7ba045] hover:to-[#94c356] flex items-center space-x-2"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          <span>Добавить занятие</span>
        </button>
      </div>

      {scheduleItems.length === 0 ? (
        <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-6xl mb-4">📅</div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Расписание пусто
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Нажмите "Добавить занятие" чтобы создать первое занятие
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduleItems.map((item) => (
            <div key={item.id} className={`rounded-xl p-4 shadow-sm transition-colors duration-300 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Clock className="w-4 h-4" />
                      <span>{item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{item.date}</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <User className="w-4 h-4" />
                      <span>{item.teacher}</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <MapPin className="w-4 h-4" />
                      <span>{item.room}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600`}>
                      {item.class_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600`}>
                      {item.level}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600`}>
                      {item.participants}/{item.max_participants}
                    </span>
                  </div>

                  {/* Отображение ссылок, если они есть */}
                  {(item.lesson_link || item.recorded_lesson_link) && (
                    <div className="flex flex-wrap items-center space-x-2 mt-2">
                      {item.lesson_link && (
                        <a
                          href={item.lesson_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors flex items-center space-x-1`}
                        >
                          <span>🔗</span>
                          <span>Онлайн</span>
                        </a>
                      )}
                      {item.recorded_lesson_link && (
                        <a
                          href={item.recorded_lesson_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors flex items-center space-x-1`}
                        >
                          <span>📹</span>
                          <span>Запись</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {canEditSchedule(item) && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                      disabled={isLoading}
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDeleteSchedule(item) && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      disabled={isLoading}
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {activeTab === 'add' ? 'Добавить новое занятие' : 'Редактировать занятие'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Название *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Например: Утренняя йога"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Преподаватель *
          </label>
          <input
            type="text"
            value={formData.teacher}
            onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Имя преподавателя"
            readOnly={isTeacher}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Аудитория *
          </label>
          <input
            type="text"
            value={formData.room}
            onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Например: Зал №1"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Тип *
          </label>
          <select
            value={formData.class_type}
            onChange={(e) => setFormData(prev => ({ ...prev, class_type: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Выберите тип</option>
            <option value="Йога">Йога</option>
            <option value="Силовая">Силовая</option>
            <option value="Кардио">Кардио</option>
            <option value="Пилатес">Пилатес</option>
            <option value="Стретчинг">Стретчинг</option>
            <option value="Функциональный">Функциональный</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Уровень
          </label>
          <select
            value={formData.level}
            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="Начинающий">Начинающий</option>
            <option value="Средний">Средний</option>
            <option value="Продвинутый">Продвинутый</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Макс. участников
          </label>
          <input
            type="number"
            value={formData.max_participants}
            onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 15 }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            min="1"
            max="50"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Дата *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Начало *
          </label>
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Окончание *
          </label>
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>

        {/* Поле выбора группы - только для админов */}
        {isAdmin && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Целевая группа *
            </label>
            <select
              value={formData.target_group}
              onChange={(e) => setFormData(prev => ({ ...prev, target_group: e.target.value }))}
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

        {/* Отладочная информация */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`text-xs p-2 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Debug: isAdmin = {isAdmin.toString()}, user.role = {user?.role}
          </div>
        )}

        {/* Новые поля для ссылок - только для админов и учителей */}
        {(isAdmin || isTeacher) && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Онлайн ссылка
              </label>
              <input
                type="url"
                value={formData.lesson_link}
                onChange={(e) => setFormData(prev => ({ ...prev, lesson_link: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="https://zoom.us/j/... или https://meet.google.com/..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Ссылка на запись
              </label>
              <input
                type="url"
                value={formData.recorded_lesson_link}
                onChange={(e) => setFormData(prev => ({ ...prev, recorded_lesson_link: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#94c356] focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="https://youtube.com/watch?v=... или https://drive.google.com/..."
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={() => {
            setActiveTab('list');
            setEditingItem(null);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDark 
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-[#94c356] to-[#7ba045] text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all hover:from-[#7ba045] hover:to-[#94c356]"
          disabled={isLoading}
        >
          {isLoading ? 'Сохранение...' : (activeTab === 'add' ? 'Добавить' : 'Сохранить')}
        </button>
      </div>
    </div>
  );

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
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {isAdmin ? 'Редактирование расписания' : 'Управление моими занятиями'}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {isAdmin ? 'Полное управление расписанием института' : 'Управление вашими занятиями'}
          </p>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' ? renderList() : renderForm()}
    </div>
  );
};

export default ScheduleEditor;