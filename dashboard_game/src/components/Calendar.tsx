import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ScheduleItem {
  id: number;
  title: string;
  teacher: string;
  room: string;
  class_type: string;
  level: string;
  participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  date: string;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  scheduleData?: ScheduleItem[];
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect, scheduleData = [] }) => {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  


  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = (firstDay.getDay() + 6) % 7; // Adjust for Monday start
    
    const days = [];
    
    // Previous month days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasWorkout = (date: Date) => {
    if (!scheduleData || scheduleData.length === 0) {
      return false;
    }
    
    // Используем локальную дату без сдвига часового пояса
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    

    
    return scheduleData.some(item => {
      // Проверяем, что item.date существует и является строкой
      if (!item.date) {
        return false;
      }
      
      let itemDateString: string;
      if (typeof item.date === 'string') {
        itemDateString = item.date.split('T')[0];
      } else {
        // Если item.date не строка, пропускаем элемент
        return false;
      }
      
      return itemDateString === dateString && item.is_active !== false;
    });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className={`rounded-2xl p-6 shadow-sm transition-colors duration-300 ${
      isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
        
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day) => (
          <div key={day} className={`text-center text-sm font-medium py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const isWorkoutDay = hasWorkout(day.date);
          const isTodayDate = isToday(day.date);
          
          return (
            <button
              key={index}
              onClick={() => {
                if (day.date) {
                  onDateSelect(day.date);
                }
              }}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative
                ${day.isCurrentMonth 
                  ? isDark
                    ? 'text-gray-200 hover:bg-gray-700 hover:text-[#94c356]'
                    : 'text-gray-800 hover:bg-[#94c356]/10 hover:text-[#94c356]'
                  : isDark
                    ? 'text-gray-600'
                    : 'text-gray-300'
                }
                ${isTodayDate 
                  ? 'bg-gradient-to-r from-[#94c356] to-[#7ba045] text-white font-semibold' 
                  : ''
                }
                ${isWorkoutDay && !isTodayDate 
                  ? isDark
                    ? 'bg-[#94c356]/30 text-[#94c356] font-medium'
                    : 'bg-[#94c356]/20 text-[#94c356] font-medium'
                  : ''
                }`}
            >
              {day.date.getDate()}
              {isWorkoutDay && (
                <div className="absolute bottom-1 w-1.5 h-1.5 bg-[#94c356] rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-[#94c356] to-[#7ba045] rounded-full"></div>
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Сегодня</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full border ${
            isDark ? 'bg-[#94c356]/30 border-[#94c356]' : 'bg-[#94c356]/20 border-[#94c356]'
          }`}></div>
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Есть занятия</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;