import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  RefreshCw, Users, TrendingUp, Pickaxe, Coins, ShoppingCart, Calendar, 
  DollarSign, ArrowLeftRight, Target, CheckCircle, Megaphone, Smartphone, 
  Star, Repeat, Monitor, Laptop, Building2, Zap, Mountain, Wallet, 
  CalendarDays, Diamond, Gamepad2, Trophy, Medal, ThumbsUp, Heart, 
  Pointer, PartyPopper, Globe, Gift, UserPlus, CreditCard, Award,
  Search, ChevronRight, X
} from 'lucide-react';

// Icon component for events
const EventIcon: React.FC<{ name: string; className?: string; color?: string }> = ({ name, className = "w-5 h-5", color }) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'mining': <Pickaxe className={className} style={{ color }} />,
    'coins': <Coins className={className} style={{ color }} />,
    'cart': <ShoppingCart className={className} style={{ color }} />,
    'calendar': <Calendar className={className} style={{ color }} />,
    'dollar': <DollarSign className={className} style={{ color }} />,
    'swap': <ArrowLeftRight className={className} style={{ color }} />,
    'target': <Target className={className} style={{ color }} />,
    'check': <CheckCircle className={className} style={{ color }} />,
    'megaphone': <Megaphone className={className} style={{ color }} />,
    'phone': <Smartphone className={className} style={{ color }} />,
    'star': <Star className={className} style={{ color }} />,
    'exchange': <Repeat className={className} style={{ color }} />,
    'monitor': <Monitor className={className} style={{ color }} />,
    'laptop': <Laptop className={className} style={{ color }} />,
    'building': <Building2 className={className} style={{ color }} />,
    'zap': <Zap className={className} style={{ color }} />,
    'mountain': <Mountain className={className} style={{ color }} />,
    'wallet': <Wallet className={className} style={{ color }} />,
    'calendar-days': <CalendarDays className={className} style={{ color }} />,
    'diamond': <Diamond className={className} style={{ color }} />,
    'gamepad': <Gamepad2 className={className} style={{ color }} />,
    'trophy': <Trophy className={className} style={{ color }} />,
    'medal': <Medal className={className} style={{ color }} />,
    'thumb': <ThumbsUp className={className} style={{ color }} />,
    'heart': <Heart className={className} style={{ color }} />,
    'pointer': <Pointer className={className} style={{ color }} />,
    'party': <PartyPopper className={className} style={{ color }} />,
    'globe': <Globe className={className} style={{ color }} />,
    'gift': <Gift className={className} style={{ color }} />,
    'users': <Users className={className} style={{ color }} />,
    'user-plus': <UserPlus className={className} style={{ color }} />,
    'card': <CreditCard className={className} style={{ color }} />,
    'award': <Award className={className} style={{ color }} />,
  };
  return <>{iconMap[name] || <Zap className={className} style={{ color }} />}</>;
};
import { fetchDashboardStats, type DashboardStats } from '../../utils/n8n';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { subDays, format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Address } from '@ton/core';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const numberFormat = (value: number, fractionDigits = 2) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: fractionDigits }).format(value);

// Функция для полного отображения чисел (без округления)
const formatFullNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  
  // Если число очень маленькое (< 0.0001), показываем все знаки
  if (Math.abs(num) > 0 && Math.abs(num) < 0.0001) {
    return num.toFixed(20).replace(/\.?0+$/, '');
  }
  
  // Для обычных чисел показываем до 8 знаков после запятой
  return num.toFixed(8).replace(/\.?0+$/, '');
};

