import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LOGO_PATH } from '../../utils/paths';

const Home: React.FC = () => {
  const { isDark } = useTheme();

  const ecosCards = [
    {
      title: "Что?",
      icon: "⛏️",
      content: "ECOS Mining Game — это инновационная игра-симулятор майнинга Bitcoin, где вы можете построить свою майнинг-империю. Управляйте оборудованием, оптимизируйте энергопотребление и добывайте Bitcoin в реалистичной симуляции."
    },
    {
      title: "Для кого?",
      icon: "👥",
      content: "– Для новичков в Bitcoin — тех, кто хочет понять принципы майнинга без реальных инвестиций.\n\n– Для опытных трейдеров и майнеров, готовых протестировать стратегии и оптимизировать процессы добычи Bitcoin."
    },
    {
      title: "Зачем?",
      icon: "💎",
      content: "– Изучите основы майнинга Bitcoin в безопасной среде.\n\n– Оптимизируйте стратегии добычи без риска потери средств.\n\n– Получите практический опыт управления майнинг-фермой.\n\n– Участвуйте в соревнованиях с другими игроками.\n\n– Зарабатывайте игровую валюту и улучшайте оборудование."
    },
    {
      title: "Как?",
      icon: "🚀",
      content: "Начните с базового оборудования и постепенно расширяйте свою майнинг-ферму. Покупайте более мощные видеокарты, процессоры и ASIC-майнеры. Оптимизируйте энергопотребление и добывайте Bitcoin с максимальной эффективностью."
    }
  ];

  const ecosInfo = {
    title: "Информация об ECOS",
    subtitle: "Что такое ECOS Mining Game",
    description: "ECOS Mining Game — это передовая симуляция майнинга Bitcoin, созданная для обучения и развлечения. Наша платформа объединяет реалистичную физику майнинга с увлекательным геймплеем, позволяя игрокам освоить все аспекты добычи Bitcoin.",
    achievements: [
      "Реалистичная симуляция майнинга",
      "1000+ активных игроков",
      "Динамическая экономика игры",
      "Соревновательные элементы",
      "Образовательный контент",
      "Безопасная среда для обучения"
    ]
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500 shadow-2xl bg-white p-1">
            <img 
              src={LOGO_PATH} 
              alt="ECOS Mining Game Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          ECOS Mining Game
        </h1>
        <p className={`text-lg md:text-xl ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Постройте свою майнинг-империю и станьте Bitcoin магнатом
        </p>
      </div>

      {/* 4 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {ecosCards.map((card, index) => (
          <div key={index} className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 ${
            isDark 
              ? 'bg-gray-800 border border-gray-700 hover:border-orange-600' 
              : 'bg-white border border-gray-200 hover:border-orange-500 shadow-xl'
          }`}>
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{card.icon}</span>
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                {card.title}
              </h3>
            </div>
            <p className={`leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {card.content}
            </p>
          </div>
        ))}
      </div>

      {/* ECOS Information */}
      <div className={`p-8 rounded-2xl mb-8 ${
        isDark 
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-r from-gray-50 to-white border border-gray-200'
      }`}>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          {ecosInfo.title}
        </h2>
        <h3 className="text-xl font-semibold mb-4 text-center text-orange-600">
          {ecosInfo.subtitle}
        </h3>
        <p className={`text-lg leading-relaxed mb-6 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {ecosInfo.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ecosInfo.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className={`${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {achievement}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className={`text-center p-8 rounded-2xl ${
        isDark 
          ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-700' 
          : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
      }`}>
        <h3 className="text-2xl font-bold mb-4 text-orange-600">
          Готовы начать майнинг?
        </h3>
        <p className={`text-lg mb-6 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Присоединяйтесь к сообществу майнеров и постройте свою криптовалютную империю
        </p>
        <button 
          className={`inline-block px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 shadow-lg`}
        >
          Начать игру
        </button>
      </div>
    </div>
  );
};

export default Home;