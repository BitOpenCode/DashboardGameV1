import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Crown, Star, Zap, Flame, Search, Filter, X, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

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

interface AvatarShopProps {
  onBack: () => void;
}

const AvatarShop: React.FC<AvatarShopProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [filteredAvatars, setFilteredAvatars] = useState<Avatar[]>([]);
  const [ownedAvatars, setOwnedAvatars] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAvatars();
    fetchUserBalance();
    fetchOwnedAvatars();
  }, []);

  useEffect(() => {
    filterAvatars();
  }, [avatars, searchTerm, rarityFilter, priceFilter, ownedAvatars]);

  const fetchAvatars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Нет токена авторизации');
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/shop_avatars', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const avatarsData = Array.isArray(data) ? data : [];
        console.log('Аватары с сервера:', avatarsData);
        console.log('Проверка isOwned:', avatarsData.map(avatar => ({
          id: avatar.id,
          name: avatar.name,
          isOwned: avatar.isOwned,
          isEquipped: avatar.isEquipped,
          isOwnedType: typeof avatar.isOwned,
          isEquippedType: typeof avatar.isEquipped
        })));
        
        // Проверяем конкретно аватар с id: 1
        const avatar1 = avatarsData.find(avatar => avatar.id === 1);
        if (avatar1) {
          console.log('Аватар ID 1:', {
            id: avatar1.id,
            name: avatar1.name,
            isOwned: avatar1.isOwned,
            isEquipped: avatar1.isEquipped,
            isOwnedType: typeof avatar1.isOwned,
            isEquippedType: typeof avatar1.isEquipped
          });
        }
        setAvatars(avatarsData);
      } else {
        console.error('HTTP Error:', response.status);
        setError(`Ошибка загрузки аватаров: ${response.status}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) return;

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/user-coins', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = Array.isArray(data) ? data[0] : data;
        setUserBalance(userData?.dashecos_coin_balance || 0);
      }
    } catch (err) {
      console.error('Ошибка получения баланса:', err);
    }
  };

  const fetchOwnedAvatars = async () => {
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) return;

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/my_avatars', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const ownedAvatarsData = Array.isArray(data) ? data : [];
        console.log('Данные my_avatars webhook:', ownedAvatarsData);
        const ownedIds = ownedAvatarsData.map(avatar => avatar.id);
        console.log('Купленные аватары ID:', ownedIds);
        setOwnedAvatars(ownedIds);
      }
    } catch (err) {
      console.error('Ошибка получения купленных аватаров:', err);
    }
  };

  const filterAvatars = () => {
    let filtered = [...avatars];

    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(avatar =>
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по редкости
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(avatar => {
        const normalizedAvatarRarity = avatar.rarity?.toLowerCase().trim().replace(/[\s_]/g, '');
        const normalizedFilterRarity = rarityFilter.toLowerCase().trim().replace(/[\s_]/g, '');
        return normalizedAvatarRarity === normalizedFilterRarity;
      });
    }

    // Фильтр по цене
    if (priceFilter !== 'all') {
      if (priceFilter === 'free') {
        filtered = filtered.filter(avatar => avatar.price_dashecos_coins === 0);
      } else if (priceFilter === 'paid') {
        filtered = filtered.filter(avatar => avatar.price_dashecos_coins > 0);
      }
    }

    // Сортировка по редкости: common -> rare -> super rare -> platinum
    const rarityOrder = { 'common': 1, 'rare': 2, 'super rare': 3, 'platinum': 4 };
    filtered.sort((a, b) => {
      const aOrder = rarityOrder[a.rarity as keyof typeof rarityOrder] || 0;
      const bOrder = rarityOrder[b.rarity as keyof typeof rarityOrder] || 0;
      return aOrder - bOrder;
    });

    setFilteredAvatars(filtered);
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

  const handlePurchase = async (avatar: Avatar) => {
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        alert('Нет токена авторизации');
        return;
      }

      // Проверяем баланс
      if (userBalance < avatar.price_dashecos_coins) {
        alert('Недостаточно DashEcos Coin для покупки');
        return;
      }

      const requestData = {
        avatar_id: avatar.id,
        price_paid: avatar.price_dashecos_coins
      };

      console.log('Отправляем запрос на покупку аватара:', requestData);
      console.log('Текущий баланс пользователя:', userBalance);

      const response = await fetch(`https://n8n.bitcoinlimb.com/webhook/buy-avatar?avatar_id=${avatar.id}&price_paid=${avatar.price_dashecos_coins}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Ответ сервера:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Ответ от сервера:', result);
        
        if (result.success) {
          alert(`Аватар "${avatar.name}" успешно куплен!`);
          // Обновляем данные
          fetchAvatars();
          fetchUserBalance();
          fetchOwnedAvatars();
        } else {
          alert(`Ошибка: ${result.error}`);
        }
      } else {
        const result = await response.json();
        console.error('Ошибка покупки аватара:', response.status, result);
        alert(`Ошибка: ${result.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка при покупке аватара:', error);
      alert('Ошибка соединения с сервером');
    }
  };

  const handleWearAvatar = async (avatar: Avatar) => {
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        alert('Нет токена авторизации');
        return;
      }

      const response = await fetch(`https://n8n.bitcoinlimb.com/webhook/wear_avatar?avatar_id=${avatar.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Аватар успешно экипирован:', result);
        alert(`Аватар "${avatar.name}" успешно выбран!`);
        
        // Обновляем данные
        fetchAvatars();
      } else {
        const errorText = await response.text();
        console.error('Ошибка экипировки аватара:', response.status, errorText);
        alert(`Ошибка выбора аватара: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка при экипировке аватара:', error);
      alert('Ошибка соединения с сервером');
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
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка магазина...</p>
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
              onClick={fetchAvatars}
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
          
          @keyframes neonGlowOwned {
            0% {
              box-shadow: 0 0 15px rgba(34,197,94,0.3), 0 0 30px rgba(34,197,94,0.1);
            }
            100% {
              box-shadow: 0 0 25px rgba(34,197,94,0.5), 0 0 50px rgba(34,197,94,0.2);
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
          Магазин аватаров
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Balance */}
      <div className={`rounded-2xl p-4 mb-6 shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-6 h-6 text-yellow-300" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Ваш баланс
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-300">
            {userBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Поиск аватаров..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Фильтры</span>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`p-4 rounded-lg transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Фильтры
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rarity Filter */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Редкость
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'common', 'rare', 'super rare', 'platinum'].map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => setRarityFilter(rarity)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      rarityFilter === rarity
                        ? 'bg-orange-500 text-white'
                        : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rarity === 'all' ? 'Все' : rarity}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Цена
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'free', 'paid'].map((price) => (
                  <button
                    key={price}
                    onClick={() => setPriceFilter(price)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      priceFilter === price
                        ? 'bg-orange-500 text-white'
                        : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {price === 'all' ? 'Все' : price === 'free' ? 'Бесплатные' : 'Платные'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Avatars Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAvatars.map((avatar) => (
          <div
            key={avatar.id}
            className={`relative rounded-xl p-4 border-2 transition-all ${
              avatar.isEquipped 
                ? 'border-orange-500 bg-orange-500/10' 
                : avatar.isOwned 
                  ? 'border-orange-500 bg-orange-900/20' 
                  : getRarityColor(avatar.rarity)
            }`}
            style={{
              animation: avatar.isEquipped 
                ? 'neonGlowGreen 2s ease-in-out infinite alternate'
                : avatar.isOwned
                  ? 'neonGlowOwned 2s ease-in-out infinite alternate'
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
            <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden bg-white">
              <img
                src={avatar.image_data}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
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

              {/* Price */}
              <div className="flex items-center justify-center space-x-1 mb-3">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {avatar.price_dashecos_coins === 0 ? 'Бесплатно' : avatar.price_dashecos_coins.toLocaleString()}
                </span>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                {ownedAvatars.includes(avatar.id) ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-1 text-xs text-orange-500 font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      <span>Куплен</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(avatar)}
                    disabled={userBalance < avatar.price_dashecos_coins}
                    className={`w-full text-xs py-1 px-2 rounded transition-colors ${
                      userBalance >= avatar.price_dashecos_coins
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {avatar.price_dashecos_coins === 0 ? 'Забрать' : 'Купить'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAvatars.length === 0 && !isLoading && (
        <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <span className="text-3xl">🎭</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Аватары не найдены
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Попробуйте изменить фильтры поиска
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setRarityFilter('all');
              setPriceFilter('all');
            }}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default AvatarShop;