const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Установлено в false, так как dashboard-stats не используется
  const [error, setError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<{
    totalUsers: number;
    usersLast24h: any[];
    dailyCounts: { date: string; count: number }[];
    languageCounts?: { language: string; count: number }[];
    languageCountsLast24h?: { language: string; count: number }[];
    premiumUsers?: number;
    premiumUsersLast24h?: number;
    totalPremiumPercentage?: number;
    premiumPercentageLast24h?: number;
    text?: string; // Для текстового сообщения от n8n
  } | null>(null);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<'all' | '7' | '30'>('all');
  const [walletsData, setWalletsData] = useState<{
    totalUsers: number;
    withWalletCount: number;
    withoutWalletCount: number;
    withWalletPercent: string;
    withoutWalletPercent: string;
  } | null>(null);
  const [walletsLoading, setWalletsLoading] = useState<boolean>(false);
  const [eventsData, setEventsData] = useState<{
    events: {
      [key: string]: { date: string; count: number }[];
    };
    totalByDay: { date: string; count: number }[];
    debug?: any;
  } | null>(null);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsTimeFilter, setEventsTimeFilter] = useState<'all' | '7' | '30'>('all');
  const [selectedEventModal, setSelectedEventModal] = useState<{
    eventName: string;
    eventData: { date: string; count: number }[];
    eventInfo: { title: string; icon: string; color: string };
  } | null>(null);
  const [modalTimeFilter, setModalTimeFilter] = useState<'all' | '7' | '30'>('all');
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonTimeFilter, setComparisonTimeFilter] = useState<'all' | '7' | '30'>('all');
  const [correlationTimeFilter, setCorrelationTimeFilter] = useState<'all' | '7' | '30'>('all');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [eventsInitialized, setEventsInitialized] = useState<boolean>(false);
  const [referralsData, setReferralsData] = useState<{
    totalInvites: number;
    topReferrers: { username: string; count: number }[];
    byDay: { date: string; count: number }[];
  } | null>(null);
  const [referralsLoading, setReferralsLoading] = useState<boolean>(false);
  const [activityOverview, setActivityOverview] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState<string | null>(null);
  const [walletUsers, setWalletUsers] = useState<Array<{
    id: number;
    display_name: string;
    username: string;
    first_name: string;
    last_name: string;
    wallet_address: string;
    is_ecos_premium: boolean;
    language_code: string;
    created_at: string;
    updated_at: string;
  }> | null>(null);
  const [walletUsersLoading, setWalletUsersLoading] = useState<boolean>(false);
  const [walletBalances, setWalletBalances] = useState<{ [address: string]: { balance: string; loading: boolean; error?: string } }>({});
  const [walletSearchQuery, setWalletSearchQuery] = useState<string>('');
  const [tonUsdRate, setTonUsdRate] = useState<number | null>(null);
  const [tonUsdLoading, setTonUsdLoading] = useState<boolean>(false);
  const [funnelData, setFunnelData] = useState<{
    level_stats: Array<{
      level: number;
      users_per_level: number;
      percentage: string;
    }>;
    total_users: number;
  } | null>(null);
  const [funnelLoading, setFunnelLoading] = useState<boolean>(false);
  const [leadersData, setLeadersData] = useState<{
    leaderboard: Array<{
      rank: number;
      user_id: number | null;
      username: string;
      asic_count: number;
      th: number;
      avatar_url: string | null;
    }>;
    total: number;
  } | null>(null);
  const [leadersLoading, setLeadersLoading] = useState<boolean>(false);
  const [poolsData, setPoolsData] = useState<{
    pools: Array<{
      id: number;
      owner_id: number;
      name: string;
      description: string | null;
      reward_type: string;
      commission: string;
      payment_frequency: number;
      visibility: string;
      status: string;
      total_hashrate: string;
      created_at: string;
      updated_at: string;
      lvl: number;
      max_lvl: number;
    }>;
  } | null>(null);
  const [poolsLoading, setPoolsLoading] = useState<boolean>(false);
  const [kpiData, setKpiData] = useState<{
    level_stats: Array<{
      level: number;
      users_per_level: number;
      percentage: string;
    }>;
    total_users: number;
  } | null>(null);
  const [kpiLoading, setKpiLoading] = useState<boolean>(false);
  const [selectedKpiLevel, setSelectedKpiLevel] = useState<number | null>(null);
  const [asicKpiData, setAsicKpiData] = useState<Array<{
    person_id: number;
    tg_id: string;
    username: string;
    first_name: string;
    last_name: string;
    current_level: number;
    effective_ths: string;
    total_asics: number;
    required_asics_for_next_level: number;
    missing_asics: number;
    progress_percent: number;
    person_created_at: string;
    tg_photo_url: string;
  }> | null>(null);
  const [asicKpiLoading, setAsicKpiLoading] = useState<boolean>(false);
  const [refKpiData, setRefKpiData] = useState<Array<{
    person_id: number;
    tg_id: string;
    username: string;
    first_name: string;
    last_name: string;
    current_level: number;
    effective_ths: string;
    total_asics: number;
    total_referrals: number;
    person_created_at: string;
    tg_photo_url: string;
  }> | null>(null);
  const [refKpiLoading, setRefKpiLoading] = useState<boolean>(false);
  const [ref3KpiData, setRef3KpiData] = useState<Array<{
    person_id: number;
    tg_id: string;
    username: string;
    first_name: string;
    last_name: string;
    current_level: number;
    effective_ths: string;
    total_asics: number;
    total_referrals: number;
    person_created_at: string;
    tg_photo_url: string;
  }> | null>(null);
  const [ref3KpiLoading, setRef3KpiLoading] = useState<boolean>(false);
  const [selectedRefKpiUsers, setSelectedRefKpiUsers] = useState<Set<number>>(new Set());
  const [selectedAsicKpiUsers, setSelectedAsicKpiUsers] = useState<Set<number>>(new Set());
  const [selectedRef3KpiUsers, setSelectedRef3KpiUsers] = useState<Set<number>>(new Set());
  const [pushModalOpen, setPushModalOpen] = useState<boolean>(false);
  const [pushMessage, setPushMessage] = useState<string>('');
  const [pushSending, setPushSending] = useState<boolean>(false);
  const [pushModalSource, setPushModalSource] = useState<'ref1' | 'ref3' | 'asic' | null>(null);
  const [allUsersData, setAllUsersData] = useState<{
    users: Array<{
      person_id: number;
      person_language: string;
      wallet_address: string;
      hex_wallet_address: string;
      is_ecos_premium: boolean;
      ecos_premium_until: string | null;
      onbording_done: boolean;
      person_created_at: string;
      person_updated_at: string;
      tg_id: string;
      first_name: string;
      last_name: string;
      username: string;
      tg_language: string;
      tg_premium: boolean;
      photo_url: string | null;
      tg_created_at: string;
      tg_updated_at: string;
      total_asics: number;
      total_th: number;
      level: number | null;
      effective_ths: number;
      progress_cached: number;
    }>;
    total: number;
  } | null>(null);
  const [allUsersLoading, setAllUsersLoading] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<{
    user: any;
    loading: boolean;
  } | null>(null);
  const [userTransactions, setUserTransactions] = useState<{
    all_transactions: any[];
    transactions_by_type: any;
    balance_history: any;
    last_transaction: any;
    total_orders: number;
    total_points_spent: number;
    total_ton_spent: number;
    orders: any[];
    assets_metadata: any;
    loading: boolean;
  } | null>(null);
  const [transactionFilters, setTransactionFilters] = useState<{
    type: string;
    dateFrom: string;
    dateTo: string;
    amountMin: string;
    amountMax: string;
    direction: 'all' | 'income' | 'expense';
  }>({
    type: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    direction: 'all'
  });
  const [orderFilters, setOrderFilters] = useState<{
    type: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    pointsMin: string;
    pointsMax: string;
    tonMin: string;
    tonMax: string;
  }>({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    pointsMin: '',
    pointsMax: '',
    tonMin: '',
    tonMax: ''
  });
  const [allUsersFilters, setAllUsersFilters] = useState<{
    search: string;
    ecosPremium: 'all' | 'premium' | 'free';
    tgPremium: 'all' | 'premium' | 'free';
    onboarding: 'all' | 'done' | 'pending';
    language: 'all' | string;
    level: 'all' | string;
    minAsic: string;
    maxAsic: string;
    minTh: string;
    maxTh: string;
    dateFrom: string;
    dateTo: string;
  }>({
    search: '',
    ecosPremium: 'all',
    tgPremium: 'all',
    onboarding: 'all',
    language: 'all',
    level: 'all',
    minAsic: '',
    maxAsic: '',
    minTh: '',
    maxTh: '',
    dateFrom: '',
    dateTo: ''
  });
  const [allUsersSort, setAllUsersSort] = useState<{
    field: string | null;
    direction: 'asc' | 'desc';
  }>({
    field: null,
    direction: 'asc'
  });
  const [levelUsersModal, setLevelUsersModal] = useState<{
    level: number;
    users: Array<{
      rank: number;
      user_id: number;
      username: string;
      asic_count: number;
      th: number;
      avatar_url: string | null;
    }>;
  } | null>(null);
  const [levelUsersLoading, setLevelUsersLoading] = useState<boolean>(false);
  
  // Фильтры для модального окна пользователей уровня
  const [levelUsersFilters, setLevelUsersFilters] = useState<{
    minASIC: string;
    maxASIC: string;
    minTh: string;
    maxTh: string;
  }>({
    minASIC: '',
    maxASIC: '',
    minTh: '',
    maxTh: ''
  });

  // Refs для категорий событий
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (e) {
      // Игнорируем ошибки загрузки dashboard-stats, так как этот webhook может быть неактивен
      console.warn('⚠️ Не удалось загрузить dashboard-stats (webhook может быть неактивен):', e);
      // Не устанавливаем ошибку, чтобы не показывать её пользователю
      // setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersData = async () => {
    setUsersLoading(true);
    
    // Скрываем остальную статистику
    setWalletsData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      // Используем относительный путь для прокси (на production будет полный URL)
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/users-game-daily'  // Для локальной разработки через прокси
        : 'https://n8n-p.blc.am/webhook/users-game-daily'; // Для production

      console.log('Отправляем запрос на:', webhookUrl);
      console.log('Метод: GET');

      // GET запрос без авторизации (убираем mode: 'cors' для избежания preflight запроса)
      const response = await fetch(webhookUrl, {
        method: 'GET'
      });

      console.log('Ответ получен:', response.status, response.statusText);
      console.log('Заголовки ответа:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка ответа:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Детали: ${errorText}`);
      }

      const data = await response.json();
      console.log('Данные получены:', data);
      console.log('Тип данных:', typeof data);
      console.log('Является ли массивом:', Array.isArray(data));
      
      // Проверяем, пришли ли структурированные данные от n8n
      if (data.totalUsers !== undefined) {
        // Если пришли структурированные данные от n8n
        console.log('Получены структурированные данные от n8n:', data);
        setUsersData(data);
      } else if (data.text) {
        // Если пришло текстовое сообщение от n8n (старый формат)
        console.log('Получено текстовое сообщение от n8n');
        setUsersData({
          totalUsers: 0,
          usersLast24h: [],
          dailyCounts: [],
          text: data.text
        });
      } else {
        // Обрабатываем сырые данные пользователей (старый формат)
        let users = [];
        
        if (Array.isArray(data)) {
          console.log('Получен массив пользователей, количество:', data.length);
          users = data;
        } else if (data && typeof data === 'object') {
          console.log('Получен одиночный объект пользователя');
          users = [data]; // Преобразуем в массив
        } else {
          console.log('Неожиданный формат данных:', typeof data);
          throw new Error('Неожиданный формат данных от вебхука');
        }
        
        console.log('Обрабатываем пользователей:', users.length);
        
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        
        // Подсчитываем пользователей за последние 24 часа
        const usersLast24h = users.filter((user: any) => {
          const createdAt = Date.parse(user.created_at);
          return !Number.isNaN(createdAt) && createdAt >= dayAgo;
        });
        
        console.log('Пользователи за последние 24 часа:', usersLast24h.length);
        
        // Группируем по дням
        const countsByDay = new Map();
        for (const user of users) {
          const ts = Date.parse(user.created_at);
          if (Number.isNaN(ts)) continue;
          const date = new Date(ts);
          const dayKey = `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCFullYear()).slice(-2)}`;
          countsByDay.set(dayKey, (countsByDay.get(dayKey) || 0) + 1);
        }
        
        const dailyCounts = Array.from(countsByDay.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => {
            const [ad, am, ay] = a.date.split('.').map(Number);
            const [bd, bm, by] = b.date.split('.').map(Number);
            const aDate = new Date(2000 + ay, am - 1, ad).getTime();
            const bDate = new Date(2000 + by, bm - 1, bd).getTime();
            return aDate - bDate;
          });
        
        console.log('Итоговые данные:', {
          totalUsers: users.length,
          usersLast24h: usersLast24h.length,
          dailyCounts: dailyCounts.length
        });
        
        setUsersData({
          totalUsers: users.length,
          usersLast24h: usersLast24h,
          dailyCounts: dailyCounts
        });
      }
    } catch (e) {
      console.error('Ошибка загрузки данных пользователей:', e);
      
      // Более детальная обработка ошибок
      let errorMessage = 'Unknown error';
      if (e instanceof Error) {
        if (e.message.includes('Failed to fetch')) {
          errorMessage = 'Ошибка сети: не удается подключиться к серверу. Проверьте интернет-соединение.';
        } else if (e.message.includes('CORS')) {
          errorMessage = 'Ошибка CORS: сервер не разрешает запросы с этого домена.';
        } else {
          errorMessage = e.message;
        }
      }
      
      alert('Ошибка загрузки данных пользователей: ' + errorMessage);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadWalletsData = async () => {
    setWalletsLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/users-wallets'
        : 'https://n8n-p.blc.am/webhook/users-wallets';
      
      console.log('🔗 Загрузка данных кошельков...');
      console.log('URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Данные кошельков получены:', data);
      
      // Обрабатываем данные
      setWalletsData({
        totalUsers: data['Total Users'] || data.totalUsers || 0,
        withWalletCount: data.withWalletCount || 0,
        withoutWalletCount: data.withoutWalletCount || 0,
        withWalletPercent: data.withWalletPercent || '0%',
        withoutWalletPercent: data.withoutWalletPercent || '0%',
      });
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке данных кошельков:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки данных кошельков: ${errorMessage}\n\nУбедитесь, что webhook "users-wallets" активен в n8n.`;
      alert(fullErrorMessage);
    } finally {
      setWalletsLoading(false);
    }
  };

  const loadEventsData = async () => {
    setEventsLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-events'
        : 'https://n8n-p.blc.am/webhook/game-events';
      
      console.log('🔗 Загрузка данных игровых событий...');
      console.log('URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      let data = await response.json();
      console.log('✅ Данные событий получены:', data);
      
      // Обрабатываем данные - если это массив с одним элементом, берем первый элемент
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
      
      setEventsData({
        events: data.events || {},
        totalByDay: data.totalByDay || [],
        debug: data.debug
      });
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке данных событий:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      alert('Ошибка загрузки данных событий: ' + errorMessage);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadReferralsData = async () => {
    setReferralsLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setEventsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/top-ref'
        : 'https://n8n-p.blc.am/webhook/top-ref';
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Парсим HTML-текст
      let textData = data[0]?.text || data.text || '';
      
      // Заменяем экранированные символы на реальные переносы строк
      textData = textData.replace(/\\n/g, '\n');
      
      // Извлекаем Total invites
      const totalMatch = textData.match(/Total invites:<\/b>\s*(\d+)/);
      const totalInvites = totalMatch ? parseInt(totalMatch[1]) : 0;
      
      // Извлекаем Top referrers
      const topReferrersSection = textData.match(/Top referrers:<\/b>\n([\s\S]*?)\n\n<b>By day:/);
      const topReferrers = [];
      
      if (topReferrersSection && topReferrersSection[1]) {
        const lines = topReferrersSection[1].split('\n').filter(l => l.trim());
        for (const line of lines) {
          const match = line.match(/(.+?)\s+—\s+(\d+)/);
          if (match) {
            topReferrers.push({
              username: match[1].trim(),
              count: parseInt(match[2])
            });
          }
        }
      }
      
      console.log('👥 Топ рефереров из основной статистики:', topReferrers.map(r => r.username));
      
      // Извлекаем By day
      const byDaySection = textData.match(/By day:<\/b>\n([\s\S]*?)$/);
      const byDay = [];
      
      if (byDaySection && byDaySection[1]) {
        const lines = byDaySection[1].split('\n').filter(l => l.trim());
        for (const line of lines) {
          const match = line.match(/(\d{4}-\d{2}-\d{2})\s+—\s+(\d+)/);
          if (match) {
            // Преобразуем формат даты из YYYY-MM-DD в DD.MM.YY
            const [year, month, day] = match[1].split('-');
            const formattedDate = `${day}.${month}.${year.slice(-2)}`;
            byDay.push({
              date: formattedDate,
              count: parseInt(match[2])
            });
          }
        }
      }
      
      setReferralsData({
        totalInvites,
        topReferrers,
        byDay
      });
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке данных рефералов:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      alert('Ошибка загрузки данных рефералов: ' + errorMessage);
    } finally {
      setReferralsLoading(false);
    }
  };

  const loadFunnelData = async () => {
    setFunnelLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-funnel'
        : 'https://n8n-p.blc.am/webhook/game-funnel';
      
      console.log('🔗 Загрузка Funnel данных с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Полученные Funnel данные (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Обрабатываем данные от webhook
      // Ожидаем формат: [{ level_stats: [...], total_users: number }] или { level_stats: [...], total_users: number }
      let processedData;
      if (Array.isArray(data) && data.length > 0) {
        // Если это массив, берем первый элемент
        if (data[0].level_stats) {
          processedData = data[0];
        } else if (data[0] && typeof data[0] === 'object') {
          // Если первый элемент - объект со статистикой напрямую
          processedData = data[0];
        } else {
          throw new Error('Неверный формат данных: массив не содержит level_stats');
        }
      } else if (data && data.level_stats) {
        // Если данные пришли не в массиве, но есть level_stats
        processedData = data;
      } else {
        console.error('❌ Неверный формат данных:', data);
        throw new Error('Неверный формат данных от webhook. Ожидается объект с level_stats или массив с таким объектом.');
      }
      
      console.log('📊 Обработанные данные:', processedData);
      
      // Нормализуем типы данных (убеждаемся, что numbers - это numbers, а не strings)
      processedData.level_stats = processedData.level_stats.map((stat: any) => ({
        level: parseInt(stat.level) || 0,
        users_per_level: parseInt(stat.users_per_level) || 0,
        percentage: typeof stat.percentage === 'string' ? stat.percentage : parseFloat(stat.percentage || 0).toFixed(2)
      }));
      
      // Дополняем данные недостающими уровнями (0-10) с нулевыми значениями
      const maxLevel = 10;
      const existingLevels = new Set(processedData.level_stats.map((stat: any) => stat.level));
      
      // Создаем массив всех уровней от 0 до 10
      const allLevels = [];
      for (let level = 0; level <= maxLevel; level++) {
        const existingStat = processedData.level_stats.find((stat: any) => stat.level === level);
        if (existingStat) {
          allLevels.push(existingStat);
        } else {
          // Добавляем уровень с нулевыми значениями
          allLevels.push({
            level: level,
            users_per_level: 0,
            percentage: "0.00"
          });
        }
      }
      
      processedData.level_stats = allLevels;
      processedData.total_users = parseInt(processedData.total_users) || 0;
      
      setFunnelData(processedData);
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке Funnel данных:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки Funnel данных: ${errorMessage}\n\nУбедитесь, что webhook "game-funnel-board" активен в n8n.`;
      alert(fullErrorMessage);
    } finally {
      setFunnelLoading(false);
    }
  };

  const loadLeadersData = async () => {
    setLeadersLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-leaders-table'
        : 'https://n8n-p.blc.am/webhook/game-leaders-table';
      
      console.log('🔗 Загрузка данных лидеров с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Полученные данные лидеров (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Обрабатываем данные от webhook
      // Ожидаем формат: [{ leaderboard: [...], total: number }] или { leaderboard: [...], total: number }
      let rawData;
      if (Array.isArray(data) && data.length > 0) {
        // Если это массив, берем первый элемент
        rawData = data[0];
        console.log('✅ Данные - массив, извлекаем первый элемент');
      } else if (data && typeof data === 'object' && data.leaderboard) {
        // Если это объект с leaderboard
        rawData = data;
        console.log('✅ Данные - объект с leaderboard');
      } else {
        console.error('❌ Неизвестный формат данных:', data);
        throw new Error('Неверный формат данных от webhook. Ожидается массив с объектом или объект с leaderboard.');
      }
      
      // Проверяем наличие leaderboard
      if (!rawData.leaderboard || !Array.isArray(rawData.leaderboard)) {
        throw new Error('Неверный формат данных: отсутствует leaderboard или он не является массивом.');
      }
      
      const processedData = {
        leaderboard: rawData.leaderboard.map((user: any) => ({
          rank: parseInt(user.rank) || 0,
          user_id: user.user_id ? parseInt(user.user_id) : null,
          username: user.username || 'Unknown',
          asic_count: parseInt(user.asic_count) || 0,
          th: parseInt(user.th) || 0,
          avatar_url: user.avatar_url || null
        })),
        total: parseInt(rawData.total) || rawData.leaderboard.length
      };
      
      console.log('📊 Обработанные данные лидеров:', processedData);
      setLeadersData(processedData);
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке данных лидеров:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки данных лидеров: ${errorMessage}\n\nУбедитесь, что webhook "game-leaders-table" активен в n8n.`;
      alert(fullErrorMessage);
    } finally {
      setLeadersLoading(false);
    }
  };

  const loadPoolsData = async () => {
    setPoolsLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setKpiData(null);
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-pools-table'
        : 'https://n8n-p.blc.am/webhook/game-pools-table';
      
      console.log('🔗 Загрузка данных пулов с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Полученные данные пулов (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Обрабатываем данные от webhook
      // Ожидаем формат: [{ pools: [...] }] или { pools: [...] }
      let rawData;
      if (Array.isArray(data) && data.length > 0) {
        // Если это массив, берем первый элемент
        rawData = data[0];
        console.log('✅ Данные - массив, извлекаем первый элемент');
      } else if (data && typeof data === 'object' && data.pools) {
        // Если это объект с pools
        rawData = data;
        console.log('✅ Данные - объект с pools');
      } else {
        console.error('❌ Неизвестный формат данных:', data);
        throw new Error('Неверный формат данных от webhook. Ожидается массив с объектом или объект с pools.');
      }
      
      // Проверяем наличие pools
      if (!rawData.pools || !Array.isArray(rawData.pools)) {
        throw new Error('Неверный формат данных: отсутствует pools или он не является массивом.');
      }
      
      // Используем все пулы (уже отсортированы по hashrate в n8n)
      const allPools = rawData.pools;
      
      const processedData = {
        pools: allPools.map((pool: any) => ({
          id: parseInt(pool.id) || 0,
          owner_id: parseInt(pool.owner_id) || 0,
          name: pool.name || 'Unknown Pool',
          description: pool.description || null,
          reward_type: pool.reward_type || 'Unknown',
          commission: pool.commission || '0.00',
          payment_frequency: parseInt(pool.payment_frequency) || 0,
          visibility: pool.visibility || 'public',
          status: pool.status || 'active',
          total_hashrate: pool.total_hashrate || '0',
          created_at: pool.created_at || '',
          updated_at: pool.updated_at || '',
          lvl: parseInt(pool.lvl) || 0,
          max_lvl: parseInt(pool.max_lvl) || 0
        }))
      };
      
      console.log('📊 Обработанные данные пулов (топ-3):', processedData);
      setPoolsData(processedData);
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке данных пулов:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки данных пулов: ${errorMessage}\n\nУбедитесь, что webhook "game-pools-table" активен в n8n.`;
      alert(fullErrorMessage);
    } finally {
      setPoolsLoading(false);
    }
  };

  const loadAsicKpiData = async (level?: number | null) => {
    console.log('🚀 loadAsicKpiData вызвана для уровня:', level);
    setAsicKpiLoading(true);
    setAsicKpiData(null);
    
    // Используем переданный уровень или выбранный уровень из состояния
    const targetLevel = level !== undefined ? level : selectedKpiLevel;
    
    try {
      // Добавляем параметр уровня в URL, если он указан
      let webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-kpi1'
        : 'https://n8n-p.blc.am/webhook/game-kpi1';
      
      if (targetLevel !== null && targetLevel !== undefined) {
        webhookUrl += `?level=${targetLevel}`;
      }
      
      console.log('🔗 Загрузка ASIC KPI данных с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let data = await response.json();
      console.log('📊 Полученные ASIC KPI данные (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Если webhook с responseMode: "lastNode" вернул только последний элемент массива,
      // нужно проверить, есть ли способ получить весь массив
      // Попробуем проверить, является ли это массивом объектов с json полем
      if (!Array.isArray(data) && data && typeof data === 'object' && data.json) {
        // Если это один объект с полем json, возможно это последний элемент
        // Но нам нужен весь массив - возможно данные приходят в другом формате
        console.log('⚠️ Получен один объект вместо массива, проверяем структуру...');
      }
      
      // Обрабатываем данные в зависимости от формата ответа
      let usersList: any[] = [];
      
      // Если это массив напрямую
      if (Array.isArray(data)) {
        // Проверяем, является ли это массивом объектов с полем json (формат n8n)
        if (data.length > 0 && data[0] && typeof data[0] === 'object' && data[0].json) {
          // Это массив объектов вида [{json: {...}}, {json: {...}}]
          usersList = data.map((item: any) => item.json || item);
          console.log('✅ Данные - массив объектов с json полем, длина:', usersList.length);
        } else {
          // Это обычный массив пользователей
          usersList = data;
          console.log('✅ Данные - массив пользователей, длина:', usersList.length);
        }
      } 
      // Если это объект
      else if (data && typeof data === 'object') {
        // Проверяем различные варианты структуры
        if (data.rows && Array.isArray(data.rows)) {
          usersList = data.rows;
          console.log('✅ Данные - объект с rows, длина:', usersList.length);
        } else if (data.result && Array.isArray(data.result)) {
          usersList = data.result;
          console.log('✅ Данные - объект с result, длина:', usersList.length);
        } else if (data.users && Array.isArray(data.users)) {
          usersList = data.users;
          console.log('✅ Данные - объект с users, длина:', usersList.length);
        } else if (data.count !== undefined && data.users && Array.isArray(data.users)) {
          // Если данные пришли как {users: [...], count: ...}
          usersList = data.users;
          console.log('✅ Данные - объект с users и count, длина:', usersList.length);
        } else if (data.data && Array.isArray(data.data)) {
          usersList = data.data;
          console.log('✅ Данные - объект с data, длина:', usersList.length);
        } else if (Array.isArray(data.json)) {
          // Если данные пришли как массив объектов с полем json
          usersList = data.json.map((item: any) => item.json || item);
          console.log('✅ Данные - объект с json массивом, длина:', usersList.length);
        } else if (data.person_id !== undefined) {
          // Если это один объект пользователя (не массив)
          usersList = [data];
          console.log('✅ Данные - один объект пользователя, добавлен в массив');
        } else if (data.json && typeof data.json === 'object') {
          if (Array.isArray(data.json)) {
            // Если json - это массив
            usersList = data.json.map((item: any) => (item.json || item));
            console.log('✅ Данные - объект с json массивом, длина:', usersList.length);
          } else if (data.json.person_id !== undefined) {
            // Если данные обернуты в { json: {...} } (один пользователь)
            usersList = [data.json];
            console.log('✅ Данные - объект с json полем (один пользователь), добавлен в массив');
          }
        }
      }
      
      console.log('📊 Извлечено пользователей:', usersList.length);
      if (usersList.length > 0) {
        console.log('📊 Первый пользователь:', usersList[0]);
      }
      
      // Фильтруем по выбранному уровню, если он указан
      let filteredUsers = usersList;
      if (targetLevel !== null && targetLevel !== undefined) {
        filteredUsers = usersList.filter((user: any) => {
          const userLevel = typeof user.current_level === 'string' 
            ? parseInt(user.current_level, 10) 
            : parseInt(user.current_level);
          return userLevel === targetLevel;
        });
        console.log(`📊 Отфильтровано по уровню ${targetLevel}:`, filteredUsers.length, 'пользователей');
      }
      
      // Преобразуем строковые значения в числа
      const formattedUsers = filteredUsers.map((user: any) => ({
        person_id: typeof user.person_id === 'string' ? parseInt(user.person_id, 10) || 0 : parseInt(user.person_id) || 0,
        tg_id: String(user.tg_id || ''),
        username: String(user.username || ''),
        first_name: String(user.first_name || ''),
        last_name: String(user.last_name || ''),
        current_level: typeof user.current_level === 'string' ? parseInt(user.current_level, 10) || 0 : parseInt(user.current_level) || 0,
        effective_ths: String(user.effective_ths || '0'),
        total_asics: typeof user.total_asics === 'string' ? parseInt(user.total_asics, 10) || 0 : parseInt(user.total_asics) || 0,
        required_asics_for_next_level: typeof user.required_asics_for_next_level === 'string' ? parseInt(user.required_asics_for_next_level, 10) || null : parseInt(user.required_asics_for_next_level) || null,
        missing_asics: typeof user.missing_asics === 'string' ? parseInt(user.missing_asics, 10) || 0 : parseInt(user.missing_asics) || 0,
        progress_percent: typeof user.progress_percent === 'string' ? parseFloat(user.progress_percent) || 0 : parseFloat(user.progress_percent) || 0,
        person_created_at: user.person_created_at || null,
        tg_photo_url: user.tg_photo_url || null
      }));
      
      setAsicKpiData(formattedUsers);
      console.log('✅ ASIC KPI данные загружены:', formattedUsers.length, 'пользователей');
    } catch (e: any) {
      console.error('❌ Ошибка загрузки ASIC KPI данных:', e);
      setAsicKpiData([]);
    } finally {
      setAsicKpiLoading(false);
    }
  };

  const loadRefKpiData = async (level?: number | null) => {
    console.log('🚀 loadRefKpiData вызвана для уровня:', level);
    setRefKpiLoading(true);
    setRefKpiData(null);
    
    // Используем переданный уровень или выбранный уровень из состояния
    const targetLevel = level !== undefined ? level : selectedKpiLevel;
    
    try {
      // Webhook возвращает всех пользователей без рефералов, фильтрация по уровню на фронтенде
      let webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-kpi-1ref'
        : 'https://n8n-p.blc.am/webhook/game-kpi-1ref';
      
      console.log('🔗 Загрузка Ref KPI данных с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let data = await response.json();
      console.log('📊 Полученные Ref KPI данные (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Обрабатываем данные в зависимости от формата ответа
      let usersList: any[] = [];
      
      // Если это массив напрямую
      if (Array.isArray(data)) {
        // Проверяем, является ли это массивом объектов с полем json (формат n8n)
        if (data.length > 0 && data[0] && typeof data[0] === 'object' && data[0].json) {
          // Это массив объектов вида [{json: {...}}, {json: {...}}]
          usersList = data.map((item: any) => item.json || item);
          console.log('✅ Данные - массив объектов с json полем, длина:', usersList.length);
        } else {
          // Это обычный массив пользователей
          usersList = data;
          console.log('✅ Данные - массив пользователей, длина:', usersList.length);
        }
      } 
      // Если это объект
      else if (data && typeof data === 'object') {
        // Проверяем различные варианты структуры
        if (data.rows && Array.isArray(data.rows)) {
          usersList = data.rows;
          console.log('✅ Данные - объект с rows, длина:', usersList.length);
        } else if (data.result && Array.isArray(data.result)) {
          usersList = data.result;
          console.log('✅ Данные - объект с result, длина:', usersList.length);
        } else if (data.users && Array.isArray(data.users)) {
          usersList = data.users;
          console.log('✅ Данные - объект с users, длина:', usersList.length);
        } else if (data.count !== undefined && data.users && Array.isArray(data.users)) {
          // Если данные пришли как {users: [...], count: ...}
          usersList = data.users;
          console.log('✅ Данные - объект с users и count, длина:', usersList.length);
        } else if (data.data && Array.isArray(data.data)) {
          usersList = data.data;
          console.log('✅ Данные - объект с data, длина:', usersList.length);
        } else if (Array.isArray(data.json)) {
          // Если данные пришли как массив объектов с полем json
          usersList = data.json.map((item: any) => item.json || item);
          console.log('✅ Данные - объект с json массивом, длина:', usersList.length);
        } else if (data.person_id !== undefined) {
          // Если это один объект пользователя (не массив)
          usersList = [data];
          console.log('✅ Данные - один объект пользователя, добавлен в массив');
        } else if (data.json && typeof data.json === 'object') {
          if (Array.isArray(data.json)) {
            // Если json - это массив
            usersList = data.json.map((item: any) => (item.json || item));
            console.log('✅ Данные - объект с json массивом, длина:', usersList.length);
          } else if (data.json.person_id !== undefined) {
            // Если данные обернуты в { json: {...} } (один пользователь)
            usersList = [data.json];
            console.log('✅ Данные - объект с json полем (один пользователь), добавлен в массив');
          }
        }
      }
      
      console.log('📊 Извлечено пользователей:', usersList.length);
      if (usersList.length > 0) {
        console.log('📊 Первый пользователь:', usersList[0]);
      }
      
      // Фильтруем по выбранному уровню на фронтенде
      let filteredUsers = usersList;
      if (targetLevel !== null && targetLevel !== undefined) {
        filteredUsers = usersList.filter((user: any) => {
          const userLevel = typeof user.current_level === 'string' 
            ? parseInt(user.current_level, 10) 
            : parseInt(user.current_level);
          return userLevel === targetLevel;
        });
        console.log(`📊 Отфильтровано по уровню ${targetLevel}:`, filteredUsers.length, 'пользователей');
      }
      
      // Преобразуем строковые значения в числа
      const formattedUsers = filteredUsers.map((user: any) => ({
        person_id: typeof user.person_id === 'string' ? parseInt(user.person_id, 10) || 0 : parseInt(user.person_id) || 0,
        tg_id: String(user.tg_id || ''),
        username: String(user.username || ''),
        first_name: String(user.first_name || ''),
        last_name: String(user.last_name || ''),
        current_level: typeof user.current_level === 'string' ? parseInt(user.current_level, 10) || 0 : parseInt(user.current_level) || 0,
        effective_ths: String(user.effective_ths || '0'),
        total_asics: typeof user.total_asics === 'string' ? parseInt(user.total_asics, 10) || 0 : parseInt(user.total_asics) || 0,
        total_referrals: typeof user.total_referrals === 'string' ? parseInt(user.total_referrals, 10) || 0 : parseInt(user.total_referrals) || 0,
        person_created_at: user.person_created_at || null,
        tg_photo_url: user.tg_photo_url || null
      }));
      
      setRefKpiData(formattedUsers);
      console.log('✅ Ref KPI данные загружены:', formattedUsers.length, 'пользователей');
    } catch (e: any) {
      console.error('❌ Ошибка загрузки Ref KPI данных:', e);
      setRefKpiData([]);
    } finally {
      setRefKpiLoading(false);
    }
  };

  const loadRef3KpiData = async (level?: number | null) => {
    console.log('🚀 loadRef3KpiData вызвана для уровня:', level);
    setRef3KpiLoading(true);
    setRef3KpiData(null);
    
    // Используем переданный уровень или выбранный уровень из состояния
    const targetLevel = level !== undefined ? level : selectedKpiLevel;
    
    try {
      // Webhook возвращает всех пользователей с 2 рефералами, фильтрация по уровню на фронтенде
      let webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-kpi-3ref'
        : 'https://n8n-p.blc.am/webhook/game-kpi-3ref';
      
      console.log('🔗 Загрузка Ref 3 KPI данных с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let data = await response.json();
      console.log('📊 Полученные Ref 3 KPI данные (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Обрабатываем данные в зависимости от формата ответа
      let usersList: any[] = [];
      
      // Если это массив напрямую
      if (Array.isArray(data)) {
        // Проверяем, является ли это массивом объектов с полем json (формат n8n)
        if (data.length > 0 && data[0] && typeof data[0] === 'object' && data[0].json) {
          // Это массив объектов вида [{json: {...}}, {json: {...}}]
          usersList = data.map((item: any) => item.json || item);
          console.log('✅ Данные - массив объектов с json полем, длина:', usersList.length);
        } else {
          // Это обычный массив пользователей
          usersList = data;
          console.log('✅ Данные - массив пользователей, длина:', usersList.length);
        }
      } 
      // Если это объект
      else if (data && typeof data === 'object') {
        // Проверяем различные варианты структуры
        if (data.rows && Array.isArray(data.rows)) {
          usersList = data.rows;
          console.log('✅ Данные - объект с rows, длина:', usersList.length);
        } else if (data.result && Array.isArray(data.result)) {
          usersList = data.result;
          console.log('✅ Данные - объект с result, длина:', usersList.length);
        } else if (data.users && Array.isArray(data.users)) {
          usersList = data.users;
          console.log('✅ Данные - объект с users, длина:', usersList.length);
        } else if (data.count !== undefined && data.users && Array.isArray(data.users)) {
          // Если данные пришли как {users: [...], count: ...}
          usersList = data.users;
          console.log('✅ Данные - объект с users и count, длина:', usersList.length);
        } else if (data.data && Array.isArray(data.data)) {
          usersList = data.data;
          console.log('✅ Данные - объект с data, длина:', usersList.length);
        } else if (Array.isArray(data.json)) {
          // Если данные пришли как массив объектов с полем json
          usersList = data.json.map((item: any) => item.json || item);
          console.log('✅ Данные - объект с json массивом, длина:', usersList.length);
        } else if (data.person_id !== undefined) {
          // Если это один объект пользователя (не массив)
          usersList = [data];
          console.log('✅ Данные - один объект пользователя, добавлен в массив');
        } else if (data.json && typeof data.json === 'object') {
          if (Array.isArray(data.json)) {
            // Если json - это массив
            usersList = data.json.map((item: any) => (item.json || item));
            console.log('✅ Данные - объект с json массивом, длина:', usersList.length);
          } else if (data.json.person_id !== undefined) {
            // Если данные обернуты в { json: {...} } (один пользователь)
            usersList = [data.json];
            console.log('✅ Данные - объект с json полем (один пользователь), добавлен в массив');
          }
        }
      }
      
      console.log('📊 Извлечено пользователей:', usersList.length);
      if (usersList.length > 0) {
        console.log('📊 Первый пользователь:', usersList[0]);
      }
      
      // Фильтруем по выбранному уровню на фронтенде
      let filteredUsers = usersList;
      if (targetLevel !== null && targetLevel !== undefined) {
        filteredUsers = usersList.filter((user: any) => {
          const userLevel = typeof user.current_level === 'string' 
            ? parseInt(user.current_level, 10) 
            : parseInt(user.current_level);
          return userLevel === targetLevel;
        });
        console.log(`📊 Отфильтровано по уровню ${targetLevel}:`, filteredUsers.length, 'пользователей');
      }
      
      // Преобразуем строковые значения в числа
      const formattedUsers = filteredUsers.map((user: any) => ({
        person_id: typeof user.person_id === 'string' ? parseInt(user.person_id, 10) || 0 : parseInt(user.person_id) || 0,
        tg_id: String(user.tg_id || ''),
        username: String(user.username || ''),
        first_name: String(user.first_name || ''),
        last_name: String(user.last_name || ''),
        current_level: typeof user.current_level === 'string' ? parseInt(user.current_level, 10) || 0 : parseInt(user.current_level) || 0,
        effective_ths: String(user.effective_ths || '0'),
        total_asics: typeof user.total_asics === 'string' ? parseInt(user.total_asics, 10) || 0 : parseInt(user.total_asics) || 0,
        total_referrals: typeof user.total_referrals === 'string' ? parseInt(user.total_referrals, 10) || 0 : parseInt(user.total_referrals) || 0,
        person_created_at: user.person_created_at || null,
        tg_photo_url: user.tg_photo_url || null
      }));
      
      setRef3KpiData(formattedUsers);
      console.log('✅ Ref 3 KPI данные загружены:', formattedUsers.length, 'пользователей');
    } catch (e: any) {
      console.error('❌ Ошибка загрузки Ref 3 KPI данных:', e);
      setRef3KpiData([]);
    } finally {
      setRef3KpiLoading(false);
    }
  };

  const sendPushNotifications = async (tgIds: string[], message: string) => {
    console.log('🚀 sendPushNotifications вызвана');
    console.log('📊 TG IDs:', tgIds);
    console.log('💬 Сообщение:', message);
    
    setPushSending(true);
    
    try {
      let webhookUrl = import.meta.env.DEV
        ? '/webhook/game-push-1ref'
        : 'https://n8n-p.blc.am/webhook/game-push-1ref';
      
      // Для GET запроса передаем данные через query параметры
      // Массив tg_ids передаем как JSON строку
      const params = new URLSearchParams({
        tg_ids: JSON.stringify(tgIds),
        message: message
      });
      
      webhookUrl += `?${params.toString()}`;
      
      console.log('🔗 Отправка push-уведомлений на:', webhookUrl);
      console.log('📦 Данные:', { tg_ids: tgIds, message: message });
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка ответа:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Push-уведомления отправлены:', data);
      
      // Закрываем модальное окно и очищаем выбор
                setPushModalOpen(false);
                setPushModalSource(null);
                setPushMessage('');
                // Очищаем выбранных пользователей в зависимости от источника
                if (pushModalSource === 'ref1') {
                  setSelectedRefKpiUsers(new Set());
                } else if (pushModalSource === 'ref3') {
                  setSelectedRef3KpiUsers(new Set());
                } else if (pushModalSource === 'asic') {
                  setSelectedAsicKpiUsers(new Set());
                }
      
      alert(`Push-уведомления успешно отправлены ${tgIds.length} пользователям!`);
    } catch (e: any) {
      console.error('❌ Ошибка отправки push-уведомлений:', e);
      alert(`Ошибка отправки push-уведомлений: ${e.message}`);
    } finally {
      setPushSending(false);
    }
  };

  const loadKpiData = async () => {
    console.log('🚀 loadKpiData вызвана');
    setKpiLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null); // Сбрасываем предыдущие данные
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-funnel-kpi'
        : 'https://n8n-p.blc.am/webhook/game-funnel-kpi';
      
      console.log('🔗 Загрузка KPI данных с:', webhookUrl);
      console.log('🔗 Режим:', import.meta.env.DEV ? 'DEV' : 'PROD');
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Полученные KPI данные (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Обрабатываем данные от webhook
      // Ожидаем формат: { level_stats: [...], total_users: ... } или [{ level_stats: [...], total_users: ... }]
      let processedData;
      if (Array.isArray(data) && data.length > 0) {
        // Если это массив, берем первый элемент
        processedData = data[0];
        console.log('✅ Данные - массив, извлекаем первый элемент:', processedData);
      } else if (data && typeof data === 'object') {
        // Если это объект
        if (data.level_stats) {
          processedData = data;
          console.log('✅ Данные - объект с level_stats');
        } else if (data.json && data.json.level_stats) {
          // Если данные обернуты в { json: {...} }
          processedData = data.json;
          console.log('✅ Данные - объект с json.level_stats');
        } else {
          console.error('❌ Неизвестный формат данных:', data);
          throw new Error('Неверный формат данных от webhook. Ожидается объект с level_stats и total_users.');
        }
      } else {
        console.error('❌ Неизвестный формат данных:', data);
        throw new Error('Неверный формат данных от webhook. Ожидается объект с level_stats и total_users.');
      }
      
      console.log('📊 Обработанные данные перед нормализацией:', processedData);
      
      // Проверяем наличие необходимых полей
      if (!processedData.level_stats || !Array.isArray(processedData.level_stats)) {
        console.error('❌ Отсутствует level_stats или он не массив:', processedData);
        throw new Error('Неверный формат данных: отсутствует level_stats или он не является массивом.');
      }
      
      // Нормализуем данные
      const normalizedData = {
        level_stats: processedData.level_stats.map((stat: any) => ({
          level: parseInt(stat.level) || 0,
          users_per_level: parseInt(stat.users_per_level) || 0,
          percentage: parseFloat(stat.percentage || 0).toFixed(2)
        })),
        total_users: parseInt(processedData.total_users) || 0
      };
      
      console.log('📊 Обработанные KPI данные (нормализованные):', normalizedData);
      console.log('📊 Количество уровней:', normalizedData.level_stats.length);
      setKpiData(normalizedData);
      console.log('✅ KPI данные установлены в состояние');
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке KPI данных:', e);
      console.error('❌ Stack:', e.stack);
      
      let errorMessage = 'Неизвестная ошибка';
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки KPI данных: ${errorMessage}\n\nУбедитесь, что webhook "game-funnel-kpi" активен в n8n.\n\nПроверьте консоль браузера для деталей.`;
      alert(fullErrorMessage);
    } finally {
      setKpiLoading(false);
      console.log('🏁 loadKpiData завершена');
    }
  };

  // Функция для нормализации данных пользователя (заменяет CODE ноду)
  const normalizeUserData = (user: any): any => {
    // Нормализуем поля (на случай разных названий в БД)
    const personId = user.person_id || user.user_id || user.id || null;
    const username = user.username || user.tg_username || user.name || 'Unknown';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    const walletAddress = user.wallet_address || user.wallet || null;
    const hexWalletAddress = user.hex_wallet_address || user.hex_wallet || null;
    const photoUrl = user.photo_url || user.avatar_url || user.avatar || null;
    const tgId = user.tg_id || user.telegram_id || user.telegramId || '';
    
    // Обрабатываем total_asics (может быть строкой или числом)
    const totalAsics = user.total_asics || user.total_asics_count || user.asic_count || user.asics || 0;
    const totalAsicsNumber = typeof totalAsics === 'string' ? parseInt(totalAsics) || 0 : parseInt(totalAsics) || 0;
    
    // Обрабатываем level (может быть строкой или числом)
    const level = user.level !== undefined && user.level !== null 
      ? (typeof user.level === 'string' ? parseInt(user.level) || 0 : parseInt(user.level) || 0)
      : null;
    
    // Обрабатываем effective_ths (может быть строкой или числом)
    const effectiveThs = user.effective_ths || user.effective_th || 0;
    const effectiveThsNumber = typeof effectiveThs === 'string' ? parseFloat(effectiveThs) || 0 : parseFloat(effectiveThs) || 0;
    
    // Обрабатываем progress_cached (может быть строкой или числом)
    const progressCached = user.progress_cached || user.progress || 0;
    const progressCachedNumber = typeof progressCached === 'string' ? parseFloat(progressCached) || 0 : parseFloat(progressCached) || 0;
    
    // Обрабатываем level_updated_at
    const levelUpdatedAt = user.level_updated_at || null;
    
    // Обрабатываем total_balance и balance_by_asset
    const totalBalance = user.total_balance ? (typeof user.total_balance === 'string' ? parseFloat(user.total_balance) || 0 : parseFloat(user.total_balance) || 0) : 0;
    const balanceByAsset = user.balance_by_asset || {};
    
    // Обрабатываем assets_metadata и заменяем ECOScoin на XP
    const assetsMetadataRaw = user.assets_metadata || {};
    const assetsMetadata: any = {};
    for (const assetId in assetsMetadataRaw) {
      if (assetsMetadataRaw.hasOwnProperty(assetId)) {
        const asset = assetsMetadataRaw[assetId];
        assetsMetadata[assetId] = {
          ...asset,
          name: asset.name === 'ECOScoin' ? 'XP' : (asset.name || `Asset ${assetId}`)
        };
      }
    }
    
    // Обрабатываем balance_history
    const balanceHistory = user.balance_history || {};
    
    // Обрабатываем last_transaction
    const lastTransaction = user.last_transaction || null;
    
    // Обрабатываем all_transactions (все транзакции пользователя)
    let allTransactions: any[] = [];
    if (user.all_transactions) {
      if (Array.isArray(user.all_transactions)) {
        allTransactions = user.all_transactions;
      } else if (typeof user.all_transactions === 'string') {
        try {
          allTransactions = JSON.parse(user.all_transactions);
          if (!Array.isArray(allTransactions)) {
            allTransactions = [];
          }
        } catch (e) {
          console.warn('Ошибка парсинга all_transactions:', e);
          allTransactions = [];
        }
      } else if (typeof user.all_transactions === 'object') {
        if (Array.isArray(user.all_transactions.transactions)) {
          allTransactions = user.all_transactions.transactions;
        } else {
          allTransactions = [];
        }
      }
    }
    
    // Обрабатываем transactions_by_type (статистика по типам операций)
    let transactionsByType: any = {};
    if (user.transactions_by_type) {
      if (typeof user.transactions_by_type === 'object' && !Array.isArray(user.transactions_by_type)) {
        transactionsByType = user.transactions_by_type;
      } else if (typeof user.transactions_by_type === 'string') {
        try {
          transactionsByType = JSON.parse(user.transactions_by_type);
          if (Array.isArray(transactionsByType) || typeof transactionsByType !== 'object') {
            transactionsByType = {};
          }
        } catch (e) {
          console.warn('Ошибка парсинга transactions_by_type:', e);
          transactionsByType = {};
        }
      }
    }
    
    // Обрабатываем mining_summary
    const miningSummary = user.mining_summary || {};
    
    // Обрабатываем last_mining
    const lastMining = user.last_mining || null;
    
    // Обрабатываем checkin_summary
    const checkinSummary = user.checkin_summary || {};
    
    // Обрабатываем streak_summary
    const streakSummary = user.streak_summary || {};
    
    // Обрабатываем participation_summary
    const participationSummary = user.participation_summary || {};
    
    // Обрабатываем poke данные
    const pokeSentCount = user.poke_sent_count ? (typeof user.poke_sent_count === 'string' ? parseInt(user.poke_sent_count) || 0 : parseInt(user.poke_sent_count) || 0) : 0;
    const pokeReceivedCount = user.poke_received_count ? (typeof user.poke_received_count === 'string' ? parseInt(user.poke_received_count) || 0 : parseInt(user.poke_received_count) || 0) : 0;
    const pokeRewards = user.poke_rewards || [];
    
    // Обрабатываем referrals
    const totalReferrals = user.total_referrals ? (typeof user.total_referrals === 'string' ? parseInt(user.total_referrals) || 0 : parseInt(user.total_referrals) || 0) : 0;
    const referees = user.referees || [];
    
    // Обрабатываем orders
    const totalOrders = user.total_orders ? (typeof user.total_orders === 'string' ? parseInt(user.total_orders) || 0 : parseInt(user.total_orders) || 0) : 0;
    const totalPointsSpent = user.total_points_spent ? (typeof user.total_points_spent === 'string' ? parseFloat(user.total_points_spent) || 0 : parseFloat(user.total_points_spent) || 0) : 0;
    const totalTonSpent = user.total_ton_spent ? (typeof user.total_ton_spent === 'string' ? parseFloat(user.total_ton_spent) || 0 : parseFloat(user.total_ton_spent) || 0) : 0;
    const orders = user.orders || [];
    
    // Обрабатываем ownership_details
    const ownershipDetails = user.ownership_details || [];
    
    // Обрабатываем photo_url (может быть tg_photo_url)
    const finalPhotoUrl = photoUrl || user.tg_photo_url || null;
    
    return {
      person_id: parseInt(String(personId)) || 0,
      person_language: user.person_language || user.language || 'en',
      wallet_address: walletAddress,
      hex_wallet_address: hexWalletAddress,
      is_ecos_premium: user.is_ecos_premium === true || user.is_ecos_premium === 'true' || user.ecos_premium === true,
      ecos_premium_until: user.ecos_premium_until || user.premium_until || null,
      onbording_done: user.onbording_done === true || user.onbording_done === 'true' || user.onboarding_done === true,
      person_created_at: user.person_created_at || user.created_at || user.registered_at || '',
      person_updated_at: user.person_updated_at || user.updated_at || '',
      tg_id: String(tgId),
      first_name: firstName,
      last_name: lastName,
      username: username,
      tg_language: user.tg_language || user.telegram_language || user.language || 'en',
      tg_premium: user.tg_premium === true || user.tg_premium === 'true' || user.telegram_premium === true,
      photo_url: finalPhotoUrl,
      tg_created_at: user.tg_created_at || user.telegram_created_at || user.person_created_at || '',
      tg_updated_at: user.tg_updated_at || user.telegram_updated_at || user.person_updated_at || '',
      total_asics: totalAsicsNumber,
      total_th: totalAsicsNumber * 234, // Вычисляем Th: ASIC * 234
      level: level,
      effective_ths: effectiveThsNumber,
      progress_cached: progressCachedNumber,
      level_updated_at: levelUpdatedAt,
      ownership_details: ownershipDetails,
      total_balance: totalBalance,
      balance_by_asset: balanceByAsset,
      assets_metadata: assetsMetadata,
      balance_history: balanceHistory,
      last_transaction: lastTransaction,
      all_transactions: allTransactions,
      transactions_by_type: transactionsByType,
      mining_summary: miningSummary,
      last_mining: lastMining,
      checkin_summary: checkinSummary,
      streak_summary: streakSummary,
      participation_summary: participationSummary,
      poke_sent_count: pokeSentCount,
      poke_received_count: pokeReceivedCount,
      poke_rewards: pokeRewards,
      total_referrals: totalReferrals,
      referees: referees,
      total_orders: totalOrders,
      total_points_spent: totalPointsSpent,
      total_ton_spent: totalTonSpent,
      orders: orders
    };
  };

  const loadAllUsersData = async () => {
    console.log('🚀 loadAllUsersData вызвана');
    setAllUsersLoading(true);
    
    // Скрываем остальную статистику
    setUsersData(null);
    setWalletsData(null);
    setEventsData(null);
    setReferralsData(null);
    setWalletUsers(null);
    setFunnelData(null);
    setLeadersData(null);
    setPoolsData(null);
    setKpiData(null);
    setAllUsersData(null);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-all-users'
        : 'https://n8n-p.blc.am/webhook/game-all-users';
      
      console.log('🔗 Загрузка данных всех пользователей с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Полученные данные всех пользователей (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Извлекаем массив пользователей из разных форматов ответа
      let rawUsers: any[] = [];
      
      if (Array.isArray(data)) {
        // Если это массив пользователей напрямую
        rawUsers = data;
        console.log('✅ Данные - массив пользователей');
      } else if (data && typeof data === 'object') {
        // Если это объект
        if (data.users && Array.isArray(data.users)) {
          rawUsers = data.users;
          console.log('✅ Данные - объект с users');
        } else if (data.json && data.json.users && Array.isArray(data.json.users)) {
          rawUsers = data.json.users;
          console.log('✅ Данные - объект с json.users');
        } else if (data.result && Array.isArray(data.result)) {
          rawUsers = data.result;
          console.log('✅ Данные - объект с result');
        } else if (data.rows && Array.isArray(data.rows)) {
          rawUsers = data.rows;
          console.log('✅ Данные - объект с rows');
        } else if (data.person_id !== undefined || data.user_id !== undefined) {
          // Если это один пользователь
          rawUsers = [data];
          console.log('✅ Данные - один пользователь');
        } else {
          console.error('❌ Неизвестный формат данных:', data);
          throw new Error('Неверный формат данных от webhook.');
        }
      } else {
        console.error('❌ Неизвестный формат данных:', data);
        throw new Error('Неверный формат данных от webhook.');
      }
      
      console.log(`📊 Получено ${rawUsers.length} пользователей из webhook`);
      
      // Нормализуем данные пользователей на фронте (заменяет CODE ноду)
      // Обрабатываем данные порциями, чтобы не блокировать UI
      const BATCH_SIZE = 1000; // Обрабатываем по 1000 пользователей за раз
      const normalizedUsers: any[] = [];
      
      console.log(`🔄 Начинаем нормализацию ${rawUsers.length} пользователей порциями по ${BATCH_SIZE}...`);
      
      for (let i = 0; i < rawUsers.length; i += BATCH_SIZE) {
        const batch = rawUsers.slice(i, i + BATCH_SIZE);
        const normalizedBatch = batch.map(user => normalizeUserData(user));
        normalizedUsers.push(...normalizedBatch);
        
        // Показываем прогресс каждые 10000 пользователей
        if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= rawUsers.length) {
          console.log(`✅ Обработано ${Math.min(i + BATCH_SIZE, rawUsers.length)} / ${rawUsers.length} пользователей`);
          // Даем браузеру возможность обновить UI
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      const processedData = {
        users: normalizedUsers,
        total: normalizedUsers.length
      };
      
      console.log('📊 Обработанные данные:', processedData);
      console.log('📊 Количество пользователей:', processedData.total);
      setAllUsersData(processedData);
      console.log('✅ Данные всех пользователей установлены в состояние');
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке данных всех пользователей:', e);
      console.error('❌ Stack:', e.stack);
      
      let errorMessage = 'Неизвестная ошибка';
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки данных всех пользователей: ${errorMessage}\n\nУбедитесь, что webhook "game-all-users" активен в n8n.\n\nПроверьте консоль браузера для деталей.`;
      alert(fullErrorMessage);
    } finally {
      setAllUsersLoading(false);
      console.log('🏁 loadAllUsersData завершена');
    }
  };

  const loadUserDetails = async (personId: number) => {
    console.log('🚀 loadUserDetails вызвана для person_id:', personId, '(тип:', typeof personId, ')');
    setUserDetails({ user: null, loading: true });
    
    try {
      // Убеждаемся, что personId - это число
      const personIdNum = parseInt(String(personId));
      if (isNaN(personIdNum)) {
        throw new Error(`Некорректный person_id: ${personId}`);
      }
      
      // Используем webhook game-user-4kpi, который возвращает всех пользователей
      const webhookUrl = import.meta.env.DEV 
        ? `/webhook/game-user-4kpi`
        : `https://n8n-p.blc.am/webhook/game-user-4kpi`;
      
      console.log('🔗 Загрузка данных всех пользователей с webhook:', webhookUrl);
      
      // Используем GET запрос (webhook возвращает всех пользователей)
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Полученные данные от webhook (RAW):', data);
      console.log('📊 Полный JSON ответ (первые 5000 символов):', JSON.stringify(data, null, 2).substring(0, 5000));
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      
      // Webhook возвращает массив всех пользователей (как в final.json)
      // Нужно найти нужного пользователя по person_id на фронте
      let allUsers: any[] = [];
      
      if (Array.isArray(data)) {
        // Если это массив пользователей (основной случай)
        allUsers = data;
        console.log(`✅ Получен массив из ${allUsers.length} пользователей`);
      } else if (data && typeof data === 'object') {
        // Если это объект, пробуем найти массив внутри
        console.log('📦 Данные - объект, все ключи:', Object.keys(data));
        console.log('📦 Структура объекта:', Object.keys(data).map(key => ({
          key,
          type: typeof data[key],
          isArray: Array.isArray(data[key]),
          length: Array.isArray(data[key]) ? data[key].length : 'N/A'
        })));
        
        // Проверяем все возможные поля, которые могут содержать массив
        if (data.rows && Array.isArray(data.rows)) {
          allUsers = data.rows;
          console.log('✅ Извлечено rows из объекта, количество:', allUsers.length);
        } else if (data.result && Array.isArray(data.result)) {
          allUsers = data.result;
          console.log('✅ Извлечено result из объекта, количество:', allUsers.length);
        } else if (data.users && Array.isArray(data.users)) {
          allUsers = data.users;
          console.log('✅ Извлечено users из объекта, количество:', allUsers.length);
        } else if (data.data && Array.isArray(data.data)) {
          allUsers = data.data;
          console.log('✅ Извлечено data из объекта, количество:', allUsers.length);
        } else {
          // Пробуем найти любой массив в объекте
          for (const key in data) {
            if (Array.isArray(data[key])) {
              const arr = data[key];
              // Проверяем, что это массив пользователей (есть person_id)
              if (arr.length > 0 && (arr[0].person_id !== undefined || arr[0].id !== undefined)) {
                allUsers = arr;
                console.log(`✅ Найден массив пользователей в поле "${key}", количество:`, allUsers.length);
                break;
              }
            }
          }
          
          // Если все еще не нашли массив
          if (allUsers.length === 0) {
            // Если это один объект пользователя - добавляем в массив
            console.log('⚠️ Получен один объект вместо массива, добавляем в массив');
            console.log('⚠️ Структура объекта:', {
              keys: Object.keys(data),
              person_id: data.person_id,
              id: data.id,
              sample_keys: Object.keys(data).slice(0, 10)
            });
            allUsers = [data];
          }
        }
      }
      
      console.log(`📊 Всего получено ${allUsers.length} пользователей от webhook`);
      
      // Если webhook вернул мало пользователей, используем уже загруженные данные из allUsersData
      // (которые загружаются через game-all-users и содержат всех пользователей)
      let searchInUsers = allUsers;
      
      if (allUsers.length < 100) {
        console.warn(`⚠️ Webhook вернул только ${allUsers.length} пользователей, это подозрительно мало`);
        console.log('📋 ID пользователей от webhook:', allUsers.map((u: any) => {
          const uid = u.person_id ?? u.id ?? u.user_id ?? u.personId ?? u.userId;
          return uid !== undefined && uid !== null ? parseInt(String(uid)) : null;
        }));
        
        // Пробуем использовать уже загруженные данные
        if (allUsersData && allUsersData.users && Array.isArray(allUsersData.users) && allUsersData.users.length > 0) {
          console.log(`✅ Используем уже загруженные данные из allUsersData (${allUsersData.users.length} пользователей)`);
          searchInUsers = allUsersData.users;
        } else {
          console.warn('⚠️ allUsersData не загружены, используем данные от webhook');
        }
      }
      
      // Ищем пользователя с нужным person_id в массиве
      const requestedIdNum = personIdNum;
      console.log(`🔍 Ищем пользователя с ID ${requestedIdNum} среди ${searchInUsers.length} пользователей`);
      
      const userData = searchInUsers.find((user: any) => {
        // Пробуем все возможные поля для ID
        const userId = user.person_id ?? user.id ?? user.user_id ?? user.personId ?? user.userId;
        
        if (userId === undefined || userId === null) {
          return false;
        }
        
        // Сравниваем как числа
        const userIdNum = parseInt(String(userId));
        const match = userIdNum === requestedIdNum;
        
        if (match) {
          console.log('✅ Найден пользователь!', {
            person_id: user.person_id,
            id: user.id,
            username: user.username || user.tg_username || user.first_name
          });
        }
        
        return match;
      });
      
      // Если не нашли пользователя
      if (!userData) {
        console.error('❌ Пользователь с ID не найден в массиве!');
        console.log('📋 Запрошенный ID:', requestedIdNum, '(тип:', typeof requestedIdNum, ')');
        console.log('📋 Первые 20 ID в данных:', searchInUsers.slice(0, 20).map((u: any) => {
          const uid = u.person_id ?? u.id ?? u.user_id ?? u.personId ?? u.userId;
          return {
            person_id: u.person_id,
            id: u.id,
            user_id: u.user_id,
            parsed_id: uid !== undefined && uid !== null ? parseInt(String(uid)) : null,
            username: u.username || u.tg_username || u.first_name
          };
        }));
        throw new Error(`Пользователь с ID ${requestedIdNum} не найден. Проверено ${searchInUsers.length} пользователей (${allUsers.length} от webhook, ${allUsersData?.users?.length || 0} из allUsersData).`);
      }
      
      console.log('✅ Найден пользователь:', {
        person_id: userData.person_id,
        username: userData.username || userData.tg_username || userData.first_name
      });
      
      // Нормализуем данные пользователя (используем ту же функцию, что и для списка)
      const normalizedUser = normalizeUserData(userData);
      
      console.log('✅ Данные пользователя извлечены и нормализованы:', {
        person_id: normalizedUser.person_id,
        username: normalizedUser.username,
        first_name: normalizedUser.first_name
      });
      
      setUserDetails({ user: normalizedUser, loading: false });
      
      // Загружаем детальные данные о транзакциях и заказах из отдельного webhook
      await loadUserTransactions(personIdNum);
    } catch (e: any) {
      console.error('❌ Ошибка загрузки деталей пользователя:', e);
      setUserDetails(null);
      setUserTransactions(null);
      
      let errorMessage = 'Неизвестная ошибка';
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      const fullErrorMessage = `Ошибка загрузки деталей пользователя: ${errorMessage}\n\nУбедитесь, что webhook "game-user-4kpi" активен в n8n.\n\nПроверьте консоль браузера для деталей.`;
      alert(fullErrorMessage);
    }
  };

  // Загрузка детальных данных о транзакциях и заказах
  const loadUserTransactions = async (personId: number) => {
    console.log('🚀 loadUserTransactions вызвана для person_id:', personId);
    setUserTransactions({ 
      all_transactions: [],
      transactions_by_type: {},
      balance_history: {},
      last_transaction: null,
      total_orders: 0,
      total_points_spent: 0,
      total_ton_spent: 0,
      orders: [],
      assets_metadata: {},
      loading: true 
    });
    
    try {
      const personIdNum = parseInt(String(personId));
      if (isNaN(personIdNum)) {
        throw new Error(`Некорректный person_id: ${personId}`);
      }
      
      const webhookUrl = import.meta.env.DEV 
        ? `/webhook/game-transactions?person_id=${personIdNum}`
        : `https://n8n-p.blc.am/webhook/game-transactions?person_id=${personIdNum}`;
      
      console.log('🔗 Загрузка транзакций и заказов с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Полученные данные транзакций:', data);
      
      // Обрабатываем ответ (может быть массив или объект)
      let transactionsData = null;
      if (Array.isArray(data) && data.length > 0) {
        transactionsData = data[0];
      } else if (data && typeof data === 'object') {
        if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
          transactionsData = data.rows[0];
        } else if (data.result && Array.isArray(data.result) && data.result.length > 0) {
          transactionsData = data.result[0];
        } else if (data.person_id !== undefined) {
          transactionsData = data;
        }
      }
      
      if (!transactionsData) {
        throw new Error('Не удалось извлечь данные транзакций из ответа webhook');
      }
      
      // Обрабатываем all_transactions (может быть массивом или JSON строкой)
      let allTransactions: any[] = [];
      if (transactionsData.all_transactions) {
        if (Array.isArray(transactionsData.all_transactions)) {
          allTransactions = transactionsData.all_transactions;
        } else if (typeof transactionsData.all_transactions === 'string') {
          try {
            allTransactions = JSON.parse(transactionsData.all_transactions);
            if (!Array.isArray(allTransactions)) {
              allTransactions = [];
            }
          } catch (e) {
            console.warn('Ошибка парсинга all_transactions:', e);
          }
        }
      }
      
      // Обрабатываем transactions_by_type
      let transactionsByType: any = {};
      if (transactionsData.transactions_by_type) {
        if (typeof transactionsData.transactions_by_type === 'object' && !Array.isArray(transactionsData.transactions_by_type)) {
          transactionsByType = transactionsData.transactions_by_type;
        } else if (typeof transactionsData.transactions_by_type === 'string') {
          try {
            transactionsByType = JSON.parse(transactionsData.transactions_by_type);
            if (Array.isArray(transactionsByType) || typeof transactionsByType !== 'object') {
              transactionsByType = {};
            }
          } catch (e) {
            console.warn('Ошибка парсинга transactions_by_type:', e);
          }
        }
      }
      
      // Обрабатываем orders
      let orders: any[] = [];
      if (transactionsData.orders) {
        if (Array.isArray(transactionsData.orders)) {
          orders = transactionsData.orders;
        } else if (typeof transactionsData.orders === 'string') {
          try {
            orders = JSON.parse(transactionsData.orders);
            if (!Array.isArray(orders)) {
              orders = [];
            }
          } catch (e) {
            console.warn('Ошибка парсинга orders:', e);
          }
        }
      }
      
      // Обрабатываем assets_metadata (заменяем ECOScoin на XP)
      let assetsMetadata: any = {};
      if (transactionsData.assets_metadata) {
        if (typeof transactionsData.assets_metadata === 'object' && !Array.isArray(transactionsData.assets_metadata)) {
          assetsMetadata = transactionsData.assets_metadata;
          // Заменяем ECOScoin на XP
          for (const assetId in assetsMetadata) {
            if (assetsMetadata[assetId].name === 'ECOScoin') {
              assetsMetadata[assetId].name = 'XP';
            }
          }
        } else if (typeof transactionsData.assets_metadata === 'string') {
          try {
            assetsMetadata = JSON.parse(transactionsData.assets_metadata);
            if (typeof assetsMetadata === 'object' && !Array.isArray(assetsMetadata)) {
              for (const assetId in assetsMetadata) {
                if (assetsMetadata[assetId].name === 'ECOScoin') {
                  assetsMetadata[assetId].name = 'XP';
                }
              }
            } else {
              assetsMetadata = {};
            }
          } catch (e) {
            console.warn('Ошибка парсинга assets_metadata:', e);
          }
        }
      }
      
      setUserTransactions({
        all_transactions: allTransactions,
        transactions_by_type: transactionsByType,
        balance_history: transactionsData.balance_history || {},
        last_transaction: transactionsData.last_transaction || null,
        total_orders: parseInt(String(transactionsData.total_orders || 0)),
        total_points_spent: parseFloat(String(transactionsData.total_points_spent || 0)),
        total_ton_spent: parseFloat(String(transactionsData.total_ton_spent || 0)),
        orders: orders,
        assets_metadata: assetsMetadata,
        loading: false
      });
      
      console.log('✅ Данные транзакций загружены:', {
        transactions: allTransactions.length,
        orders: orders.length,
        types: Object.keys(transactionsByType).length
      });
    } catch (e: any) {
      console.error('❌ Ошибка загрузки транзакций:', e);
      setUserTransactions({
        all_transactions: [],
        transactions_by_type: {},
        balance_history: {},
        last_transaction: null,
        total_orders: 0,
        total_points_spent: 0,
        total_ton_spent: 0,
        orders: [],
        assets_metadata: {},
        loading: false
      });
    }
  };

  // Определение уровней и их порогов
  const getLevelThresholds = (level: number) => {
    const thresholds: { [key: number]: { current: number; next: number } } = {
      0: { current: 234, next: 936 },           // 234 Th (1 ASIC) -> 936 Th (4 ASIC)
      1: { current: 936, next: 4914 },         // 936 Th (4 ASIC) -> 4914 Th (21 ASIC)
      2: { current: 4914, next: 14976 },        // 4914 Th (21 ASIC) -> 14976 Th (64 ASIC)
      3: { current: 14976, next: 24804 },       // 14976 Th (64 ASIC) -> 24804 Th (106 ASIC)
      4: { current: 24804, next: 49842 },       // 24804 Th (106 ASIC) -> 49842 Th (213 ASIC)
      5: { current: 49842, next: 99918 },       // 49842 Th (213 ASIC) -> 99918 Th (427 ASIC)
      6: { current: 99918, next: 249912 },       // 99918 Th (427 ASIC) -> 249912 Th (1068 ASIC)
      7: { current: 249912, next: 499824 },      // 249912 Th (1068 ASIC) -> 499824 Th (2136 ASIC)
      8: { current: 499824, next: 999882 },     // 499824 Th (2136 ASIC) -> 999882 Th (4273 ASIC)
      9: { current: 999882, next: 7999992 },    // 999882 Th (4273 ASIC) -> 7999992 Th (34188 ASIC)
      10: { current: 7999992, next: 1000000000 } // 7999992 Th (34188 ASIC) -> 1 Eh (1,000,000,000 Th)
    };
    return thresholds[level] || { current: 0, next: 0 };
  };

  // Функция для определения уровня пользователя по Th
  // ВАЖНО: Эта логика должна совпадать с SQL запросом в n8n!
  // Уровень 0: от 234 Th до 935 Th включительно
  // Уровень 1: от 936 Th и выше
  const getUserLevel = (th: number): number | null => {
    // Пользователи без ASIC (th < 234) не имеют уровня
    if (th < 234) return null;
    
    // Уровень 0: от 234 Th (1 ASIC) до 935 Th включительно
    if (th >= 234 && th <= 935) return 0;
    // Уровень 1: от 936 Th (4 ASIC) до 4913 Th включительно
    if (th >= 936 && th <= 4913) return 1;
    // Уровень 2: от 4914 Th (21 ASIC) до 14975 Th включительно
    if (th >= 4914 && th <= 14975) return 2;
    // Уровень 3: от 14976 Th (64 ASIC) до 24803 Th включительно
    if (th >= 14976 && th <= 24803) return 3;
    // Уровень 4: от 24804 Th (106 ASIC) до 49841 Th включительно
    if (th >= 24804 && th <= 49841) return 4;
    // Уровень 5: от 49842 Th (213 ASIC) до 99917 Th включительно
    if (th >= 49842 && th <= 99917) return 5;
    // Уровень 6: от 99918 Th (427 ASIC) до 249911 Th включительно
    if (th >= 99918 && th <= 249911) return 6;
    // Уровень 7: от 249912 Th (1068 ASIC) до 499823 Th включительно
    if (th >= 249912 && th <= 499823) return 7;
    // Уровень 8: от 499824 Th (2136 ASIC) до 999881 Th включительно
    if (th >= 499824 && th <= 999881) return 8;
    // Уровень 9: от 999882 Th (4273 ASIC) до 7999991 Th включительно
    if (th >= 999882 && th <= 7999991) return 9;
    // Уровень 10: от 7999992 Th (34188 ASIC) и выше
    if (th >= 7999992) return 10;
    
    return null;
  };

  // Функция для загрузки пользователей по уровню
  const loadLevelUsers = async (level: number) => {
    setLevelUsersLoading(true);
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? `/webhook/game-funnel-board`
        : `https://n8n-p.blc.am/webhook/game-funnel-board`;
      
      console.log('🔗 Загрузка пользователей уровня', level, 'с:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Полученные данные пользователей (RAW):', data);
      console.log('📊 Тип данных:', typeof data);
      console.log('📊 Является массивом:', Array.isArray(data));
      console.log('📊 Ключи объекта:', data && typeof data === 'object' ? Object.keys(data) : 'N/A');
      
      // Обрабатываем данные от webhook
      // Ожидаем формат: { leaderboard: [...], total: number } или массив пользователей
      let allUsers = [];
      if (Array.isArray(data)) {
        // Если это массив пользователей напрямую
        allUsers = data;
        console.log('✅ Данные - массив пользователей, количество:', allUsers.length);
      } else if (data && data.leaderboard && Array.isArray(data.leaderboard)) {
        // Если это объект с полем leaderboard (формат от game-funnel-board)
        allUsers = data.leaderboard;
        console.log('✅ Данные - объект с leaderboard, количество:', allUsers.length);
        console.log('📊 Total из ответа:', data.total);
      } else if (data && typeof data === 'object') {
        // Если это один объект пользователя, оборачиваем в массив
        allUsers = [data];
        console.log('✅ Данные - один объект пользователя');
      } else {
        console.error('❌ Неизвестный формат данных:', data);
        throw new Error('Неверный формат данных от webhook');
      }
      
      console.log(`📊 Всего пользователей получено: ${allUsers.length}`);
      
      // Показываем примеры первых пользователей для отладки
      if (allUsers.length > 0) {
        console.log('📋 Примеры первых пользователей (RAW):', allUsers.slice(0, 5).map((u: any) => ({
          username: u.username,
          th: u.th,
          th_type: typeof u.th,
          asic_count: u.asic_count
        })));
      }
      
      // Нормализуем данные пользователей (преобразуем th в число)
      const normalizedUsers = allUsers.map((user: any, originalIndex: number) => {
        // Нормализуем th - может быть строкой или числом
        let userTh = user.th;
        if (typeof userTh === 'string') {
          userTh = parseFloat(userTh) || 0;
        } else if (typeof userTh !== 'number') {
          userTh = parseInt(userTh) || 0;
        }
        
        return {
          ...user,
          th: userTh,
          _originalIndex: originalIndex // Сохраняем оригинальный индекс для логирования
        };
      });
      
      // Фильтруем пользователей по уровню
      const filteredUsers = normalizedUsers
        .filter((user: any) => {
          const userTh = user.th || 0;
          const userLevel = getUserLevel(userTh);
          const matches = userLevel === level;
          
          // Логируем для отладки уровня 0 (первые 50 пользователей или те, у кого th в диапазоне 234-935)
          if (level === 0) {
            if (user._originalIndex < 50 || (userTh >= 234 && userTh <= 935)) {
              console.log(`🔍 [Уровень 0] Пользователь ${user.username}: Th=${userTh} (тип: ${typeof userTh}), Уровень=${userLevel}, Совпадает=${matches}`);
            }
          }
          
          // Логируем для отладки других уровней (первые 10)
          if (level !== 0 && user._originalIndex < 10) {
            console.log(`🔍 Пользователь ${user.username}: Th=${userTh}, Уровень=${userLevel}, Совпадает с ${level}=${matches}`);
          }
          
          return matches;
        })
        // Пересчитываем rank для отфильтрованных пользователей (1, 2, 3... для уровня)
        .map((user: any, index: number) => {
          const { _originalIndex, ...userWithoutIndex } = user;
          return {
            ...userWithoutIndex,
            rank: index + 1 // Новый rank для пользователей уровня
          };
        });
      
      console.log(`✅ Найдено ${filteredUsers.length} пользователей уровня ${level} из ${allUsers.length} всего`);
      
      // Подробная статистика для уровня 0
      if (level === 0) {
        const level0Users = normalizedUsers.filter((u: any) => {
          const lvl = getUserLevel(u.th || 0);
          return lvl === 0;
        });
        console.log(`🔍 [Уровень 0] Детальная статистика:`);
        console.log(`  - Всего пользователей уровня 0 найдено: ${level0Users.length}`);
        if (level0Users.length > 0) {
          console.log(`  - Примеры Th значений:`, level0Users.slice(0, 10).map((u: any) => {
            return `${u.username}: ${u.th} Th`;
          }));
        } else {
          console.warn(`  ⚠️ Не найдено пользователей уровня 0!`);
          console.log(`  - Проверка диапазона: ищем пользователей с Th от 234 до 935`);
          const inRange = normalizedUsers.filter((u: any) => {
            const th = u.th || 0;
            return th >= 234 && th <= 935;
          });
          console.log(`  - Пользователей в диапазоне 234-935 Th: ${inRange.length}`);
          if (inRange.length > 0) {
            console.log(`  - Примеры:`, inRange.slice(0, 5).map((u: any) => `${u.username}: ${u.th} Th`));
          }
        }
      }
      
      if (filteredUsers.length > 0) {
        console.log(`📊 Примеры отфильтрованных пользователей:`, filteredUsers.slice(0, 5).map((u: any) => ({
          rank: u.rank,
          username: u.username,
          th: u.th,
          th_type: typeof u.th,
          level: getUserLevel(u.th || 0)
        })));
      } else {
        console.warn(`⚠️ Не найдено пользователей уровня ${level}!`);
        console.log(`📊 Проверка: примеры пользователей с их уровнями:`, normalizedUsers.slice(0, 10).map((u: any) => {
          return {
            username: u.username,
            th: u.th,
            level: getUserLevel(u.th || 0)
          };
        }));
      }
      
      setLevelUsersModal({
        level: level,
        users: filteredUsers
      });
      
      // Сбрасываем фильтры при загрузке новых данных
      setLevelUsersFilters({ minASIC: '', maxASIC: '', minTh: '', maxTh: '' });
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке пользователей уровня:', e);
      
      let errorMessage = 'Неизвестная ошибка';
      
      if (e.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch. Возможные причины:\n' +
          '1. CORS-ошибка (проверьте настройки n8n)\n' +
          '2. Webhook неактивен\n' +
          '3. Проблемы с сетью';
      } else if (e.message.includes('NetworkError')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else {
        errorMessage = e.message;
      }
      
      alert(`Ошибка загрузки пользователей уровня ${level}: ${errorMessage}\n\nУбедитесь, что webhook "game-funnel-board" активен в n8n.`);
    } finally {
      setLevelUsersLoading(false);
    }
  };

  const loadActivityOverview = async (username: string) => {
    console.log('🚀 Загружаем обзор активности для пользователя:', username);
    setActivityLoading(username);
    
    try {
      // Убираем @ из username для передачи в запрос
      const cleanUsername = username.replace(/^@/, '');
      const baseUrl = import.meta.env.DEV 
        ? '/webhook/ref-overview'
        : 'https://n8n-p.blc.am/webhook/ref-overview';
      const webhookUrl = `${baseUrl}?username=${encodeURIComponent(cleanUsername)}`;
      
      console.log('🔗 URL запроса:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data = await response.json();
      console.log('📊 Полученные данные:', data);
      
      // Webhook должен вернуть массив с одним элементом или один объект
      let userStats = null;
      
      if (Array.isArray(data) && data.length > 0) {
        // Если пришел массив - берем первый элемент
        userStats = data[0];
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Если пришел объект напрямую
        userStats = data;
      }
      
      console.log('✅ Статистика пользователя:', userStats);
      
      if (userStats && userStats.referrer_name) {
        console.log('✅ Открываем модальное окно');
        setActivityOverview(userStats);
      } else {
        console.error('❌ Данные не получены');
        alert(`Статистика для пользователя "${username}" не найдена.\n\nВозможно, вебхук не настроен на фильтрацию по параметру username.`);
      }
      
    } catch (e: any) {
      console.error('❌ Ошибка при загрузке обзора активности:', e);
      alert('Ошибка загрузки обзора активности: ' + e.message);
    } finally {
      setActivityLoading(null);
    }
  };

  // Функция для получения курса TON к доллару
  const fetchTonUsdRate = async () => {
    if (tonUsdLoading || tonUsdRate !== null) {
      // Если уже загружаем или уже загрузили, не делаем повторный запрос
      return;
    }
    
    setTonUsdLoading(true);
    
    try {
      console.log('💱 Получение курса TON/USD...');
      
      // Используем CoinGecko API (бесплатный, без ключа)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
      
      if (!response.ok) {
        throw new Error(`Ошибка получения курса: ${response.status}`);
      }
      
      const data = await response.json();
      const rate = data['the-open-network']?.usd;
      
      if (rate) {
        setTonUsdRate(rate);
        console.log('✅ Курс TON/USD получен:', rate, 'USD');
      } else {
        console.error('❌ Курс не найден в ответе API');
      }
    } catch (error) {
      console.error('❌ Ошибка при получении курса TON/USD:', error);
    } finally {
      setTonUsdLoading(false);
    }
  };

  const loadWalletUsers = async () => {
    setWalletUsersLoading(true);
    
    // Загружаем курс TON/USD при загрузке списка кошельков
    fetchTonUsdRate();
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/wallet-view'
        : 'https://n8n-p.blc.am/webhook/wallet-view';
      
      console.log('🚀 ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ С КОШЕЛЬКАМИ ==========');
      console.log('URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Получаем текст ответа для диагностики
      const responseText = await response.text();
      console.log('📥 RAW RESPONSE (первые 500 символов):', responseText.substring(0, 500));
      
      // Парсим JSON
      const data = JSON.parse(responseText);
      
      console.log('📊 ПАРСИНГ ЗАВЕРШЁН');
      console.log('typeof data:', typeof data);
      console.log('Array.isArray(data):', Array.isArray(data));
      
      // n8n Code нода возвращает объект {users: [...], total: 204}
      // Извлекаем массив пользователей
      let users: any[] = [];
      
      if (Array.isArray(data)) {
        // Если пришёл массив напрямую - используем как есть
        console.log('✅ Данные - это массив');
        users = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.users)) {
        // Если пришёл объект с ключом users - извлекаем массив
        console.log('✅ Данные - это объект с ключом users');
        console.log('✅ Total:', data.total);
        users = data.users;
      } else if (data && typeof data === 'object') {
        // Если это просто объект (1 пользователь) - оборачиваем в массив
        console.log('⚠️ Данные - это один объект, оборачиваю в массив');
        users = [data];
      } else {
        console.error('❌ Неизвестный формат данных!');
        console.error('Тип:', typeof data);
        console.error('Данные:', data);
        alert('Ошибка: неизвестный формат данных от webhook!');
        return;
      }
      
      console.log('✅ Извлечён массив пользователей!');
      console.log('✅ Длина массива:', users.length);
      console.log('✅ Первые 5 ID:', users.slice(0, 5).map((u: any) => u.id));
      console.log('✅ Последние 5 ID:', users.slice(-5).map((u: any) => u.id));
      
      console.log('💾 СОХРАНЯЮ В STATE...');
      setWalletUsers(users);
      console.log('✅ setWalletUsers вызван с', users.length, 'элементами');
      console.log('🚀 ========== КОНЕЦ ЗАГРУЗКИ ==========');
      
    } catch (e: any) {
      console.error('❌ ОШИБКА:', e);
      alert('Ошибка загрузки пользователей: ' + e.message);
    } finally {
      setWalletUsersLoading(false);
    }
  };

  // Функция для конвертации HEX адреса в user-friendly формат TON
  const hexToUserFriendlyAddress = (hexAddress: string): string => {
    console.log('🔧 hexToUserFriendlyAddress вызвана с адресом:', hexAddress);
    console.log('📏 Исходная длина адреса:', hexAddress.length);
    
    try {
      // Очищаем адрес от пробелов и переносов строк
      const cleanAddress = hexAddress.trim();
      console.log('🧹 Очищенный адрес:', cleanAddress);
      console.log('📏 Длина после очистки:', cleanAddress.length);
      
      // Если адрес уже в user-friendly формате (начинается с UQ/EQ), возвращаем как есть
      if (cleanAddress.startsWith('UQ') || cleanAddress.startsWith('EQ')) {
        console.log('✅ Адрес уже в user-friendly формате');
        return cleanAddress;
      }
      
      // Если адрес в raw формате (содержит ':'), парсим и конвертируем
      if (cleanAddress.includes(':')) {
        console.log('🔄 Адрес в raw формате, конвертируем...');
        const address = Address.parse(cleanAddress);
        const result = address.toString({ bounceable: true, testOnly: false });
        console.log('✅ Конвертировано:', result);
        return result;
      }
      
      // Если это чистый HEX адрес (64-66 символов - допускаем небольшие вариации), конвертируем через библиотеку TON
      if (cleanAddress.length >= 64 && cleanAddress.length <= 66 && /^[0-9a-fA-F]+$/.test(cleanAddress)) {
        console.log('🔄 Это HEX адрес, начинаем конвертацию...');
        
        // Определяем правильный HEX адрес (ровно 64 символа)
        let hexOnly;
        if (cleanAddress.length === 65 && cleanAddress.startsWith('0')) {
          // Если 65 символов и начинается с '0', убираем первый символ (это лишний ноль)
          hexOnly = cleanAddress.slice(1);
          console.log('✂️ Убран лишний "0" в начале, осталось 64 символа:', hexOnly);
        } else if (cleanAddress.length === 64) {
          // Если ровно 64 - используем как есть
          hexOnly = cleanAddress;
          console.log('✅ Адрес ровно 64 символа:', hexOnly);
        } else {
          // В остальных случаях берем последние 64 символа
          hexOnly = cleanAddress.slice(-64);
          console.log('✂️ Взяты последние 64 символа:', hexOnly);
        }
        
        console.log('📦 Проверка наличия Address:', typeof Address);
        console.log('📦 Проверка parseRaw:', typeof Address.parseRaw);
        
        const rawFormat = `0:${hexOnly}`;
        console.log('📝 Raw формат для парсинга:', rawFormat);
        
        // Создаем Address объект из raw формата (workchain 0 для основной сети)
        const address = Address.parseRaw(rawFormat);
        console.log('✅ Address объект создан:', address);
        
        // Конвертируем в user-friendly формат (bounceable, mainnet)
        const userFriendly = address.toString({ 
          bounceable: true,  // Стандартный формат для кошельков
          testOnly: false    // mainnet (не testnet)
        });
        
        console.log('✅ Конвертация HEX → User-friendly:', hexOnly, '→', userFriendly);
        return userFriendly;
      }
      
      // Если формат неизвестен, возвращаем как есть
      console.warn('⚠️ Неизвестный формат адреса (длина:', cleanAddress.length, '):', cleanAddress);
      console.warn('⚠️ Проверка HEX:', /^[0-9a-fA-F]+$/.test(cleanAddress));
      return cleanAddress;
      
    } catch (e: any) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА конвертации адреса:', e);
      console.error('❌ Стек ошибки:', e.stack);
      console.error('❌ Возвращаем исходный адрес');
      return hexAddress;
    }
  };

  // Функция для проверки баланса TON кошелька
  const checkWalletBalance = async (walletAddress: string) => {
    // ЗАЩИТА: Проверяем, не идет ли уже загрузка для этого адреса
    if (walletBalances[walletAddress]?.loading) {
      console.warn('⚠️ Загрузка для этого адреса уже идет, пропускаем повторный запрос');
      return;
    }
    
    // Устанавливаем статус загрузки
    setWalletBalances(prev => ({
      ...prev,
      [walletAddress]: { balance: '', loading: true }
    }));

    try {
      console.log('🔍 ========== ПРОВЕРКА БАЛАНСА TON ==========');
      console.log('📍 Исходный адрес:', walletAddress);
      console.log('📏 Длина адреса:', walletAddress.length);
      console.log('🔧 НАЧИНАЮ КОНВЕРТАЦИЮ АДРЕСА...');
      console.log('🔧 Проверка функции hexToUserFriendlyAddress:', typeof hexToUserFriendlyAddress);
      
      // Конвертируем HEX адрес в user-friendly формат, если необходимо
      let userFriendlyAddress;
      try {
        userFriendlyAddress = hexToUserFriendlyAddress(walletAddress);
        console.log('✅ КОНВЕРТАЦИЯ ЗАВЕРШЕНА');
      } catch (convError) {
        console.error('❌ ОШИБКА ПРИ ВЫЗОВЕ hexToUserFriendlyAddress:', convError);
        userFriendlyAddress = walletAddress; // Используем исходный адрес
      }
      
      console.log('🔄 Конвертированный адрес:', userFriendlyAddress);
      console.log('📝 Формат:', userFriendlyAddress.startsWith('UQ') || userFriendlyAddress.startsWith('EQ') ? 'User-friendly (base64)' : 'Другой формат');
      
      // Пробуем несколько API для максимальной надежности
      let balanceInTon = '0.00';
      let apiUsed = '';
      
      // Метод 1: TON API (tonapi.io) - современный и надежный
      try {
        console.log('🔄 Попытка 1: TON API (tonapi.io)...');
        const tonapiUrl = `https://tonapi.io/v2/accounts/${userFriendlyAddress}`;
        console.log('🌐 URL:', tonapiUrl);
        
        const tonapiResponse = await fetch(tonapiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (tonapiResponse.ok) {
          const tonapiData = await tonapiResponse.json();
          console.log('📦 Ответ TON API:', tonapiData);
          
          if (tonapiData.balance !== undefined) {
            // TON API возвращает баланс в нанотонах
            balanceInTon = (tonapiData.balance / 1_000_000_000).toFixed(2);
            apiUsed = 'TON API';
            console.log('✅ TON API успешно вернул баланс:', balanceInTon, 'TON');
          }
        } else {
          const errorText = await tonapiResponse.text();
          console.log('⚠️ TON API вернул ошибку:', tonapiResponse.status, errorText);
        }
      } catch (e) {
        console.log('⚠️ TON API недоступен:', e);
      }
      
      // Метод 2: TON Center API v2 (резервный)
      if (balanceInTon === '0.00') {
        try {
          console.log('🔄 Попытка 2: TON Center API v2...');
          const toncenterUrl = `https://toncenter.com/api/v2/getAddressBalance?address=${userFriendlyAddress}`;
          console.log('🌐 URL:', toncenterUrl);
          
          const toncenterResponse = await fetch(toncenterUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (toncenterResponse.ok) {
            const toncenterData = await toncenterResponse.json();
            console.log('📦 Ответ TON Center v2:', toncenterData);
            
            if (toncenterData.ok && toncenterData.result !== undefined) {
              balanceInTon = (toncenterData.result / 1_000_000_000).toFixed(2);
              apiUsed = 'TON Center API v2';
              console.log('✅ TON Center API v2 успешно вернул баланс:', balanceInTon, 'TON');
            } else if (!toncenterData.ok) {
              console.log('⚠️ TON Center API v2 вернул ошибку:', toncenterData.error);
            }
          } else {
            const errorText = await toncenterResponse.text();
            console.log('⚠️ TON Center API v2 вернул HTTP ошибку:', toncenterResponse.status, errorText);
          }
        } catch (e) {
          console.log('⚠️ TON Center API v2 недоступен:', e);
        }
      }
      
      // Метод 3: TON Center API v3 (альтернативный)
      if (balanceInTon === '0.00') {
        try {
          console.log('🔄 Попытка 3: TON Center API v3...');
          const v3Url = `https://toncenter.com/api/v3/account?address=${userFriendlyAddress}`;
          console.log('🌐 URL:', v3Url);
          
          const v3Response = await fetch(v3Url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (v3Response.ok) {
            const v3Data = await v3Response.json();
            console.log('📦 Ответ TON Center v3:', v3Data);
            
            if (v3Data.balance !== undefined) {
              balanceInTon = (v3Data.balance / 1_000_000_000).toFixed(2);
              apiUsed = 'TON Center API v3';
              console.log('✅ TON Center v3 успешно вернул баланс:', balanceInTon, 'TON');
            }
          } else {
            const errorText = await v3Response.text();
            console.log('⚠️ TON Center v3 вернул ошибку:', v3Response.status, errorText);
          }
        } catch (e) {
          console.log('⚠️ TON Center v3 недоступен:', e);
        }
      }
      
      console.log('🎯 Итоговый баланс:', balanceInTon, 'TON');
      console.log('📡 Использован API:', apiUsed || 'Не удалось получить данные');
      console.log('🔍 ========== КОНЕЦ ПРОВЕРКИ ==========');
      
      if (apiUsed === '' && balanceInTon === '0.00') {
        throw new Error('Не удалось получить баланс ни от одного API. Проверьте формат адреса.');
      }
      
      setWalletBalances(prev => ({
        ...prev,
        [walletAddress]: { balance: balanceInTon, loading: false }
      }));
      
    } catch (e: any) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', e);
      
      setWalletBalances(prev => ({
        ...prev,
        [walletAddress]: { 
          balance: '', 
          loading: false, 
          error: e.message || 'Неизвестная ошибка' 
        }
      }));
    }
  };

  // Функция для прокрутки к категории
  const scrollToCategory = (categoryName: string) => {
    // Скрываем All Users Info при переключении на другие секции
    setAllUsersData(null);
    setUserDetails(null);
    setUserTransactions(null);
    
    const element = categoryRefs.current[categoryName];
    if (element) {
      const yOffset = -100; // Отступ сверху для навигации
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Фильтрация и группировка данных по периоду
  const filteredData = useMemo(() => {
    if (!usersData || !usersData.dailyCounts) return null;

    const now = new Date();
    
    // Функция для форматирования даты
    const formatDateDDMMYY = (date: Date) => {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(date.getUTCFullYear()).slice(-2);
      return `${dd}.${mm}.${yy}`;
    };
    
    // Функция для получения начала недели (понедельник)
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      let dow = d.getUTCDay(); // 0..6, где 0 = воскресенье
      if (dow === 0) dow = 7;  // 1..7, где 1 = понедельник
      const start = new Date(d);
      start.setUTCDate(d.getUTCDate() - (dow - 1));
      start.setUTCHours(0, 0, 0, 0);
      return start;
    };

    if (timeFilter === 'all') {
      // Все время - показываем по дням
      return {
        ...usersData,
        dailyCounts: usersData.dailyCounts
      };
    } else if (timeFilter === '7') {
      // 7 дней - группировка по неделям (по 7 дней от первой регистрации)
      if (usersData.dailyCounts.length === 0) {
        return { ...usersData, dailyCounts: [] };
      }
      
      // Сначала сортируем все дни по дате (по возрастанию)
      const sortedDays = [...usersData.dailyCounts].sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('.').map(Number);
        const [dayB, monthB, yearB] = b.date.split('.').map(Number);
        const dateA = Date.UTC(2000 + yearA, monthA - 1, dayA);
        const dateB = Date.UTC(2000 + yearB, monthB - 1, dayB);
        return dateA - dateB;
      });
      
      // Находим первую дату регистрации
      const firstDay = sortedDays[0];
      const [firstDayStr, firstMonthStr, firstYearStr] = firstDay.date.split('.');
      const startDate = new Date(Date.UTC(2000 + parseInt(firstYearStr), parseInt(firstMonthStr) - 1, parseInt(firstDayStr), 0, 0, 0, 0));
      
      const countsByWeek: { weekStart: Date; weekEnd: Date; count: number; minDate: Date; maxDate: Date }[] = [];
      
      sortedDays.forEach(day => {
        const [dayStr, monthStr, yearStr] = day.date.split('.');
        const dayDate = new Date(Date.UTC(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), 0, 0, 0, 0));
        
        // Вычисляем разницу в днях от первой даты
        const daysDiff = Math.floor((dayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(daysDiff / 7);
        
        // Вычисляем начало и конец недели
        const weekStart = new Date(startDate.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        // Ищем существующую неделю
        let weekData = countsByWeek.find(w => w.weekStart.getTime() === weekStart.getTime());
        
        if (!weekData) {
          weekData = {
            weekStart,
            weekEnd,
            count: 0,
            minDate: dayDate,
            maxDate: dayDate
          };
          countsByWeek.push(weekData);
        }
        
        weekData.count += day.count;
        
        if (dayDate < weekData.minDate) weekData.minDate = dayDate;
        if (dayDate > weekData.maxDate) weekData.maxDate = dayDate;
      });
      
      const weeklyCounts = countsByWeek
        .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
        .map(data => ({
          date: `${formatDateDDMMYY(data.weekStart)}–${formatDateDDMMYY(data.weekEnd)}`,
          count: data.count
        }));
      
      return {
        ...usersData,
        dailyCounts: weeklyCounts
      };
    } else if (timeFilter === '30') {
      // 30 дней - группировка по месяцам
      const countsByMonth = new Map<string, number>();
      
      usersData.dailyCounts.forEach(day => {
        const [dayStr, monthStr, yearStr] = day.date.split('.');
        const dayDate = new Date(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
        
        const mm = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(dayDate.getUTCFullYear()).slice(-2);
        const monthKey = `${mm}.${yy}`;
        
        countsByMonth.set(monthKey, (countsByMonth.get(monthKey) || 0) + day.count);
      });
      
      const monthlyCounts = Array.from(countsByMonth.entries())
        .map(([month, count]) => {
          const [mm, yy] = month.split('.').map(Number);
          const startTime = new Date(2000 + yy, mm - 1, 1).getTime();
          return { date: month, count, _startTime: startTime };
        })
        .sort((a, b) => a._startTime - b._startTime)
        .map(({ date, count }) => ({ date, count }));
      
      return {
        ...usersData,
        dailyCounts: monthlyCounts
      };
    }

    return {
      ...usersData,
      dailyCounts: usersData.dailyCounts
    };
  }, [usersData, timeFilter]);

  // Расчет прогноза с useMemo - используем исходные дневные данные
  const forecast = useMemo(() => {
    // Всегда используем исходные дневные данные для расчёта
    if (!usersData || !usersData.dailyCounts || usersData.dailyCounts.length < 7) return null;

    const recentDays = usersData.dailyCounts.slice(-7); // Последние 7 дней
    const values = recentDays.map(day => day.count);
    
    // Если все значения нулевые, используем среднее за всё время
    const allZero = values.every(v => v === 0);
    if (allZero) {
      const allValues = usersData.dailyCounts.map(d => d.count);
      const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
      
      const forecastData = [];
      for (let i = 0; i < 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i + 1);
        forecastData.push({
          date: format(futureDate, 'dd.MM.yy'),
          count: Math.round(avg)
        });
      }
      return forecastData;
    }
    
    // Линейная регрессия (метод наименьших квадратов)
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
      const avg = sumY / n;
      const forecastData = [];
      for (let i = 0; i < 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i + 1);
        forecastData.push({
          date: format(futureDate, 'dd.MM.yy'),
          count: Math.round(avg)
        });
      }
      return forecastData;
    }
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    const avg = sumY / n;
    const minValue = Math.min(...values);
    
    // Функция для расчёта прогноза на один день
    const predictDay = (dayIndex: number): number => {
      let predictedValue = intercept + slope * dayIndex;
      // Если прогноз слишком низкий, используем среднее со случайным разбросом
      if (predictedValue < minValue * 0.5) {
        predictedValue = avg * (0.8 + Math.random() * 0.4);
      }
      return Math.max(1, Math.round(predictedValue));
    };
    
    const forecastData = [];
    
    if (timeFilter === '7') {
      // Недельный график → прогноз на 3 недели (сумма дней за каждую неделю)
      for (let week = 0; week < 3; week++) {
        let weekSum = 0;
        for (let day = 0; day < 7; day++) {
          const dayIndex = n + (week * 7) + day;
          weekSum += predictDay(dayIndex);
        }
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() + (week * 7) + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        forecastData.push({
          date: `${format(weekStart, 'dd.MM')}–${format(weekEnd, 'dd.MM')}`,
          count: weekSum
        });
      }
    } else if (timeFilter === '30') {
      // Месячный график → прогноз на 3 месяца (сумма дней за каждый месяц)
      for (let month = 0; month < 3; month++) {
        let monthSum = 0;
        for (let day = 0; day < 30; day++) {
          const dayIndex = n + (month * 30) + day;
          monthSum += predictDay(dayIndex);
        }
        
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() + month + 1);
        
        forecastData.push({
          date: format(monthDate, 'MMM yy', { locale: ru }),
          count: monthSum
        });
      }
    } else {
      // Дневной график → прогноз на 7 дней
    for (let i = 0; i < 7; i++) {
        const dayIndex = n + i;
        const predictedValue = predictDay(dayIndex);
        
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
        
      forecastData.push({
        date: format(futureDate, 'dd.MM.yy'),
        count: predictedValue
      });
      }
    }
    
    return forecastData;
  }, [usersData, timeFilter]);

  // Фильтрованные данные events по времени (по дням / неделям / месяцам)
  const filteredEventsData = useMemo(() => {
    if (!eventsData) return null;

    const formatDateDDMMYY = (date: Date) => {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(date.getUTCFullYear()).slice(-2);
      return `${dd}.${mm}.${yy}`;
    };

    // Функция агрегации массива данных
    const aggregateData = (data: { date: string; count: number }[], filter: 'all' | '7' | '30') => {
      if (!data || data.length === 0) return [];
      
      if (filter === 'all') {
        return data;
      } else if (filter === '7') {
        // Группировка по неделям
        const sortedDays = [...data].sort((a, b) => {
          const [dayA, monthA, yearA] = a.date.split('.').map(Number);
          const [dayB, monthB, yearB] = b.date.split('.').map(Number);
          const dateA = Date.UTC(2000 + yearA, monthA - 1, dayA);
          const dateB = Date.UTC(2000 + yearB, monthB - 1, dayB);
          return dateA - dateB;
        });
        
        if (sortedDays.length === 0) return [];
        
        const firstDay = sortedDays[0];
        const [firstDayStr, firstMonthStr, firstYearStr] = firstDay.date.split('.');
        const startDate = new Date(Date.UTC(2000 + parseInt(firstYearStr), parseInt(firstMonthStr) - 1, parseInt(firstDayStr), 0, 0, 0, 0));
        
        const countsByWeek: { weekStart: Date; weekEnd: Date; count: number }[] = [];
        
        sortedDays.forEach(day => {
          const [dayStr, monthStr, yearStr] = day.date.split('.');
          const dayDate = new Date(Date.UTC(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), 0, 0, 0, 0));
          
          const daysDiff = Math.floor((dayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekNumber = Math.floor(daysDiff / 7);
          
          const weekStart = new Date(startDate.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
          
          let weekData = countsByWeek.find(w => w.weekStart.getTime() === weekStart.getTime());
          
          if (!weekData) {
            weekData = { weekStart, weekEnd, count: 0 };
            countsByWeek.push(weekData);
          }
          
          weekData.count += day.count;
        });
        
        return countsByWeek
          .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
          .map(data => ({
            date: `${formatDateDDMMYY(data.weekStart)}–${formatDateDDMMYY(data.weekEnd)}`,
            count: data.count
          }));
      } else if (filter === '30') {
        // Группировка по месяцам
        const countsByMonth = new Map<string, number>();
        
        data.forEach(day => {
          const [dayStr, monthStr, yearStr] = day.date.split('.');
          const dayDate = new Date(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
          
          const mm = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
          const yy = String(dayDate.getUTCFullYear()).slice(-2);
          const monthKey = `${mm}.${yy}`;
          
          countsByMonth.set(monthKey, (countsByMonth.get(monthKey) || 0) + day.count);
        });
        
        return Array.from(countsByMonth.entries())
          .map(([month, count]) => {
            const [mm, yy] = month.split('.').map(Number);
            const startTime = new Date(2000 + yy, mm - 1, 1).getTime();
            return { date: month, count, _startTime: startTime };
          })
          .sort((a, b) => a._startTime - b._startTime)
          .map(({ date, count }) => ({ date, count }));
      }
      
      return data;
    };

    // Агрегируем totalByDay
    const filteredTotalByDay = aggregateData(eventsData.totalByDay, eventsTimeFilter);

    // Агрегируем каждый event
    const filteredEvents: { [key: string]: { date: string; count: number }[] } = {};
    Object.keys(eventsData.events).forEach(eventName => {
      filteredEvents[eventName] = aggregateData(eventsData.events[eventName], eventsTimeFilter);
    });

    return {
      ...eventsData,
      totalByDay: filteredTotalByDay,
      events: filteredEvents
    };
  }, [eventsData, eventsTimeFilter]);

  // Фильтрованные данные для графика корреляции
  const filteredCorrelationData = useMemo(() => {
    if (!eventsData) return null;

    const formatDateDDMMYY = (date: Date) => {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(date.getUTCFullYear()).slice(-2);
      return `${dd}.${mm}.${yy}`;
    };

    const aggregateData = (data: { date: string; count: number }[], filter: 'all' | '7' | '30') => {
      if (filter === '7') {
        // Группировка по неделям
        const countsByWeek = new Map<string, { count: number; weekStart: Date; weekEnd: Date }>();
        
        data.forEach(day => {
          const [dayStr, monthStr, yearStr] = day.date.split('.');
          const dayDate = new Date(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
          
          const weekStart = new Date(dayDate);
          weekStart.setUTCDate(dayDate.getUTCDate() - dayDate.getUTCDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
          
          const weekKey = `${formatDateDDMMYY(weekStart)}–${formatDateDDMMYY(weekEnd)}`;
          
          if (!countsByWeek.has(weekKey)) {
            countsByWeek.set(weekKey, { count: 0, weekStart, weekEnd });
          }
          const weekData = countsByWeek.get(weekKey)!;
          weekData.count += day.count;
        });
        
        return Array.from(countsByWeek.values())
          .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
          .map(data => ({
            date: `${formatDateDDMMYY(data.weekStart)}–${formatDateDDMMYY(data.weekEnd)}`,
            count: data.count
          }));
      } else if (filter === '30') {
        // Группировка по месяцам
        const countsByMonth = new Map<string, number>();
        
        data.forEach(day => {
          const [dayStr, monthStr, yearStr] = day.date.split('.');
          const dayDate = new Date(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
          
          const mm = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
          const yy = String(dayDate.getUTCFullYear()).slice(-2);
          const monthKey = `${mm}.${yy}`;
          
          countsByMonth.set(monthKey, (countsByMonth.get(monthKey) || 0) + day.count);
        });
        
        return Array.from(countsByMonth.entries())
          .map(([month, count]) => {
            const [mm, yy] = month.split('.').map(Number);
            const startTime = new Date(2000 + yy, mm - 1, 1).getTime();
            return { date: month, count, _startTime: startTime };
          })
          .sort((a, b) => a._startTime - b._startTime)
          .map(({ date, count }) => ({ date, count }));
      }
      
      return data;
    };

    // Агрегируем каждый event по фильтру времени
    const filteredEvents: { [key: string]: { date: string; count: number }[] } = {};
    Object.keys(eventsData.events).forEach(eventName => {
      filteredEvents[eventName] = aggregateData(eventsData.events[eventName], correlationTimeFilter);
    });

    // Получаем общие даты для всех событий
    const allDates = new Set<string>();
    Object.values(filteredEvents).forEach(eventData => {
      eventData.forEach(day => allDates.add(day.date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const parseDate = (dateStr: string) => {
        if (dateStr.includes('–')) {
          const [start] = dateStr.split('–');
          const [dd, mm, yy] = start.split('.');
          return new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd)).getTime();
        } else if (dateStr.includes('.')) {
          const [mm, yy] = dateStr.split('.');
          return new Date(2000 + parseInt(yy), parseInt(mm) - 1, 1).getTime();
        }
        return 0;
      };
      return parseDate(a) - parseDate(b);
    });

    return {
      dates: sortedDates,
      events: filteredEvents
    };
  }, [eventsData, correlationTimeFilter]);

  // Фильтрованные данные для модального окна
  const filteredModalData = useMemo(() => {
    if (!selectedEventModal) return null;

    const formatDateDDMMYY = (date: Date) => {
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(date.getUTCFullYear()).slice(-2);
      return `${dd}.${mm}.${yy}`;
    };

    const data = selectedEventModal.eventData;
    if (!data || data.length === 0) return [];

    if (modalTimeFilter === 'all') {
      return data;
    } else if (modalTimeFilter === '7') {
      // Группировка по неделям
      const sortedDays = [...data].sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('.').map(Number);
        const [dayB, monthB, yearB] = b.date.split('.').map(Number);
        const dateA = Date.UTC(2000 + yearA, monthA - 1, dayA);
        const dateB = Date.UTC(2000 + yearB, monthB - 1, dayB);
        return dateA - dateB;
      });
      
      if (sortedDays.length === 0) return [];
      
      const firstDay = sortedDays[0];
      const [firstDayStr, firstMonthStr, firstYearStr] = firstDay.date.split('.');
      const startDate = new Date(Date.UTC(2000 + parseInt(firstYearStr), parseInt(firstMonthStr) - 1, parseInt(firstDayStr), 0, 0, 0, 0));
      
      const countsByWeek: { weekStart: Date; weekEnd: Date; count: number }[] = [];
      
      sortedDays.forEach(day => {
        const [dayStr, monthStr, yearStr] = day.date.split('.');
        const dayDate = new Date(Date.UTC(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), 0, 0, 0, 0));
        
        const daysDiff = Math.floor((dayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(daysDiff / 7);
        
        const weekStart = new Date(startDate.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        let weekData = countsByWeek.find(w => w.weekStart.getTime() === weekStart.getTime());
        
        if (!weekData) {
          weekData = { weekStart, weekEnd, count: 0 };
          countsByWeek.push(weekData);
        }
        
        weekData.count += day.count;
      });
      
      return countsByWeek
        .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
        .map(d => ({
          date: `${formatDateDDMMYY(d.weekStart)}–${formatDateDDMMYY(d.weekEnd)}`,
          count: d.count
        }));
    } else if (modalTimeFilter === '30') {
      // Группировка по месяцам
      const countsByMonth = new Map<string, number>();
      
      data.forEach(day => {
        const [dayStr, monthStr, yearStr] = day.date.split('.');
        const dayDate = new Date(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
        
        const mm = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(dayDate.getUTCFullYear()).slice(-2);
        const monthKey = `${mm}.${yy}`;
        
        countsByMonth.set(monthKey, (countsByMonth.get(monthKey) || 0) + day.count);
      });
      
      return Array.from(countsByMonth.entries())
        .map(([month, count]) => {
          const [mm, yy] = month.split('.').map(Number);
          const startTime = new Date(2000 + yy, mm - 1, 1).getTime();
          return { date: month, count, _startTime: startTime };
        })
        .sort((a, b) => a._startTime - b._startTime)
        .map(({ date, count }) => ({ date, count }));
    }
    
    return data;
  }, [selectedEventModal, modalTimeFilter]);

  useEffect(() => {
    // Автоматическая загрузка dashboard-stats отключена, так как webhook может быть неактивен
    // load();
    // Автоматическое обновление отключено - данные статичны
  }, []);

  // Блокируем скролл основного экрана при открытом модальном окне пользователей уровня
  useEffect(() => {
    if (levelUsersModal) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      // Блокируем скролл
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Восстанавливаем скролл при закрытии модального окна
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [levelUsersModal]);

  // Блокируем скролл основного экрана при открытом модальном окне деталей пользователя
  useEffect(() => {
    if (userDetails) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      // Блокируем скролл
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Восстанавливаем скролл при закрытии модального окна
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [userDetails]);

  // Инициализируем выбранные события только один раз при первой загрузке данных
  useEffect(() => {
    if (eventsData && eventsData.events && Object.keys(eventsData.events).length > 0 && !eventsInitialized) {
      const excludedEvents = ['starter_pack_granted', 'person_created', 'pool_member_bonus', 'pool_owner_commission'];
      const eventKeys = Object.keys(eventsData.events)
        .filter(eventName => !excludedEvents.includes(eventName))
        .slice(0, 20);
      setSelectedEvents(new Set(eventKeys));
      setEventsInitialized(true);
    }
  }, [eventsData, eventsInitialized]);

  // Фильтрация и сортировка данных для All Users Info
  const filteredAndSortedUsers = useMemo(() => {
    if (!allUsersData) return [];
    
    let filtered = [...allUsersData.users];

    // Применяем фильтры
    if (allUsersFilters.search) {
      const searchLower = allUsersFilters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        String(user.person_id).includes(searchLower) ||
        user.tg_id?.toLowerCase().includes(searchLower) ||
        user.wallet_address?.toLowerCase().includes(searchLower) ||
        user.hex_wallet_address?.toLowerCase().includes(searchLower) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower)
      );
    }

    if (allUsersFilters.ecosPremium !== 'all') {
      filtered = filtered.filter(user => 
        allUsersFilters.ecosPremium === 'premium' ? user.is_ecos_premium : !user.is_ecos_premium
      );
    }

    if (allUsersFilters.tgPremium !== 'all') {
      filtered = filtered.filter(user => 
        allUsersFilters.tgPremium === 'premium' ? user.tg_premium : !user.tg_premium
      );
    }

    if (allUsersFilters.onboarding !== 'all') {
      filtered = filtered.filter(user => 
        allUsersFilters.onboarding === 'done' ? user.onbording_done : !user.onbording_done
      );
    }

    if (allUsersFilters.language !== 'all') {
      filtered = filtered.filter(user => 
        user.person_language === allUsersFilters.language || user.tg_language === allUsersFilters.language
      );
    }

    if (allUsersFilters.level !== 'all') {
      const levelFilter = parseInt(allUsersFilters.level);
      if (!isNaN(levelFilter)) {
        filtered = filtered.filter(user => 
          user.level !== null && user.level === levelFilter
        );
      }
    }

    if (allUsersFilters.minAsic) {
      const minAsic = parseInt(allUsersFilters.minAsic) || 0;
      filtered = filtered.filter(user => (user.total_asics || 0) >= minAsic);
    }

    if (allUsersFilters.maxAsic) {
      const maxAsic = parseInt(allUsersFilters.maxAsic) || Infinity;
      filtered = filtered.filter(user => (user.total_asics || 0) <= maxAsic);
    }

    if (allUsersFilters.minTh) {
      const minTh = parseInt(allUsersFilters.minTh) || 0;
      filtered = filtered.filter(user => (user.total_th || 0) >= minTh);
    }

    if (allUsersFilters.maxTh) {
      const maxTh = parseInt(allUsersFilters.maxTh) || Infinity;
      filtered = filtered.filter(user => (user.total_th || 0) <= maxTh);
    }

    // Фильтр по дате регистрации
    if (allUsersFilters.dateFrom) {
      const dateFrom = new Date(allUsersFilters.dateFrom);
      dateFrom.setHours(0, 0, 0, 0);
      filtered = filtered.filter(user => {
        if (!user.person_created_at) return false;
        const userDate = new Date(user.person_created_at);
        userDate.setHours(0, 0, 0, 0);
        return userDate >= dateFrom;
      });
    }

    if (allUsersFilters.dateTo) {
      const dateTo = new Date(allUsersFilters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(user => {
        if (!user.person_created_at) return false;
        const userDate = new Date(user.person_created_at);
        return userDate <= dateTo;
      });
    }

    // Применяем сортировку
    if (allUsersSort.field) {
      filtered.sort((a, b) => {
        let aVal: any = a[allUsersSort.field as keyof typeof a];
        let bVal: any = b[allUsersSort.field as keyof typeof b];

        // Обработка разных типов данных
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          // Числа сортируем как есть
        } else {
          aVal = aVal || 0;
          bVal = bVal || 0;
        }

        if (aVal < bVal) return allUsersSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return allUsersSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allUsersData, allUsersFilters, allUsersSort]);

  // Получаем уникальные языки для фильтра
  const uniqueLanguages = useMemo(() => {
    if (!allUsersData) return [];
    const languages = new Set<string>();
    allUsersData.users.forEach(user => {
      if (user.person_language) languages.add(user.person_language);
      if (user.tg_language) languages.add(user.tg_language);
    });
    return Array.from(languages).sort();
  }, [allUsersData]);

  // Получаем уникальные уровни для фильтра
  const uniqueLevels = useMemo(() => {
    if (!allUsersData) return [];
    const levels = new Set<number>();
    allUsersData.users.forEach(user => {
      if (user.level !== null && user.level !== undefined) {
        levels.add(user.level);
      }
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [allUsersData]);

  const handleSort = (field: string) => {
    setAllUsersSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: string) => {
    if (allUsersSort.field !== field) {
      return (
        <svg className="w-4 h-4 inline-block ml-1 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return allUsersSort.direction === 'asc' ? (
      <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка данных дашборда...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-red-600">Ошибка загрузки: {error}</p>
          <button onClick={load} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white">
            <RefreshCw className="w-4 h-4" /> Повторить
          </button>
        </div>
      </div>
    );
  }

  // Удалены захардкоженные карточки майнинга

  // Единый объект eventNames для синхронизации цветов между чекбоксами и графиком
  const eventNamesMap: { [key: string]: { title: string; icon: string; color: string } } = {
    'mining_started': { title: 'Mining Started', icon: 'mining', color: '#f97316' },
    'mining_claimed': { title: 'Mining Claimed', icon: 'coins', color: '#10b981' },
    'equipment_purchase': { title: 'Equipment Purchase', icon: 'cart', color: '#3b82f6' },
    'checkin_reward': { title: 'Daily Check-in', icon: 'calendar', color: '#ec4899' },
    'referral_bonus_referrer': { title: 'Referral Bonus', icon: 'dollar', color: '#22c55e' },
    'swap_btc_to_ecos': { title: 'Swap BTC to XP', icon: 'swap', color: '#0ea5e9' },
    'daily_all_done_reward': { title: 'All Tasks Done', icon: 'target', color: '#8b5cf6' },
    'check_tma_reward': { title: 'TMA Check', icon: 'check', color: '#14b8a6' },
    'follow_game_channel_reward': { title: 'Channel Follow', icon: 'megaphone', color: '#f43f5e' },
    'app_ecos_register_tma_reward': { title: 'TMA Registration', icon: 'phone', color: '#06b6d4' },
    'confirm_telegram_premium_reward': { title: 'Telegram Premium', icon: 'star', color: '#f59e0b' },
    'swap_btc_0_03_to_ecos_reward': { title: 'Swap 0.03 BTC', icon: 'exchange', color: '#0891b2' },
    'buy_100_asics_in_the_game_reward': { title: 'Own 100 ASIC', icon: 'monitor', color: '#6366f1' },
    'buy_200_asics_in_the_game_reward': { title: 'Own 200 ASIC', icon: 'laptop', color: '#7c3aed' },
    'buy_400_asics_in_the_game_reward': { title: 'Own 400 ASIC', icon: 'monitor', color: '#a855f7' },
    'buy_800_asics_in_the_game_reward': { title: 'Own 800 ASIC', icon: 'monitor', color: '#c084fc' },
    'buy_1000_asics_in_the_game_reward': { title: 'Own 1000 ASIC', icon: 'monitor', color: '#9333ea' },
    'buy_property_reward': { title: 'Buy Property', icon: 'building', color: '#059669' },
    'checkin_7_days_reward': { title: '7 Days Check-in', icon: 'calendar', color: '#16a34a' },
    'checkin_15_days_reward': { title: '15 Days Check-in', icon: 'calendar-days', color: '#15803d' },
    'balance_turnover_1000000_reward': { title: 'Balance 1M+', icon: 'diamond', color: '#c026d3' },
    'combo_reward': { title: 'Combo Complete', icon: 'gamepad', color: '#eab308' },
    'complete_70_tasks_reward': { title: '70 Tasks Done', icon: 'medal', color: '#ea580c' },
    'complete_80_tasks_reward': { title: '80 Tasks Done', icon: 'medal', color: '#fb923c' },
    'complete_90_tasks_reward': { title: '90 Tasks Done', icon: 'trophy', color: '#dc2626' },
    'like_game_post_reward': { title: 'Like Game Post', icon: 'thumb', color: '#2563eb' },
    'share_game_post_reward': { title: 'Share Game Post', icon: 'share', color: '#0284c7' },
    'comment_game_post_reward': { title: 'Comment Game Post', icon: 'message', color: '#7c2d12' },
    'view_game_post_reward': { title: 'View Game Post', icon: 'eye', color: '#0d9488' },
    'referral_bonus_referred': { title: 'Referred User', icon: 'user-plus', color: '#65a30d' },
    'wallet_created': { title: 'Wallet Created', icon: 'wallet', color: '#047857' },
    'first_transaction': { title: 'First Transaction', icon: 'credit-card', color: '#1e40af' },
    'level_up': { title: 'Level Up', icon: 'award', color: '#d97706' },
  };

  // Цвета для событий без определенного цвета
  const defaultColors = [
    '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6',
    '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1',
    '#84cc16', '#06b6d4', '#d946ef', '#f43f5e', '#10b981',
    '#eab308', '#a855f7', '#0891b2', '#be123c', '#7c3aed',
    '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#fb7185'
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Дашборд ECOSMiningGame</h1>
        {stats && (
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Обновлено: {new Date(stats.updatedAtIso).toLocaleString('ru-RU')}</p>
        )}
      </div>

      {/* Удалены захардкоженные карточки майнинга */}

      {/* Data loading buttons */}
      <div className="mb-8 neu-btn-grid">
        <button onClick={loadUsersData} disabled={usersLoading} className="neu-btn-lg">
          {usersLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Users className="w-5 h-5 text-blue-400" />
          )}
          <span>{usersLoading ? 'Loading...' : 'User Statistics'}</span>
        </button>

        <button onClick={loadWalletsData} disabled={walletsLoading} className="neu-btn-lg">
          {walletsLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
          )}
          <span>{walletsLoading ? 'Loading...' : 'Wallet Stats'}</span>
        </button>

        <button onClick={loadEventsData} disabled={eventsLoading} className="neu-btn-lg">
          {eventsLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
          )}
          <span>{eventsLoading ? 'Loading...' : 'Game Events'}</span>
        </button>

        <button onClick={loadReferralsData} disabled={referralsLoading} className="neu-btn-lg">
          {referralsLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
          )}
          <span>{referralsLoading ? 'Loading...' : 'Referral Stats'}</span>
        </button>

        <button onClick={loadPoolsData} disabled={poolsLoading} className="neu-btn-lg">
          {poolsLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
          )}
          <span>{poolsLoading ? 'Loading...' : 'Top Pools'}</span>
        </button>

        <button onClick={loadFunnelData} disabled={funnelLoading} className="neu-btn-lg">
          {funnelLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
          )}
          <span>{funnelLoading ? 'Loading...' : 'Users by Level'}</span>
        </button>

        <button onClick={loadLeadersData} disabled={leadersLoading} className="neu-btn-lg">
          {leadersLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
          )}
          <span>{leadersLoading ? 'Loading...' : 'Leaderboard'}</span>
        </button>

        <button onClick={loadKpiData} disabled={kpiLoading} className="neu-btn-lg">
          {kpiLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
          )}
          <span>{kpiLoading ? 'Loading...' : 'Users KPI'}</span>
        </button>

        <button onClick={loadAllUsersData} disabled={allUsersLoading} className="neu-btn-lg">
          {allUsersLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
          )}
          <span>{allUsersLoading ? 'Loading...' : 'All Users Info'}</span>
        </button>
      </div>


      {/* Отображение данных пользователей */}
      {usersData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-orange-500" />
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>User Statistics</h2>
          </div>
          
          {/* Если пришло текстовое сообщение от n8n */}
          {usersData.text ? (
            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200">
                  {usersData.text}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Основная статистика - Apple Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Всего пользователей */}
                <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                    : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
                } rounded-2xl p-6`}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        Всего
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {usersData.totalUsers || 0}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                        пользователей
                      </div>
                    </div>
                  </div>
                </div>

                {/* За 24 часа */}
                <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  isDark 
                    ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                    : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
                } rounded-2xl p-6`}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></div>
                      <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        За 24 часа
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {usersData.usersLast24h?.length || 0}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                        новых регистраций
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium пользователи */}
                {usersData.premiumUsers !== undefined && (
                  <>
                    <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                        : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
                    } rounded-2xl p-6`}>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                            <span className="text-white text-xs">★</span>
                          </div>
                          <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Premium
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {usersData.premiumUsers}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {usersData.totalPremiumPercentage}% от общего
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                      isDark 
                        ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                        : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
                    } rounded-2xl p-6`}>
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs">★</span>
                          </div>
                          <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Premium 24ч
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                          <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {usersData.premiumUsersLast24h || 0}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {usersData.premiumPercentageLast24h}% от новых
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* График прироста пользователей */}
              {filteredData?.dailyCounts && filteredData.dailyCounts.length > 0 && (
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 График прироста пользователей</h3>
                    </div>
                    
                    {/* Filter buttons */}
                    <div className="flex gap-2">
                        {[
                        { key: 'all', label: '1D' },
                        { key: '7', label: '1W' },
                        { key: '30', label: '1M' }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setTimeFilter(key as any)}
                          className={timeFilter === key ? 'neu-btn-filter-active' : 'neu-btn-filter'}
                          >
                            {label}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* График */}
                  <div className="h-80">
                    <Line
                      data={{
                        labels: [...(filteredData?.dailyCounts.map(day => day.date) || []), ...(forecast?.map(day => day.date) || [])],
                        datasets: [
                          {
                            label: 'Регистрации',
                            data: filteredData?.dailyCounts.map(day => day.count) || [],
                            borderColor: isDark ? '#f97316' : '#ea580c',
                            backgroundColor: isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: isDark ? '#f97316' : '#ea580c',
                            pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                          },
                          // Добавляем прогноз
                          ...(forecast ? [{
                            label: 'Прогноз',
                            data: [...(filteredData?.dailyCounts.map(() => null) || []), ...forecast.map(day => day.count)],
                            borderColor: isDark ? '#8b5cf6' : '#7c3aed',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            tension: 0.4,
                            pointBackgroundColor: isDark ? '#8b5cf6' : '#7c3aed',
                            pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                          }] : [])
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: isDark ? '#374151' : '#ffffff',
                            titleColor: isDark ? '#ffffff' : '#000000',
                            bodyColor: isDark ? '#ffffff' : '#000000',
                            borderColor: isDark ? '#4b5563' : '#e5e7eb',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                              title: function(context) {
                                return `📅 ${context[0].label}`;
                              },
                              label: function(context) {
                                return `👥 ${context.parsed.y} новых пользователей`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              color: isDark ? '#374151' : '#f3f4f6',
                              drawBorder: false
                            },
                            ticks: {
                              color: isDark ? '#9ca3af' : '#6b7280',
                              font: {
                                size: 12
                              }
                            }
                          },
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: isDark ? '#374151' : '#f3f4f6',
                              drawBorder: false
                            },
                            ticks: {
                              color: isDark ? '#9ca3af' : '#6b7280',
                              font: {
                                size: 12
                              },
                              callback: function(value) {
                                return Number(value).toLocaleString('ru-RU');
                              }
                            }
                          }
                        },
                        interaction: {
                          intersect: false,
                          mode: 'index'
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Статистика по языкам */}
              {usersData.languageCounts && usersData.languageCounts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Language list */}
                  <div className="neu-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="neu-inset p-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>User Languages</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {usersData.languageCounts.slice(0, 8).map((lang: { language: string; count: number }, index: number) => (
                        <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">{lang.count}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">{lang.language.toUpperCase()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div className="neu-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="neu-inset p-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Language Distribution</h3>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut
                        data={{
                          labels: usersData.languageCounts.slice(0, 6).map(lang => lang.language.toUpperCase()),
                          datasets: [{
                            data: usersData.languageCounts.slice(0, 6).map(lang => lang.count),
                            backgroundColor: [
                              '#f97316', // orange-500
                              '#3b82f6', // blue-500
                              '#10b981', // emerald-500
                              '#8b5cf6', // violet-500
                              '#ef4444', // red-500
                              '#f59e0b', // amber-500
                            ],
                            borderColor: isDark ? '#374151' : '#ffffff',
                            borderWidth: 2,
                            hoverOffset: 4,
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: isDark ? '#ffffff' : '#000000',
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                  size: 12
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: isDark ? '#374151' : '#ffffff',
                              titleColor: isDark ? '#ffffff' : '#000000',
                              bodyColor: isDark ? '#ffffff' : '#000000',
                              borderColor: isDark ? '#4b5563' : '#e5e7eb',
                              borderWidth: 1,
                              cornerRadius: 8,
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Languages in last 24 hours */}
              {usersData.languageCountsLast24h && usersData.languageCountsLast24h.length > 0 && (
                <div className="neu-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="neu-inset p-2">
                      <Globe className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Languages (24h)</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {usersData.languageCountsLast24h.map((lang: { language: string; count: number }, index: number) => (
                      <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{lang.count}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">{lang.language.toUpperCase()}</div>
                        </div>
          </div>
        ))}
      </div>
                </div>
              )}

              {/* Регистрации по дням и прогноз */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registrations by day */}
                {usersData?.dailyCounts && usersData.dailyCounts.length > 0 && (
                  <div className="neu-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="neu-inset p-2">
                        <Calendar className="w-5 h-5 text-pink-400" />
                      </div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Daily Registrations</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {usersData.dailyCounts.map((day: { date: string; count: number }, index: number) => (
                          <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <span className="font-medium text-gray-900 dark:text-white">{day.date}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, (day.count / Math.max(...usersData.dailyCounts.map(d => d.count))) * 100)}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-orange-600 min-w-[2rem] text-right">{day.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Прогноз */}
                {forecast && (
                  <div className="neu-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="neu-inset p-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Forecast: {timeFilter === '7' ? '3 Weeks' : timeFilter === '30' ? '3 Months' : '7 Days'}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {forecast.map((day: { date: string; count: number }, index: number) => (
                        <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{day.date}</span>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                              прогноз
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, (day.count / Math.max(...forecast.map(d => d.count))) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-purple-600 min-w-[2rem] text-right">{day.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        💡 Прогноз основан на тренде последних 7 дней
                      </p>
                    </div>
                  </div>
                )}
              </div>
        </div>
          )}
        </div>
      )}

      {/* Отображение данных кошельков */}
      {walletsData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">💳 Статистика кошельков</h2>
          </div>
          
          <div className="space-y-6">
            {/* Карточки статистики кошельков - Apple Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Всего пользователей */}
              <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                isDark 
                  ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                  : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
              } rounded-2xl p-6`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Всего пользователей
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {walletsData.totalUsers}
                    </div>
                  </div>
                </div>
              </div>

              {/* С кошельком */}
              <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                isDark 
                  ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                  : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
              } rounded-2xl p-6`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></div>
                    <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      С кошельком
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {walletsData.withWalletCount}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                      {walletsData.withWalletPercent} от общего
                    </div>
                  </div>
                </div>
              </div>

              {/* Без кошелька */}
              <div className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                isDark 
                  ? 'bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50' 
                  : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-sm'
              } rounded-2xl p-6`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full bg-red-500`}></div>
                    <span className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      Без кошелька
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className={`text-5xl font-semibold tracking-tight mb-1 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {walletsData.withoutWalletCount}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                      {walletsData.withoutWalletPercent} от общего
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопка для просмотра пользователей с кошельками */}
            <div className="flex justify-center mt-6">
              <button
                onClick={loadWalletUsers}
                disabled={walletUsersLoading}
                className={`group relative px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-3 text-sm ${
                  walletUsersLoading
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
                    : isDark
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {walletUsersLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Загрузка...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Показать пользователей с кошельками</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список пользователей с кошельками (чистый рендер) */}
      {Array.isArray(walletUsers) && walletUsers.length > 0 && (() => {
        // Фильтрация пользователей по поисковому запросу
        const filteredUsers = walletUsers.filter(u => {
          if (!walletSearchQuery.trim()) return true;
          
          const searchLower = walletSearchQuery.toLowerCase();
          const username = (u.username || '').toLowerCase();
          const firstName = (u.first_name || '').toLowerCase();
          const lastName = (u.last_name || '').toLowerCase();
          const displayName = (u.display_name || '').toLowerCase();
          const id = String(u.id);
          
          return username.includes(searchLower) ||
                 firstName.includes(searchLower) ||
                 lastName.includes(searchLower) ||
                 displayName.includes(searchLower) ||
                 id.includes(searchLower);
        });
        
        return (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">👛 Пользователи с подключенными кошельками</h3>
            </div>
            <div className={`${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'} px-4 py-2 rounded-lg text-sm font-semibold`}>
              {walletUsers.length} пользователей
            </div>
          </div>
          
          {/* Индикатор курса TON/USD */}
          {tonUsdRate !== null && (
            <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
              isDark ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-800/50' : 'bg-blue-100'}`}>
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                  </svg>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Курс TON
                  </div>
                  <div className={`font-bold text-lg ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    ${tonUsdRate.toFixed(4)} USD
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Поле поиска */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={walletSearchQuery}
                onChange={(e) => setWalletSearchQuery(e.target.value)}
                placeholder="Поиск по имени, никнейму или ID..."
                className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50'
                } focus:outline-none`}
              />
              {walletSearchQuery && (
                <button
                  onClick={() => setWalletSearchQuery('')}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  } transition-colors`}
                  title="Очистить"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {walletSearchQuery && (
              <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Найдено: {filteredUsers.length} из {walletUsers.length}
              </div>
            )}
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className={`p-8 text-center rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <svg className={`w-16 h-16 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Ничего не найдено
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Попробуйте изменить поисковый запрос
              </p>
            </div>
          ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {filteredUsers.map((u, index) => {
              const wallet = u.wallet_address || '';
              const shortWallet = wallet.length > 20 ? `${wallet.slice(0, 8)}...${wallet.slice(-8)}` : wallet || '-';
              const displayName = u.username ? `@${u.username}` : u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : `User #${u.id}`;
              const balanceInfo = walletBalances[wallet];
              
              return (
                <div 
                  key={u.id}
                  className={`p-4 rounded-lg transition-all ${
                    isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Верхняя часть: номер, имя, ID */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs flex-shrink-0 ${
                      isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} truncate`}>
                        {displayName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ID: {u.id}</span>
                        {u.language_code && (
                          <span className={`${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'} px-2 py-0.5 rounded text-xs font-semibold uppercase`}>
                            {u.language_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Средняя часть: адрес кошелька */}
                  <div className={`flex items-center justify-between flex-wrap gap-2 pb-3 mb-3 ${isDark ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Адрес кошелька:</span>
                    <div className="flex items-center gap-2">
                      <code 
                        className={`text-sm font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'} px-2 py-1 rounded ${isDark ? 'bg-gray-600/50' : 'bg-emerald-50'}`}
                        title={wallet}
                      >
                        {shortWallet}
                      </code>
                      {wallet && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(wallet);
                            alert('Адрес скопирован!');
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            isDark ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                          }`}
                          title="Скопировать адрес"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Нижняя часть: кнопка проверки и баланс */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => checkWalletBalance(wallet)}
                      disabled={balanceInfo?.loading || !wallet}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        balanceInfo?.loading || !wallet
                          ? 'opacity-50 cursor-not-allowed bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          : isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {balanceInfo?.loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Check Wallet
                        </>
                      )}
                    </button>
                    
                    {/* Отображение баланса */}
                    {balanceInfo && !balanceInfo.loading && (
                      <div className="flex items-center gap-2">
                        {balanceInfo.error ? (
                          <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            ❌ Ошибка
                          </span>
                        ) : balanceInfo.balance ? (
                          <div className={`flex flex-col gap-1 px-3 py-1.5 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                              </svg>
                              <span className="font-bold text-lg">{balanceInfo.balance}</span>
                              <span className="text-sm font-medium">TON</span>
                            </div>
                            {tonUsdRate !== null && (
                              <div className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-1`}>
                                <span>≈</span>
                                <span className="font-semibold">
                                  ${(parseFloat(balanceInfo.balance) * tonUsdRate).toFixed(2)}
                                </span>
                                <span className="opacity-75">USD</span>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })()}

      {/* Отображение данных игровых событий */}
      {eventsData && filteredEventsData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
              <h2 className="text-2xl font-bold text-white">Game Events Statistics</h2>
            </div>
            {/* Time filter buttons */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: '1D' },
                { key: '7', label: '1W' },
                { key: '30', label: '1M' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEventsTimeFilter(key as 'all' | '7' | '30')}
                  className={eventsTimeFilter === key ? 'neu-btn-filter-active' : 'neu-btn-filter'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Overall Activity Chart */}
            {filteredEventsData.totalByDay && filteredEventsData.totalByDay.length > 0 && (
              <div className="neu-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="neu-inset p-2">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Overall Player Activity</h3>
                </div>
                
                <div className="h-80">
                  <Line
                    data={{
                      labels: filteredEventsData.totalByDay.map(day => day.date),
                      datasets: [{
                        label: eventsTimeFilter === 'all' ? 'Всего событий за день' : eventsTimeFilter === '7' ? 'Всего событий за неделю' : 'Всего событий за месяц',
                        data: filteredEventsData.totalByDay.map(day => day.count),
                        borderColor: isDark ? '#a855f7' : '#9333ea',
                        backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.05)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: isDark ? '#a855f7' : '#9333ea',
                        pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          titleColor: isDark ? '#ffffff' : '#000000',
                          bodyColor: isDark ? '#ffffff' : '#000000',
                          borderColor: isDark ? '#4b5563' : '#e5e7eb',
                          borderWidth: 1,
                          cornerRadius: 8,
                          displayColors: false,
                          callbacks: {
                            title: function(context) {
                              return `📅 ${context[0].label}`;
                            },
                            label: function(context) {
                              return `⚡ ${context.parsed.y} событий`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: isDark ? '#374151' : '#f3f4f6',
                            drawBorder: false
                          },
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                          }
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: isDark ? '#374151' : '#f3f4f6',
                            drawBorder: false
                          },
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 12
                            },
                            callback: function(value) {
                              return Number(value).toLocaleString('ru-RU');
                            }
                          }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* All Events Correlation Chart */}
            {filteredCorrelationData && filteredCorrelationData.dates.length > 0 && (
              <div className="neu-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="neu-inset p-2">
                      <TrendingUp className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>All Events Correlation</h3>
                      <p className="text-sm text-gray-400">Select events to compare on one chart</p>
                    </div>
                  </div>

                  {/* Time Filter Buttons and Clear All */}
                  <div className="flex gap-2 items-center">
                    {[
                      { key: 'all', label: '1D' },
                      { key: '7', label: '1W' },
                      { key: '30', label: '1M' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setCorrelationTimeFilter(key as 'all' | '7' | '30')}
                        className={correlationTimeFilter === key ? 'neu-btn-filter-active' : 'neu-btn-filter'}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedEvents(new Set())}
                      className="neu-btn-filter"
                      title="Clear all selections"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                          </div>
                          
                {/* Event Checkboxes */}
                {(() => {
                  // Исключаем ненужные события
                  const excludedEvents = ['starter_pack_granted', 'person_created', 'pool_member_bonus', 'pool_owner_commission'];
                  
                  const availableEvents = Object.keys(filteredCorrelationData.events)
                    .filter(eventName => !excludedEvents.includes(eventName))
                    .slice(0, 20);
                  
                  // Создаем мапу для быстрого доступа к индексу события
                  const eventIndexMap = new Map(availableEvents.map((eventName, index) => [eventName, index]));
                  
                  return (
                    <div className="mb-6 p-4 neu-inset rounded-lg">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-48 overflow-y-auto">
                        {availableEvents.map((eventName) => {
                          let eventInfo = eventNamesMap[eventName];
                          if (!eventInfo) {
                            // Используем индекс события в availableEvents для определения цвета
                            const eventIndex = eventIndexMap.get(eventName) || 0;
                            const color = defaultColors[eventIndex % defaultColors.length];
                            eventInfo = { title: eventName.replace(/_/g, ' '), icon: 'zap', color };
                          }
                          const isSelected = selectedEvents.has(eventName);
                          
                          return (
                            <label
                              key={eventName}
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedEvents);
                                  if (e.target.checked) {
                                    newSelected.add(eventName);
                                  } else {
                                    newSelected.delete(eventName);
                                  }
                                  setSelectedEvents(newSelected);
                                }}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 focus:ring-2"
                                style={{ accentColor: eventInfo.color }}
                              />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: eventInfo.color }} />
                                <span className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{eventInfo.title}</span>
                        </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                
                <div className="h-96">
                  <Line
                    data={{
                      labels: filteredCorrelationData.dates,
                      datasets: selectedEvents.size > 0 ? (() => {
                        // Исключаем ненужные события
                        const excludedEvents = ['starter_pack_granted', 'person_created', 'pool_member_bonus', 'pool_owner_commission'];
                        
                        // Получаем доступные события в том же порядке, что и в чекбоксах
                        const availableEvents = Object.keys(filteredCorrelationData.events)
                          .filter(eventName => !excludedEvents.includes(eventName))
                          .slice(0, 20);
                        
                        // Создаем мапу для быстрого доступа к индексу события
                        const eventIndexMap = new Map(availableEvents.map((eventName, index) => [eventName, index]));
                        
                        return Array.from(selectedEvents)
                          .filter(eventName => !excludedEvents.includes(eventName))
                          .map((eventName) => {
                            const eventData = filteredCorrelationData.events[eventName] || [];
                            
                            // Используем единый объект eventNamesMap для синхронизации цветов
                            let eventInfo = eventNamesMap[eventName];
                            if (!eventInfo) {
                              // Используем индекс события в availableEvents для определения цвета (как в чекбоксах)
                              const eventIndex = eventIndexMap.get(eventName) || 0;
                              const color = defaultColors[eventIndex % defaultColors.length];
                              eventInfo = { title: eventName.replace(/_/g, ' '), icon: 'zap', color };
                            }
                            
                            // Создаем массив данных, соответствующий всем датам
                            const dataMap = new Map(eventData.map(d => [d.date, d.count]));
                            const data = filteredCorrelationData.dates.map(date => dataMap.get(date) || 0);
                            
                            return {
                              label: eventInfo.title,
                              data,
                              borderColor: eventInfo.color,
                              backgroundColor: 'transparent',
                              borderWidth: 2,
                              fill: false,
                              tension: 0.3,
                              pointRadius: 2,
                              pointHoverRadius: 5,
                            };
                          });
                        })() : []
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              color: '#9ca3af',
                              font: { size: 10 },
                              boxWidth: 12,
                              padding: 8,
                              usePointStyle: true,
                            }
                          },
                          tooltip: {
                            backgroundColor: '#1f2937',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#374151',
                            borderWidth: 1,
                            cornerRadius: 8,
                            mode: 'index',
                            intersect: false,
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: '#374151', drawBorder: false },
                            ticks: { color: '#9ca3af', font: { size: 10 }, maxRotation: 45, minRotation: 45 }
                          },
                          y: {
                            beginAtZero: true,
                            grid: { color: '#374151', drawBorder: false },
                            ticks: { color: '#9ca3af', font: { size: 11 } }
                          }
                        },
                        interaction: { intersect: false, mode: 'index' }
                      }}
                    />
                </div>
              </div>
            )}
            
            {/* Category Navigation */}
            {filteredEventsData.events && Object.keys(filteredEventsData.events).length > 0 && (
              <div className="neu-card p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="neu-inset p-3">
                    <Search className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Quick Navigation</h3>
                    <p className="text-sm text-gray-400">Select category to view statistics</p>
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { name: 'Mining Events', icon: 'mining', color: '#f97316' },
                    { name: 'Purchases', icon: 'cart', color: '#3b82f6' },
                    { name: 'Daily Activities', icon: 'calendar', color: '#ec4899' },
                    { name: 'Referrals', icon: 'users', color: '#22c55e' },
                    { name: 'Transactions', icon: 'swap', color: '#0ea5e9' },
                    { name: 'Tasks', icon: 'target', color: '#8b5cf6' },
                    { name: 'Social', icon: 'phone', color: '#06b6d4' },
                    { name: 'Registrations', icon: 'check', color: '#14b8a6' },
                    { name: 'ASIC Tasks', icon: 'monitor', color: '#3b82f6' },
                    { name: 'Property Tasks', icon: 'building', color: '#10b981' },
                    { name: 'Achievements', icon: 'trophy', color: '#f59e0b' },
                  ].map((category) => (
                    <button
                      key={category.name}
                      onClick={() => scrollToCategory(category.name)}
                      className="neu-btn text-left"
                    >
                      <EventIcon name={category.icon} className="w-4 h-4" color={category.color} />
                      <span className="flex-1 text-xs text-gray-300">{category.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
            
            {/* Карточки по типам событий */}
            {filteredEventsData.events && Object.keys(filteredEventsData.events).length > 0 && (
              <div className="space-y-8">
                {(() => {
                  // Event names with icon keys
                  const eventNames: { [key: string]: { title: string; icon: string; color: string } } = {
                    'mining_started': { title: 'Mining Started', icon: 'mining', color: '#f97316' },
                    'mining_claimed': { title: 'Mining Claimed', icon: 'coins', color: '#10b981' },
                    'equipment_purchase': { title: 'Equipment Purchase', icon: 'cart', color: '#3b82f6' },
                    'checkin_reward': { title: 'Daily Check-in', icon: 'calendar', color: '#ec4899' },
                    'referral_bonus_referrer': { title: 'Referral Bonus', icon: 'dollar', color: '#22c55e' },
                    'swap_btc_to_ecos': { title: 'Swap BTC to XP', icon: 'swap', color: '#0ea5e9' },
                    'daily_all_done_reward': { title: 'All Tasks Done', icon: 'target', color: '#8b5cf6' },
                    'check_tma_reward': { title: 'TMA Check', icon: 'check', color: '#14b8a6' },
                    'follow_game_channel_reward': { title: 'Channel Follow', icon: 'megaphone', color: '#3b82f6' },
                    'app_ecos_register_tma_reward': { title: 'TMA Registration', icon: 'phone', color: '#06b6d4' },
                    'confirm_telegram_premium_reward': { title: 'Telegram Premium', icon: 'star', color: '#f59e0b' },
                    'swap_btc_0_03_to_ecos_reward': { title: 'Swap 0.03 BTC', icon: 'exchange', color: '#0ea5e9' },
                    'buy_100_asics_in_the_game_reward': { title: 'Own 100 ASIC', icon: 'monitor', color: '#3b82f6' },
                    'buy_200_asics_in_the_game_reward': { title: 'Own 200 ASIC', icon: 'laptop', color: '#06b6d4' },
                    'buy_400_asics_in_the_game_reward': { title: 'Own 400 ASIC', icon: 'monitor', color: '#8b5cf6' },
                    'buy_600_asics_in_the_game_reward': { title: 'Own 600 ASIC', icon: 'laptop', color: '#8b5cf6' },
                    'buy_asics_in_the_game_reward': { title: 'Buy ASIC Task', icon: 'zap', color: '#f59e0b' },
                    'buy_datacenter_in_the_game_reward': { title: 'Buy Datacenter', icon: 'building', color: '#10b981' },
                    'buy_energy_station_in_the_game_reward': { title: 'Buy Energy Station', icon: 'zap', color: '#eab308' },
                    'buy_land_in_the_game_reward': { title: 'Buy Land', icon: 'mountain', color: '#10b981' },
                    'check_telegram_wallet_reward': { title: 'Connect TON Wallet', icon: 'wallet', color: '#0ea5e9' },
                    'checkin_7_days_reward': { title: '7 Days Check-in', icon: 'calendar', color: '#22c55e' },
                    'checkin_15_days_reward': { title: '15 Days Check-in', icon: 'calendar-days', color: '#16a34a' },
                    'balance_turnover_1000000_reward': { title: 'Balance 1M+', icon: 'diamond', color: '#a855f7' },
                    'combo_reward': { title: 'Combo Complete', icon: 'gamepad', color: '#f59e0b' },
                    'complete_70_tasks_reward': { title: '70 Tasks Done', icon: 'medal', color: '#f97316' },
                    'complete_80_tasks_reward': { title: '80 Tasks Done', icon: 'medal', color: '#fb923c' },
                    'complete_90_tasks_reward': { title: '90 Tasks Done', icon: 'trophy', color: '#f97316' },
                    'like_game_post_reward': { title: 'Like Game Post', icon: 'thumb', color: '#3b82f6' },
                    'like_telegram_post_reward': { title: 'Like Telegram Post', icon: 'heart', color: '#0ea5e9' },
                    'poke_reward': { title: 'Poke Reward', icon: 'pointer', color: '#ec4899' },
                    'referral_claim_reward': { title: 'Referral Claim', icon: 'party', color: '#22c55e' },
                    'site_visit_reward': { title: 'Site Visit', icon: 'globe', color: '#8b5cf6' },
                    'telegram_channel_follow_reward': { title: 'Telegram Follow', icon: 'phone', color: '#06b6d4' },
                    'swap_btc_0_05_to_ecos_reward': { title: 'Swap 0.05 BTC', icon: 'coins', color: '#0ea5e9' },
                    'reach_100000_ths_reward': { title: 'Reach 100K TH/s', icon: 'zap', color: '#f59e0b' },
                    'plan_completed_reward': { title: 'Plan Complete', icon: 'check', color: '#22c55e' },
                    'bonus_reward': { title: 'Bonus Reward', icon: 'gift', color: '#ec4899' },
                    'referral_bonus_referee': { title: 'Referee Bonus', icon: 'users', color: '#14b8a6' },
                  };
                  
                  // Event categories with icon keys
                  const eventCategories: { [key: string]: { icon: string; events: string[] } } = {
                    'Mining Events': { icon: 'mining', events: ['mining_started', 'mining_claimed'] },
                    'Purchases': { icon: 'cart', events: ['equipment_purchase'] },
                    'Daily Activities': { icon: 'calendar', events: ['checkin_reward', 'checkin_7_days_reward', 'checkin_15_days_reward', 'combo_reward', 'poke_reward'] },
                    'Referrals': { icon: 'users', events: ['referral_bonus_referrer', 'referral_claim_reward', 'referral_bonus_referee'] },
                    'Transactions': { icon: 'swap', events: ['swap_btc_to_ecos', 'swap_btc_0_03_to_ecos_reward', 'swap_btc_0_05_to_ecos_reward'] },
                    'Tasks': { icon: 'target', events: ['daily_all_done_reward', 'complete_70_tasks_reward', 'complete_80_tasks_reward', 'complete_90_tasks_reward', 'plan_completed_reward'] },
                    'Social': { icon: 'phone', events: ['follow_game_channel_reward', 'telegram_channel_follow_reward', 'like_game_post_reward', 'like_telegram_post_reward', 'site_visit_reward'] },
                    'Registrations': { icon: 'check', events: ['app_ecos_register_tma_reward', 'confirm_telegram_premium_reward', 'check_telegram_wallet_reward', 'check_tma_reward'] },
                    'ASIC Tasks': { icon: 'monitor', events: ['buy_asics_in_the_game_reward', 'buy_100_asics_in_the_game_reward', 'buy_200_asics_in_the_game_reward', 'buy_400_asics_in_the_game_reward', 'buy_600_asics_in_the_game_reward'] },
                    'Property Tasks': { icon: 'building', events: ['buy_datacenter_in_the_game_reward', 'buy_energy_station_in_the_game_reward', 'buy_land_in_the_game_reward'] },
                    'Achievements': { icon: 'trophy', events: ['reach_100000_ths_reward', 'balance_turnover_1000000_reward'] },
                    'Bonuses': { icon: 'gift', events: ['bonus_reward'] },
                  };
                  
                  // События, которые не нужно отображать
                  const excludedEvents = ['person_created', 'starter_pack_granted', 'bonus_reward', 'referral_bonus_referee'];
                  
                  // Функция для рендеринга карточки события
                  const renderEventCard = (eventName: string, eventData: any) => {
                    const totalCount = eventData.reduce((sum: number, day: any) => sum + day.count, 0);
                    const lastDayCount = eventData.length > 0 ? eventData[eventData.length - 1].count : 0;
                  const eventInfo = eventNames[eventName] || { title: eventName, icon: 'zap', color: '#6b7280' };
                  
                  return (
                    <div key={eventName} className="neu-card p-6 min-h-[280px] flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="neu-inset p-2">
                            <EventIcon name={eventInfo.icon} className="w-5 h-5" color={eventInfo.color} />
                          </div>
                          <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} leading-tight`}>{eventInfo.title}</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-5 flex-1 flex flex-col">
                        <div className="mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold" style={{ color: eventInfo.color }}>{totalCount}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">всего</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            Сегодня: <span className="font-semibold" style={{ color: eventInfo.color }}>{lastDayCount}</span>
                          </div>
                        </div>
                        
                        {/* Мини-график */}
                        <div 
                          className="h-24 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedEventModal({ eventName, eventData, eventInfo })}
                          title="Нажмите для увеличения графика"
                        >
                          <Line
                            data={{
                              labels: eventData.map(d => d.date),
                              datasets: [{
                                data: eventData.map(d => d.count),
                                borderColor: eventInfo.color,
                                backgroundColor: `${eventInfo.color}20`,
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 0,
                                pointHoverRadius: 4,
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  backgroundColor: isDark ? '#374151' : '#ffffff',
                                  titleColor: isDark ? '#ffffff' : '#000000',
                                  bodyColor: isDark ? '#ffffff' : '#000000',
                                  borderColor: isDark ? '#4b5563' : '#e5e7eb',
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  displayColors: false,
                                  callbacks: {
                                    title: function(context) {
                                      return context[0].label;
                                    },
                                    label: function(context) {
                                      return `${context.parsed.y} событий`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: { display: false },
                                y: { display: false, beginAtZero: true }
                              },
                              interaction: {
                                intersect: false,
                                mode: 'index'
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                  };
                  
                  // Render categories with events
                  return (
                    <>
                      {Object.entries(eventCategories).map(([categoryName, categoryData]) => {
                        // Filter events: only those that exist in data and not excluded
                        const categoryEvents = categoryData.events
                          .filter(eventName => 
                            filteredEventsData.events[eventName] && 
                            !excludedEvents.includes(eventName)
                          );
                        
                        // If no events in category - don't show it
                        if (categoryEvents.length === 0) return null;
                        
                        return (
                          <div 
                            key={categoryName} 
                            className="space-y-4"
                            ref={(el) => (categoryRefs.current[categoryName] = el)}
                          >
                            {/* Category header */}
                            <div className="flex items-center gap-3 border-b border-gray-700 pb-3">
                              <EventIcon name={categoryData.icon} className="w-6 h-6 text-orange-500" />
                              <h3 className="text-xl font-bold text-white">{categoryName}</h3>
                            </div>
                            
                            {/* Event cards in category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {categoryEvents.map(eventName => 
                                renderEventCard(eventName, filteredEventsData.events[eventName])
                              )}
                              
                              {/* Special comparison block for mining events */}
                              {categoryName === 'Mining Events' && 
                               filteredEventsData.events['mining_started'] && 
                               filteredEventsData.events['mining_claimed'] && (
                                <div className="neu-card p-6 min-h-[280px] flex flex-col">
                                  <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                      <div className="neu-inset p-2">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                      </div>
                                      <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} leading-tight`}>Ratio: Start → Claim</h4>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-5 flex-1 flex flex-col">
                                    {/* Процентное соотношение */}
                                    <div className="mb-2">
                                      {(() => {
                                        const totalStarted = filteredEventsData.events['mining_started'].reduce((sum: number, day: any) => sum + day.count, 0);
                                        const totalClaimed = filteredEventsData.events['mining_claimed'].reduce((sum: number, day: any) => sum + day.count, 0);
                                        const claimRate = totalStarted > 0 ? ((totalClaimed / totalStarted) * 100).toFixed(1) : '0';
                                        
                                        return (
                                          <>
                                            <div className="flex items-baseline gap-2 mb-3">
                                              <span className="text-3xl font-bold text-emerald-600">{claimRate}%</span>
                                              <span className="text-sm text-gray-500 dark:text-gray-400">собрано от запущенного</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                              <div className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Запущено</div>
                                                <div className="text-lg font-bold text-orange-600">{totalStarted}</div>
                                              </div>
                                              <div className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Собрано</div>
                                                <div className="text-lg font-bold text-emerald-600">{totalClaimed}</div>
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    
                                    {/* График сравнения */}
                                    <div 
                                      className="h-24 flex-1 cursor-pointer hover:opacity-80 transition-opacity" 
                                      title="Нажмите для увеличения"
                                      onClick={() => setComparisonModalOpen(true)}
                                    >
                                      <Line
                                        data={{
                                          labels: filteredEventsData.events['mining_started'].map((d: any) => d.date),
                                          datasets: [
                                            {
                                              label: 'Запущено',
                                              data: filteredEventsData.events['mining_started'].map((d: any) => d.count),
                                              borderColor: '#f97316',
                                              backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                              borderWidth: 2,
                                              fill: false,
                                              tension: 0.4,
                                              pointRadius: 0,
                                              pointHoverRadius: 4,
                                            },
                                            {
                                              label: 'Собрано',
                                              data: filteredEventsData.events['mining_claimed'].map((d: any) => d.count),
                                              borderColor: '#10b981',
                                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                              borderWidth: 2,
                                              fill: false,
                                              tension: 0.4,
                                              pointRadius: 0,
                                              pointHoverRadius: 4,
                                            }
                                          ]
                                        }}
                                        options={{
                                          responsive: true,
                                          maintainAspectRatio: false,
                                          plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                              backgroundColor: isDark ? '#374151' : '#ffffff',
                                              titleColor: isDark ? '#ffffff' : '#000000',
                                              bodyColor: isDark ? '#ffffff' : '#000000',
                                              borderColor: isDark ? '#4b5563' : '#e5e7eb',
                                              borderWidth: 1,
                                              cornerRadius: 8,
                                              displayColors: true,
                                            }
                                          },
                                          scales: {
                                            x: { display: false },
                                            y: { display: false, beginAtZero: true }
                                          },
                                          interaction: {
                                            intersect: false,
                                            mode: 'index'
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                      </div>
                    </div>
                  );
                })}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Отображение данных рефералов */}
      {referralsData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👥 Статистика рефералов</h2>
          </div>

          <div className="space-y-6">
            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Общее количество приглашений */}
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-700/50' : 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-pink-300' : 'text-pink-600'} mb-1`}>Всего приглашений</p>
                    <p className="text-4xl font-bold text-pink-600 dark:text-pink-400">{referralsData.totalInvites}</p>
                  </div>
                  <div className="p-4 rounded-full bg-pink-500/20">
                    <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Общий заработок XP */}
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gradient-to-br from-orange-900/30 to-yellow-900/30 border border-orange-700/50' : 'bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'} mb-1`}>Всего выплачено XP</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{(referralsData.totalInvites * 20000).toLocaleString('ru-RU')}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>20 000 XP за реферала</p>
                  </div>
                  <div className="p-4 rounded-full bg-orange-500/20">
                    <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Invitations chart by day */}
            {referralsData.byDay && referralsData.byDay.length > 0 && (
              <div className="neu-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="neu-inset p-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Daily Invitations</h3>
                </div>
                <div className="h-80">
                  <Line
                    data={{
                      labels: referralsData.byDay.map(d => d.date),
                      datasets: [{
                        label: 'Приглашения',
                        data: referralsData.byDay.map(d => d.count),
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ec4899',
                        pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          titleColor: isDark ? '#ffffff' : '#000000',
                          bodyColor: isDark ? '#ffffff' : '#000000',
                          borderColor: isDark ? '#4b5563' : '#e5e7eb',
                          borderWidth: 1,
                          cornerRadius: 8,
                          displayColors: false,
                          callbacks: {
                            title: function(context) {
                              return `📅 ${context[0].label}`;
                            },
                            label: function(context) {
                              return `👥 ${context.parsed.y} приглашений`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: isDark ? '#374151' : '#f3f4f6',
                            drawBorder: false
                          },
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                          }
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: isDark ? '#374151' : '#f3f4f6',
                            drawBorder: false
                          },
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 12
                            },
                            callback: function(value) {
                              return Number(value).toLocaleString('ru-RU');
                            }
                          }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Топ рефереров */}
            {referralsData.topReferrers && referralsData.topReferrers.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Топ-20 рефереров</h3>
                </div>
                <div className="space-y-3">
                  {referralsData.topReferrers.map((referrer, index) => {
                    const earnedXP = referrer.count * 20000;
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg transition-all ${
                          isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-600 text-white' :
                              isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              {referrer.username}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">приглашений:</span>
                            <span className="font-bold text-pink-600 dark:text-pink-400 text-lg">{referrer.count}</span>
                          </div>
                        </div>
                        <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <button
                            onClick={() => {
                              console.log('🎯 Нажата кнопка для пользователя:', referrer.username);
                              console.log('🎯 Тип:', typeof referrer.username);
                              console.log('🎯 Объект referrer:', referrer);
                              loadActivityOverview(referrer.username);
                            }}
                            disabled={activityLoading === referrer.username}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                              activityLoading === referrer.username
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                            }`}
                          >
                            {activityLoading === referrer.username ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Загрузка...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Обзор активности</span>
                              </>
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Заработано:</span>
                            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">{earnedXP.toLocaleString('ru-RU')} XP</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно обзора активности рефералов */}
      {activityOverview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-12 pb-32 overflow-y-auto"
          onClick={() => setActivityOverview(null)}
        >
          <div 
            className={`max-w-6xl w-full rounded-xl shadow-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="neu-inset p-2">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Activity Overview: {activityOverview.referrer_name}
                </h3>
              </div>
              <button
                onClick={() => setActivityOverview(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Статистика в карточках */}
            {(() => {
              const activationRate = parseFloat(activityOverview.activation_rate);
              const avgDays = parseFloat(activityOverview.avg_active_days);
              
              // Определяем качество
              let qualityIcon = '';
              let qualityText = '';
              let qualityDescription = '';
              let qualityColor = '';
              
              if (activationRate >= 90 && avgDays >= 3) {
                qualityIcon = '🌟';
                qualityText = 'Отличное качество';
                qualityDescription = 'Высокая активация (≥90%) и хорошее удержание (≥3 дней). Приглашаются реальные активные пользователи.';
                qualityColor = 'bg-green-500';
              } else if (activationRate >= 70 && avgDays >= 2) {
                qualityIcon = '✅';
                qualityText = 'Хорошее качество';
                qualityDescription = 'Хорошая активация (≥70%) и удовлетворительное удержание (≥2 дней). Рефералы проявляют интерес к игре.';
                qualityColor = 'bg-blue-500';
              } else if (activationRate >= 50) {
                qualityIcon = '⚠️';
                qualityText = 'Среднее качество';
                qualityDescription = 'Активация ≥50%, но многие пользователи быстро уходят.';
                qualityColor = 'bg-yellow-500';
              } else if (avgDays < 1.5 && activationRate === 100) {
                qualityIcon = '🤖';
                qualityText = 'Подозрение на ботов';
                qualityDescription = '100% активация, но средняя активность <1.5 дней. Похоже на схему: регистрация → получение бонуса → уход. Возможно использование ботов или фейковых аккаунтов.';
                qualityColor = 'bg-red-500';
              } else {
                qualityIcon = '❌';
                qualityText = 'Низкое качество';
                qualityDescription = 'Низкая активация (<50%). Большинство приглашенных не начинают играть или быстро уходят.';
                qualityColor = 'bg-red-500';
              }
              
              return (
                <>
                  {/* Карточка с оценкой качества */}
                  <div className={`${qualityColor} text-white p-6 rounded-xl shadow-lg mb-6`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{qualityIcon}</span>
                      <h4 className="text-2xl font-bold">{qualityText}</h4>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">{qualityDescription}</p>
                  </div>
                  
                  {/* Главные метрики */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Всего приглашений</div>
                      <div className="text-4xl font-bold text-pink-600 dark:text-pink-400">
                        {activityOverview.total_invited}
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Средняя активность</div>
                      <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                        {parseFloat(activityOverview.avg_activity_per_referral).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">действий на реферала</div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Средние активные дни</div>
                      <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                        {parseFloat(activityOverview.avg_active_days).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">дней активности</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Удален блок "Активные майнеры" */}
      
      {/* Модальное окно с детальным графиком */}
      {selectedEventModal && filteredModalData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-12 pb-32 overflow-y-auto"
          onClick={() => { setSelectedEventModal(null); setModalTimeFilter('all'); }}
        >
          <div 
            className={`max-w-4xl w-full rounded-xl shadow-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEventModal.eventInfo.icon}</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedEventModal.eventInfo.title}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedEventModal(null); setModalTimeFilter('all'); }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2 mb-6">
              {[
                { key: 'all', label: '1D' },
                { key: '7', label: '1W' },
                { key: '30', label: '1M' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setModalTimeFilter(key as 'all' | '7' | '30')}
                  className={modalTimeFilter === key ? 'neu-btn-filter-active' : 'neu-btn-filter'}
                >
                  {label}
                </button>
              ))}
            </div>
            
            {/* Статистика */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {modalTimeFilter === 'all' ? 'Всего' : modalTimeFilter === '7' ? 'Всего за период' : 'Всего за период'}
                </div>
                <div className="text-3xl font-bold" style={{ color: selectedEventModal.eventInfo.color }}>
                  {filteredModalData.reduce((sum, day) => sum + day.count, 0)}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {modalTimeFilter === 'all' ? 'Последний день' : modalTimeFilter === '7' ? 'Последняя неделя' : 'Последний месяц'}
                </div>
                <div className="text-3xl font-bold" style={{ color: selectedEventModal.eventInfo.color }}>
                  {filteredModalData.length > 0 ? filteredModalData[filteredModalData.length - 1].count : 0}
                </div>
              </div>
            </div>
            
            {/* Большой график */}
            <div className="h-96">
              <Line
                data={{
                  labels: filteredModalData.map(d => d.date),
                  datasets: [{
                    label: selectedEventModal.eventInfo.title,
                    data: filteredModalData.map(d => d.count),
                    borderColor: selectedEventModal.eventInfo.color,
                    backgroundColor: `${selectedEventModal.eventInfo.color}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: selectedEventModal.eventInfo.color,
                    pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      titleColor: isDark ? '#ffffff' : '#000000',
                      bodyColor: isDark ? '#ffffff' : '#000000',
                      borderColor: isDark ? '#4b5563' : '#e5e7eb',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: false,
                      callbacks: {
                        title: function(context) {
                          return `📅 ${context[0].label}`;
                        },
                        label: function(context) {
                          return `⚡ ${context.parsed.y} событий`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: isDark ? '#374151' : '#f3f4f6',
                        drawBorder: false
                      },
                      ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        font: {
                          size: 12
                        }
                      }
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: isDark ? '#374151' : '#f3f4f6',
                        drawBorder: false
                      },
                      ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        font: {
                          size: 12
                        },
                        callback: function(value) {
                          return Number(value).toLocaleString('ru-RU');
                        }
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Отображение данных Funnel */}
      {funnelData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">Users by Level</h2>
          </div>

          <div className="space-y-6">
            {/* Общая статистика */}
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Всего пользователей</div>
              <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">
                {funnelData.total_users?.toLocaleString('ru-RU') || 0}
              </div>
            </div>

            {/* Статистика по уровням */}
            {funnelData.level_stats && funnelData.level_stats.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Распределение пользователей по уровням</h3>
                <div className="space-y-4">
                  {funnelData.level_stats
                    .sort((a, b) => a.level - b.level)
                    .map((levelStat) => {
                      const percentage = parseFloat(levelStat.percentage);
                      const maxPercentage = Math.max(...funnelData.level_stats.map(l => parseFloat(l.percentage)));
                      
                      return (
                        <div
                          key={levelStat.level}
                          onClick={() => loadLevelUsers(levelStat.level)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                            isDark ? 'bg-gray-700/50 border-gray-600 hover:border-cyan-500' : 'bg-gray-50 border-gray-200 hover:border-cyan-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                                levelStat.level === 0 
                                  ? 'bg-gray-500 text-white'
                                  : levelStat.level <= 3
                                  ? 'bg-blue-500 text-white'
                                  : levelStat.level <= 6
                                  ? 'bg-purple-500 text-white'
                                  : levelStat.level <= 8
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}>
                                {levelStat.level}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Уровень {levelStat.level}</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {levelStat.users_per_level.toLocaleString('ru-RU')} пользователей
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                {levelStat.percentage}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Прогресс-бар */}
                          <div className={`h-4 rounded-full overflow-hidden ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            <div
                              className={`h-full transition-all ${
                                levelStat.level === 0 
                                  ? 'bg-gray-500'
                                  : levelStat.level <= 3
                                  ? 'bg-blue-500'
                                  : levelStat.level <= 6
                                  ? 'bg-purple-500'
                                  : levelStat.level <= 8
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(percentage / maxPercentage) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* График распределения */}
            {funnelData.level_stats && funnelData.level_stats.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Визуализация распределения</h3>
                <div className="h-80">
                  <Line
                    data={{
                      labels: funnelData.level_stats
                        .sort((a, b) => a.level - b.level)
                        .map(stat => `Уровень ${stat.level}`),
                      datasets: [{
                        label: 'Пользователей',
                        data: funnelData.level_stats
                          .sort((a, b) => a.level - b.level)
                          .map(stat => stat.users_per_level),
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          titleColor: isDark ? '#ffffff' : '#000000',
                          bodyColor: isDark ? '#ffffff' : '#000000',
                          borderColor: isDark ? '#4b5563' : '#e5e7eb',
                          borderWidth: 1,
                          cornerRadius: 8,
                          displayColors: false,
                          callbacks: {
                            title: function(context) {
                              return context[0].label;
                            },
                            label: function(context) {
                              const level = funnelData.level_stats
                                .sort((a, b) => a.level - b.level)
                                [context.dataIndex];
                              return `${context.parsed.y} пользователей (${level.percentage}%)`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: {
                            color: isDark ? '#374151' : '#f3f4f6',
                            drawBorder: false
                          },
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 12
                            },
                            maxRotation: 45,
                            minRotation: 45
                          }
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: isDark ? '#374151' : '#f3f4f6',
                            drawBorder: false
                          },
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 12
                            },
                            callback: function(value) {
                              return Number(value).toLocaleString('ru-RU');
                            }
                          }
                        }
                      },
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Отображение таблицы лидеров */}
      {leadersData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Таблица лидеров</h2>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="mb-4">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Всего лидеров: <span className="font-semibold">{leadersData.total}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Место
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Username
                    </th>
                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      ASIC
                    </th>
                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Th/s
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leadersData.leaderboard.map((user, index) => {
                    const formatTh = (th: number) => {
                      if (th >= 1000000000) {
                        return `${(th / 1000000000).toFixed(2)} Eh`;
                      }
                      return `${th.toLocaleString('ru-RU')} Th`;
                    };

                    return (
                      <tr
                        key={user.user_id || index}
                        className={`border-b transition-colors ${
                          isDark 
                            ? 'border-gray-700 hover:bg-gray-700/50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            user.rank === 1
                              ? 'bg-yellow-500 text-white'
                              : user.rank === 2
                              ? 'bg-gray-400 text-white'
                              : user.rank === 3
                              ? 'bg-orange-600 text-white'
                              : isDark
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {user.rank}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url && (
                              <img 
                                src={user.avatar_url} 
                                alt={user.username}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {user.asic_count.toLocaleString('ru-RU')}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          {formatTh(user.th)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Отображение топ-3 пулов */}
      {poolsData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🏊 Лидерборд пулов</h2>
          </div>

          <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="mb-4">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Всего пулов: <span className="font-semibold">{poolsData.pools.length}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Место
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Название
                    </th>
                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Hashrate
                    </th>
                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Комиссия
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Уровень
                    </th>
                    <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bonus
                    </th>
                    <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Создан
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {poolsData.pools.map((pool, index) => {
                    const formatHashrate = (hashrate: string) => {
                      const num = parseFloat(hashrate);
                      if (num >= 1000000000) {
                        return `${(num / 1000000000).toFixed(2)} Eh/s`;
                      } else if (num >= 1000000) {
                        return `${(num / 1000000).toFixed(2)} Ph/s`;
                      } else if (num >= 1000) {
                        return `${(num / 1000).toFixed(2)} Th/s`;
                      }
                      return `${num.toFixed(2)} Gh/s`;
                    };

                    const formatDate = (dateString: string) => {
                      if (!dateString) return 'N/A';
                      try {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch {
                        return dateString;
                      }
                    };

                    const getMedalColor = (index: number) => {
                      if (index === 0) return 'bg-yellow-500 text-white';
                      if (index === 1) return 'bg-gray-400 text-white';
                      if (index === 2) return 'bg-orange-600 text-white';
                      return isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600';
                    };

                    return (
                      <tr
                        key={pool.id}
                        className={`border-b transition-colors ${
                          isDark 
                            ? 'border-gray-700 hover:bg-gray-700/50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getMedalColor(index)}`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                              {pool.name}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              ID: {pool.id}
                            </div>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} whitespace-nowrap`}>
                          {formatHashrate(pool.total_hashrate)}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {pool.commission}%
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {pool.lvl} / 5
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {(() => {
                            const bonusMap: { [key: number]: number } = {
                              1: 5,
                              2: 10,
                              3: 15,
                              4: 20,
                              5: 25
                            };
                            const level = pool.lvl || 1;
                            return `${bonusMap[level] || 0}%`;
                          })()}
                        </td>
                        <td className={`py-3 px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(pool.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Отображение KPI данных */}
      {kpiLoading && (
        <div className="mb-6">
          <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>Загрузка KPI данных...</p>
            </div>
          </div>
        </div>
      )}
      {kpiData && (
        <div className="mb-6 pb-20">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Users KPI - Статистика по уровням</h2>
          </div>

          {/* Общая статистика */}
          <div className={`p-6 rounded-xl shadow-lg mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Всего пользователей</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {numberFormat(kpiData.total_users)}
                </p>
              </div>
            </div>
          </div>

          {/* Карточки уровней */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 11 }, (_, i) => i).map((level) => {
              const levelStat = kpiData.level_stats.find(s => s.level === level) || {
                level,
                users_per_level: 0,
                percentage: '0.00'
              };
              const isSelected = selectedKpiLevel === level;
                const getLevelColor = (level: number) => {
                  if (level === 0) return isDark ? 'bg-gray-600' : 'bg-gray-200';
                  if (level <= 3) return isDark ? 'bg-blue-600' : 'bg-blue-200';
                  if (level <= 6) return isDark ? 'bg-purple-600' : 'bg-purple-200';
                  return isDark ? 'bg-yellow-600' : 'bg-yellow-200';
                };

                const getLevelTextColor = (level: number) => {
                  if (level === 0) return isDark ? 'text-gray-300' : 'text-gray-700';
                  if (level <= 3) return isDark ? 'text-blue-300' : 'text-blue-700';
                  if (level <= 6) return isDark ? 'text-purple-300' : 'text-purple-700';
                  return isDark ? 'text-yellow-300' : 'text-yellow-700';
                };

                return (
                  <div
                    key={level}
                    onClick={() => {
                      setSelectedKpiLevel(isSelected ? null : level);
                      // Скрываем ASIC KPI и Ref KPI данные при переключении на другой уровень
                      setAsicKpiData(null);
                      setRefKpiData(null);
                      setRef3KpiData(null);
                      // Очищаем выбранных пользователей
                      setSelectedAsicKpiUsers(new Set());
                      setSelectedRefKpiUsers(new Set());
                      setSelectedRef3KpiUsers(new Set());
                    }}
                    className={`p-4 rounded-xl shadow-lg cursor-pointer transition-all hover:shadow-xl border-2 ${
                      isSelected
                        ? isDark
                          ? 'bg-purple-900 border-purple-500'
                          : 'bg-purple-50 border-purple-500'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getLevelColor(level)} ${getLevelTextColor(level)}`}>
                        {level}
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {numberFormat(levelStat.users_per_level)}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {levelStat.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className={`h-2 rounded-full transition-all ${getLevelColor(level)}`}
                          style={{
                            width: `${Math.min(parseFloat(levelStat.percentage), 100)}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isSelected ? 'Нажмите, чтобы свернуть' : 'Нажмите для деталей'}
                      </p>
                    </div>
                  </div>
                );
            })}
          </div>

          {/* Детальная информация выбранного уровня */}
          {selectedKpiLevel !== null && (
            <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Уровень {selectedKpiLevel} - Детальная информация
                </h3>
                <button
                  onClick={() => {
                    setSelectedKpiLevel(null);
                    // Скрываем ASIC KPI и Ref KPI данные при закрытии детального окна
                    setAsicKpiData(null);
                    setRefKpiData(null);
                    setRef3KpiData(null);
                    // Очищаем выбранных пользователей
                    setSelectedAsicKpiUsers(new Set());
                    setSelectedRefKpiUsers(new Set());
                    setSelectedRef3KpiUsers(new Set());
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                >
                  Свернуть
                </button>
              </div>
              {(() => {
                const levelStat = kpiData.level_stats.find(s => s.level === selectedKpiLevel);
                if (!levelStat) return null;
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Пользователей на уровне</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {numberFormat(levelStat.users_per_level)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Процент от общего</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {levelStat.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          loadAsicKpiData(selectedKpiLevel);
                        }}
                        disabled={asicKpiLoading}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          asicKpiLoading
                            ? 'bg-gray-500 cursor-not-allowed text-white'
                            : isDark
                            ? 'bg-purple-700 hover:bg-purple-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {asicKpiLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Загрузка...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>KPI 1 ASIC till level up</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          loadRefKpiData(selectedKpiLevel);
                        }}
                        disabled={refKpiLoading}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          refKpiLoading
                            ? 'bg-gray-500 cursor-not-allowed text-white'
                            : isDark
                            ? 'bg-blue-700 hover:bg-blue-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {refKpiLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Загрузка...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>KPI 1 ref</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          loadRef3KpiData(selectedKpiLevel);
                        }}
                        disabled={ref3KpiLoading}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                          ref3KpiLoading
                            ? 'bg-gray-500 cursor-not-allowed text-white'
                            : isDark
                            ? 'bg-green-700 hover:bg-green-600 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {ref3KpiLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Загрузка...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>KPI 3 ref</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* ASIC KPI Results */}
                    {asicKpiData && asicKpiData.length > 0 && (() => {
                      const handleAsicUserSelect = (personId: number, e?: React.MouseEvent) => {
                        if (e) {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                        setSelectedAsicKpiUsers(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(personId)) {
                            newSet.delete(personId);
                          } else {
                            newSet.add(personId);
                          }
                          return newSet;
                        });
                      };

                      const handleAsicSelectAll = () => {
                        if (selectedAsicKpiUsers.size === asicKpiData.length) {
                          setSelectedAsicKpiUsers(new Set());
                        } else {
                          setSelectedAsicKpiUsers(new Set(asicKpiData.map(u => u.person_id)));
                        }
                      };

                      const handleOpenAsicPushModal = () => {
                        if (selectedAsicKpiUsers.size === 0) {
                          alert('Пожалуйста, выберите хотя бы одного пользователя');
                          return;
                        }
                        setPushMessage('');
                        setPushModalSource('asic');
                        setPushModalOpen(true);
                      };

                      return (
                        <div className={`mt-6 p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Пользователи, которым не хватает 1 ASIC для перехода на следующий уровень
                            </h3>
                            <div className="flex items-center gap-2">
                              {selectedAsicKpiUsers.size > 0 && (
                                <button
                                  onClick={handleOpenAsicPushModal}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDark
                                      ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  Отправить пуш ({selectedAsicKpiUsers.size})
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setAsicKpiData(null);
                                  setSelectedAsicKpiUsers(new Set());
                                }}
                                className={`px-3 py-1 rounded text-sm ${
                                  isDark 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="mb-3 flex items-center gap-2">
                            <button
                              onClick={handleAsicSelectAll}
                              className={`text-sm px-3 py-1 rounded ${
                                isDark
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              {selectedAsicKpiUsers.size === asicKpiData.length ? 'Снять все' : 'Выбрать все'}
                            </button>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Выбрано: {selectedAsicKpiUsers.size} из {asicKpiData.length}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} w-12`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAsicKpiUsers.size === asicKpiData.length && asicKpiData.length > 0}
                                      onChange={handleAsicSelectAll}
                                      className="cursor-pointer"
                                    />
                                  </th>
                                  <th className={`text-left py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                                  <th className={`text-left py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Пользователь</th>
                                  <th className={`text-center py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Уровень</th>
                                  <th className={`text-center py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ASIC</th>
                                  <th className={`text-center py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Нужно для след. уровня</th>
                                  <th className={`text-center py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Не хватает</th>
                                  <th className={`text-center py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Прогресс</th>
                                </tr>
                              </thead>
                              <tbody>
                                {asicKpiData.map((user, idx) => (
                                  <tr 
                                    key={user.person_id || idx} 
                                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}
                                  >
                                    <td 
                                      className="py-2 px-2 text-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAsicUserSelect(user.person_id, e);
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedAsicKpiUsers.has(user.person_id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleAsicUserSelect(user.person_id, e);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="cursor-pointer w-4 h-4"
                                      />
                                    </td>
                                    <td className={`py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {user.person_id}
                                    </td>
                                  <td className={`py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <div className="flex items-center gap-2">
                                      {user.tg_photo_url && (
                                        <img 
                                          src={user.tg_photo_url} 
                                          alt={user.username || user.first_name}
                                          className="w-6 h-6 rounded-full"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium">{user.first_name} {user.last_name || ''}</div>
                                        {user.username && (
                                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            @{user.username}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className={`py-2 px-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      user.current_level === 0
                                        ? isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                        : user.current_level <= 3
                                        ? isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                                        : user.current_level <= 6
                                        ? isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'
                                        : isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {user.current_level}
                                    </span>
                                  </td>
                                  <td className={`py-2 px-3 text-center font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    {user.total_asics || 0}
                                  </td>
                                  <td className={`py-2 px-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {user.required_asics_for_next_level || '—'}
                                  </td>
                                  <td className={`py-2 px-3 text-center font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                    {user.missing_asics || 0}
                                  </td>
                                  <td className={`py-2 px-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${
                                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                                      }`}>
                                        <div 
                                          className={`h-full ${
                                            user.progress_percent >= 100
                                              ? 'bg-green-500'
                                              : user.progress_percent >= 75
                                              ? 'bg-yellow-500'
                                              : 'bg-orange-500'
                                          }`}
                                          style={{ width: `${Math.min(user.progress_percent || 0, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-medium min-w-[3rem]">
                                        {user.progress_percent ? user.progress_percent.toFixed(1) : '0'}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      );
                    })()}
                    
                    {/* Ref KPI Results */}
                    {refKpiData && refKpiData.length > 0 && (() => {
                      const formatDate = (dateString: string) => {
                        if (!dateString) return 'N/A';
                        try {
                          const date = new Date(dateString);
                          return date.toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (e) {
                          return 'N/A';
                        }
                      };

                      const handleUserSelect = (personId: number, e?: React.MouseEvent) => {
                        if (e) {
                          e.stopPropagation(); // Предотвращаем открытие деталей пользователя
                          e.preventDefault();
                        }
                        setSelectedRefKpiUsers(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(personId)) {
                            newSet.delete(personId);
                          } else {
                            newSet.add(personId);
                          }
                          return newSet;
                        });
                      };

                      const handleSelectAll = () => {
                        if (selectedRefKpiUsers.size === refKpiData.length) {
                          setSelectedRefKpiUsers(new Set());
                        } else {
                          setSelectedRefKpiUsers(new Set(refKpiData.map(u => u.person_id)));
                        }
                      };

                      const handleOpenPushModal = () => {
                        if (selectedRefKpiUsers.size === 0) {
                          alert('Пожалуйста, выберите хотя бы одного пользователя');
                          return;
                        }
                        setPushMessage(''); // Сброс сообщения при открытии
                        setPushModalSource('ref1');
                        setPushModalOpen(true);
                      };

                      return (
                        <div className={`mt-6 p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Пользователи на уровне {selectedKpiLevel}, которые еще никого не пригласили
                            </h3>
                            <div className="flex items-center gap-2">
                              {selectedRefKpiUsers.size > 0 && (
                                <button
                                  onClick={handleOpenPushModal}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDark
                                      ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  Отправить пуш ({selectedRefKpiUsers.size})
                                </button>
                              )}
                              <button
                                onClick={() => setRefKpiData(null)}
                                className={`px-3 py-1 rounded text-sm ${
                                  isDark 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                Скрыть
                              </button>
                            </div>
                          </div>
                          <div className="mb-3 flex items-center gap-2">
                            <button
                              onClick={handleSelectAll}
                              className={`text-sm px-3 py-1 rounded ${
                                isDark
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              {selectedRefKpiUsers.size === refKpiData.length ? 'Снять все' : 'Выбрать все'}
                            </button>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Выбрано: {selectedRefKpiUsers.size} из {refKpiData.length}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} w-12`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedRefKpiUsers.size === refKpiData.length && refKpiData.length > 0}
                                      onChange={handleSelectAll}
                                      className="cursor-pointer"
                                    />
                                  </th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Аватар</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[200px]`}>Имя</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[120px]`}>TG ID</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Уровень</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Th</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ASIC</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Рефералов</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Дата регистрации</th>
                                </tr>
                              </thead>
                              <tbody>
                                {refKpiData.map((user) => (
                                  <tr 
                                    key={user.person_id} 
                                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                                  >
                                    <td 
                                      className="py-2 px-2 text-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUserSelect(user.person_id);
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedRefKpiUsers.has(user.person_id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleUserSelect(user.person_id);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="cursor-pointer w-4 h-4"
                                      />
                                    </td>
                                    <td 
                                      className={`py-2 px-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.person_id}
                                    </td>
                                    <td 
                                      className="py-2 px-2 cursor-pointer"
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.tg_photo_url ? (
                                        <img 
                                          src={user.tg_photo_url} 
                                          alt={user.username || user.first_name}
                                          className="w-8 h-8 rounded-full"
                                          loading="lazy"
                                          onError={(e) => {
                                            // Просто скрываем изображение при ошибке, чтобы не было бесконечных попыток загрузки
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            // Предотвращаем повторные вызовы onError
                                            target.onerror = null;
                                          }}
                                        />
                                      ) : (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {user.first_name?.[0]?.toUpperCase() || '?'}
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[200px] cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium truncate">{user.first_name} {user.last_name}</span>
                                        {user.username && (
                                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} truncate`}>@{user.username}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td 
                                      className={`py-2 px-2 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-[120px] truncate cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.tg_id || '—'}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        user.current_level === 0
                                          ? isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                          : user.current_level <= 3
                                          ? isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                                          : user.current_level <= 6
                                          ? isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'
                                          : isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {user.current_level}
                                      </span>
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {numberFormat(parseFloat(user.effective_ths || '0'))}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.total_asics || 0}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-red-400' : 'text-red-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.total_referrals || 0}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.person_created_at ? formatDate(user.person_created_at) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Ref 3 KPI Results */}
                    {ref3KpiData && ref3KpiData.length > 0 && (() => {
                      const formatDate = (dateString: string) => {
                        if (!dateString) return 'N/A';
                        try {
                          const date = new Date(dateString);
                          return date.toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (e) {
                          return 'N/A';
                        }
                      };

                      const handleRef3UserSelect = (personId: number, e?: React.MouseEvent) => {
                        if (e) {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                        setSelectedRef3KpiUsers(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(personId)) {
                            newSet.delete(personId);
                          } else {
                            newSet.add(personId);
                          }
                          return newSet;
                        });
                      };

                      const handleRef3SelectAll = () => {
                        if (selectedRef3KpiUsers.size === ref3KpiData.length) {
                          setSelectedRef3KpiUsers(new Set());
                        } else {
                          setSelectedRef3KpiUsers(new Set(ref3KpiData.map(u => u.person_id)));
                        }
                      };

                      const handleOpenRef3PushModal = () => {
                        if (selectedRef3KpiUsers.size === 0) {
                          alert('Пожалуйста, выберите хотя бы одного пользователя');
                          return;
                        }
                        setPushMessage('');
                        setPushModalSource('ref3');
                        setPushModalOpen(true);
                      };

                      return (
                        <div className={`mt-6 p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Пользователи на уровне {selectedKpiLevel}, которые пригласили ровно 2 реферала
                            </h3>
                            <div className="flex items-center gap-2">
                              {selectedRef3KpiUsers.size > 0 && (
                                <button
                                  onClick={handleOpenRef3PushModal}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isDark
                                      ? 'bg-blue-700 hover:bg-blue-600 text-white'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  Отправить пуш ({selectedRef3KpiUsers.size})
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setRef3KpiData(null);
                                  setSelectedRef3KpiUsers(new Set());
                                }}
                                className={`px-3 py-1 rounded text-sm ${
                                  isDark 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                Скрыть
                              </button>
                            </div>
                          </div>
                          <div className="mb-3 flex items-center gap-2">
                            <button
                              onClick={handleRef3SelectAll}
                              className={`text-sm px-3 py-1 rounded ${
                                isDark
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              {selectedRef3KpiUsers.size === ref3KpiData.length ? 'Снять все' : 'Выбрать все'}
                            </button>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Выбрано: {selectedRef3KpiUsers.size} из {ref3KpiData.length}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} w-12`}>
                                    <input
                                      type="checkbox"
                                      checked={selectedRef3KpiUsers.size === ref3KpiData.length && ref3KpiData.length > 0}
                                      onChange={handleRef3SelectAll}
                                      className="cursor-pointer"
                                    />
                                  </th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Аватар</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[200px]`}>Имя</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[120px]`}>TG ID</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Уровень</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Th</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ASIC</th>
                                  <th className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Рефералов</th>
                                  <th className={`py-2 px-2 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Дата регистрации</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ref3KpiData.map((user) => (
                                  <tr 
                                    key={user.person_id} 
                                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                                  >
                                    <td 
                                      className="py-2 px-2 text-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRef3UserSelect(user.person_id, e);
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedRef3KpiUsers.has(user.person_id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleRef3UserSelect(user.person_id, e);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="cursor-pointer w-4 h-4"
                                      />
                                    </td>
                                    <td 
                                      className={`py-2 px-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.person_id}
                                    </td>
                                    <td 
                                      className="py-2 px-2 cursor-pointer"
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.tg_photo_url ? (
                                        <img 
                                          src={user.tg_photo_url} 
                                          alt={user.username || user.first_name}
                                          className="w-8 h-8 rounded-full"
                                          loading="lazy"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.onerror = null;
                                          }}
                                        />
                                      ) : (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {user.first_name?.[0]?.toUpperCase() || '?'}
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} max-w-[200px] cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium truncate">{user.first_name} {user.last_name}</span>
                                        {user.username && (
                                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} truncate`}>@{user.username}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td 
                                      className={`py-2 px-2 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-[120px] truncate cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.tg_id || '—'}
                                    </td>
                                    <td 
                                      className="py-2 px-2 text-center cursor-pointer"
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        user.current_level === 0
                                          ? isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                          : user.current_level <= 3
                                          ? isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                                          : user.current_level <= 6
                                          ? isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'
                                          : isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {user.current_level}
                                      </span>
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {numberFormat(parseFloat(user.effective_ths || '0'))}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.total_asics || 0}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-green-400' : 'text-green-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.total_referrals || 0}
                                    </td>
                                    <td 
                                      className={`py-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} cursor-pointer`}
                                      onClick={() => loadUserDetails(user.person_id)}
                                    >
                                      {user.person_created_at ? formatDate(user.person_created_at) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Отображение данных всех пользователей */}
      {allUsersData && (
          <div className="mb-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👥 All Users Info</h2>
            </div>

            {/* Общая статистика */}
            <div className={`p-6 rounded-xl shadow-lg mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Всего пользователей</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {numberFormat(allUsersData.total)}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Показано после фильтров</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {numberFormat(filteredAndSortedUsers.length)}
                  </p>
                </div>
              </div>
            </div>

            {/* Фильтры */}
            <div className={`p-6 rounded-xl shadow-lg mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Фильтры</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Поиск */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Поиск
                  </label>
                  <input
                    type="text"
                    value={allUsersFilters.search}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Username, ID, TG ID, Wallet, Имя..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                {/* ECOS Premium фильтр */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ECOS Premium
                  </label>
                  <select
                    value={allUsersFilters.ecosPremium}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, ecosPremium: e.target.value as any }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  >
                    <option value="all">Все</option>
                    <option value="premium">Premium</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                {/* TG Premium фильтр */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    TG Premium
                  </label>
                  <select
                    value={allUsersFilters.tgPremium}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, tgPremium: e.target.value as any }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  >
                    <option value="all">Все</option>
                    <option value="premium">Premium</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                {/* Onboarding фильтр */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Onboarding
                  </label>
                  <select
                    value={allUsersFilters.onboarding}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, onboarding: e.target.value as any }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  >
                    <option value="all">Все</option>
                    <option value="done">Done</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Язык фильтр */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Язык
                  </label>
                  <select
                    value={allUsersFilters.language}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, language: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  >
                    <option value="all">Все</option>
                    {uniqueLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Level фильтр */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Level
                  </label>
                  <select
                    value={allUsersFilters.level}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, level: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  >
                    <option value="all">Все</option>
                    {uniqueLevels.map(level => (
                      <option key={level} value={String(level)}>Level {level}</option>
                    ))}
                  </select>
                </div>

                {/* Минимальный ASIC */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ASIC от
                  </label>
                  <input
                    type="number"
                    value={allUsersFilters.minAsic}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, minAsic: e.target.value }))}
                    placeholder="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                {/* Максимальный ASIC */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ASIC до
                  </label>
                  <input
                    type="number"
                    value={allUsersFilters.maxAsic}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, maxAsic: e.target.value }))}
                    placeholder="∞"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                {/* Минимальный Th */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Th от
                  </label>
                  <input
                    type="number"
                    value={allUsersFilters.minTh}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, minTh: e.target.value }))}
                    placeholder="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                {/* Максимальный Th */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Th до
                  </label>
                  <input
                    type="number"
                    value={allUsersFilters.maxTh}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, maxTh: e.target.value }))}
                    placeholder="∞"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                {/* Дата регистрации от */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Дата регистрации от
                  </label>
                  <input
                    type="date"
                    value={allUsersFilters.dateFrom}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                {/* Дата регистрации до */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Дата регистрации до
                  </label>
                  <input
                    type="date"
                    value={allUsersFilters.dateTo}
                    onChange={(e) => setAllUsersFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>
              </div>

              {/* Кнопка сброса фильтров */}
              <button
                onClick={() => setAllUsersFilters({
                  search: '',
                  ecosPremium: 'all',
                  tgPremium: 'all',
                  onboarding: 'all',
                  language: 'all',
                  level: 'all',
                  minAsic: '',
                  maxAsic: '',
                  minTh: '',
                  maxTh: '',
                  dateFrom: '',
                  dateTo: ''
                })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Сбросить фильтры
              </button>
            </div>

            {/* Таблица пользователей */}
            <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                      <th 
                        className={`text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('person_id')}
                      >
                        <div className="flex items-center gap-1">
                          ID {getSortIcon('person_id')}
                        </div>
                      </th>
                      <th 
                        className={`text-left py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('tg_id')}
                      >
                        <div className="flex items-center gap-1">
                          TG ID {getSortIcon('tg_id')}
                        </div>
                      </th>
                      <th 
                        className={`text-left py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('username')}
                      >
                        <div className="flex items-center gap-1">
                          Username {getSortIcon('username')}
                        </div>
                      </th>
                      <th 
                        className={`text-left py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('first_name')}
                      >
                        <div className="flex items-center gap-1">
                          Имя {getSortIcon('first_name')}
                        </div>
                      </th>
                      <th className={`text-left py-2.5 px-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Wallet
                      </th>
                      <th 
                        className={`text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('total_asics')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          ASIC {getSortIcon('total_asics')}
                        </div>
                      </th>
                      <th 
                        className={`text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('total_th')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Th {getSortIcon('total_th')}
                        </div>
                      </th>
                      <th 
                        className={`text-center py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('level')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Level {getSortIcon('level')}
                        </div>
                      </th>
                      <th 
                        className={`text-center py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('is_ecos_premium')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          ECOS Premium {getSortIcon('is_ecos_premium')}
                        </div>
                      </th>
                      <th 
                        className={`text-center py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('tg_premium')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          TG Premium {getSortIcon('tg_premium')}
                        </div>
                      </th>
                      <th 
                        className={`text-center py-2.5 px-2 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('onbording_done')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Onboarding {getSortIcon('onbording_done')}
                        </div>
                      </th>
                      <th className={`text-center py-2.5 px-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Язык
                      </th>
                      <th 
                        className={`text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        onClick={() => handleSort('person_created_at')}
                      >
                        <div className="flex items-center gap-1">
                          Регистрация {getSortIcon('person_created_at')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedUsers.map((user, index) => {
                    const formatDate = (dateString: string) => {
                      if (!dateString) return 'N/A';
                      try {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch {
                        return dateString;
                      }
                    };

                    return (
                      <tr
                        key={user.person_id}
                        onClick={() => {
                          console.log('🖱️ Клик по пользователю:', {
                            person_id: user.person_id,
                            username: user.username,
                            index: index
                          });
                          loadUserDetails(user.person_id);
                        }}
                        className={`border-b transition-all duration-150 cursor-pointer ${
                          isDark 
                            ? 'border-gray-700/50 hover:bg-gray-700/30' 
                            : 'border-gray-100 hover:bg-gray-50'
                        } ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-50/30') : ''}`}
                      >
                        <td className={`py-2 px-3 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.person_id}
                        </td>
                        <td className={`py-2 px-2 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.tg_id || 'N/A'}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            {user.photo_url && (
                              <img 
                                src={user.photo_url} 
                                alt={user.username}
                                className="w-5 h-5 rounded-full flex-shrink-0"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"%3E%3C/svg%3E';
                                }}
                                loading="lazy"
                              />
                            )}
                            <span className={`text-sm font-medium truncate max-w-[120px] ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                              {user.username || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className={`py-2 px-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="truncate max-w-[140px]" title={`${user.first_name} ${user.last_name}`}>
                            {user.first_name} {user.last_name}
                          </div>
                        </td>
                        <td className={`py-2 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="truncate max-w-[100px] text-xs font-mono" title={user.wallet_address || 'N/A'}>
                            {user.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : 'N/A'}
                          </div>
                        </td>
                        <td className={`py-2 px-3 text-right text-sm font-semibold tabular-nums ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          {numberFormat(user.total_asics || 0)}
                        </td>
                        <td className={`py-2 px-3 text-right text-sm font-semibold tabular-nums ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          {numberFormat(user.total_th || 0)} <span className="text-xs opacity-70">Th</span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          {user.level !== null ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              user.level === 0 
                                ? isDark ? 'bg-gray-700/50 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                : user.level <= 3
                                ? isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                : user.level <= 6
                                ? isDark ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                : user.level <= 8
                                ? isDark ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-800 border border-orange-200'
                                : isDark ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {user.level}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {user.is_ecos_premium ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                              ✓
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {user.tg_premium ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                              ✓
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {user.onbording_done ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                              ✓
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                              ⚠
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            user.person_language === 'ru' || user.tg_language === 'ru'
                              ? isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'
                              : isDark ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {(user.person_language || user.tg_language || 'N/A').toUpperCase()}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                          {formatDate(user.person_created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с пользователями уровня */}
      {levelUsersModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-12 pb-32 overflow-y-auto"
          onClick={() => setLevelUsersModal(null)}
        >
          <div 
            className={`max-w-4xl w-full rounded-xl shadow-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                  levelUsersModal.level === 0 
                    ? 'bg-gray-500 text-white'
                    : levelUsersModal.level <= 3
                    ? 'bg-blue-500 text-white'
                    : levelUsersModal.level <= 6
                    ? 'bg-purple-500 text-white'
                    : levelUsersModal.level <= 8
                    ? 'bg-orange-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {levelUsersModal.level}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Пользователи уровня {levelUsersModal.level}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Всего: {levelUsersModal.users.length} пользователей
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLevelUsersModal(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Фильтры */}
            <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <h4 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Фильтры</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Фильтр по ASIC */}
                <div className="w-full min-w-0">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ASIC (мин - макс)
                  </label>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      placeholder="Мин"
                      value={levelUsersFilters.minASIC}
                      onChange={(e) => setLevelUsersFilters({ ...levelUsersFilters, minASIC: e.target.value })}
                      className={`w-full min-w-0 px-3 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500'
                      } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
                    />
                    <span className={`flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
                    <input
                      type="number"
                      placeholder="Макс"
                      value={levelUsersFilters.maxASIC}
                      onChange={(e) => setLevelUsersFilters({ ...levelUsersFilters, maxASIC: e.target.value })}
                      className={`w-full min-w-0 px-3 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500'
                      } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
                    />
                  </div>
                </div>
                {/* Фильтр по Th */}
                <div className="w-full min-w-0">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Th/s (мин - макс)
                  </label>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      placeholder="Мин"
                      value={levelUsersFilters.minTh}
                      onChange={(e) => setLevelUsersFilters({ ...levelUsersFilters, minTh: e.target.value })}
                      className={`w-full min-w-0 px-3 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500'
                      } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
                    />
                    <span className={`flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
                    <input
                      type="number"
                      placeholder="Макс"
                      value={levelUsersFilters.maxTh}
                      onChange={(e) => setLevelUsersFilters({ ...levelUsersFilters, maxTh: e.target.value })}
                      className={`w-full min-w-0 px-3 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500'
                      } focus:outline-none focus:ring-2 focus:ring-cyan-500/20`}
                    />
                  </div>
                </div>
              </div>
              {/* Кнопка сброса фильтров */}
              {(levelUsersFilters.minASIC || levelUsersFilters.maxASIC || levelUsersFilters.minTh || levelUsersFilters.maxTh) && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setLevelUsersFilters({ minASIC: '', maxASIC: '', minTh: '', maxTh: '' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
            </div>

            {/* Список пользователей */}
            {levelUsersLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Загрузка пользователей...</p>
              </div>
            ) : levelUsersModal.users.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  На этом уровне пока нет пользователей
                </p>
              </div>
            ) : (() => {
              // Применяем фильтры к списку пользователей
              const filteredUsers = levelUsersModal.users
                .filter((user) => {
                  // Дополнительная проверка: убеждаемся, что пользователь действительно на нужном уровне
                  const userLevel = getUserLevel(user.th || 0);
                  if (userLevel === null || userLevel !== levelUsersModal.level) {
                    return false;
                  }
                  
                  // Фильтр по ASIC
                  const asicCount = user.asic_count || 0;
                  const minASIC = levelUsersFilters.minASIC ? parseInt(levelUsersFilters.minASIC) : null;
                  const maxASIC = levelUsersFilters.maxASIC ? parseInt(levelUsersFilters.maxASIC) : null;
                  
                  if (minASIC !== null && asicCount < minASIC) {
                    return false;
                  }
                  if (maxASIC !== null && asicCount > maxASIC) {
                    return false;
                  }
                  
                  // Фильтр по Th
                  const th = user.th || 0;
                  const minTh = levelUsersFilters.minTh ? parseInt(levelUsersFilters.minTh) : null;
                  const maxTh = levelUsersFilters.maxTh ? parseInt(levelUsersFilters.maxTh) : null;
                  
                  if (minTh !== null && th < minTh) {
                    return false;
                  }
                  if (maxTh !== null && th > maxTh) {
                    return false;
                  }
                  
                  return true;
                });
              
              return (
                <>
                  {/* Информация о количестве отфильтрованных пользователей */}
                  <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {filteredUsers.length === levelUsersModal.users.length ? (
                        <>Показано: <span className="font-semibold">{filteredUsers.length}</span> из {levelUsersModal.users.length} пользователей</>
                      ) : (
                        <>Показано: <span className="font-semibold">{filteredUsers.length}</span> из {levelUsersModal.users.length} пользователей (применены фильтры)</>
                      )}
                    </p>
                  </div>
                  
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Нет пользователей, соответствующих выбранным фильтрам
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Место
                            </th>
                            <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Username
                            </th>
                            <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              ASIC
                            </th>
                            <th className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Th/s
                            </th>
                            <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Прогресс
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, index) => {
                      const thresholds = getLevelThresholds(levelUsersModal.level);
                      const currentTh = user.th || 0;
                      const progress = Math.min(100, ((currentTh - thresholds.current) / (thresholds.next - thresholds.current)) * 100);
                      const progressPercent = Math.max(0, progress);
                      
                      // Форматируем большие числа
                      const formatTh = (th: number) => {
                        if (th >= 1000000000) {
                          return `${(th / 1000000000).toFixed(2)} Eh`;
                        }
                        return `${th.toLocaleString('ru-RU')} Th`;
                      };
                      
                      return (
                        <tr
                          key={user.user_id || index}
                          className={`border-b transition-colors ${
                            isDark 
                              ? 'border-gray-700 hover:bg-gray-700/50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              user.rank === 1
                                ? 'bg-yellow-500 text-white'
                                : user.rank === 2
                                ? 'bg-gray-400 text-white'
                                : user.rank === 3
                                ? 'bg-orange-600 text-white'
                                : isDark
                                ? 'bg-gray-600 text-gray-300'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {user.rank}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {user.avatar_url && (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                {user.username}
                              </span>
                            </div>
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.asic_count.toLocaleString('ru-RU')}
                          </td>
                          <td className={`text-right py-3 px-4 font-semibold text-cyan-600 dark:text-cyan-400`}>
                            {user.th.toLocaleString('ru-RU')} Th/s
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {formatTh(currentTh)} из {formatTh(thresholds.next)}
                                </span>
                                <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {progressPercent.toFixed(1)}%
                                </span>
                              </div>
                              <div className={`h-2 rounded-full overflow-hidden ${
                                isDark ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                <div
                                  className="h-full transition-all bg-gradient-to-r from-cyan-500 to-blue-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Модальное окно с деталями пользователя */}
      {userDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-12 pb-32 overflow-y-auto"
          onClick={() => {
            setUserDetails(null);
            setUserTransactions(null);
            setTransactionFilters({
              type: 'all',
              dateFrom: '',
              dateTo: '',
              amountMin: '',
              amountMax: '',
              direction: 'all'
            });
            setOrderFilters({
              type: 'all',
              status: 'all',
              dateFrom: '',
              dateTo: '',
              pointsMin: '',
              pointsMax: '',
              tonMin: '',
              tonMax: ''
            });
          }}
        >
          <div 
            className={`max-w-6xl w-full rounded-xl shadow-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👤</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Детали пользователя
                  </h3>
                  {userDetails.user && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userDetails.user.username || userDetails.user.first_name || `ID: ${userDetails.user.person_id}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setUserDetails(null);
                  setUserTransactions(null);
                  setTransactionFilters({
                    type: 'all',
                    dateFrom: '',
                    dateTo: '',
                    amountMin: '',
                    amountMax: '',
                    direction: 'all'
                  });
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Контент модального окна */}
            {userDetails.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : userDetails.user ? (
              <div className="space-y-6">
                {/* Основная информация */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Основная информация</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Person ID</p>
                      <p className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{userDetails.user.person_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">TG ID</p>
                      <p className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{userDetails.user.tg_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Username</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{userDetails.user.username || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Имя</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{userDetails.user.first_name || 'N/A'} {userDetails.user.last_name || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Level</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{userDetails.user.level !== null ? userDetails.user.level : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ASIC</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userDetails.user.total_asics || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Th</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userDetails.user.total_th || 0)} Th</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effective Th/s</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userDetails.user.effective_ths || 0)} Th/s</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                        {userDetails.user.progress_cached ? `${(userDetails.user.progress_cached * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Баланс */}
                {userDetails.user.total_balance !== undefined && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Баланс</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Общий баланс</p>
                        <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          {numberFormat(userDetails.user.total_balance || 0)}
                        </p>
                      </div>
                      {userDetails.user.balance_by_asset && Object.keys(userDetails.user.balance_by_asset).map((assetId) => {
                        const assetNameRaw = userDetails.user.assets_metadata?.[assetId]?.name || `Asset ${assetId}`;
                        const assetName = assetNameRaw === 'ECOScoin' ? 'XP' : assetNameRaw;
                        const balance = userDetails.user.balance_by_asset[assetId];
                        return (
                          <div key={assetId}>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{assetName}</p>
                            <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(balance || 0)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* История баланса */}
                {userDetails.user.balance_history && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">История баланса</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Net</p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userDetails.user.balance_history.net || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total In</p>
                        <p className={`${isDark ? 'text-green-400' : 'text-green-600'}`}>{numberFormat(userDetails.user.balance_history.total_in || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Out</p>
                        <p className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>{numberFormat(userDetails.user.balance_history.total_out || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Майнинг */}
                {userDetails.user.mining_summary && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Майнинг</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Сессий</p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{userDetails.user.mining_summary.sessions_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Энергия (kWh)</p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userDetails.user.mining_summary.total_energy_kwh || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effective Th/s</p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userDetails.user.mining_summary.total_effective_ths || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated BTC</p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{userDetails.user.mining_summary.total_estimated_btc || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Рефералы */}
                {userDetails.user.total_referrals !== undefined && (() => {
                  // Получаем информацию о рефералах из allUsersData
                  const refereesList = (() => {
                    if (!userDetails.user.referees || !Array.isArray(userDetails.user.referees) || userDetails.user.referees.length === 0) {
                      return [];
                    }
                    
                    if (!allUsersData || !allUsersData.users) {
                      return userDetails.user.referees.map((ref: any) => ({
                        referee_id: ref.referee_id,
                        joined_at: ref.joined_at,
                        username: null,
                        first_name: null,
                        last_name: null,
                        level: null,
                        total_asics: null,
                        total_th: null
                      }));
                    }
                    
                    // Ищем информацию о каждом реферале в allUsersData
                    return userDetails.user.referees.map((ref: any) => {
                      const refereeInfo = allUsersData.users.find((u: any) => u.person_id === ref.referee_id);
                      return {
                        referee_id: ref.referee_id,
                        joined_at: ref.joined_at,
                        username: refereeInfo?.username || null,
                        first_name: refereeInfo?.first_name || null,
                        last_name: refereeInfo?.last_name || null,
                        level: refereeInfo?.level !== undefined ? refereeInfo.level : null,
                        total_asics: refereeInfo?.total_asics || null,
                        total_th: refereeInfo?.total_th || null,
                        photo_url: refereeInfo?.photo_url || null
                      };
                    });
                  })();
                  
                  return (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Рефералы ({userDetails.user.total_referrals || 0})
                      </h4>
                      
                      {refereesList.length > 0 ? (
                        <div className="space-y-3">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                  <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    ID
                                  </th>
                                  <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Пользователь
                                  </th>
                                  <th className={`text-center py-2 px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Level
                                  </th>
                                  <th className={`text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    ASIC
                                  </th>
                                  <th className={`text-right py-2 px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Th
                                  </th>
                                  <th className={`text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Дата регистрации
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {refereesList.map((referee: any, index: number) => (
                                  <tr 
                                    key={referee.referee_id || index}
                                    className={`border-b transition-colors ${
                                      isDark 
                                        ? 'border-gray-700/50 hover:bg-gray-700/30' 
                                        : 'border-gray-100 hover:bg-gray-50'
                                    } ${index % 2 === 0 ? (isDark ? 'bg-gray-800/30' : 'bg-gray-50/30') : ''}`}
                                  >
                                    <td className={`py-2 px-3 text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {referee.referee_id}
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        {referee.photo_url && (
                                          <img 
                                            src={referee.photo_url} 
                                            alt={referee.username || 'User'}
                                            className="w-6 h-6 rounded-full flex-shrink-0"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement;
                                              img.style.display = 'none';
                                            }}
                                            loading="lazy"
                                          />
                                        )}
                                        <div className="min-w-0">
                                          <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                            {referee.username || 'Unknown'}
                                          </p>
                                          {(referee.first_name || referee.last_name) && (
                                            <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                              {referee.first_name} {referee.last_name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      {referee.level !== null ? (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                          referee.level === 0 
                                            ? isDark ? 'bg-gray-700/50 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                            : referee.level <= 3
                                            ? isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : referee.level <= 6
                                            ? isDark ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                            : referee.level <= 8
                                            ? isDark ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-800 border border-orange-200'
                                            : isDark ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-200'
                                        }`}>
                                          {referee.level}
                                        </span>
                                      ) : (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                          —
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-2 px-3 text-right text-sm font-semibold tabular-nums ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                      {referee.total_asics !== null ? numberFormat(referee.total_asics) : '—'}
                                    </td>
                                    <td className={`py-2 px-3 text-right text-sm font-semibold tabular-nums ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                      {referee.total_th !== null ? `${numberFormat(referee.total_th)} Th` : '—'}
                                    </td>
                                    <td className={`py-2 px-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {referee.joined_at 
                                        ? new Date(referee.joined_at).toLocaleDateString('ru-RU', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Нет приглашенных пользователей
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Заказы */}
                {userTransactions && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Заказы
                      {userTransactions.loading && <span className="ml-2 text-sm text-gray-500">(загрузка...)</span>}
                    </h4>
                    {userTransactions.loading ? (
                      <div className="text-center py-4">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Загрузка данных о заказах...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Всего заказов</p>
                            <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{userTransactions.total_orders || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Потрачено Points</p>
                            <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userTransactions.total_points_spent || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Потрачено TON</p>
                            <p className={isDark ? 'text-gray-300' : 'text-gray-900'}>{numberFormat(userTransactions.total_ton_spent || 0)}</p>
                          </div>
                        </div>
                        {/* Фильтры заказов */}
                        {userTransactions.orders && userTransactions.orders.length > 0 && (
                          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'}`}>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Фильтры заказов:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Фильтр по типу */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Тип
                                </label>
                                <select
                                  value={orderFilters.type}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, type: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="all">Все типы</option>
                                  <option value="asic">ASIC</option>
                                  <option value="energy">Energy</option>
                                  <option value="land">Land</option>
                                  <option value="energystation">Energy Station</option>
                                  <option value="datacenter">Data Center</option>
                                </select>
                              </div>

                              {/* Фильтр по статусу */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Статус
                                </label>
                                <select
                                  value={orderFilters.status}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="all">Все статусы</option>
                                  <option value="completed">Завершенные</option>
                                  <option value="pending">Ожидающие</option>
                                  <option value="cancelled">Отмененные</option>
                                  <option value="failed">Неудачные</option>
                                </select>
                              </div>

                              {/* Фильтр по дате от */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Дата от
                                </label>
                                <input
                                  type="date"
                                  value={orderFilters.dateFrom}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, dateFrom: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по дате до */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Дата до
                                </label>
                                <input
                                  type="date"
                                  value={orderFilters.dateTo}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, dateTo: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Кнопка сброса фильтров */}
                              <div className="flex items-end">
                                <button
                                  onClick={() => setOrderFilters({
                                    type: 'all',
                                    status: 'all',
                                    dateFrom: '',
                                    dateTo: '',
                                    pointsMin: '',
                                    pointsMax: '',
                                    tonMin: '',
                                    tonMax: ''
                                  })}
                                  className={`w-full px-3 py-1 text-sm rounded ${
                                    isDark 
                                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  } transition-colors`}
                                >
                                  Сбросить
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                              {/* Фильтр по минимальному количеству Points */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Points мин.
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={orderFilters.pointsMin}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, pointsMin: e.target.value })}
                                  placeholder="0"
                                  className={`w-full px-2 py-1 text-sm rounded border font-mono ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по максимальному количеству Points */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Points макс.
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={orderFilters.pointsMax}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, pointsMax: e.target.value })}
                                  placeholder="∞"
                                  className={`w-full px-2 py-1 text-sm rounded border font-mono ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по минимальному количеству TON */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  TON мин.
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={orderFilters.tonMin}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, tonMin: e.target.value })}
                                  placeholder="0"
                                  className={`w-full px-2 py-1 text-sm rounded border font-mono ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по максимальному количеству TON */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  TON макс.
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={orderFilters.tonMax}
                                  onChange={(e) => setOrderFilters({ ...orderFilters, tonMax: e.target.value })}
                                  placeholder="∞"
                                  className={`w-full px-2 py-1 text-sm rounded border font-mono ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Список заказов */}
                        {(() => {
                          if (!userTransactions.orders || userTransactions.orders.length === 0) {
                            return null;
                          }

                          // Применяем фильтры
                          let filteredOrders = userTransactions.orders;

                          // Фильтр по типу (проверяем item_code на наличие типа)
                          if (orderFilters.type !== 'all') {
                            filteredOrders = filteredOrders.filter((order: any) => {
                              const itemCode = String(order.item_code || '').toLowerCase();
                              let filterType = orderFilters.type.toLowerCase();
                              
                              // Специальная обработка для "energystation" - ищем energy_station или energystation
                              if (filterType === 'energystation') {
                                // Ищем energy_station (с подчеркиванием) или energystation (без подчеркивания)
                                return itemCode.includes('energy_station') || itemCode.includes('energystation');
                              }
                              
                              // Для остальных типов проверяем точное совпадение или вхождение
                              // Проверяем, содержит ли item_code указанный тип
                              return itemCode.includes(filterType);
                            });
                          }

                          // Фильтр по статусу
                          if (orderFilters.status !== 'all') {
                            filteredOrders = filteredOrders.filter((order: any) => 
                              (order.status || 'pending') === orderFilters.status
                            );
                          }

                          // Фильтр по дате от
                          if (orderFilters.dateFrom) {
                            const dateFrom = new Date(orderFilters.dateFrom);
                            dateFrom.setHours(0, 0, 0, 0);
                            filteredOrders = filteredOrders.filter((order: any) => {
                              if (!order.created_at) return false;
                              const orderDate = new Date(order.created_at);
                              return orderDate >= dateFrom;
                            });
                          }

                          // Фильтр по дате до
                          if (orderFilters.dateTo) {
                            const dateTo = new Date(orderFilters.dateTo);
                            dateTo.setHours(23, 59, 59, 999);
                            filteredOrders = filteredOrders.filter((order: any) => {
                              if (!order.created_at) return false;
                              const orderDate = new Date(order.created_at);
                              return orderDate <= dateTo;
                            });
                          }

                          // Фильтр по минимальному количеству Points
                          if (orderFilters.pointsMin) {
                            const minPoints = parseFloat(orderFilters.pointsMin);
                            if (!isNaN(minPoints)) {
                              filteredOrders = filteredOrders.filter((order: any) => {
                                const points = parseFloat(String(order.amount_points || 0));
                                return points >= minPoints;
                              });
                            }
                          }

                          // Фильтр по максимальному количеству Points
                          if (orderFilters.pointsMax) {
                            const maxPoints = parseFloat(orderFilters.pointsMax);
                            if (!isNaN(maxPoints)) {
                              filteredOrders = filteredOrders.filter((order: any) => {
                                const points = parseFloat(String(order.amount_points || 0));
                                return points <= maxPoints;
                              });
                            }
                          }

                          // Фильтр по минимальному количеству TON
                          if (orderFilters.tonMin) {
                            const minTon = parseFloat(orderFilters.tonMin);
                            if (!isNaN(minTon)) {
                              filteredOrders = filteredOrders.filter((order: any) => {
                                const ton = parseFloat(String(order.amount_ton || 0));
                                return ton >= minTon;
                              });
                            }
                          }

                          // Фильтр по максимальному количеству TON
                          if (orderFilters.tonMax) {
                            const maxTon = parseFloat(orderFilters.tonMax);
                            if (!isNaN(maxTon)) {
                              filteredOrders = filteredOrders.filter((order: any) => {
                                const ton = parseFloat(String(order.amount_ton || 0));
                                return ton <= maxTon;
                              });
                            }
                          }

                          return (
                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between">
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Показано: {filteredOrders.length} из {userTransactions.orders.length} заказов
                                </p>
                              </div>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredOrders.map((order: any, idx: number) => (
                                  <div key={idx} className={`p-3 rounded border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                            {order.item_code || `Заказ #${order.order_id || idx + 1}`}
                                          </span>
                                          <span className={`text-xs px-2 py-0.5 rounded ${
                                            order.status === 'completed' 
                                              ? 'bg-green-500/20 text-green-600' 
                                              : order.status === 'cancelled' || order.status === 'failed'
                                              ? 'bg-red-500/20 text-red-600'
                                              : 'bg-yellow-500/20 text-yellow-600'
                                          }`}>
                                            {order.status || 'pending'}
                                          </span>
                                        </div>
                                        <div className="flex gap-4 mt-2 text-xs">
                                          {order.amount_points > 0 && (
                                            <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                              Points: {formatFullNumber(order.amount_points)}
                                            </span>
                                          )}
                                          {order.amount_ton > 0 && (
                                            <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                              TON: {formatFullNumber(order.amount_ton)}
                                            </span>
                                          )}
                                        </div>
                                        {order.metadata && typeof order.metadata === 'object' && Object.keys(order.metadata).length > 0 && (
                                          <details className="mt-2">
                                            <summary className={`text-xs cursor-pointer ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                              Метаданные
                                            </summary>
                                            <pre className={`text-xs mt-1 p-2 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                                              {JSON.stringify(order.metadata, null, 2)}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <span className={`text-xs block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                          {order.created_at 
                                            ? new Date(order.created_at).toLocaleDateString('ru-RU', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                              })
                                            : 'N/A'}
                                        </span>
                                        {order.order_id && (
                                          <span className={`text-xs block mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            ID: {order.order_id}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* Все транзакции */}
                {userTransactions && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Все транзакции
                      {userTransactions.loading && <span className="ml-2 text-sm text-gray-500">(загрузка...)</span>}
                    </h4>
                    {userTransactions.loading ? (
                      <div className="text-center py-4">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Загрузка транзакций...</p>
                      </div>
                    ) : (
                      <>
                        {/* Фильтры транзакций */}
                        {userTransactions.all_transactions && userTransactions.all_transactions.length > 0 && (
                          <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {/* Фильтр по типу транзакции */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Тип транзакции
                                </label>
                                <select
                                  value={transactionFilters.type}
                                  onChange={(e) => setTransactionFilters({ ...transactionFilters, type: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="all">Все типы</option>
                                  {userTransactions.transactions_by_type && Object.keys(userTransactions.transactions_by_type).map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Фильтр по направлению (поступления/траты) */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Направление
                                </label>
                                <select
                                  value={transactionFilters.direction}
                                  onChange={(e) => setTransactionFilters({ ...transactionFilters, direction: e.target.value as 'all' | 'income' | 'expense' })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="all">Все</option>
                                  <option value="income">Поступления (+)</option>
                                  <option value="expense">Траты (-)</option>
                                </select>
                              </div>

                              {/* Фильтр по дате от */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Дата от
                                </label>
                                <input
                                  type="date"
                                  value={transactionFilters.dateFrom}
                                  onChange={(e) => setTransactionFilters({ ...transactionFilters, dateFrom: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по дате до */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Дата до
                                </label>
                                <input
                                  type="date"
                                  value={transactionFilters.dateTo}
                                  onChange={(e) => setTransactionFilters({ ...transactionFilters, dateTo: e.target.value })}
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по минимальному объему */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Мин. объем
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={transactionFilters.amountMin}
                                  onChange={(e) => setTransactionFilters({ ...transactionFilters, amountMin: e.target.value })}
                                  placeholder="0"
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Фильтр по максимальному объему */}
                              <div>
                                <label className={`block text-xs mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Макс. объем
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={transactionFilters.amountMax}
                                  onChange={(e) => setTransactionFilters({ ...transactionFilters, amountMax: e.target.value })}
                                  placeholder="∞"
                                  className={`w-full px-2 py-1 text-sm rounded border ${
                                    isDark 
                                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </div>

                              {/* Кнопка сброса фильтров */}
                              <div className="flex items-end">
                                <button
                                  onClick={() => setTransactionFilters({
                                    type: 'all',
                                    dateFrom: '',
                                    dateTo: '',
                                    amountMin: '',
                                    amountMax: '',
                                    direction: 'all'
                                  })}
                                  className={`w-full px-3 py-1 text-sm rounded ${
                                    isDark 
                                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  } transition-colors`}
                                >
                                  Сбросить
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Отфильтрованные транзакции */}
                        {(() => {
                          if (!userTransactions.all_transactions || userTransactions.all_transactions.length === 0) {
                            return (
                              <div className="text-center py-4">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Нет транзакций
                                </p>
                              </div>
                            );
                          }

                          // Применяем фильтры
                          let filteredTransactions = userTransactions.all_transactions;

                          // Фильтр по типу
                          if (transactionFilters.type !== 'all') {
                            filteredTransactions = filteredTransactions.filter((t: any) => 
                              t.operation_type === transactionFilters.type
                            );
                          }

                          // Фильтр по направлению
                          if (transactionFilters.direction === 'income') {
                            filteredTransactions = filteredTransactions.filter((t: any) => 
                              parseFloat(String(t.operation_value || 0)) > 0
                            );
                          } else if (transactionFilters.direction === 'expense') {
                            filteredTransactions = filteredTransactions.filter((t: any) => 
                              parseFloat(String(t.operation_value || 0)) < 0
                            );
                          }

                          // Фильтр по дате от
                          if (transactionFilters.dateFrom) {
                            const dateFrom = new Date(transactionFilters.dateFrom);
                            dateFrom.setHours(0, 0, 0, 0);
                            filteredTransactions = filteredTransactions.filter((t: any) => {
                              if (!t.created_at) return false;
                              const txDate = new Date(t.created_at);
                              return txDate >= dateFrom;
                            });
                          }

                          // Фильтр по дате до
                          if (transactionFilters.dateTo) {
                            const dateTo = new Date(transactionFilters.dateTo);
                            dateTo.setHours(23, 59, 59, 999);
                            filteredTransactions = filteredTransactions.filter((t: any) => {
                              if (!t.created_at) return false;
                              const txDate = new Date(t.created_at);
                              return txDate <= dateTo;
                            });
                          }

                          // Фильтр по минимальному объему
                          if (transactionFilters.amountMin) {
                            const minAmount = parseFloat(transactionFilters.amountMin);
                            if (!isNaN(minAmount)) {
                              filteredTransactions = filteredTransactions.filter((t: any) => {
                                const txAmount = Math.abs(parseFloat(String(t.operation_value || 0)));
                                return txAmount >= minAmount;
                              });
                            }
                          }

                          // Фильтр по максимальному объему
                          if (transactionFilters.amountMax) {
                            const maxAmount = parseFloat(transactionFilters.amountMax);
                            if (!isNaN(maxAmount)) {
                              filteredTransactions = filteredTransactions.filter((t: any) => {
                                const txAmount = Math.abs(parseFloat(String(t.operation_value || 0)));
                                return txAmount <= maxAmount;
                              });
                            }
                          }

                          return (
                            <>
                              <div className="mb-2 flex items-center justify-between">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Показано: {filteredTransactions.length} из {userTransactions.all_transactions.length} транзакций
                                </p>
                              </div>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredTransactions.map((transaction: any, idx: number) => {
                                  const assetName = userTransactions.assets_metadata?.[transaction.asset_id]?.name || `Asset ${transaction.asset_id}`;
                                  const operationValue = parseFloat(String(transaction.operation_value || 0));
                                  const isPositive = operationValue > 0;
                                  const absValue = Math.abs(operationValue);
                                  
                                  return (
                                    <div key={idx} className={`p-3 rounded border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-semibold font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                              {isPositive ? '+' : ''}{formatFullNumber(absValue)}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{assetName}</span>
                                          </div>
                                          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {transaction.operation_type || 'N/A'}
                                          </p>
                                          {transaction.operation_id && (
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                              ID операции: {transaction.operation_id}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          <span className={`text-xs block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {transaction.created_at 
                                              ? new Date(transaction.created_at).toLocaleDateString('ru-RU', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                  second: '2-digit'
                                                })
                                              : 'N/A'}
                                          </span>
                                          {transaction.id && (
                                            <span className={`text-xs block mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                              ID: {transaction.id}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                        
                        {/* Статистика по типам транзакций */}
                        {userTransactions.transactions_by_type && Object.keys(userTransactions.transactions_by_type).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Статистика по типам:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(userTransactions.transactions_by_type).slice(0, 9).map(([type, stats]: [string, any]) => (
                                <div key={type} className={`p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                                  <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {type}
                                  </p>
                                  <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {stats.count || 0} шт. / {formatFullNumber(stats.total_value || 0)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* JSON для отладки (можно скрыть в продакшене) */}
                <details className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <summary className="cursor-pointer text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Полные данные (JSON)
                  </summary>
                  <pre className={`text-xs overflow-auto max-h-96 p-4 rounded ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                    {JSON.stringify(userDetails.user, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Не удалось загрузить данные пользователя
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Модальное окно для отправки push-уведомлений */}
      {pushModalOpen && pushModalSource && (() => {
        // Определяем источник данных и выбранных пользователей
        let selectedUsers: any[] = [];
        let selectedCount = 0;
        let sourceData: any[] = [];

        if (pushModalSource === 'ref1' && refKpiData) {
          sourceData = refKpiData;
          selectedUsers = refKpiData.filter(user => selectedRefKpiUsers.has(user.person_id));
          selectedCount = selectedRefKpiUsers.size;
        } else if (pushModalSource === 'ref3' && ref3KpiData) {
          sourceData = ref3KpiData;
          selectedUsers = ref3KpiData.filter(user => selectedRef3KpiUsers.has(user.person_id));
          selectedCount = selectedRef3KpiUsers.size;
        } else if (pushModalSource === 'asic' && asicKpiData) {
          sourceData = asicKpiData;
          selectedUsers = asicKpiData.filter(user => selectedAsicKpiUsers.has(user.person_id));
          selectedCount = selectedAsicKpiUsers.size;
        }

        if (selectedCount === 0) {
          return null;
        }

        return (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setPushModalOpen(false);
              setPushModalSource(null);
            }}
          >
            <div 
              className={`max-w-2xl w-full rounded-xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Отправить push-уведомления
                </h3>
                <button
                  onClick={() => {
                    setPushModalOpen(false);
                    setPushModalSource(null);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                  Выбрано пользователей: <span className="font-semibold">{selectedCount}</span>
                </p>
                <div className={`max-h-40 overflow-y-auto p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <span 
                        key={user.person_id}
                        className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {user.first_name} {user.last_name || ''} (@{user.username || user.tg_id})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Сообщение для отправки:
              </label>
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Введите текст push-уведомления..."
                rows={6}
                className={`w-full p-3 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {pushMessage.length} символов
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setPushModalOpen(false);
                  setPushModalSource(null);
                }}
                disabled={pushSending}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } ${pushSending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!pushMessage.trim()) {
                    alert('Пожалуйста, введите сообщение');
                    return;
                  }
                  
                  const tgIds = selectedUsers.map(user => user.tg_id).filter((id): id is string => id !== undefined && id !== null && id.trim() !== '');
                  
                  if (tgIds.length === 0) {
                    alert('У выбранных пользователей нет TG ID');
                    return;
                  }
                  
                  await sendPushNotifications(tgIds, pushMessage.trim());
                }}
                disabled={pushSending || !pushMessage.trim() || selectedCount === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  pushSending || !pushMessage.trim()
                    ? 'bg-gray-500 cursor-not-allowed text-white'
                    : isDark
                    ? 'bg-blue-700 hover:bg-blue-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {pushSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Отправить пуш</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Модальное окно сравнительного графика майнинга */}
      {comparisonModalOpen && eventsData && eventsData.events['mining_started'] && eventsData.events['mining_claimed'] && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-12 pb-32 overflow-y-auto"
          onClick={() => setComparisonModalOpen(false)}
        >
          <div 
            className={`max-w-4xl w-full rounded-xl shadow-2xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Соотношение: Запуск → Сбор
                </h3>
              </div>
              <button
                onClick={() => setComparisonModalOpen(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Запущено</div>
                <div className="text-3xl font-bold text-orange-600">
                  {eventsData.events['mining_started'].reduce((sum: number, day: any) => sum + day.count, 0)}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Собрано</div>
                <div className="text-3xl font-bold text-emerald-600">
                  {eventsData.events['mining_claimed'].reduce((sum: number, day: any) => sum + day.count, 0)}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Процент сбора</div>
                <div className="text-3xl font-bold text-emerald-600">
                  {(() => {
                    const totalStarted = eventsData.events['mining_started'].reduce((sum: number, day: any) => sum + day.count, 0);
                    const totalClaimed = eventsData.events['mining_claimed'].reduce((sum: number, day: any) => sum + day.count, 0);
                    return totalStarted > 0 ? ((totalClaimed / totalStarted) * 100).toFixed(1) : '0';
                  })()}%
                </div>
              </div>
            </div>
            
            {/* Большой график */}
            <div className="h-96">
              <Line
                data={{
                  labels: eventsData.events['mining_started'].map((d: any) => d.date),
                  datasets: [
                    {
                      label: 'Майнинг запущен',
                      data: eventsData.events['mining_started'].map((d: any) => d.count),
                      borderColor: '#f97316',
                      backgroundColor: 'rgba(249, 115, 22, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#f97316',
                      pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                    },
                    {
                      label: 'Майнинг собран',
                      data: eventsData.events['mining_claimed'].map((d: any) => d.count),
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: '#10b981',
                      pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                      pointBorderWidth: 2,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: isDark ? '#ffffff' : '#000000',
                        padding: 20,
                        usePointStyle: true,
                        font: {
                          size: 14
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      titleColor: isDark ? '#ffffff' : '#000000',
                      bodyColor: isDark ? '#ffffff' : '#000000',
                      borderColor: isDark ? '#4b5563' : '#e5e7eb',
                      borderWidth: 1,
                      cornerRadius: 8,
                      displayColors: true,
                      callbacks: {
                        title: function(context) {
                          return `📅 ${context[0].label}`;
                        },
                        label: function(context) {
                          return `${context.dataset.label}: ${context.parsed.y} событий`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: isDark ? '#374151' : '#f3f4f6',
                        drawBorder: false
                      },
                      ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        font: {
                          size: 12
                        }
                      }
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: isDark ? '#374151' : '#f3f4f6',
                        drawBorder: false
                      },
                      ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        font: {
                          size: 12
                        },
                        callback: function(value) {
                          return Number(value).toLocaleString('ru-RU');
                        }
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


