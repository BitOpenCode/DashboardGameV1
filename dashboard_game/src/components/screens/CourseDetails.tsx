import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Clock, Calendar, Globe, Award, Users, CheckCircle } from 'lucide-react';

interface CourseDetailsProps {
  courseId: number;
  onBack: () => void;
}

interface Module {
  id: number;
  title: string;
  description: string;
  content: string[];
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ courseId, onBack }) => {
  const { isDark } = useTheme();
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  // Данные курса
  const course = {
    id: 1,
    title: 'Эксперт восстановительного фитнеса',
    type: 'Основной курс',
    startDate: '10 августа 2025',
    duration: '9 месяцев',
    format: 'Онлайн',
    document: 'Диплом',
    image: './course-expert-fitness.jpg',
    diplomaImage: 'https://via.placeholder.com/800x600/4A5568/FFFFFF?text=Diploma+Certificate'
  };

  // Учебные модули
  const modules: Module[] = [
    {
      id: 1,
      title: 'Фундаментальные дисциплины. От теории к практике',
      description: 'Общая анатомия, общая физиология, биохимия, биомеханика',
      content: [
        'Общая анатомия',
        'Общая физиология',
        'Биохимия',
        'Биомеханика'
      ]
    },
    {
      id: 2,
      title: 'Опорно-двигательный аппарат. Костная и мышечная система',
      description: 'Теоретический и практический блоки по работе с ОДА',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях ОДА'
      ]
    },
    {
      id: 3,
      title: 'Система кровообращения, Сердечно-сосудистая система',
      description: 'Теоретический и практический блоки по работе с ССС',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях ССС'
      ]
    },
    {
      id: 4,
      title: 'Пищеварительная система. Выделительная система',
      description: 'Теоретический и практический блоки по работе с ЖКТ',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях ЖКТ'
      ]
    },
    {
      id: 5,
      title: 'Эндокринная система',
      description: 'Теоретический и практический блоки по работе с эндокринной системой',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях эндокринной системы'
      ]
    },
    {
      id: 6,
      title: 'Иммунная система',
      description: 'Теоретический и практический блоки по работе с иммунной системой',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях иммунной системы'
      ]
    },
    {
      id: 7,
      title: 'Нервная система',
      description: 'Теоретический и практический блоки по работе с нервной системой',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях нервной системы'
      ]
    },
    {
      id: 8,
      title: 'Репродуктивная система',
      description: 'Теоретический и практический блоки по работе с репродуктивной системой',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях репродуктивной системы'
      ]
    },
    {
      id: 9,
      title: 'Дыхательная система',
      description: 'Теоретический и практический блоки по работе с дыхательной системой',
      content: [
        'Теоретический блок: Строение, Патологии',
        'Практический блок: Протоколы работы по каждой патологии, Современные методы работы тренера при заболеваниях и патологиях дыхательной системы'
      ]
    },
    {
      id: 10,
      title: 'Современные восстановительные методы фитнес-инструктора',
      description: 'Практические техники и методы',
      content: [
        'Кинезиология. Кинезитерапия в системе фитнес-тренировок',
        'Техники манипуляций (трастов)',
        'Мышечные стимуляции',
        'Тейпирование',
        'Фасциальные техники'
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
            <Globe className="w-4 h-4 text-[#94c356]" />
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

      {/* For Whom Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Для кого курс:
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Для начинающих и действующих тренеров, реабилитологов и специалистов по движению, которые хотят:
        </p>
        <ul className="space-y-2 mb-4">
          {[
            'Расширить профессиональные горизонты.',
            'Освоить востребованный сегмент восстановительного фитнеса.',
            'Привлекать больше клиентов с особыми запросами.',
            'Работать по международным стандартам и быть экспертом в области фитнеса и восстановления.',
            'Занять востребованную нишу на фитнес-рынке и достойно зарабатывать.'
          ].map((item, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-[#94c356] mt-0.5 flex-shrink-0" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* What You'll Learn Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Вы научитесь:
        </h2>
        <ul className="space-y-2 mb-4">
          {[
            'Видеть тело как единую систему.',
            'Работать с самыми сложными случаями.',
            'Применять эксклюзивные методики.'
          ].map((item, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-[#94c356] mt-0.5 flex-shrink-0" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* What You'll Get Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Вы получите:
        </h2>
        <ul className="space-y-2 mb-4">
          {[
            'Российский диплом о профессиональной переподготовке «Специалист по адаптивной физической культуре» (1137 часов) с занесением в единую базу ФИС ФРДО.',
            'Международный диплом Rehab&fitness trainer.',
            'Сертификация по дополнительным программам обучения.'
          ].map((item, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-[#94c356] mt-0.5 flex-shrink-0" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Наши дипломы имеют статус ВУЗа. Лицензия на ведение образовательной деятельности № 1595, серия бланка 78Л02 № 0000524.
        </p>
      </div>

      {/* Curriculum Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Учебный план
        </h2>
        
        <div className="space-y-4">
          {modules.map((module) => (
            <div key={module.id} className={`border rounded-lg ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
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

        {/* Bonus Section */}
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-[#94c356]/20 border border-[#94c356]/30' : 'bg-[#94c356]/10 border border-[#94c356]/20'}`}>
          <h3 className={`font-semibold mb-2 text-[#94c356]`}>
            🎁 Бонус
          </h3>
          <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Дополнительные модули
          </h4>
          <ul className="space-y-1">
            {[
              'Лаборатория движения.',
              'Практические тематические блоки и функциональные тесты.',
              'Пилатес — метод в работе инструктора групповых программ и персонального тренинга.',
              'Доступ к практическим модулям «Инструктор групповых программ» и «Персональный фитнес-тренер».'
            ].map((item, index) => (
              <li key={index} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                + {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Diploma Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Диплом
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          По окончанию курса вы получите:
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          {[
            'Российский диплом о профессиональной переподготовке «Специалист по адаптивной физической культуре» (1137 часов) с занесением в единую базу ФИС ФРДО.',
            'Международный диплом Rehab&fitness trainer.',
            'Сертификация по дополнительным программам обучения. Наши дипломы имеют статус ВУЗа.'
          ].map((item, index) => (
            <li key={index} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {item}
            </li>
          ))}
        </ol>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Лицензия на ведение образовательной деятельности № 1595, серия бланка 78Л02 № 0000524.
        </p>
        
        <div className="mt-4">
          <img 
            src={course.diplomaImage} 
            alt="Документы об образовании"
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Стоимость курса
        </h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Выберите тариф или заполните форму и получите бесплатную консультацию
        </p>
        
        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#94c356]/20 border border-[#94c356]/30' : 'bg-[#94c356]/10 border border-[#94c356]/20'}`}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Тариф 1
          </h3>
          <div className="flex items-center space-x-3 mb-2">
            <span className={`text-2xl font-bold text-[#94c356]`}>
              106 000 ₽
            </span>
            <span className={`text-sm line-through ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              120 000 ₽
            </span>
          </div>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Акция до 10 августа
          </p>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            доступна рассрочка
          </p>
          <p className={`text-lg font-semibold text-[#94c356]`}>
            8 800 ₽/мес
          </p>
        </div>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="h-20"></div>
    </div>
  );
};

export default CourseDetails;
