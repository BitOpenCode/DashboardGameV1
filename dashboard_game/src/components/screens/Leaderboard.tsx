import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, Medal, Award, Coins } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface LeaderboardUser {
  id: number;
  name: string;
  dashecos_coin_balance: number;
  avatar_name?: string;
  avatar_image?: string;
  rank: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Нет токена авторизации');
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/leaderboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Таблица лидеров с сервера:', data);
        
        // Добавляем ранги
        const usersWithRank = (Array.isArray(data) ? data : []).map((user: any, index: number) => ({
          ...user,
          rank: index + 1
        }));
        
        setUsers(usersWithRank);
      } else {
        console.error('HTTP Error:', response.status);
        setError(`Ошибка загрузки таблицы лидеров: ${response.status}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Ошибка соединения с сервером при загрузке таблицы лидеров');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка таблицы лидеров...</p>
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
              onClick={fetchLeaderboard}
              className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
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
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Таблица лидеров
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`rounded-xl p-4 transition-all ${
              user.rank <= 3 ? getRankColor(user.rank) : isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
                {getRankIcon(user.rank)}
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {user.avatar_image ? (
                  <img
                    src={user.avatar_image}
                    alt={user.avatar_name || 'Аватар'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${
                  user.rank <= 3 ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  {user.name}
                </h3>
              </div>

              {/* Balance */}
              <div className="flex items-center space-x-2">
                <Coins className={`w-5 h-5 ${
                  user.rank <= 3 ? 'text-yellow-200' : 'text-yellow-400'
                }`} />
                <span className={`font-bold text-lg ${
                  user.rank <= 3 ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  {user.dashecos_coin_balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Таблица лидеров пуста
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
