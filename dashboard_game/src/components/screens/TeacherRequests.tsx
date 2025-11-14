import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Mail, Calendar, MessageSquare, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface TeacherRequest {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  request_message?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: number;
  processed_at?: string;
}

interface TeacherRequestsProps {
  onBack: () => void;
  isDark: boolean;
}

const TeacherRequests: React.FC<TeacherRequestsProps> = ({ onBack, isDark }) => {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем заявки при открытии экрана
  useEffect(() => {
    fetchTeacherRequests();
  }, []);

  const fetchTeacherRequests = async () => {
    setIsLoadingData(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/teacher-requests-take', {
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
      console.log('Полученные данные заявок:', data); // Для отладки
      
      let requestsData = [];
      
      if (data.success && Array.isArray(data.requests)) {
        requestsData = data.requests;
      } else if (Array.isArray(data)) {
        requestsData = data;
      } else if (data.requests && Array.isArray(data.requests)) {
        requestsData = data.requests;
      }
      
      // Фильтруем пустые или неполные заявки
      const validRequests = requestsData.filter(request => 
        request && 
        request.id && 
        request.user_email && 
        request.user_name &&
        request.status
      );
      
      setRequests(validRequests);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      setError('Ошибка загрузки заявок');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/teacher-request-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'approve',
          admin_notes: 'Заявка одобрена'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Обновляем локальное состояние
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'approved' } : req
        ));
        // Перезагружаем данные
        fetchTeacherRequests();
      } else {
        setError('Ошибка одобрения заявки');
      }
    } catch (error) {
      console.error('Ошибка одобрения запроса:', error);
      setError('Ошибка одобрения заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (requestId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/teacher-request-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'reject',
          admin_notes: 'Заявка отклонена'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Обновляем локальное состояние
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' } : req
        ));
        // Перезагружаем данные
        fetchTeacherRequests();
      } else {
        setError('Ошибка отклонения заявки');
      }
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error);
      setError('Ошибка отклонения заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/teacher-request-delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Удаляем заявку из локального состояния
        setRequests(prev => prev.filter(req => req.id !== requestId));
        // Перезагружаем данные
        fetchTeacherRequests();
      } else {
        setError('Ошибка удаления заявки');
      }
    } catch (error) {
      console.error('Ошибка удаления запроса:', error);
      setError('Ошибка удаления заявки');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указана';
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Одобрено';
      case 'rejected':
        return 'Отклонено';
      default:
        return 'Ожидает рассмотрения';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (isLoadingData) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#94c356] mb-4"></div>
            <p>Загрузка заявок...</p>
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
            Запросы на добавление в качестве аналитика
          </h1>
          <button
            onClick={fetchTeacherRequests}
            disabled={isLoadingData}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors disabled:opacity-50`}
            title="Обновить данные"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">👨‍🏫</div>
          <h2 className="text-xl font-bold mb-2">Заявки на роль аналитика</h2>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Рассмотрите заявки от пользователей, желающих стать аналитиками
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

        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                    <UserPlus className="w-5 h-5 text-[#94c356]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{request.user_name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Mail className="w-4 h-4" />
                      <span>{request.user_email}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(request.status)}`}>
                  {getStatusText(request.status)}
                </div>
              </div>

              {/* Сообщение заявки */}
              {request.request_message && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Сообщение заявки:</div>
                      <p className={`text-sm ${isDark ? 'text-gray-900' : 'text-gray-900'}`}>{request.request_message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Заметки администратора */}
              {request.admin_notes && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">Заметки администратора:</div>
                  <p className="text-sm text-blue-800">{request.admin_notes}</p>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4" />
                <span>Заявка подана: {formatDate(request.created_at)}</span>
              </div>

              {/* Кнопки действий */}
              <div className="flex space-x-3">
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Одобрить</span>
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Отклонить</span>
                    </button>
                  </>
                )}
                {/* Кнопка удаления - всегда видна */}
                <button
                  onClick={() => handleDelete(request.id)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  title="Удалить заявку"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Удалить</span>
                </button>
              </div>

              {/* Информация об обработке */}
              {request.status !== 'pending' && request.processed_at && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Обработано: {formatDate(request.processed_at)}
                  </div>
                </div>
              )}
            </div>
          ))}

          {requests.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-6xl mb-4">👨‍🏫</div>
              <p className="text-lg font-semibold mb-2">Заявки на роль аналитика отсутствуют</p>
              <p className="text-sm">В данный момент нет заявок от пользователей, желающих стать аналитиками</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherRequests;
