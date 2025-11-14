import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Clock, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Transaction {
  id: number;
  amount: number;
  type: 'referral_click' | 'referral_registration' | 'purchase' | 'withdrawal' | 'bonus';
  description: string;
  created_at: string;
}

interface TransactionsProps {
  onBack: () => void;
}

const Transactions: React.FC<TransactionsProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCurrentBalance();
  }, []);

  const fetchCurrentBalance = async () => {
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
        setCurrentBalance(userData?.dashecos_coin_balance || 0);
      }
    } catch (err) {
      console.error('Ошибка получения баланса:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('dashecos_token');
      if (!token) {
        setError('Нет токена авторизации');
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/user-transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Транзакции с сервера:', data);
        
        if (data && Array.isArray(data) && data.length > 0) {
          // Фильтруем только валидные транзакции
          const validTransactions = data.filter(item => 
            item && 
            item.id && 
            typeof item.amount === 'number' && 
            item.type && 
            item.created_at
          );
          
          console.log('Валидные транзакции:', validTransactions);
          
          const transactions = validTransactions.map(item => ({
            id: item.id,
            amount: item.amount || 0,
            type: item.type,
            description: item.description || '',
            created_at: item.created_at
          }));
          
          setTransactions(transactions);
        } else {
          setTransactions([]);
        }
      } else {
        console.error('HTTP Error:', response.status);
        setError(`Ошибка загрузки транзакций: ${response.status}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Ошибка соединения с сервером при загрузке транзакций');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'referral_click':
      case 'referral_registration':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'purchase':
        return <Minus className="w-5 h-5 text-red-500" />;
      case 'withdrawal':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'bonus':
        return <Plus className="w-5 h-5 text-blue-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return (amount || 0) > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'referral_click':
        return 'Реферальный клик';
      case 'referral_registration':
        return 'Реферальная регистрация';
      case 'purchase':
        return 'Покупка';
      case 'withdrawal':
        return 'Вывод средств';
      case 'bonus':
        return 'Бонус';
      default:
        return 'Транзакция';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#94c356] mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка транзакций...</p>
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
              onClick={fetchTransactions}
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
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Транзакции
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Current Balance */}
      <div className={`rounded-2xl p-6 mb-6 shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-6 h-6 text-yellow-300" />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Текущий баланс
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-300">
            {currentBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`rounded-xl p-4 transition-colors duration-300 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                {getTransactionIcon(transaction.type)}
              </div>

              {/* Transaction Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {getTransactionTypeText(transaction.type)}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  {transaction.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(transaction.created_at)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className={`font-bold text-lg ${getTransactionColor(transaction.amount || 0)}`}>
                {(transaction.amount || 0) > 0 ? '+' : ''}{(transaction.amount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {transactions.length === 0 && !isLoading && !error && (
        <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Coins className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            У вас нет транзакций
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Транзакции появятся после операций с DashEcos Coin
          </p>
        </div>
      )}
    </div>
  );
};

export default Transactions;
