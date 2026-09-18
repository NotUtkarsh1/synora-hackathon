import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface RateLimitContextType {
  attemptRequest: () => { allowed: boolean; reason: 'cooldown' | 'ratelimit' | 'none'; wait?: number };
  isCoolingDown: boolean;
  rateLimitWait: number;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export const RateLimitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [rateLimitWait, setRateLimitWait] = useState<number>(0);
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Update 2-second cooldown
      setIsCoolingDown(now - lastRequestTime < 2000);

      // Update 60-second window
      const validTimestamps = timestamps.filter((t) => now - t < 60000);
      if (validTimestamps.length !== timestamps.length) {
        setTimestamps(validTimestamps);
      }

      // Check max 5 requests per 60s
      if (validTimestamps.length >= 5) {
        const oldest = Math.min(...validTimestamps);
        const wait = Math.ceil((oldest + 60000 - now) / 1000);
        setRateLimitWait(Math.max(0, wait));
      } else {
        setRateLimitWait(0);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [timestamps, lastRequestTime]);

  const attemptRequest = useCallback(() => {
    const now = Date.now();
    
    // Check 2-second spam cooldown
    if (now - lastRequestTime < 2000) {
      return { allowed: false, reason: 'cooldown' as const };
    }
    
    // Check 60-second rolling window
    const validTimestamps = timestamps.filter((t) => now - t < 60000);
    if (validTimestamps.length >= 5) {
      const oldest = Math.min(...validTimestamps);
      const wait = Math.ceil((oldest + 60000 - now) / 1000);
      return { allowed: false, reason: 'ratelimit' as const, wait };
    }
    
    // Accept request and update state immediately
    const newTimestamps = [...validTimestamps, now];
    setTimestamps(newTimestamps);
    setLastRequestTime(now);
    setIsCoolingDown(true); // Immediate UI update for the 2s cooldown
    
    if (newTimestamps.length >= 5) {
      const oldest = Math.min(...newTimestamps);
      const wait = Math.ceil((oldest + 60000 - now) / 1000);
      setRateLimitWait(Math.max(0, wait));
    }
    
    return { allowed: true, reason: 'none' as const };
  }, [timestamps, lastRequestTime]);

  return (
    <RateLimitContext.Provider value={{ attemptRequest, isCoolingDown, rateLimitWait }}>
      {children}
    </RateLimitContext.Provider>
  );
};

export const useRateLimit = () => {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
};
