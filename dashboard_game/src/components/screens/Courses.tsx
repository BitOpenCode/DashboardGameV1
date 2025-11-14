import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Award, Users, Cpu, HardDrive } from 'lucide-react';
import EventsList from '../EventsList';
import CourseDetails from './CourseDetails';

interface CoursesProps {
  onNavigateToFFT?: () => void;
  onNavigateToODA?: () => void;
  onNavigateToAnatomy?: () => void;
}

const Courses: React.FC<CoursesProps> = ({ onNavigateToFFT, onNavigateToODA, onNavigateToAnatomy }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  
  const isAdmin = user?.role === 'admin';

  const handleCourseSelect = (courseId: number) => {
    setSelectedCourse(courseId);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
  };

  const handleFFTCourseClick = () => {
    if (onNavigateToFFT) {
      onNavigateToFFT();
    }
  };

  const handleODACourseClick = () => {
    if (onNavigateToODA) {
      onNavigateToODA();
    }
  };

  const handleAnatomyCourseClick = () => {
    if (onNavigateToAnatomy) {
      onNavigateToAnatomy();
    }
  };

  const courses = [
    {
      id: 1,
      title: 'Базовый майнинг Bitcoin',
      duration: 'Постоянно',
      type: 'Основной майнинг',
      price: 'Bitcoin',
      startDate: 'Доступно сейчас',
      description: 'Начните добычу Bitcoin с базовым оборудованием. Изучите основы майнинга и начните зарабатывать первую криптовалюту.',
      features: [
        'Настройка майнинг-фермы',
        'Оптимизация энергопотребления',
        'Мониторинг доходности',
        'Управление пулами',
        'Безопасность кошельков'
      ],
      icon: Award
    },
    {
      id: 2,
      title: 'ASIC Майнеры',
      duration: '24/7',
      type: 'Профессиональный',
      price: 'Высокая доходность',
      startDate: 'Доступно сейчас',
      description: 'Используйте специализированные ASIC-майнеры для максимальной эффективности добычи Bitcoin.',
      features: [
        'Высокая хешрейт',
        'Энергоэффективность',
        'Автоматизация процессов',
        'Масштабирование'
      ],
      icon: Cpu
    },
    {
      id: 3,
      title: 'GPU Майнинг',
      duration: 'Гибкий график',
      type: 'Универсальный',
      price: 'Множество монет',
      startDate: 'Доступно сейчас',
      description: 'Добывайте различные криптовалюты с помощью видеокарт. Гибкость в выборе монет для майнинга.',
      features: [
        'Множество алгоритмов',
        'Гибкость переключения',
        'Доступность оборудования',
        'Обучение на практике'
      ],
      icon: HardDrive
    },
    {
      id: 4,
      title: 'Облачный майнинг',
      duration: 'По подписке',
      type: 'Удаленный',
      price: 'Без оборудования',
      startDate: 'Доступно сейчас',
      description: 'Арендуйте вычислительные мощности для майнинга без покупки собственного оборудования.',
      features: [
        'Без вложений в оборудование',
        'Удаленное управление',
        'Автоматические выплаты',
        'Масштабируемость'
      ],
      icon: Users
    }
  ];





  // Если выбран курс, показываем детальный экран
  if (selectedCourse) {
    return (
      <CourseDetails 
        courseId={selectedCourse}
        onBack={handleBackToCourses}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          Майнинг оборудование
        </h1>
        <p className={`text-lg ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Выберите тип майнинга и начните добычу криптовалют
        </p>
      </div>

      {/* Courses Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          Доступные типы майнинга
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const Icon = course.icon;
            return (
              <div key={course.id} className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-gray-800 border border-gray-700 hover:border-orange-600' 
                  : 'bg-white border border-gray-200 hover:border-orange-500 shadow-xl'
              }`}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 mr-4">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      {course.title}
                    </h3>
                    <span className="text-sm text-orange-600 font-medium">
                      {course.type}
                    </span>
                  </div>
                </div>
                
                <p className={`text-sm mb-4 leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {course.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {course.duration}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {course.startDate}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-sm font-medium rounded-full">
                    {course.price}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {course.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => {
                    if (course.id === 2) return handleFFTCourseClick();
                    if (course.id === 3) return handleODACourseClick();
                    if (course.id === 4) return handleAnatomyCourseClick();
                    return handleCourseSelect(course.id);
                  }}
                  className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isDark
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}>
                  Подробнее
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className={`p-6 rounded-2xl ${
        isDark 
          ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-700' 
          : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
      }`}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-orange-600">
            Активность майнинга
          </h2>
        </div>
        
        <EventsList 
          onEditEvent={undefined}
          onDeleteEvent={undefined}
        />
      </div>
    </div>
  );
};

export default Courses;