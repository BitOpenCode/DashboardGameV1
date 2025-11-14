import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Search, Users, CheckCircle, XCircle, Filter, Send, User, Phone, Mail, Calendar } from 'lucide-react';

interface CourseApplicationsProps {
  onBack: () => void;
  isDark: boolean;
}

interface Application {
  id: number;
  first_name: string;
  phone: string;
  email: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  tgid?: string;
}

const CourseApplications: React.FC<CourseApplicationsProps> = ({ onBack, isDark }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [pushMessage, setPushMessage] = useState('');
  const [isSendingPush, setIsSendingPush] = useState(false);

  // Загрузка заявок на курс
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        throw new Error('Токен не найден');
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/course-applications-get', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Полученные заявки:', data);
      
      // Отладочная информация для дат
      if (Array.isArray(data) && data.length > 0) {
        console.log('Первая заявка:', data[0]);
        console.log('Дата создания (raw):', data[0].created_at);
        console.log('Дата создания (formatted):', formatDate(data[0].created_at));
      }

      if (Array.isArray(data)) {
        setApplications(data);
        setFilteredApplications(data);
      } else {
        console.error('Неверный формат данных:', data);
        setApplications([]);
        setFilteredApplications([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      alert('Ошибка загрузки заявок. Попробуйте еще раз.');
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтрация заявок
  useEffect(() => {
    let filtered = applications;

    // Фильтр по статусу
    if (statusFilter === 'pending') {
      filtered = filtered.filter(app => !app.approved);
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(app => app.approved);
    }

    // Фильтр по поиску
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(app => 
        app.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone.includes(searchQuery)
      );
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, applications]);

  const handleApprove = async (applicationId: number) => {
    setIsLoading(true);
    
    try {
      // TODO: Здесь будет отправка запроса на n8n для подтверждения
      console.log('Подтверждение заявки:', applicationId);
      
      // Обновляем локальное состояние
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, approved: true, updated_at: new Date().toISOString() }
            : app
        )
      );
      
      alert('Заявка подтверждена!');
    } catch (error) {
      console.error('Ошибка подтверждения:', error);
      alert('Ошибка подтверждения заявки. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (applicationId: number) => {
    setIsLoading(true);
    
    try {
      // TODO: Здесь будет отправка запроса на n8n для отклонения
      console.log('Отклонение заявки:', applicationId);
      
      // Обновляем локальное состояние
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, approved: false, updated_at: new Date().toISOString() }
            : app
        )
      );
      
      alert('Заявка отклонена!');
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      alert('Ошибка отклонения заявки. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPush = async (application: Application) => {
    if (!application.tgid) {
      alert('У пользователя нет Telegram ID для отправки пуша');
      return;
    }
    
    // Показываем модальное окно для ввода сообщения
    setSelectedApplication(application);
    setPushMessage('');
    setShowPushModal(true);
  };

  const sendPushMessage = async () => {
    if (!selectedApplication || !pushMessage.trim()) {
      alert('Введите сообщение для отправки');
      return;
    }

    setIsSendingPush(true);
    
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        throw new Error('Токен не найден');
      }

      // Используем GET метод с query параметрами для обхода CORS
      const params = new URLSearchParams({
        tgid: selectedApplication.tgid,
        message_text: pushMessage.trim(),
        user_name: selectedApplication.first_name
      });

      const response = await fetch(`https://n8n.bitcoinlimb.com/webhook/course-application-push?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Результат отправки пуша:', result);
      
      alert(`Пуш успешно отправлен пользователю ${selectedApplication.first_name}!`);
      setShowPushModal(false);
      setPushMessage('');
      setSelectedApplication(null);
    } catch (error) {
      console.error('Ошибка отправки пуша:', error);
      alert('Ошибка отправки пуша. Попробуйте еще раз.');
    } finally {
      setIsSendingPush(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Просто отображаем дату как есть, без преобразований
    // Это гарантирует, что время будет показано точно как в PostgreSQL
    return dateString.replace('T', ' ').replace('Z', '').substring(0, 19);
  };

  const getStatusColor = (approved: boolean) => {
    return approved 
      ? 'text-green-500 bg-green-100 dark:bg-green-900/20' 
      : 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
  };

  const getStatusText = (approved: boolean) => {
    return approved ? 'Подтверждена' : 'Ожидает';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg shadow-sm hover:shadow-md transition-all ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Заявки на курс
          </h1>
        </div>
        <button
          onClick={fetchApplications}
          disabled={isLoading}
          className={`p-2 rounded-lg shadow-sm hover:shadow-md transition-all ${
            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Обновить заявки"
        >
          <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Search and Filters */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-6`}>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Поиск по имени, email или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#94c356]' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-[#94c356]'
              } focus:outline-none focus:ring-2 focus:ring-[#94c356]/20`}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'Все' },
                { value: 'pending', label: 'Ожидают' },
                { value: 'approved', label: 'Подтверждены' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as 'all' | 'pending' | 'approved')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-[#94c356] text-white'
                      : isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Заявки ({filteredApplications.length})
          </h2>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Загрузка заявок...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Заявки не найдены
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className={`p-4 border-b border-gray-100 dark:border-gray-700`}>
                <div className="flex items-start justify-between">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                        <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {application.first_name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(application.approved)}`}>
                          {getStatusText(application.approved)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 ml-13">
                      <div className="flex items-center space-x-2">
                        <Mail className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {application.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {application.phone}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Подана: {formatDate(application.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {!application.approved ? (
                      <button
                        onClick={() => handleApprove(application.id)}
                        disabled={isLoading}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Подтвердить"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReject(application.id)}
                        disabled={isLoading}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Отклонить"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleSendPush(application)}
                      disabled={!application.tgid}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                        application.tgid
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                      title={application.tgid ? 'Отправить пуш' : 'Нет Telegram ID'}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно для отправки пуша */}
      {showPushModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Отправить пуш пользователю
              </h3>
              <button
                onClick={() => setShowPushModal(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <XCircle className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} mb-3`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Пользователь:</strong> {selectedApplication.first_name}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Telegram ID:</strong> {selectedApplication.tgid}
                </p>
              </div>
              
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Сообщение:
              </label>
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Введите сообщение для отправки..."
                rows={4}
                className={`w-full p-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#94c356]' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-[#94c356]'
                } focus:outline-none focus:ring-2 focus:ring-[#94c356]/20`}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPushModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Отмена
              </button>
              <button
                onClick={sendPushMessage}
                disabled={isSendingPush || !pushMessage.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSendingPush || !pushMessage.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-[#94c356] hover:bg-[#7ba045] text-white'
                }`}
              >
                {isSendingPush ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseApplications;
