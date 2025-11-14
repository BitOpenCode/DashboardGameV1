import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, MessageSquare, Send, User, CheckSquare, Users } from 'lucide-react';

interface UserMessagesProps {
  onBack: () => void;
  isDark: boolean;
}

interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  role: 'admin' | 'marketing' | 'viewer';
  created_at: string;
  last_login?: string;
  is_active: boolean;
  tgid?: number;
  avatar_id?: number;
  referral_clicks?: number;
  referral_registrations?: number;
  referred_by?: number;
  dashecos_coin_balance?: number;
  admin_active?: boolean;
}

const UserMessages: React.FC<UserMessagesProps> = ({ onBack, isDark }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'marketing' | 'viewer'>('all');

  // Функция для получения пользователей
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('dashecos_token');
      
      if (!token) {
        console.error('Токен не найден');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/users-take', {
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
      console.log('Пользователи с сервера:', data);
      
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Фильтрация пользователей по поисковому запросу, роли и группе
  useEffect(() => {
    let filtered = users;

    // Фильтр по поисковому запросу
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(user => {
        const userName = user.first_name || user.name || user.email.split('@')[0];
        return user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
               userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (user.tgid && user.tgid.toString().includes(searchQuery));
      });
    }

    // Фильтр по роли
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }


    setFilteredUsers(filtered);
  }, [searchQuery, users, roleFilter]);

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim()) return;

    setIsLoading(true);
    
    try {
      // TODO: Здесь будет отправка сообщения через n8n workflow
      console.log('Отправка сообщения:', {
        userId: selectedUser.id,
        message: message.trim(),
        timestamp: new Date().toISOString()
      });

      // Очищаем поле сообщения
      setMessage('');
      
      // Показываем уведомление об успешной отправке
      alert('Сообщение отправлено!');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Ошибка отправки сообщения. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Функции для массовой рассылки
  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkSend = async () => {
    if (selectedUsers.length === 0 || !bulkMessage.trim()) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Здесь будет логика массовой отправки через n8n workflow
      console.log(`Отправка сообщения ${selectedUsers.length} пользователям: ${bulkMessage}`);
      
      // Имитация отправки
      setTimeout(() => {
        setIsLoading(false);
        setBulkMessage('');
        setSelectedUsers([]);
        setShowBulkMessage(false);
        alert(`Сообщение отправлено ${selectedUsers.length} пользователям!`);
      }, 1000);
    } catch (error) {
      console.error('Ошибка массовой отправки:', error);
      alert('Ошибка отправки сообщений. Попробуйте еще раз.');
      setIsLoading(false);
    }
  };

  // Функция для получения имени пользователя
  const getUserName = (user: User) => {
    return user.first_name || user.name || user.email.split('@')[0];
  };

  // Функция для получения роли пользователя
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'marketing': return 'Аналитик';
      case 'viewer': return 'Пользователь';
      default: return role;
    }
  };

  // Функция для получения иконки роли
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'marketing': return '📢';
      case 'viewer': return '👤';
      default: return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-500';
      case 'marketing':
        return 'text-blue-500';
      case 'viewer':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
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
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Сообщения для пользователей
          </h1>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-6`}>
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Поиск по email, имени или Telegram ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-orange-500'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'marketing' | 'viewer')}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                : 'bg-white border-gray-300 text-gray-800 focus:border-orange-500'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
          >
            <option value="all">Все роли</option>
            <option value="admin">Админы</option>
            <option value="marketing">Аналитики</option>
            <option value="viewer">Пользователи</option>
          </select>
          
        </div>
        
        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{selectedUsers.length === filteredUsers.length ? 'Снять все' : 'Выбрать все'}</span>
            </button>
            
            {selectedUsers.length > 0 && (
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Выбрано: {selectedUsers.length}
              </span>
            )}
          </div>
          
          <button
            onClick={() => setShowBulkMessage(true)}
            disabled={selectedUsers.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedUsers.length > 0
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : isDark 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Массовая рассылка</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className={`lg:col-span-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Пользователи ({filteredUsers.length})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`w-full p-4 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                  selectedUser?.id === user.id
                    ? isDark ? 'bg-orange-500/20' : 'bg-orange-500/10'
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Checkbox for bulk selection */}
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                    className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                      <span className="text-lg">{getRoleIcon(user.role)}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {getUserName(user)}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)} bg-opacity-10`}>
                        {getRoleName(user.role)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.email}
                    </p>
                    {user.tgid && (
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Telegram ID: {user.tgid}
                      </p>
                    )}
                    {user.student_group && (
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Группа: {user.student_group}
                      </p>
                    )}
                  </div>
                  
                  {/* Message button */}
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`lg:col-span-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          {selectedUser ? (
            <div className="h-96 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                    <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedUser.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Начните диалог с пользователем
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Введите сообщение..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-orange-500'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      message.trim() && !isLoading
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Выберите пользователя для начала диалога</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Message Modal */}
      {showBulkMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Массовая рассылка
              </h3>
              
              <div className="mb-4">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  Отправить сообщение {selectedUsers.length} пользователям:
                </p>
                <div className="max-h-32 overflow-y-auto">
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className={`text-xs py-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        • {getUserName(user)} ({user.email})
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Введите сообщение для рассылки..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#94c356]' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-[#94c356]'
                } focus:outline-none focus:ring-2 focus:ring-[#94c356]/20`}
              />
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBulkMessage(false);
                    setBulkMessage('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Отмена
                </button>
                <button
                  onClick={handleBulkSend}
                  disabled={!bulkMessage.trim() || isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    bulkMessage.trim() && !isLoading
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isLoading ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMessages;
