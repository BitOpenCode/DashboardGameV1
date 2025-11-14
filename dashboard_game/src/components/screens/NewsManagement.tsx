import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Eye, Edit, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NewsItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'event';
  image_url?: string;
  link_url?: string;
  show_button: boolean;
  button_text: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

interface NewsManagementProps {
  onBack: () => void;
  isDark: boolean;
}

const NewsManagement: React.FC<NewsManagementProps> = ({ onBack, isDark }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'published' | 'create' | 'edit'>('published');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  
  // Форма создания новости
  const [newsForm, setNewsForm] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    image_url: '',
    link_url: '',
    show_button: false,
    button_text: 'Читать далее'
  });

  useEffect(() => {
    if (activeView === 'published') {
      fetchPublishedNews();
    }
  }, [activeView]);

  const fetchPublishedNews = async () => {
    const token = localStorage.getItem('dashecos_token');
    if (!token) {
      setError('Необходимо войти в систему');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/news-get-published', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Данные получены в NewsManagement:', data);
        
        // Проверяем различные форматы ответа (как в NotificationsScreen)
        let newsData = [];
        if (data.success && data.news) {
          newsData = data.news;
        } else if (data.news) {
          newsData = data.news;
        } else if (data.data) {
          newsData = data.data;
        } else if (Array.isArray(data)) {
          newsData = data;  // ← Наш случай!
        } else if (data && typeof data === 'object') {
          // Если ответ - объект, ищем массив новостей в его свойствах
          const keys = Object.keys(data);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              newsData = data[key];
              break;
            }
          }
        }
        
        console.log('Устанавливаем новости:', newsData);
        setNews(newsData);
      } else {
        setError('Ошибка соединения с сервером');
      }
    } catch (err) {
      console.error('Ошибка загрузки новостей:', err);
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNews = async () => {
    const token = localStorage.getItem('dashecos_token');
    if (!token) {
      alert('Ошибка: пользователь не авторизован');
      return;
    }

    try {
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/news-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newsForm,
          created_by_id: user?.id,
          created_by_name: user?.name || user?.email,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Новость успешно создана!');
          setNewsForm({
            title: '',
            message: '',
            type: 'info',
            image_url: '',
            link_url: '',
            show_button: false,
            button_text: 'Читать далее'
          });
          setActiveView('published');
          fetchPublishedNews();
        } else {
          alert(data.message || 'Ошибка создания новости');
        }
      } else {
        alert('Ошибка соединения с сервером');
      }
    } catch (err) {
      console.error('Ошибка создания новости:', err);
      alert('Ошибка соединения');
    }
  };

  const handleEditNews = async (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setNewsForm({
      title: newsItem.title,
      message: newsItem.message,
      type: newsItem.type,
      image_url: newsItem.image_url || '',
      link_url: newsItem.link_url || '',
      show_button: newsItem.show_button,
      button_text: newsItem.button_text || 'Читать далее'
    });
    setActiveView('edit');
  };

  const handleUpdateNews = async () => {
    if (!editingNews) return;
    
    const token = localStorage.getItem('dashecos_token');
    if (!token) {
      alert('Ошибка: пользователь не авторизован');
      return;
    }

    try {
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/news-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingNews.id,
          ...newsForm
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Новость успешно обновлена!');
          setEditingNews(null);
          setActiveView('published');
          fetchPublishedNews();
        } else {
          alert(data.message || 'Ошибка обновления новости');
        }
      } else {
        alert('Ошибка соединения с сервером');
      }
    } catch (err) {
      console.error('Ошибка обновления новости:', err);
      alert('Ошибка соединения');
    }
  };

  const handleDeleteNews = async (newsId: number) => {
    const token = localStorage.getItem('dashecos_token');
    if (!token || !confirm('Вы уверены, что хотите удалить эту новость?')) {
      return;
    }

    try {
      // Немедленно убираем новость из состояния для лучшего UX
      setNews(prevNews => prevNews.filter(item => item.id !== newsId));
      
      const response = await fetch('https://n8n.bitcoinlimb.com/webhook/news-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: newsId
        })
      });

      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            // Новость уже убрана из состояния, просто показываем сообщение
            alert('Новость удалена!');
          } else {
            alert(data.message || 'Ошибка удаления новости');
            // Если ошибка, возвращаем новость обратно в состояние
            fetchPublishedNews();
          }
        } catch (jsonError) {
          console.error('Ошибка парсинга JSON:', jsonError);
          alert('Ошибка удаления новости');
          // Возвращаем новость обратно в состояние
          fetchPublishedNews();
        }
      } else {
        alert('Ошибка соединения с сервером');
        // Возвращаем новость обратно в состояние
        fetchPublishedNews();
      }
    } catch (err) {
      console.error('Ошибка удаления новости:', err);
      alert('Ошибка соединения');
      // Возвращаем новость обратно в состояние
      fetchPublishedNews();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Дата не указана';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неверная дата';
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
    
    switch (type) {
      case 'event':
        return `border-l-blue-500 ${bgColor}`;
      case 'warning':
        return `border-l-yellow-500 ${bgColor}`;
      case 'success':
        return `border-l-orange-500 ${bgColor}`;
      default:
        return `border-l-orange-500 ${bgColor}`;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'event':
        return 'Событие';
      case 'warning':
        return 'Предупреждение';
      case 'success':
        return 'Успех';
      default:
        return 'Информация';
    }
  };

  // Экран создания новости
  if (activeView === 'create' || activeView === 'edit') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-800'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveView('published')}
            className={`p-2 rounded-lg ${isDark ? 'text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {activeView === 'create' ? 'Создать новость' : 'Редактировать новость'}
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-6">
          {/* Оглавление */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Оглавление *
            </label>
            <input
              type="text"
              required
              value={newsForm.title}
              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Заголовок новости"
            />
          </div>

          {/* Тип новости */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Тип новости
            </label>
            <select
              value={newsForm.type}
              onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value as any })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="info">Информация</option>
              <option value="warning">Предупреждение</option>
              <option value="success">Успех</option>
              <option value="event">Событие</option>
            </select>
          </div>

          {/* Ссылка на картинку */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Ссылка на картинку
            </label>
            <div className="relative">
              <input
                type="url"
                value={newsForm.image_url}
                onChange={(e) => setNewsForm({ ...newsForm, image_url: e.target.value })}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="https://example.com/image.jpg"
              />
              <ImageIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>

          {/* Текстовый блок */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Текстовый блок *
            </label>
            <textarea
              required
              rows={6}
              value={newsForm.message}
              onChange={(e) => setNewsForm({ ...newsForm, message: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder="Подробное описание новости..."
            />
          </div>

          {/* Ссылка на новость */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Ссылка на новость
            </label>
            <div className="relative">
              <input
                type="url"
                value={newsForm.link_url}
                onChange={(e) => setNewsForm({ ...newsForm, link_url: e.target.value })}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="https://example.com/news"
              />
              <LinkIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>

          {/* Показывать кнопку */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="show_button"
              checked={newsForm.show_button}
              onChange={(e) => setNewsForm({ ...newsForm, show_button: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="show_button" className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Показывать кнопку на новость
            </label>
          </div>

          {/* Текст кнопки */}
          {newsForm.show_button && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Текст кнопки
              </label>
              <input
                type="text"
                value={newsForm.button_text}
                onChange={(e) => setNewsForm({ ...newsForm, button_text: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="Читать далее"
              />
            </div>
          )}

          {/* Кнопки */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={() => setActiveView('published')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Отмена
            </button>
            <button
              onClick={activeView === 'create' ? handleCreateNews : handleUpdateNews}
              disabled={!newsForm.title || !newsForm.message}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 hover:from-orange-600 hover:to-orange-500 flex items-center justify-center space-x-2"
            >
              {activeView === 'create' ? (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Создать новость</span>
                </>
              ) : (
                <>
                  <span>Обновить новость</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Основной экран с опубликованными новостями
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onBack}
          className={`p-2 rounded-lg ${isDark ? 'text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Управление новостями
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Кнопки навигации */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveView('published')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeView === 'published'
                ? 'bg-orange-500 text-white'
                : isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Опубликованные новости
          </button>
          <button
            onClick={() => setActiveView('create')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeView === 'create'
                ? 'bg-orange-500 text-white'
                : isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Создать новость
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Загрузка новостей...</p>
            </div>
          </div>
        ) : error ? (
          <div className={`text-center py-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <p className="text-lg font-medium mb-2">Ошибка загрузки</p>
            <p className="text-sm opacity-75">{error}</p>
            <button
              onClick={fetchPublishedNews}
              className={`mt-4 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Попробовать снова
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17v-3a5 5 0 00-5-5H5a5 5 0 00-5 5v3h15z" />
            </svg>
            <p className="text-lg font-medium mb-2">Нет опубликованных новостей</p>
            <p className="text-sm opacity-75">Создайте первую новость, нажав на кнопку "Создать новость"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news
              .filter((newsItem, index, array) => 
                newsItem && newsItem.id && 
                array.findIndex(item => item.id === newsItem.id) === index
              )
              .map((newsItem) => (
              <div
                key={`news-${newsItem.id}-${newsItem.created_at}`}
                className={`p-4 rounded-xl border-l-4 transition-all duration-200 ${
                  getTypeColor(newsItem.type)
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'text-white' : 'text-gray-800'} ${getTypeColor(newsItem.type)}`}>
                      {getTypeName(newsItem.type)}
                    </span>
                    <span className={`text-xs opacity-75 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(newsItem.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditNews(newsItem)}
                      className={`p-2 rounded-lg ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(newsItem.id)}
                      className={`p-2 rounded-lg ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-500 hover:bg-gray-100'}`}
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{newsItem.title}</h3>
                
                {newsItem.image_url && (
                  <div className="mb-3">
                    <img 
                      src={newsItem.image_url} 
                      alt="Изображение новости"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {newsItem.message}
                </p>
                
                {newsItem.show_button && newsItem.link_url && (
                  <div className="flex items-center justify-between">
                    <a
                      href={newsItem.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isDark 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {newsItem.button_text}
                    </a>
                  </div>
                )}
                
                <div className={`text-xs opacity-75 mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Автор: {newsItem.created_by}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsManagement;
