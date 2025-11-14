import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Users, Mail, Calendar, User, MoreVertical, Edit, Trash2, Eye, Send, XCircle } from 'lucide-react';

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

interface UserManagementProps {
  onBack: () => void;
  isDark: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack, isDark }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'marketing' | 'viewer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [coinFilter, setCoinFilter] = useState<'all' | '0' | '1-100' | '100-500' | '500+'>('all');
  const [avatarIdFilter, setAvatarIdFilter] = useState('');
  const [telegramIdFilter, setTelegramIdFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [adminActive, setAdminActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Загружаем пользователей при открытии экрана
  useEffect(() => {
    fetchUsers();
  }, []);

  // Очищаем скролл при размонтировании компонента
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Фильтрация пользователей
  useEffect(() => {
    let filtered = users;

    // Поиск по email
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по роли
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    // Фильтр по количеству монет
    if (coinFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = user.dashecos_coin_balance || 0;
        switch (coinFilter) {
          case '0':
            return balance === 0;
          case '1-100':
            return balance >= 1 && balance <= 100;
          case '100-500':
            return balance > 100 && balance <= 500;
          case '500+':
            return balance > 500;
          default:
            return true;
        }
      });
    }

    // Фильтр по группе

    // Фильтр по Avatar ID
    if (avatarIdFilter) {
      filtered = filtered.filter(user => 
        user.avatar_id && user.avatar_id.toString().includes(avatarIdFilter)
      );
    }

    // Фильтр по Telegram ID
    if (telegramIdFilter) {
      filtered = filtered.filter(user => 
        user.tgid && user.tgid.toString().includes(telegramIdFilter)
      );
    }

    // Фильтр по датам регистрации
    if (dateFromFilter) {
      filtered = filtered.filter(user => 
        new Date(user.created_at) >= new Date(dateFromFilter)
      );
    }

    if (dateToFilter) {
      filtered = filtered.filter(user => 
        new Date(user.created_at) <= new Date(dateToFilter)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, coinFilter, groupFilter, avatarIdFilter, telegramIdFilter, dateFromFilter, dateToFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден');
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
      console.log('Данные пользователей с сервера:', data);
      
      if (data.success && Array.isArray(data.users)) {
        console.log('Первый пользователь:', data.users[0]);
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        console.log('Первый пользователь (массив):', data[0]);
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setError('Ошибка загрузки пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указана';
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="text-yellow-500 font-bold">👑</span>;
      case 'marketing':
        return <span className="text-blue-500 font-bold">📢</span>;
      case 'viewer':
        return <span className="text-orange-500 font-bold">👤</span>;
      default:
        return <span className="text-gray-500 font-bold">👤</span>;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Админ';
      case 'teacher':
        return 'Учитель';
      case 'student':
        return 'Ученик';
      default:
        return 'Ученик';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'marketing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSendMessage = (user: User) => {
    if (!user.tgid) {
      alert('У пользователя нет Telegram ID для отправки сообщения');
      return;
    }
    
    setSelectedUser(user);
    setMessageText('');
    setShowMessageModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUserForDetails(user);
    setShowUserDetails(true);
    // Блокируем скролл основного экрана
    document.body.style.overflow = 'hidden';
  };

  const handleEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setCoinAmount('');
    setAdminActive(user.admin_active === true); // true = заблокированы, false = разрешены
    setShowEditModal(true);
    // Блокируем скролл основного экрана
    document.body.style.overflow = 'hidden';
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUserForEdit(null);
    setCoinAmount('');
    setNewGroup('');
    setAdminActive(true);
    // Восстанавливаем скролл
    document.body.style.overflow = 'unset';
  };

  const handleSaveUser = async () => {
    if (!selectedUserForEdit) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      
      // Формируем URL с параметрами для GET запроса
      console.log('DEBUG adminActive state:', adminActive);
      console.log('DEBUG (!adminActive):', !adminActive);
      console.log('DEBUG adminActive.toString():', adminActive.toString());
      console.log('DEBUG (!adminActive).toString():', (!adminActive).toString());
      
      const params = new URLSearchParams({
        userId: selectedUserForEdit.id.toString(),
        coinAmount: (coinAmount || 0).toString(),
        newGroup: newGroup || '',
        adminActive: adminActive.toString() // true = заблокирован, false = разрешен
      });
      
      console.log('DEBUG Final URL params:', params.toString());
      console.log('DEBUG Final URL:', `https://n8n.bitcoinlimb.com/webhook-test/users-edit?${params}`);
      
      const response = await fetch(`https://n8n.bitcoinlimb.com/webhook/users-edit?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Обновляем данные пользователя в списке
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === selectedUserForEdit.id ? { ...user, ...updatedUser[0] } : user
          )
        );
        handleCloseEditModal();
        alert('Изменения сохранены!');
      } else {
        throw new Error('Ошибка при сохранении');
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('Ошибка при сохранении изменений');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUserForDetails(null);
    // Разблокируем скролл основного экрана
    document.body.style.overflow = 'unset';
  };

  const sendMessage = async () => {
    if (!selectedUser || !messageText.trim()) {
      alert('Введите сообщение для отправки');
      return;
    }

    setIsSendingMessage(true);
    
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        throw new Error('Токен не найден');
      }

      // Используем GET метод с query параметрами для обхода CORS
      const params = new URLSearchParams({
        tgid: selectedUser.tgid.toString(),
        message_text: messageText.trim(),
        user_email: selectedUser.email
      });

      const response = await fetch(`https://n8n.bitcoinlimb.com/webhook/send-push?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Результат отправки сообщения:', result);
      
      alert(`Сообщение успешно отправлено пользователю ${selectedUser.email}!`);
      setShowMessageModal(false);
      setMessageText('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Ошибка отправки сообщения. Попробуйте еще раз.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${userEmail}? Это действие нельзя отменить.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Токен не найден');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/delete-user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        // Удаляем пользователя из локального состояния
        setUsers(prev => prev.filter(user => user.id !== userId));
        setFilteredUsers(prev => prev.filter(user => user.id !== userId));
        alert('Пользователь успешно удален!');
      } else {
        setError(data.error || 'Ошибка удаления пользователя');
      }
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      setError('Ошибка удаления пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
            <p>Загрузка пользователей...</p>
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
            Управление пользователями
          </h1>
          <button
            onClick={fetchUsers}
            disabled={isLoading}
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
          <div className="text-4xl mb-4">👥</div>
          <h2 className="text-xl font-bold mb-2">Управление пользователями</h2>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Просмотр, поиск и управление всеми пользователями системы
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

        {/* Фильтры и поиск */}
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="space-y-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск по email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                }`}
              />
            </div>

            {/* Кнопка фильтров */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-orange-500 text-white border-orange-500'
                  : isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}</span>
            </button>

            {/* Фильтры */}
            {showFilters && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
              {/* Фильтр по роли */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Роль
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Все роли</option>
                  <option value="admin">Админы</option>
                  <option value="marketing">Маркетологи</option>
                  <option value="viewer">Пользователи</option>
                </select>
              </div>

              {/* Фильтр по статусу */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Статус
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="inactive">Неактивные</option>
                </select>
              </div>

              {/* Фильтр по количеству монет */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Баланс DashEcos Coins
                </label>
                <select
                  value={coinFilter}
                  onChange={(e) => setCoinFilter(e.target.value as any)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="all">Все балансы</option>
                  <option value="0">0 монет</option>
                  <option value="1-100">1-100 монет</option>
                  <option value="100-500">100-500 монет</option>
                  <option value="500+">500+ монет</option>
                </select>
              </div>


              {/* Фильтр по Avatar ID */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Avatar ID
                </label>
                <input
                  type="text"
                  value={avatarIdFilter}
                  onChange={(e) => setAvatarIdFilter(e.target.value)}
                  placeholder="Введите Avatar ID..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Фильтр по Telegram ID */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Telegram ID
                </label>
                <input
                  type="text"
                  value={telegramIdFilter}
                  onChange={(e) => setTelegramIdFilter(e.target.value)}
                  placeholder="Введите Telegram ID..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Фильтр по дате регистрации (от) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Регистрация с
                </label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>

              {/* Фильтр по дате регистрации (до) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Регистрация до
                </label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                      setCoinFilter('all');
                      setGroupFilter('all');
                      setAvatarIdFilter('');
                      setTelegramIdFilter('');
                      setDateFromFilter('');
                      setDateToFilter('');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Сбросить все фильтры
                  </button>
                </div>
              </div>
            )}

            {/* Статистика */}
            <div className="space-y-2 text-sm text-gray-500">
              <div className="text-center">
                <span>Найдено: {filteredUsers.length} из {users.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="font-semibold text-yellow-600">{users.filter(u => u.role === 'admin').length}</div>
                  <div className="text-xs">Админов</div>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="font-semibold text-blue-600">{users.filter(u => u.role === 'marketing').length}</div>
                  <div className="text-xs">Маркетологов</div>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="font-semibold text-orange-600">{users.filter(u => u.role === 'viewer').length}</div>
                  <div className="text-xs">Пользователей</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Список пользователей */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="mb-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{user.email}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Mail className="w-4 h-4" />
                      <span>ID: {user.id}</span>
                    </div>
                    {user.first_name && (
                      <div className="text-sm text-gray-600 mt-1">
                        Имя: {user.first_name}
                      </div>
                    )}
                    {user.avatar_id && (
                      <div className="text-sm text-gray-600 mt-1">
                        Аватар ID: {user.avatar_id}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      Баланс: {user.dashecos_coin_balance || 0} DashEcos Coins
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                    {getRoleName(user.role)}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    user.is_active 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </div>
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="space-y-2 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="truncate">Регистрация: {formatDate(user.created_at)}</span>
                </div>
                {user.last_login && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="truncate">Последний вход: {formatDate(user.last_login)}</span>
                  </div>
                )}
                {user.student_group && user.student_group !== 'default' && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="truncate">Группа: {user.student_group === 'all' ? 'Все группы' : `Группа ${user.student_group.replace('group_', '')}`}</span>
                  </div>
                )}
              </div>

              {/* Telegram ID */}
              {user.tgid && (
                <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">Telegram ID:</div>
                  <div className="text-sm text-blue-800 font-mono">{user.tgid}</div>
                </div>
              )}

              {/* Реферальная информация */}
              {(user.referral_clicks || user.referral_registrations || user.referred_by) && (
                <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-600 mb-2 font-medium">Реферальная статистика</div>
                  <div className="space-y-1 text-sm">
                    {user.referral_clicks !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-orange-700">Клики по ссылке:</span>
                        <span className="font-medium text-orange-800">{user.referral_clicks}</span>
                      </div>
                    )}
                    {user.referral_registrations !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-orange-700">Регистрации:</span>
                        <span className="font-medium text-orange-800">{user.referral_registrations}</span>
                      </div>
                    )}
                    {user.referred_by && (
                      <div className="flex justify-between">
                        <span className="text-orange-700">Приглашен пользователем ID:</span>
                        <span className="font-medium text-orange-800">{user.referred_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Действия */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleViewUser(user)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 text-sm ${
                      isDark 
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                    title="Просмотр профиля"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Просмотр</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage(user)}
                    disabled={!user.tgid}
                    className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 text-sm ${
                      user.tgid 
                        ? isDark
                          ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-500'
                          : 'bg-blue-500 text-white hover:bg-blue-600 border border-blue-400'
                        : isDark
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-200'
                    }`}
                    title={user.tgid ? 'Отправить сообщение' : 'Нет Telegram ID'}
                  >
                    <Send className="w-4 h-4" />
                    <span>Сообщение</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 text-sm ${
                      isDark 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 border border-orange-500' 
                        : 'bg-orange-500 text-white hover:bg-orange-600 border border-orange-500'
                    }`}
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Редактировать</span>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 text-sm disabled:opacity-50 ${
                      isDark 
                        ? 'bg-red-600 text-white hover:bg-red-700 border border-red-500' 
                        : 'bg-red-500 text-white hover:bg-red-600 border border-red-400'
                    }`}
                    title="Удалить пользователя"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-6xl mb-4">👥</div>
              <p className="text-lg">Пользователи не найдены</p>
              <p className="text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для отправки сообщения */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Отправить сообщение пользователю
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <XCircle className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} mb-3`}>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Пользователь:</strong> {selectedUser.email}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Telegram ID:</strong> {selectedUser.tgid}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Роль:</strong> {getRoleName(selectedUser.role)}
                </p>
              </div>
              
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Сообщение:
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите сообщение для отправки..."
                rows={4}
                className={`w-full p-3 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-orange-500'
                } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Отмена
              </button>
              <button
                onClick={sendMessage}
                disabled={isSendingMessage || !messageText.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSendingMessage || !messageText.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isSendingMessage ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для просмотра деталей пользователя */}
      {showUserDetails && selectedUserForDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 px-4 z-50"
          style={{ 
            overflow: 'hidden',
            touchAction: 'none'
          }}
        >
          <div className={`w-full max-w-lg rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Информация о пользователе
              </h3>
              <button
                onClick={handleCloseUserDetails}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <XCircle className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Основная информация */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Основная информация
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>ID:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedUserForDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Имя:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedUserForDetails.name || selectedUserForDetails.first_name || 'Не указано'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Email:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'} break-all`}>{selectedUserForDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Роль:</span>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(selectedUserForDetails.role)}
                      <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{getRoleName(selectedUserForDetails.role)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Группа:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedUserForDetails.student_group 
                        ? (selectedUserForDetails.student_group === 'all' ? 'Все группы' : 
                           selectedUserForDetails.student_group === 'default' ? 'По умолчанию' : 
                           `Группа ${selectedUserForDetails.student_group.replace('group_', '')}`)
                        : 'Не назначена'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Аватар ID:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedUserForDetails.avatar_id || 'Не назначен'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Баланс DashEcos Coins:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'} font-semibold`}>
                      {selectedUserForDetails.dashecos_coin_balance || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Статус:</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUserForDetails.is_active 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUserForDetails.is_active ? 'Активен' : 'Неактивен'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Telegram информация */}
              {selectedUserForDetails.tgid && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Telegram
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between">
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Telegram ID:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-800'} font-mono`}>{selectedUserForDetails.tgid}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Даты */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Даты
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Регистрация:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{formatDate(selectedUserForDetails.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Последнее обновление:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{formatDate(selectedUserForDetails.updated_at)}</span>
                  </div>
                  {selectedUserForDetails.last_login && (
                    <div className="flex justify-between">
                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Последний вход:</span>
                      <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>{formatDate(selectedUserForDetails.last_login)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Дополнительно
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Редактор:</span>
                    <span className={`${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedUserForDetails.is_editor ? 'Да' : 'Нет'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Реферальная информация */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                  Реферальная статистика
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Клики по ссылке:</span>
                    <span className={`${isDark ? 'text-green-200' : 'text-green-800'} font-semibold`}>
                      {selectedUserForDetails.referral_clicks !== undefined ? selectedUserForDetails.referral_clicks : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Регистрации:</span>
                    <span className={`${isDark ? 'text-green-200' : 'text-green-800'} font-semibold`}>
                      {selectedUserForDetails.referral_registrations !== undefined ? selectedUserForDetails.referral_registrations : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Приглашен пользователем ID:</span>
                    <span className={`${isDark ? 'text-green-200' : 'text-green-800'} font-semibold`}>
                      {selectedUserForDetails.referred_by || 'Никто'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseUserDetails}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  handleCloseUserDetails();
                  handleSendMessage(selectedUserForDetails);
                }}
                disabled={!selectedUserForDetails.tgid}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedUserForDetails.tgid
                    ? isDark 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                Отправить сообщение
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для редактирования пользователя */}
      {showEditModal && selectedUserForEdit && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 px-4 z-50"
          style={{ 
            overflow: 'hidden',
            touchAction: 'none'
          }}
        >
          <div className={`w-full max-w-lg rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Редактировать пользователя
              </h3>
              <button
                onClick={handleCloseEditModal}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <XCircle className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Информация о пользователе */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {selectedUserForEdit.email}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  ID: {selectedUserForEdit.id} | Роль: {getRoleName(selectedUserForEdit.role)}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Текущий баланс: {selectedUserForEdit.dashecos_coin_balance || 0} DashEcos Coins
                </p>
              </div>

              {/* Отправить DashEcos Coins */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  💰 Отправить DashEcos Coins
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      Количество монет для отправки
                    </label>
                    <input
                      type="number"
                      value={coinAmount}
                      onChange={(e) => setCoinAmount(e.target.value)}
                      placeholder="Введите количество монет..."
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  {coinAmount && (
                    <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                      Новый баланс: {(selectedUserForEdit.dashecos_coin_balance || 0) + parseInt(coinAmount || '0')} DashEcos Coins
                    </div>
                  )}
                </div>
              </div>

              {/* Изменить группу */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                  👥 Изменить группу
                </h4>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    Группа пользователя
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  >
                    <option value="">Не назначена</option>
                    <option value="default">По умолчанию</option>
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
              </div>

              {/* Telegram действия */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
                  📱 Telegram действия
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setAdminActive(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !adminActive
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      ✅ Разрешены
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminActive(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        adminActive
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      ❌ Заблокированы
                    </button>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-orange-200' : 'text-orange-700'}`}>
                    {adminActive ? (
                      <>
                        <span className="text-red-600">⚠️ Пользователь заблокирован</span>
                        <br />
                        <span className="text-xs">Не может использовать команды в Telegram боте</span>
                      </>
                    ) : (
                      <>
                        <span className="text-green-600">✅ Пользователь активен</span>
                        <br />
                        <span className="text-xs">Может использовать команды в Telegram боте</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseEditModal}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Отмена
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSaving || (!coinAmount && newGroup === selectedUserForEdit.student_group && adminActive === (selectedUserForEdit.admin_active !== false))
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
