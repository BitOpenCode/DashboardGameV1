import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshCw, Users, TrendingUp } from 'lucide-react';
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

const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
  const [selectedEventModal, setSelectedEventModal] = useState<{
    eventName: string;
    eventData: { date: string; count: number }[];
    eventInfo: { title: string; icon: string; color: string };
  } | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
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
      setError(e instanceof Error ? e.message : 'Unknown error');
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
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/users-wallets'
        : 'https://n8n-p.blc.am/webhook/users-wallets';
      
      console.log('🔗 Загрузка данных кошельков...');
      console.log('URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        mode: 'cors',
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
    
    try {
      const webhookUrl = import.meta.env.DEV 
        ? '/webhook/game-events'
        : 'https://n8n-p.blc.am/webhook/game-events';
      
      console.log('🔗 Загрузка данных игровых событий...');
      console.log('URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        mode: 'cors',
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

  // Расчет прогноза с useMemo
  const forecast = useMemo(() => {
    if (!filteredData || !filteredData.dailyCounts || filteredData.dailyCounts.length < 7) return null;

    const recentDays = filteredData.dailyCounts.slice(-7); // Последние 7 дней
    const values = recentDays.map(day => day.count);
    
    // Простое линейное приближение
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Прогноз на следующие 7 дней
    const forecastData = [];
    for (let i = 0; i < 7; i++) {
      const predictedValue = Math.max(0, Math.round(intercept + slope * (n + i)));
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
      forecastData.push({
        date: format(futureDate, 'dd.MM.yy'),
        count: predictedValue
      });
    }
    
    return forecastData;
  }, [filteredData]);

  useEffect(() => {
    load();
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

  if (!stats) return null;

  // Удалены захардкоженные карточки майнинга

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Дашборд ECOSMiningGame</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Обновлено: {new Date(stats.updatedAtIso).toLocaleString('ru-RU')}</p>
      </div>

      {/* Удалены захардкоженные карточки майнинга */}

      {/* Кнопки для загрузки данных */}
      <div className="mb-8 flex flex-col md:flex-row gap-3 justify-center items-center flex-wrap">
        <button
          onClick={loadUsersData}
          disabled={usersLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            usersLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {usersLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <Users className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'} group-hover:scale-110 transition-transform`} />
              <span>Показать статистику пользователей</span>
            </>
          )}
        </button>

        <button
          onClick={loadWalletsData}
          disabled={walletsLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            walletsLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {walletsLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Показать статистику Wallets</span>
            </>
          )}
        </button>

        <button
          onClick={loadEventsData}
          disabled={eventsLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            eventsLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {eventsLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Показать Game Events</span>
            </>
          )}
        </button>

        <button
          onClick={loadReferralsData}
          disabled={referralsLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            referralsLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {referralsLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-600'} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Показать статистику Referrals</span>
            </>
          )}
        </button>

        <button
          onClick={loadPoolsData}
          disabled={poolsLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            poolsLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {poolsLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Топ пулы</span>
            </>
          )}
        </button>

        <button
          onClick={loadFunnelData}
          disabled={funnelLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            funnelLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {funnelLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>показать Funnel события</span>
            </>
          )}
        </button>

        <button
          onClick={loadLeadersData}
          disabled={leadersLoading}
          className={`group relative w-full md:w-[280px] md:min-w-[280px] h-[44px] px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border text-sm whitespace-nowrap ${
            leadersLoading
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-400'
              : isDark
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600 shadow-sm hover:shadow-md'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          {leadersLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных...</span>
            </>
          ) : (
            <>
              <svg className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Таблица лидеров</span>
            </>
          )}
        </button>
      </div>


      {/* Отображение данных пользователей */}
      {usersData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Статистика пользователей</h2>
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
                    
                    {/* Фильтры для графика */}
                    <div className={`p-1 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex space-x-1">
                        {[
                          { key: 'all', label: 'По дням' },
                          { key: '7', label: 'По неделям' },
                          { key: '30', label: 'По месяцам' }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setTimeFilter(key as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              timeFilter === key
                                ? 'bg-orange-500 text-white shadow-lg'
                                : isDark
                                ? 'text-gray-300 hover:bg-gray-600'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
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
                  {/* Список языков */}
                  <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🌍</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Языки пользователей</h3>
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

                  {/* Круговая диаграмма */}
                  <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🥧</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Распределение языков</h3>
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

              {/* Языки за последние 24 часа */}
              {usersData.languageCountsLast24h && usersData.languageCountsLast24h.length > 0 && (
                <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🌍</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Языки за 24 часа</h3>
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
                {/* Регистрации по дням */}
                {usersData?.dailyCounts && usersData.dailyCounts.length > 0 && (
                  <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">📅</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Регистрации по дням</h3>
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

                {/* Прогноз на 7 дней */}
                {forecast && (
                  <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🔮</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Прогноз на 7 дней</h3>
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
      {eventsData && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">⚡ Статистика игровых событий</h2>
          </div>
          
          <div className="space-y-6">
            {/* График общей активности по дням */}
            {eventsData.totalByDay && eventsData.totalByDay.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 Общая активность игроков</h3>
                </div>
                
                <div className="h-80">
                  <Line
                    data={{
                      labels: eventsData.totalByDay.map(day => day.date),
                      datasets: [{
                        label: 'Всего событий',
                        data: eventsData.totalByDay.map(day => day.count),
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
            
            {/* Навигация по категориям событий */}
            {eventsData.events && Object.keys(eventsData.events).length > 0 && (
              <div className={`relative overflow-hidden rounded-2xl ${isDark ? 'bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50' : 'bg-gradient-to-br from-white via-gray-50/50 to-white backdrop-blur-xl border border-gray-200/80 shadow-xl'}`}>
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/5 to-orange-500/5 rounded-full blur-3xl"></div>
                
                <div className="relative p-8">
                  {/* Заголовок */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Быстрый переход к категориям
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Выберите категорию для просмотра статистики
                      </p>
                    </div>
                  </div>

                  {/* Сетка категорий */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {[
                      { name: '⛏️ Игровые события майнинга', icon: '⛏️', gradient: 'from-orange-500 to-red-500' },
                      { name: '🛒 Покупки и оборудование', icon: '🛒', gradient: 'from-blue-500 to-cyan-500' },
                      { name: '📅 Ежедневные активности', icon: '📅', gradient: 'from-pink-500 to-rose-500' },
                      { name: '👥 Реферальная система', icon: '👥', gradient: 'from-purple-500 to-pink-500' },
                      { name: '🔄 Обмены и транзакции', icon: '🔄', gradient: 'from-cyan-500 to-blue-500' },
                      { name: '🎯 Задания на выполнение', icon: '🎯', gradient: 'from-violet-500 to-purple-500' },
                      { name: '📱 Социальные активности', icon: '📱', gradient: 'from-blue-500 to-indigo-500' },
                      { name: '✅ Подключения и регистрации', icon: '✅', gradient: 'from-teal-500 to-emerald-500' },
                      { name: '🖥️ Задания на покупку ASIC', icon: '🖥️', gradient: 'from-indigo-500 to-blue-500' },
                      { name: '🏢 Задания на покупку объектов владения', icon: '🏢', gradient: 'from-emerald-500 to-green-500' },
                      { name: '🏆 Достижения', icon: '🏆', gradient: 'from-yellow-500 to-orange-500' },
                    ].map((category) => (
                      <button
                        key={category.name}
                        onClick={() => scrollToCategory(category.name)}
                        className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                          isDark
                            ? 'bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600'
                            : 'bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
                        }`}
                      >
                        {/* Градиентный фон при наведении */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                        
                        {/* Контент */}
                        <div className="relative p-4 flex items-center gap-3">
                          {/* Иконка с фоном */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${category.gradient} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                            <span className="drop-shadow-sm">{category.icon}</span>
                          </div>
                          
                          {/* Текст */}
                          <span className={`flex-1 text-left text-sm font-medium leading-tight ${
                            isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                          } transition-colors`}>
                            {category.name.replace(/^[^\s]+\s/, '')}
                          </span>
                          
                          {/* Стрелка */}
                          <svg 
                            className={`w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Карточки по типам событий */}
            {eventsData.events && Object.keys(eventsData.events).length > 0 && (
              <div className="space-y-8">
                {(() => {
                  // Названия событий на русском
                  const eventNames: { [key: string]: { title: string; icon: string; color: string } } = {
                    'mining_started': { title: 'Майнинг запущен', icon: '⛏️', color: '#f97316' },
                    'mining_claimed': { title: 'Майнинг собран', icon: '💰', color: '#10b981' },
                    'equipment_purchase': { title: 'Покупка оборудования', icon: '🛒', color: '#3b82f6' },
                    'checkin_reward': { title: 'Ежедневный вход', icon: '📅', color: '#ec4899' },
                    'referral_bonus_referrer': { title: 'Выплаты бонусов за рефералов', icon: '💸', color: '#22c55e' },
                    'swap_btc_to_ecos': { title: 'Обмен xpBTC на XP', icon: '🔄', color: '#0ea5e9' },
                    'daily_all_done_reward': { title: 'Все задания выполнены', icon: '🎯', color: '#8b5cf6' },
                    'check_tma_reward': { title: 'Проверка TMA', icon: '✅', color: '#14b8a6' },
                    'follow_game_channel_reward': { title: 'Подписка на канал игры', icon: '📢', color: '#3b82f6' },
                    'app_ecos_register_tma_reward': { title: 'Регистрация в TMA', icon: '📱', color: '#06b6d4' },
                    'confirm_telegram_premium_reward': { title: 'Подтверждение Telegram Premium', icon: '⭐', color: '#f59e0b' },
                    'swap_btc_0_03_to_ecos_reward': { title: 'Обмен 0.03 BTC на XP', icon: '💱', color: '#0ea5e9' },
                    'buy_100_asics_in_the_game_reward': { title: 'Выполнение задания на владение 100 ASIC в игре', icon: '🖥️', color: '#3b82f6' },
                    'buy_200_asics_in_the_game_reward': { title: 'Выполнение задания на владение 200 ASIC в игре', icon: '💻', color: '#06b6d4' },
                    'buy_400_asics_in_the_game_reward': { title: 'Выполнение задания на владение 400 ASIC в игре', icon: '🖥️', color: '#8b5cf6' },
                    'buy_600_asics_in_the_game_reward': { title: 'Выполнение задания на владение 600 ASIC в игре', icon: '💻', color: '#8b5cf6' },
                    'buy_asics_in_the_game_reward': { title: 'Покупка ASIC единоразовое задание', icon: '⚡', color: '#f59e0b' },
                    'buy_datacenter_in_the_game_reward': { title: 'Покупка Datacenter в игре', icon: '🏢', color: '#10b981' },
                    'buy_energy_station_in_the_game_reward': { title: 'Покупка ES в игре', icon: '⚡', color: '#eab308' },
                    'buy_land_in_the_game_reward': { title: 'Покупка земли', icon: '🏞️', color: '#10b981' },
                    'check_telegram_wallet_reward': { title: 'Подключение Кошелька TON к игре', icon: '💳', color: '#0ea5e9' },
                    'checkin_7_days_reward': { title: 'Совершить Check in 7 дней подряд', icon: '📅', color: '#22c55e' },
                    'checkin_15_days_reward': { title: 'Совершить Check in 15 дней подряд', icon: '📆', color: '#16a34a' },
                    'balance_turnover_1000000_reward': { title: 'Количество пользователей с совокупным балансом от 1000000', icon: '💎', color: '#a855f7' },
                    'combo_reward': { title: 'COMBO заданий выполнено', icon: '🎮', color: '#f59e0b' },
                    'complete_70_tasks_reward': { title: 'Выполнено 70 заданий', icon: '🥈', color: '#f97316' },
                    'complete_80_tasks_reward': { title: 'Выполнено 80 заданий', icon: '🥉', color: '#fb923c' },
                    'complete_90_tasks_reward': { title: 'Выполнено 90 заданий', icon: '🏆', color: '#f97316' },
                    'like_game_post_reward': { title: 'Лайк поста в игровом канале', icon: '👍', color: '#3b82f6' },
                    'like_telegram_post_reward': { title: 'Лайк поста в Telegram', icon: '💙', color: '#0ea5e9' },
                    'poke_reward': { title: 'Награда за poke', icon: '👉', color: '#ec4899' },
                    'referral_claim_reward': { title: 'Получение бонуса за реферала', icon: '🎉', color: '#22c55e' },
                    'site_visit_reward': { title: 'Посещение сайта', icon: '🌐', color: '#8b5cf6' },
                    'telegram_channel_follow_reward': { title: 'Подписка на канал Telegram', icon: '📱', color: '#06b6d4' },
                    'swap_btc_0_05_to_ecos_reward': { title: 'Обмен 0.05 BTC на XP', icon: '💰', color: '#0ea5e9' },
                    'reach_100000_ths_reward': { title: 'Достижение 100000 TH/s', icon: '⚡', color: '#f59e0b' },
                    'plan_completed_reward': { title: 'План выполнен', icon: '✅', color: '#22c55e' },
                    'bonus_reward': { title: 'Бонусная награда', icon: '🎁', color: '#ec4899' },
                    'referral_bonus_referee': { title: 'Бонус рефери', icon: '👥', color: '#14b8a6' },
                  };
                  
                  // Категории событий
                  const eventCategories = {
                    '⛏️ Игровые события майнинга': [
                      'mining_started',
                      'mining_claimed',
                    ],
                    '🛒 Покупки и оборудование': [
                      'equipment_purchase',
                    ],
                    '📅 Ежедневные активности': [
                      'checkin_reward',
                      'checkin_7_days_reward',
                      'checkin_15_days_reward',
                      'combo_reward',
                      'poke_reward',
                    ],
                    '👥 Реферальная система': [
                      'referral_bonus_referrer',
                      'referral_claim_reward',
                      'referral_bonus_referee',
                    ],
                    '🔄 Обмены и транзакции': [
                      'swap_btc_to_ecos',
                      'swap_btc_0_03_to_ecos_reward',
                      'swap_btc_0_05_to_ecos_reward',
                    ],
                    '🎯 Задания на выполнение': [
                      'daily_all_done_reward',
                      'complete_70_tasks_reward',
                      'complete_80_tasks_reward',
                      'complete_90_tasks_reward',
                      'plan_completed_reward',
                    ],
                    '📱 Социальные активности': [
                      'follow_game_channel_reward',
                      'telegram_channel_follow_reward',
                      'like_game_post_reward',
                      'like_telegram_post_reward',
                      'site_visit_reward',
                    ],
                    '✅ Подключения и регистрации': [
                      'app_ecos_register_tma_reward',
                      'confirm_telegram_premium_reward',
                      'check_telegram_wallet_reward',
                      'check_tma_reward',
                    ],
                    '🖥️ Задания на покупку ASIC': [
                      'buy_asics_in_the_game_reward',
                      'buy_100_asics_in_the_game_reward',
                      'buy_200_asics_in_the_game_reward',
                      'buy_400_asics_in_the_game_reward',
                      'buy_600_asics_in_the_game_reward',
                    ],
                    '🏢 Задания на покупку объектов владения': [
                      'buy_datacenter_in_the_game_reward',
                      'buy_energy_station_in_the_game_reward',
                      'buy_land_in_the_game_reward',
                    ],
                    '🏆 Достижения': [
                      'reach_100000_ths_reward',
                      'balance_turnover_1000000_reward',
                    ],
                    '🎁 Бонусы и награды': [
                      'bonus_reward',
                    ],
                  };
                  
                  // События, которые не нужно отображать
                  const excludedEvents = ['person_created', 'starter_pack_granted', 'bonus_reward', 'referral_bonus_referee'];
                  
                  // Функция для рендеринга карточки события
                  const renderEventCard = (eventName: string, eventData: any) => {
                    const totalCount = eventData.reduce((sum: number, day: any) => sum + day.count, 0);
                    const lastDayCount = eventData.length > 0 ? eventData[eventData.length - 1].count : 0;
                  const eventInfo = eventNames[eventName] || { title: eventName, icon: '⚡', color: '#6b7280' };
                  
                  return (
                    <div key={eventName} className={`p-6 rounded-xl shadow-lg min-h-[280px] flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{eventInfo.icon}</span>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{eventInfo.title}</h4>
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
                  
                  // Рендерим категории с событиями
                  return (
                    <>
                      {Object.entries(eventCategories).map(([categoryName, eventsList]) => {
                        // Фильтруем события: берем только те, что есть в данных и не исключены
                        const categoryEvents = eventsList
                          .filter(eventName => 
                            eventsData.events[eventName] && 
                            !excludedEvents.includes(eventName)
                          );
                        
                        // Если в категории нет событий - не показываем её
                        if (categoryEvents.length === 0) return null;
                        
                        return (
                          <div 
                            key={categoryName} 
                            className="space-y-4"
                            ref={(el) => (categoryRefs.current[categoryName] = el)}
                          >
                            {/* Заголовок категории */}
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
                              {categoryName}
                            </h3>
                            
                            {/* Карточки событий в категории */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {categoryEvents.map(eventName => 
                                renderEventCard(eventName, eventsData.events[eventName])
                              )}
                              
                              {/* Специальный блок сравнения для майнинг-событий */}
                              {categoryName === '⛏️ Игровые события майнинга' && 
                               eventsData.events['mining_started'] && 
                               eventsData.events['mining_claimed'] && (
                                <div className={`p-6 rounded-xl shadow-lg min-h-[280px] flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                                  <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">📊</span>
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Соотношение: Запуск → Сбор</h4>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-5 flex-1 flex flex-col">
                                    {/* Процентное соотношение */}
                                    <div className="mb-2">
                                      {(() => {
                                        const totalStarted = eventsData.events['mining_started'].reduce((sum: number, day: any) => sum + day.count, 0);
                                        const totalClaimed = eventsData.events['mining_claimed'].reduce((sum: number, day: any) => sum + day.count, 0);
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
                                          labels: eventsData.events['mining_started'].map((d: any) => d.date),
                                          datasets: [
                                            {
                                              label: 'Запущено',
                                              data: eventsData.events['mining_started'].map((d: any) => d.count),
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
                                              data: eventsData.events['mining_claimed'].map((d: any) => d.count),
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

            {/* График приглашений по дням */}
            {referralsData.byDay && referralsData.byDay.length > 0 && (
              <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📈</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Динамика приглашений по дням</h3>
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
                <span className="text-3xl">📊</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Обзор активности: {activityOverview.referrer_name}
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
      {selectedEventModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-12 pb-32 overflow-y-auto"
          onClick={() => setSelectedEventModal(null)}
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
                onClick={() => setSelectedEventModal(null)}
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Всего</div>
                <div className="text-3xl font-bold" style={{ color: selectedEventModal.eventInfo.color }}>
                  {selectedEventModal.eventData.reduce((sum, day) => sum + day.count, 0)}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Сегодня</div>
                <div className="text-3xl font-bold" style={{ color: selectedEventModal.eventInfo.color }}>
                  {selectedEventModal.eventData.length > 0 ? selectedEventModal.eventData[selectedEventModal.eventData.length - 1].count : 0}
                </div>
              </div>
            </div>
            
            {/* Большой график */}
            <div className="h-96">
              <Line
                data={{
                  labels: selectedEventModal.eventData.map(d => d.date),
                  datasets: [{
                    label: selectedEventModal.eventInfo.title,
                    data: selectedEventModal.eventData.map(d => d.count),
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Funnel события - Статистика по уровням</h2>
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


