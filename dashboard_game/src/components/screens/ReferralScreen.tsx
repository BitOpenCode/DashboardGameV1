import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Share2, Users, Gift, CheckCircle, ExternalLink } from 'lucide-react';

interface ReferralScreenProps {
  onBack: () => void;
  isDark: boolean;
  user: any;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  referralCode: string;
  referralLink: string;
  invitedUsers: Array<{
    id: number;
    email: string;
    name: string;
    registeredAt: string;
    isActive: boolean;
  }>;
}

const ReferralScreen: React.FC<ReferralScreenProps> = ({ onBack, isDark, user }) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Загружаем данные реферальной системы
  useEffect(() => {
    fetchReferralStats();
    
    // Получаем startParam из Telegram WebApp для отслеживания рефералов
    const checkReferral = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
        if (startParam) {
          console.log('Referral detected:', startParam);
          // Здесь можно отправить данные о реферале на сервер
          // handleReferral(startParam);
        }
      } catch (error) {
        console.error('Error checking referral:', error);
      }
    };

    checkReferral();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('dashecos_token');
      console.log('JWT Token in ReferralScreen:', token);
      
      if (!token) {
        setError('Нет токена авторизации');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/user-refferal_code', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('RAW ответ от webhook user-refferal_code:', data);
        
        // Если это массив, берем первый элемент
        const userData = Array.isArray(data) ? data[0] : data;
        console.log('Данные пользователя referral:', userData);
        
        // Загружаем список приглашенных пользователей
        let invitedUsers = [];
        try {
          const usersResponse = await fetch('https://n8n.bitcoinlimb.com/webhook/user-referrals', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log('Список приглашенных пользователей:', usersData);
            
            invitedUsers = Array.isArray(usersData) ? usersData.map((user: any, index: number) => ({
              id: index + 1,
              email: user.email,
              name: user.email.split('@')[0],
              registeredAt: user.created_at,
              isActive: user.is_active
            })) : [];
          } else {
            console.log('Не удалось загрузить список пользователей, показываем пустой список');
          }
        } catch (usersError) {
          console.log('Ошибка при загрузке пользователей:', usersError);
          // Просто оставляем пустой список, не ломаем весь экран
        }

        // Преобразуем данные из webhook в формат для компонента
        setStats({
          totalReferrals: userData?.referral_clicks || 0,
          activeReferrals: userData?.referral_registrations || 0,
          referralCode: '', // Убираем поле кода
          referralLink: userData?.referral_link || `https://t.me/DashboardGameBot?start=${userData?.tgid}`,
          invitedUsers: invitedUsers
        });
      } else {
        console.error('HTTP Error:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        setError(`Ошибка загрузки данных: ${response.status}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTelegram = () => {
    if (stats?.referralLink) {
      const message = `Присоединяйся к Dashboard Game! 🎮💎\n\nИспользуй мою реферальную ссылку: ${stats.referralLink}\n\nВместе мы заработаем больше!`;
      
      try {
        // Используем встроенный API Telegram WebApp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).Telegram?.WebApp?.openTelegramLink) {
          const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent(message)}`;
          (window as any).Telegram.WebApp.openTelegramLink(fullUrl);
        } else {
          // Fallback для обычных браузеров
          window.open(`https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent(message)}`, '_blank');
        }
      } catch (error) {
        console.error('Error opening Telegram link:', error);
        // Fallback для обычных браузеров
        window.open(`https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent(message)}`, '_blank');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#94c356] mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Ошибка</h3>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{error}</p>
            <button
              onClick={fetchReferralStats}
              className="mt-4 bg-[#94c356] text-white px-6 py-2 rounded-lg hover:bg-[#7ba045] transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Пригласить друзей
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Referral Code Card */}
      <div className={`rounded-2xl p-6 mb-6 shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-[#94c356] to-[#7ba045] rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Пригласить друзей
          </h2>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Приглашайте друзей и получайте бонусы!
          </p>
        </div>


        {/* Referral Link */}
        <div className={`rounded-xl p-4 mb-6 border-2 border-dashed ${
          isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="text-center">
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ваша ссылка:
            </p>
            <div className={`text-sm font-mono break-all ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {stats?.referralLink || 'https://t.me/DashboardGameBot?start=123'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => copyToClipboard(stats?.referralLink || 'https://t.me/DashboardGameBot?start=123')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Скопировать</span>
              </>
            )}
          </button>

          <button
            onClick={shareToTelegram}
            className="flex items-center justify-center space-x-2 py-3 px-4 bg-[#94c356] text-white rounded-xl font-semibold hover:bg-[#7ba045] transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span>Поделиться</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className={`rounded-2xl p-6 mb-6 shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Статистика приглашений
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {stats?.totalReferrals || 0}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Всего приглашено
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {stats?.activeReferrals || 0}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Активных
            </div>
          </div>
        </div>
      </div>

      {/* Invited Users List */}
      <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Приглашенные пользователи
        </h3>
        
        {stats?.invitedUsers && stats.invitedUsers.length > 0 ? (
          <div className="space-y-3">
            {stats.invitedUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      user.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {user.name || user.email}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(user.registeredAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.isActive ? 'Активен' : 'Неактивен'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Пока никто не присоединился по вашей ссылке
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Поделитесь ссылкой с друзьями!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralScreen;
