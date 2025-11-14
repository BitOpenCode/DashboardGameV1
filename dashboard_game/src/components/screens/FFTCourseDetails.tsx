import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Clock, Calendar, Monitor, Award, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FFTCourseDetailsProps {
  onBack: () => void;
}

interface Module {
  id: number;
  title: string;
  description: string;
  content: string[];
}

const FFTCourseDetails: React.FC<FFTCourseDetailsProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  // Данные курса
  const course = {
    id: 2,
    title: 'FFT Functional Future Training',
    type: 'Интенсив',
    startDate: '15 октября 2025',
    duration: '24 часа',
    format: 'Онлайн',
    document: 'Сертификат',
    image: './course-expert-fitness.jpg'
  };

  // Учебные модули
  const modules: Module[] = [
    {
      id: 1,
      title: 'Тренировки на кор',
      description: 'Фокус на мышцы кора: пресс, спина, бёдра.',
      content: [
        'Упражнения для мышц пресса',
        'Тренировка мышц спины',
        'Укрепление мышц бёдер',
        'Стабилизация корпуса'
      ]
    },
    {
      id: 2,
      title: 'Balance',
      description: 'Тренировки с фокусом на подвижности суставов, балансе и гибкости.',
      content: [
        'Упражнения на баланс',
        'Развитие подвижности суставов',
        'Улучшение гибкости',
        'Стабилизация тела'
      ]
    },
    {
      id: 3,
      title: 'Functional props/step, BOSU',
      description: 'Тренировки с весом тела с использованием дополнительного оборудования.',
      content: [
        'Работа с BOSU',
        'Упражнения на степ-платформе',
        'Функциональные движения',
        'Комбинированные упражнения'
      ]
    },
    {
      id: 4,
      title: 'Functional Strength Training',
      description: 'Тренировки с акцентом на силовые упражнения, имитирующие реальные движения.',
      content: [
        'Силовые упражнения',
        'Функциональные движения',
        'Имитация реальных действий',
        'Развитие силы'
      ]
    },
    {
      id: 5,
      title: 'Functional Kettlebells',
      description: 'Тренировки с использованием гирь.',
      content: [
        'Базовые упражнения с гирями',
        'Функциональные движения',
        'Техника выполнения',
        'Программы тренировок'
      ]
    },
    {
      id: 6,
      title: 'Functional ropes',
      description: 'Тренировки с использованием каната.',
      content: [
        'Упражнения с канатом',
        'Функциональные движения',
        'Развитие выносливости',
        'Силовые элементы'
      ]
    },
    {
      id: 7,
      title: 'HIITS',
      description: 'Высокоинтенсивные интервальные тренировки. Чередование коротких взрывных упражнений (20–60 сек) с отдыхом или низкой интенсивностью.',
      content: [
        'Интервальные тренировки',
        'Взрывные упражнения',
        'Чередование нагрузки и отдыха',
        'Развитие выносливости'
      ]
    },
    {
      id: 8,
      title: 'Circuit Training',
      description: 'Уникальные методики круговой тренировки: протоколы.',
      content: [
        'Круговые тренировки',
        'Протоколы выполнения',
        'Комбинированные упражнения',
        'Интенсивность нагрузки'
      ]
    },
    {
      id: 9,
      title: 'Plyometric Training',
      description: 'Упор на взрывные движения для развития мощности.',
      content: [
        'Взрывные движения',
        'Развитие мощности',
        'Плиометрические упражнения',
        'Техника выполнения'
      ]
    },
    {
      id: 10,
      title: 'TRX training',
      description: 'Тренировки с использованием функциональных петель.',
      content: [
        'Упражнения на TRX',
        'Функциональные петли',
        'Стабилизация тела',
        'Развитие силы'
      ]
    }
  ];

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl md:px-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg shadow-sm hover:shadow-md transition-all ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Курс «{course.title}»
          </h1>
        </div>
      </div>

      {/* Course Image */}
      <div className="mb-8">
        <img 
          src={course.image} 
          alt={course.title}
          className="w-full h-64 object-cover rounded-xl shadow-lg"
        />
      </div>

      {/* Course Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-[#94c356]" />
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Старт обучения
            </span>
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {course.startDate}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-[#94c356]" />
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Длительность
            </span>
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {course.duration}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center space-x-2 mb-2">
            <Monitor className="w-4 h-4 text-[#94c356]" />
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Формат
            </span>
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {course.format}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 text-[#94c356]" />
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Документ
            </span>
          </div>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {course.document}
          </p>
        </div>
      </div>

      {/* Course Description */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          О курсе
        </h2>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Functional Future Training (FFT) – профессиональный семинар по функциональному тренингу
        </p>
      </div>

      {/* For Whom */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <div className="flex items-center space-x-3 mb-4">
          <Users className={`w-6 h-6 text-[#94c356]`} />
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Для кого курс
          </h3>
        </div>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Для начинающих и практикующих тренеров групповых программ и тренажерного зала, которые хотят:
        </p>
        <ul className="space-y-2">
          {[
            'Освоить современные методики функционального тренинга.',
            'Научиться проводить тренировки через призму двигательных паттернов.',
            'Работать с разным оборудованием и трекерами для мониторинга прогресса.',
            'Добавить в арсенал 10 уникальных форматов тренировок и 100+ упражнений.',
            'Адаптировать программы для клиентов любого уровня подготовки.',
            'Интегрировать FFT в программы восстановительного фитнеса.',
            'Вывести свои тренировки на новый профессиональный уровень.'
          ].map((item, index) => (
            <li key={index} className="flex items-start space-x-3">
              <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 text-[#94c356]`} />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* What You Will Learn */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className={`w-6 h-6 text-[#94c356]`} />
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Вы научитесь
          </h3>
        </div>
        <ul className="space-y-2">
          {[
            'Видеть и анализировать движение как систему.',
            'Проводить тренировки по принципам биомеханики.',
            'Использовать 10 форматов FFT на практике.',
            'Работать с трекерами пульса и интенсивности.',
            'Создавать адаптивные программы под любые цели.',
            'Комбинировать оборудование и работу с весом тела.',
            'Внедрять функциональный тренинг в восстановительные программы.'
          ].map((item, index) => (
            <li key={index} className="flex items-start space-x-3">
              <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 text-[#94c356]`} />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Curriculum */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Учебный план
        </h2>
        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module.id} className={`rounded-lg ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
              <button
                onClick={() => toggleModule(module.id)}
                className={`w-full p-4 text-left flex items-center justify-between hover:bg-opacity-50 transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Модуль {module.id}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {module.title}
                  </p>
                </div>
                <div className={`transform transition-transform ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {expandedModules.includes(module.id) && (
                <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {module.description}
                  </p>
                  <ul className="space-y-1">
                    {module.content.map((item, index) => (
                      <li key={index} className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Сертификат
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          По окончании курса студенту IRFit выдается именной сертификат, подтверждающий освоение программы.
        </p>
      </div>

      {/* Pricing Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Стоимость интенсива
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Выберите тариф или заполните форму и получите бесплатную консультацию
        </p>
        
        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#94c356]/20 border border-[#94c356]/30' : 'bg-[#94c356]/10 border border-[#94c356]/20'}`}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Тариф FFT
          </h3>
          <div className="flex items-center space-x-3 mb-2">
            <span className={`text-2xl font-bold text-[#94c356]`}>
              14 900 ₽
            </span>
          </div>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            доступна рассрочка
          </p>
          <p className={`text-lg font-semibold text-[#94c356]`}>
            1 290 ₽/мес
          </p>
        </div>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="h-20"></div>
    </div>
  );
};

export default FFTCourseDetails;
