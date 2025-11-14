import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Crown, Star, Zap, Flame, Search, Filter, X } from 'lucide-react';

interface AvatarSelectionProps {
  onBack: () => void;
  isDark: boolean;
  user: any;
}

interface Avatar {
  id: number;
  name: string;
  description: string | null;
  image_data: string;
  price_dashecos_coins: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ onBack, isDark, user }) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [filteredAvatars, setFilteredAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | 'common' | 'rare' | 'super rare' | 'platinum'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAvatars();
    fetchUserBalance();
  }, []);

  // Фильтрация аватаров
  useEffect(() => {
    let filtered = avatars;

    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(avatar => 
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по редкости
    if (rarityFilter !== 'all') {
      filtered = filtered.filter(avatar => {
        // Нормализуем редкость: убираем пробелы и подчеркивания, приводим к нижнему регистру
        const normalizedAvatarRarity = avatar.rarity?.toLowerCase().trim().replace(/[\s_]/g, '');
        const normalizedFilterRarity = rarityFilter.toLowerCase().trim().replace(/[\s_]/g, '');
        
        return normalizedAvatarRarity === normalizedFilterRarity;
      });
    }

    // Фильтр по цене
    if (priceFilter === 'free') {
      filtered = filtered.filter(avatar => avatar.price_dashecos_coins === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(avatar => avatar.price_dashecos_coins > 0);
    }

    setFilteredAvatars(filtered);
  }, [avatars, searchTerm, rarityFilter, priceFilter]);

  const fetchAvatars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Нет токена авторизации');
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
        const avatarsData = Array.isArray(data) ? data : [];
        setAvatars(avatarsData);
        setFilteredAvatars(avatarsData);
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

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return <Star className="w-4 h-4 text-gray-400" />;
      case 'rare':
        return <Zap className="w-4 h-4 text-blue-400" />;
      case 'super_rare':
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
      case 'super_rare':
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
      case 'super_rare':
        return 'text-purple-400';
      case 'platinum':
        return 'text-orange-400';
      default:
        return isDark ? 'text-gray-300' : 'text-gray-600';
    }
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    console.log('🎯 handleAvatarSelect вызвана с аватаром:', avatar);
    setSelectedAvatar(avatar);
    console.log('✅ selectedAvatar установлен:', avatar);
  };

  const handleWearAvatar = async (avatar: Avatar) => {
    console.log('🎯 handleWearAvatar вызвана с аватаром:', avatar);
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        alert('Нет токена авторизации');
        return;
      }

      console.log('📤 Отправляем запрос к webhook с данными:', {
        avatar_id: avatar.id,
        token: token.substring(0, 20) + '...'
      });

      const response = await fetch(`https://n8n.bitcoinlimb.com/webhook/wear_avatar?avatar_id=${avatar.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Аватар успешно экипирован:', result);
        alert(`Аватар "${avatar.name}" успешно выбран!`);
        // Можно обновить данные пользователя или закрыть экран
        onBack();
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

  const handlePurchase = async (avatar: Avatar) => {
    if (userBalance < avatar.price_dashecos_coins) {
      alert('Недостаточно DashEcos Coin!');
      return;
    }

    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        alert('Нет токена авторизации');
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/purchase_avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_id: avatar.id,
          price: avatar.price_dashecos_coins
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Аватар успешно куплен:', result);
        alert(`Аватар "${avatar.name}" успешно куплен за ${avatar.price_dashecos_coins} DashEcos Coin!`);
        
        // После покупки сразу экипируем аватар
        await handleWearAvatar(avatar);
        
        // Обновляем баланс и список аватаров
        fetchUserBalance();
        fetchAvatars();
      } else {
        const errorText = await response.text();
        console.error('Ошибка покупки аватара:', response.status, errorText);
        alert(`Ошибка покупки аватара: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка при покупке аватара:', error);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#94c356] mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка аватаров...</p>
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
          Выбор аватара
        </h1>
        <div className="w-10"></div>
      </div>


      {/* Search and Filters */}
      <div className={`rounded-2xl p-4 mb-4 shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Search Bar */}
        <div className="relative mb-4">
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
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Фильтры</span>
          </button>
          
          <div className="text-sm text-gray-500">
            {filteredAvatars.length} из {avatars.length}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-4">
            {/* Rarity Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Редкость
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'common', label: 'Common' },
                  { value: 'rare', label: 'Rare' },
                  { value: 'super rare', label: 'Super Rare' },
                  { value: 'platinum', label: 'Platinum' }
                ].map((rarity) => (
                  <button
                    key={rarity.value}
                    onClick={() => setRarityFilter(rarity.value as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      rarityFilter === rarity.value
                        ? 'bg-[#94c356] text-white'
                        : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rarity.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Цена
              </label>
              <div className="flex gap-2">
                {['all', 'free', 'paid'].map((price) => (
                  <button
                    key={price}
                    onClick={() => setPriceFilter(price as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      priceFilter === price
                        ? 'bg-[#94c356] text-white'
                        : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredAvatars.map((avatar) => (
          <div
            key={avatar.id}
            className={`relative rounded-xl p-3 border-2 transition-all cursor-pointer ${
              selectedAvatar?.id === avatar.id
                ? 'border-[#94c356] bg-[#94c356]/10'
                : getRarityColor(avatar.rarity)
            }`}
            onClick={() => handleAvatarSelect(avatar)}
          >
            {/* Avatar Image - уменьшенный размер */}
            <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden bg-white">
              <img
                src={avatar.image_data}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Avatar Info */}
            <div className="text-center">
              <h3 className={`font-semibold text-xs mb-1 ${isDark ? 'text-white' : 'text-gray-800'} truncate`}>
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
              <div className="flex items-center justify-center space-x-1 mb-2">
                {avatar.price_dashecos_coins === 0 ? (
                  <span className="text-green-500 font-semibold text-xs">Бесплатно</span>
                ) : (
                  <>
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className={`font-semibold text-xs ${
                      userBalance >= avatar.price_dashecos_coins ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {avatar.price_dashecos_coins}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Button - только Выбрать для купленных аватаров */}
            {(() => {
              const isSelected = selectedAvatar?.id === avatar.id;
              console.log(`🔍 Аватар ${avatar.name} (id: ${avatar.id}) выбран:`, isSelected, 'selectedAvatar:', selectedAvatar);
              return isSelected;
            })() && (
              <div className="mt-2">
                <button
                  className="w-full bg-[#94c356] text-white py-1.5 px-2 rounded-lg text-xs font-semibold hover:bg-[#7ba045] transition-colors"
                  onClick={() => {
                    console.log('🖱️ Нажата кнопка "Выбрать" для аватара:', avatar);
                    handleWearAvatar(avatar);
                  }}
                >
                  Выбрать
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAvatars.length === 0 && avatars.length > 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Аватары не найдены по заданным фильтрам
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setRarityFilter('all');
              setPriceFilter('all');
            }}
            className="mt-4 bg-[#94c356] text-white px-4 py-2 rounded-lg hover:bg-[#7ba045] transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {avatars.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎭</span>
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Аватары не найдены
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarSelection;
