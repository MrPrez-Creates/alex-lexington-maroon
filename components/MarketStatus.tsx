
import React, { useState, useEffect } from 'react';

const MarketStatus: React.FC = () => {
  const [status, setStatus] = useState<{isOpen: boolean, label: string}>({ isOpen: false, label: 'Checking...' });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      // NY Time format
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: 'America/New_York', 
        hour12: false, 
        weekday: 'short', 
        hour: 'numeric' 
      };
      
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value;
      
      const day = getPart('weekday');
      const hour = parseInt(getPart('hour') || '0', 10);

      let isOpen = true;
      let label = "MARKET OPEN"; 

      // Market Hours (NY Time):
      // Opens: Sunday 18:00
      // Closes: Friday 17:00
      // Daily Break: 17:00 - 18:00 (Mon-Thu)

      if (day === 'Sat') {
          isOpen = false;
          label = "MARKET CLOSED";
      } else if (day === 'Fri') {
          if (hour >= 17) {
              isOpen = false;
              label = "MARKET CLOSED";
          }
      } else if (day === 'Sun') {
          if (hour < 18) {
              isOpen = false;
              label = "MARKET CLOSED";
          }
      } else {
          // Mon-Thu
          if (hour === 17) {
              isOpen = false;
              label = "MARKET BREAK";
          }
      }

      setStatus({ isOpen, label });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Design match: Dark green background for open, dark red for closed. 
  // Text is white and bold. Dot is bright.
  const containerClass = status.isOpen 
    ? 'bg-[#064E3B] border border-[#059669]/50 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
    : 'bg-[#450a0a] border border-[#b91c1c]/50 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    
  const dotClass = status.isOpen ? 'bg-[#34D399]' : 'bg-[#EF4444]';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${containerClass}`}>
        <span className="relative flex h-1.5 w-1.5">
          {status.isOpen && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}></span>}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotClass}`}></span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider leading-none whitespace-nowrap">
            {status.label}
        </span>
    </div>
  );
};

export default MarketStatus;
