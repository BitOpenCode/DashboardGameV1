import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Crown, Star, Zap, Flame, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface Avatar {
  id: number;
  name: string;
  description: string | null;
  image_data: string;
  price_dashecos_coins: number;
  rarity: 'common' | 'rare' | 'super rare' | 'platinum';
  is_active: boolean;
  created_at: string;
  isOwned?: boolean;
  isEquipped?: boolean;
}

interface MyAvatarsProps {
  onBack: () => void;
  onOpenShop?: () => void;
}

const MyAvatars: React.FC<MyAvatarsProps> = ({ onBack, onOpenShop }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyAvatars();
  }, []);

  const fetchMyAvatars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Нет токена авторизации');
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/my_avatars', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Мои аватары с сервера:', data);
        console.log('Тип данных:', typeof data);
        console.log('Является ли массивом:', Array.isArray(data));
        console.log('Длина массива:', Array.isArray(data) ? data.length : 'не массив');
        
        const rawData = Array.isArray(data) ? data : [];
        console.log('Сырые данные с сервера:', rawData);
        
        // Фильтруем только валидные аватары
        const avatarsData = rawData.filter(avatar => {
          const isValid = avatar && 
                         avatar.id && 
                         avatar.name;
          
          if (!isValid) {
            console.log('Отфильтрован некорректный аватар:', avatar);
          }
          
          return isValid;
        });
        
        console.log('Валидные аватары:', avatarsData);
        console.log('Количество валидных аватаров:', avatarsData.length);
        
        setAvatars(avatarsData);
      } else {
        console.error('HTTP Error:', response.status);
        setError(`Ошибка загрузки аватаров: ${response.status}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Ошибка соединения с сервером при загрузке аватаров');
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return <Star className="w-4 h-4 text-gray-400" />;
      case 'rare':
        return <Zap className="w-4 h-4 text-blue-400" />;
      case 'super rare':
        return <Crown className="w-4 h-4 text-purple-400" />;
      case 'platinum':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return isDark ? 'border-gray-500 bg-gray-700' : 'border-gray-300 bg-gray-50';
      case 'rare':
        return isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-300 bg-blue-50';
      case 'super rare':
        return isDark ? 'border-purple-500 bg-purple-900/30' : 'border-purple-300 bg-purple-50';
      case 'platinum':
        return isDark ? 'border-orange-500 bg-orange-900/30' : 'border-orange-300 bg-orange-50';
      default:
        return isDark ? 'border-gray-500 bg-gray-700' : 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return isDark ? 'text-gray-300' : 'text-gray-600';
      case 'rare':
        return 'text-blue-400';
      case 'super rare':
        return 'text-purple-400';
      case 'platinum':
        return 'text-orange-400';
      default:
        return isDark ? 'text-gray-300' : 'text-gray-600';
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
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка ваших аватаров...</p>
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
              onClick={fetchMyAvatars}
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
    <>
      <style>
        {`
          @keyframes neonGlowGreen {
            0% {
              box-shadow: 0 0 15px rgba(148,195,86,0.3), 0 0 30px rgba(148,195,86,0.1);
            }
            100% {
              box-shadow: 0 0 25px rgba(148,195,86,0.5), 0 0 50px rgba(148,195,86,0.2);
            }
          }
          
          @keyframes neonGlowRare {
            0% {
              box-shadow: 0 0 15px rgba(147,51,234,0.3), 0 0 30px rgba(147,51,234,0.1);
            }
            100% {
              box-shadow: 0 0 25px rgba(147,51,234,0.5), 0 0 50px rgba(147,51,234,0.2);
            }
          }
          
          @keyframes neonGlowSuperRare {
            0% {
              box-shadow: 0 0 15px rgba(59,130,246,0.3), 0 0 30px rgba(59,130,246,0.1);
            }
            100% {
              box-shadow: 0 0 25px rgba(59,130,246,0.5), 0 0 50px rgba(59,130,246,0.2);
            }
          }
          
          @keyframes neonGlowPlatinum {
            0% {
              box-shadow: 0 0 15px rgba(156,163,175,0.3), 0 0 30px rgba(156,163,175,0.1);
            }
            100% {
              box-shadow: 0 0 25px rgba(156,163,175,0.5), 0 0 50px rgba(156,163,175,0.2);
            }
          }
        `}
      </style>
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
          Мои аватары
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Avatars Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className={`relative rounded-xl p-4 border-2 transition-all ${
              avatar.isEquipped ? 'border-[#94c356] bg-[#94c356]/10' : getRarityColor(avatar.rarity)
            }`}
            style={{
              animation: avatar.isEquipped 
                ? 'neonGlowGreen 2s ease-in-out infinite alternate'
                : avatar.rarity === 'rare' 
                  ? 'neonGlowRare 2s ease-in-out infinite alternate'
                  : avatar.rarity === 'super rare'
                    ? 'neonGlowSuperRare 2s ease-in-out infinite alternate'
                    : avatar.rarity === 'platinum'
                      ? 'neonGlowPlatinum 2s ease-in-out infinite alternate'
                      : 'none'
            }}
          >
            {/* Avatar Image */}
            <div className="w-20 h-20 mx-auto mb-3 rounded-lg overflow-hidden bg-white">
              {avatar.image_data ? (
                <img
                  src={avatar.image_data}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Ошибка загрузки изображения аватара:', avatar.name, avatar.image_data);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-2xl">🎭</span>
                </div>
              )}
            </div>

            {/* Avatar Info */}
            <div className="text-center">
              <h3 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-800'} truncate`}>
                {avatar.name}
              </h3>
              
              {/* Rarity */}
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs mb-2 ${getRarityColor(avatar.rarity)}`}>
                {getRarityIcon(avatar.rarity)}
                <span className={`capitalize text-xs ${getRarityTextColor(avatar.rarity)}`}>
                  {avatar.rarity}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center space-x-1">
                {avatar.isEquipped ? (
                  <div className="flex items-center space-x-1 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">Экипирован</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Coins className="w-3 h-3" />
                    <span className="text-xs">Куплен</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State - показываем только если нет валидных аватаров */}
      {avatars.length === 0 && !isLoading && !error && (
        <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <span className="text-3xl">🎭</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            У вас пока нет аватаров
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Купите аватары в магазине, чтобы они появились здесь
          </p>
          <button
            onClick={onOpenShop || onBack}
            className="bg-[#94c356] text-white px-6 py-2 rounded-lg hover:bg-[#7ba045] transition-colors"
          >
            Перейти в магазин
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default MyAvatars;
