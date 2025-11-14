import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowLeft, Clock, Calendar, Monitor, Award } from 'lucide-react';

interface AnatomyCourseDetailsProps {
  onBack: () => void;
}

const AnatomyCourseDetails: React.FC<AnatomyCourseDetailsProps> = ({ onBack }) => {
  const { isDark } = useTheme();

  // Данные курса
  const course = {
    id: 4,
    title: 'Анатомия для тренера',
    type: 'Интенсив',
    startDate: '15 октября 2024',
    duration: '35 часов',
    format: 'Онлайн',
    document: 'Сертификат',
    image: './course-expert-fitness.jpg'
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
        <div className="space-y-4">
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Интерактивный курс для действующих и начинающих тренеров. Это основа основ. Возможность закрепить уже имеющиеся знания и получить новые, понять причинно-следственные связи работы систем организма и их взаимосвязь с биомеханикой движения.
          </p>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            На занятиях мы подробно изучим строение тела человека с помощью онлайн-уроков в формате 3D-проекции всех сегментов, закрепим полученные знания на анатомических моделях скелета через лепку из пластилина.
          </p>
        </div>
      </div>

      {/* Certificate Section */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-8`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Сертификат
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          По окончании курса студенту выдается именной сертификат, подтверждающий освоение программы.
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
            Тариф Анатомия
          </h3>
          <div className="flex items-center space-x-3 mb-2">
            <span className={`text-2xl font-bold text-[#94c356]`}>
              15 900 ₽
            </span>
          </div>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            доступна рассрочка
          </p>
          <p className={`text-lg font-semibold text-[#94c356]`}>
            1 390 ₽/мес
          </p>
        </div>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="h-20"></div>
    </div>
  );
};

export default AnatomyCourseDetails;
