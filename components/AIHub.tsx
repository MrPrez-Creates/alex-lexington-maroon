
import React from 'react';

interface AIHubProps {
  onStartChat: (initialPrompt?: string) => void;
}

const AIHub: React.FC<AIHubProps> = ({ onStartChat }) => {
  const suggestions = [
    {
      title: "PORTFOLIO ANALYSIS",
      prompt: "What is my total net worth?",
      icon: (
        <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: "MARKET INSIGHTS",
      prompt: "Why is Silver up today?",
      icon: (
        <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: "VAULT AUDIT",
      prompt: "List all Gold coins I bought in 2023.",
      icon: (
        <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 animate-fade-in pb-24 justify-center min-h-[80vh]">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-b from-gold-400 to-gold-600 shadow-[0_0_40px_rgba(212,175,55,0.2)] mb-4">
            <span className="font-serif text-4xl font-bold text-navy-900 mt-1">M</span>
        </div>
        
        <div>
            <h1 className="text-4xl font-serif text-white mb-2">
              Hello, <span className="text-gold-500">Investor.</span>
            </h1>
            <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed font-light">
              I am Maroon, your personal bullion intelligence. I can audit your vault, analyze market trends, and calculate your real-time net worth.
            </p>
        </div>
      </div>

      {/* Main Voice Action Button */}
      <div className="flex justify-center mb-12">
        <button
          onClick={() => onStartChat()}
          className="group relative w-full max-w-sm bg-navy-800/80 hover:bg-navy-800 border border-gold-500/30 rounded-full px-6 py-5 flex items-center justify-center gap-4 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
        >
           {/* Recording Indicator */}
           <div className="flex items-center justify-center w-6 h-6">
               <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
           </div>
           
           <span className="text-white font-bold tracking-[0.15em] text-sm uppercase">Activate Maroon Live</span>
           
           <svg className="w-5 h-5 text-gold-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
           </svg>
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-4 max-w-md mx-auto w-full">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-center mb-6">Suggestions</h3>
        <div className="grid gap-3">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onStartChat(item.prompt)}
              className="w-full bg-navy-800/60 hover:bg-navy-800 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-gold-500/30 transition-all group text-left"
            >
              <div className="bg-navy-900 p-2 rounded-lg border border-white/5 group-hover:border-gold-500/20 transition-colors">
                {item.icon}
              </div>
              <div>
                <h4 className="text-gold-500 font-bold text-[10px] uppercase tracking-wider mb-0.5">{item.title}</h4>
                <p className="text-white text-sm font-medium">{item.prompt}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Capability Tags */}
      <div className="pt-10 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
         {['Real-time Prices', 'Vault Auditing', 'Investment Strategy', 'Market News', 'Sentiment Analysis'].map(tag => (
             <span key={tag} className="px-3 py-1.5 rounded-full bg-navy-800/50 border border-white/5 text-[10px] font-medium text-gray-500">
                 {tag}
             </span>
         ))}
      </div>

    </div>
  );
};

export default AIHub;
