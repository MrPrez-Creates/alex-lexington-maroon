import { useState } from 'react';

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
