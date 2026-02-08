/**
 * MaverickIntro Component
 *
 * First-time user onboarding modal for the Maverick AI Concierge.
 * Shows when user taps the mic button for the first time.
 */

import React, { useState, useEffect } from 'react';

interface MaverickIntroProps {
  onComplete: () => void; // Called when user dismisses or completes intro
  customerName?: string;
}

const MAVERICK_CAPABILITIES = [
  {
    icon: '💰',
    title: 'Check Balances',
    description: 'Instantly know your funding balance and holdings value',
  },
  {
    icon: '📊',
    title: 'Get Live Quotes',
    description: 'Real-time prices for buying or selling precious metals',
  },
  {
    icon: '📈',
    title: 'Portfolio Analysis',
    description: 'Understand your holdings, performance, and trends',
  },
  {
    icon: '📰',
    title: 'Market Intelligence',
    description: 'Stay informed with the latest market news and charts',
  },
];

export default function MaverickIntro({ onComplete, customerName }: MaverickIntroProps) {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Initial animation
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (step < 1) {
      setStep(step + 1);
    } else {
      // Mark as seen and close
      localStorage.setItem('maverick-intro-seen', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('maverick-intro-seen', 'true');
    onComplete();
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/98 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md mx-4 text-center">

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {/* Maverick Avatar */}
            <div className="relative mx-auto mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-2xl shadow-gold-500/40 animate-pulse-slow">
                <span className="text-4xl font-bold text-navy-900">M</span>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gold-500/20 blur-xl animate-ping-slow" />
            </div>

            {/* Welcome Text */}
            <h1 className="text-3xl font-bold text-white mb-3">
              Meet <span className="text-gold-400">Maverick</span>
            </h1>
            <p className="text-lg text-gray-400 mb-2">
              Your Personal AI Concierge
            </p>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8">
              {customerName
                ? `${getGreeting()}, ${customerName.split(' ')[0]}. I'm here to help with your precious metals journey.`
                : `${getGreeting()}. I'm here to help with your precious metals investments.`
              }
            </p>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-full shadow-lg shadow-gold-500/30 transition-all active:scale-95"
            >
              See What I Can Do
            </button>

            {/* Skip Link */}
            <button
              onClick={handleSkip}
              className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              Skip intro
            </button>
          </div>
        )}

        {/* Step 1: Capabilities */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
                <span className="text-navy-900 text-sm font-bold">M</span>
              </div>
              <span className="text-lg font-bold text-white">Maverick</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              How Can I Help?
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Just speak or type. I understand natural language.
            </p>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {MAVERICK_CAPABILITIES.map((cap, index) => (
                <div
                  key={cap.title}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-gold-500/30 hover:bg-gold-500/5 transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-2xl mb-2 block">{cap.icon}</span>
                  <h3 className="text-sm font-bold text-white mb-1">{cap.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{cap.description}</p>
                </div>
              ))}
            </div>

            {/* Example Prompts */}
            <div className="text-left mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                Try saying:
              </p>
              <div className="space-y-2">
                {[
                  "What's my current balance?",
                  "Get me a quote for 1 oz of gold",
                  "How's the silver market today?",
                ].map((prompt, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 bg-navy-800/50 border border-white/5 rounded-full text-sm text-gray-400 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gold-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    "{prompt}"
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-full shadow-lg shadow-gold-500/30 transition-all active:scale-95"
            >
              Start Talking to Maverick
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to check if user has seen the Maverick intro
 */
export function useMaverickIntro(): {
  hasSeenIntro: boolean;
  markAsSeen: () => void;
  resetIntro: () => void;
} {
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    return localStorage.getItem('maverick-intro-seen') === 'true';
  });

  const markAsSeen = () => {
    localStorage.setItem('maverick-intro-seen', 'true');
    setHasSeenIntro(true);
  };

  const resetIntro = () => {
    localStorage.removeItem('maverick-intro-seen');
    setHasSeenIntro(false);
  };

  return { hasSeenIntro, markAsSeen, resetIntro };
}
