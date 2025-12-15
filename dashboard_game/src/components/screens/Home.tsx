import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LOGO_PATH } from '../../utils/paths';
import { Pickaxe, Users, Diamond, Rocket, TrendingUp, Shield, Clock } from 'lucide-react';

const Home: React.FC = () => {
  const { isDark } = useTheme();

  const ecosCards = [
    {
      title: "What?",
      icon: Pickaxe,
      color: "#f97316",
      content: "ECOS Mining Game is an innovative Bitcoin mining simulator where you can build your mining empire."
    },
    {
      title: "For Whom?",
      icon: Users,
      color: "#22c55e",
      content: "For beginners and experienced traders ready to test Bitcoin mining strategies."
    },
    {
      title: "Why?",
      icon: Diamond,
      color: "#a855f7",
      content: "Learn mining basics in a safe environment and get hands-on experience managing a mining farm."
    },
    {
      title: "How?",
      icon: Rocket,
      color: "#0ea5e9",
      content: "Start with basic equipment and expand your farm by purchasing more powerful ASIC miners."
    }
  ];

  const stats = [
    { value: '1000+', label: 'Players', icon: Users },
    { value: '24/7', label: 'Online', icon: Clock },
    { value: '100%', label: 'Secure', icon: Shield }
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-8 md:max-w-4xl">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className={`w-28 h-28 rounded-2xl overflow-hidden ${
            isDark ? 'neu-card-lg animate-float' : 'shadow-2xl'
          }`}>
            <img 
              src={LOGO_PATH} 
              alt="ECOS Mining Game Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${
          isDark ? 'text-orange-500 tracking-wider' : 'bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent'
        }`}>
          {isDark ? 'ECOS MINING' : 'ECOS Mining Game'}
        </h1>
        <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
          Build Your Mining Empire
        </p>
      </div>

      {/* 4 Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {ecosCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={index} 
              className={`p-6 transition-all duration-300 hover:scale-[1.02] ${
            isDark 
                  ? 'neu-card' 
                  : 'bg-white rounded-2xl shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center mb-4 gap-3">
                <div className={isDark ? 'neu-inset p-2' : 'p-2 bg-gray-100 rounded-lg'}>
                  <IconComponent className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <h3 className={`text-xl font-bold ${
                  isDark ? 'text-orange-500' : 'text-orange-600'
                }`}>
                {card.title}
              </h3>
            </div>
              <p className={`leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
              {card.content}
            </p>
          </div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className={`p-8 mb-8 ${isDark ? 'neu-card-lg' : 'bg-white rounded-2xl shadow-xl'}`}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <TrendingUp className={`w-6 h-6 ${isDark ? 'text-orange-500' : 'text-orange-600'}`} />
          <h2 className={`text-2xl font-bold ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
            Platform Statistics
        </h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div key={i} className={`text-center p-4 ${isDark ? 'neu-inset' : 'bg-gray-50 rounded-xl'}`}>
                <div className="flex justify-center mb-2">
                  <StatIcon className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                </div>
                <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>
                  {stat.value}
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  {stat.label}
                </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className={`text-center p-8 ${isDark ? 'neu-card neu-glow-orange' : 'bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl'}`}>
        <div className="flex justify-center mb-4">
          <Rocket className={`w-8 h-8 ${isDark ? 'text-orange-500' : 'text-white'}`} />
        </div>
        <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-orange-500' : 'text-white'}`}>
          Ready to Start?
        </h3>
        <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-orange-100'}`}>
          Join the miners community
        </p>
        <button className={`neu-btn-lg ${!isDark ? '!bg-white/20 !text-white hover:!bg-white/30 border border-white/30' : ''}`}>
          <span>Start Game</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
