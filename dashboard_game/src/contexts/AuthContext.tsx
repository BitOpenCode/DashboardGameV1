import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  avatar_id?: number;
  avatar_name?: string;
  avatar_image?: string;
  avatar_rarity?: string;
  dashecos_coin_balance?: number;
  student_group?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => void;
  updateUserFromToken: (token: string) => void;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Моковые данные для демонстрации
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@dashboard.local',
    name: 'Админ',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '2',
    email: 'teacher@dashboard.local',
    name: 'Иван Петров',
    role: 'teacher',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
  {
    id: '3',
    email: 'student@dashboard.local',
    name: 'Анна Сидорова',
    role: 'student',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Проверяем localStorage для аутентификации
    const isAuth = localStorage.getItem('dashecos_is_authenticated');
    const userData = localStorage.getItem('dashecos_user_data');
    const token = localStorage.getItem('dashecos_token');
    
    if (isAuth === 'true' && userData && token) {
      try {
        const parsedUserData = JSON.parse(userData);
        console.log('Parsed user data from localStorage:', parsedUserData);
        console.log('First name from localStorage:', parsedUserData.first_name);
        console.log('First name type:', typeof parsedUserData.first_name);
        console.log('First name length:', parsedUserData.first_name?.length);
        
        const user = {
          id: parsedUserData.userId,
          email: parsedUserData.email,
          name: parsedUserData.first_name && parsedUserData.first_name.trim() !== '' 
            ? parsedUserData.first_name 
            : parsedUserData.email.split('@')[0], // Используем first_name только если он не пустой
          role: parsedUserData.role || 'student', // Берем роль напрямую из localStorage
          isActive: true,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        console.log('Final user object:', user);
        return user;
      } catch (error) {
        console.error('Ошибка парсинга данных пользователя:', error);
        return null;
      }
    }
    
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('dashecos_is_authenticated') === 'true';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  }, [user]);

  // Дополнительный useEffect для синхронизации с localStorage
  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuth = localStorage.getItem('dashecos_is_authenticated') === 'true';
      const token = localStorage.getItem('dashecos_token');
      const userData = localStorage.getItem('dashecos_user_data');
      
      if (isAuth && token && userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          const user = {
            id: parsedUserData.userId,
            email: parsedUserData.email,
            name: parsedUserData.email.split('@')[0],
            role: parsedUserData.role || 'student', // Берем роль напрямую из localStorage
            isActive: true,
            createdAt: new Date(),
            lastLogin: new Date(),
          };
          setUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Ошибка парсинга данных пользователя:', error);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    // Проверяем статус при загрузке
    checkAuthStatus();

    // Слушаем изменения в localStorage
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === 'password') { // Простая проверка для демо
      setUser(foundUser);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Очищаем все данные аутентификации
    localStorage.removeItem('dashecos_token');
    localStorage.removeItem('dashecos_is_authenticated');
    localStorage.removeItem('dashecos_user_data');
    localStorage.removeItem('user');
    // Устанавливаем активный экран в профиль для входа
    localStorage.setItem('dashecos_active_screen', 'profile');
    // Перезагружаем страницу для применения изменений
    window.location.reload();
  };

  const register = async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    // Имитация API запроса
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return false; // Пользователь уже существует
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date(),
    };

    mockUsers.push(newUser);
    setUser(newUser);
    return true;
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  const updateUserFromToken = (token: string) => {
    console.log('updateUserFromToken called with token:', token);
    try {
      // Декодируем JWT токен
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const tokenData = JSON.parse(jsonPayload);
      console.log('JWT Token Data:', tokenData);
      console.log('First name from JWT:', tokenData.first_name);
      console.log('First name type:', typeof tokenData.first_name);
      console.log('First name length:', tokenData.first_name?.length);
      console.log('First name trimmed:', tokenData.first_name?.trim());
      console.log('Student group from JWT:', tokenData.student_group);
      console.log('Student group type:', typeof tokenData.student_group);
      
      const user = {
        id: tokenData.userId,
        email: tokenData.email,
        name: tokenData.first_name && tokenData.first_name.trim() !== '' 
          ? tokenData.first_name 
          : tokenData.email.split('@')[0], // Используем first_name только если он не пустой
        role: tokenData.role || 'student', // Берем роль напрямую из токена
        avatar_id: tokenData.avatar_id,
        student_group: tokenData.student_group, // Добавляем student_group из токена
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      console.log('User object created:', user);
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Ошибка обновления пользователя из токена:', error);
    }
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('dashecos_token');
      if (!token) return;

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/user_profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Профиль пользователя с сервера:', data);
        
        if (data && data.length > 0) {
          const userData = data[0];
          
          // Сохраняем текущий student_group если он есть
          const currentUser = user;
          const currentStudentGroup = currentUser?.student_group;
          
          // Также пытаемся получить student_group из localStorage
          const storedUser = localStorage.getItem('user');
          let storedStudentGroup = null;
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              storedStudentGroup = parsedUser.student_group;
            } catch (e) {
              console.error('Ошибка парсинга пользователя из localStorage:', e);
            }
          }
          
          console.log('Текущий пользователь при обновлении профиля:', currentUser);
          console.log('Текущий student_group:', currentStudentGroup);
          console.log('student_group из localStorage:', storedStudentGroup);
          console.log('student_group из вебхука:', userData.student_group);
          
          const updatedUser = {
            id: userData.id.toString(),
            email: userData.email,
            name: userData.first_name && userData.first_name.trim() !== '' 
              ? userData.first_name 
              : userData.email.split('@')[0],
            role: userData.role || 'student',
            avatar_id: userData.avatar_id,
            avatar_name: userData.avatar_name,
            avatar_image: userData.avatar_image,
            avatar_rarity: userData.avatar_rarity,
            dashecos_coin_balance: userData.dashecos_coin_balance || 0,
            student_group: userData.student_group || currentStudentGroup || storedStudentGroup, // Используем из вебхука, текущего пользователя или localStorage
            isActive: userData.is_active,
            createdAt: new Date(userData.created_at),
            lastLogin: new Date(),
          };
          
          console.log('Обновленный профиль пользователя:', updatedUser);
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        console.error('Ошибка загрузки профиля:', response.status);
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      register,
      updateProfile,
      updateUserFromToken,
      fetchUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 