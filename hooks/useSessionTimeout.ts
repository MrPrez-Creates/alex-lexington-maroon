/**
 * Session Inactivity Timeout Hook
 *
 * Tracks user activity (clicks, keys, scrolls, touches).
 * After 30 minutes of inactivity, shows a warning.
 * After 35 minutes, auto-logs out.
 *
 * Also listens for AUTH_ERROR_EVENT from apiClient (401/403 recovery failure).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AUTH_ERROR_EVENT } from '../services/apiClient';

const TIMEOUT_WARNING_MS = 30 * 60 * 1000; // 30 minutes → show warning
const TIMEOUT_LOGOUT_MS = 35 * 60 * 1000;  // 35 minutes → auto-logout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

interface UseSessionTimeoutOptions {
  onLogout: () => void;
  enabled: boolean; // Only run when user is authenticated
}

interface UseSessionTimeoutReturn {
  showTimeoutWarning: boolean;
  dismissWarning: () => void;
  showAuthExpired: boolean;
  dismissAuthExpired: () => void;
}

export function useSessionTimeout({ onLogout, enabled }: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [showAuthExpired, setShowAuthExpired] = useState(false);
  const warningTimer = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastActivity = useRef(Date.now());

  const resetTimers = useCallback(() => {
    lastActivity.current = Date.now();
    setShowTimeoutWarning(false);

    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    if (!enabled) return;

    warningTimer.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, TIMEOUT_WARNING_MS);

    logoutTimer.current = setTimeout(() => {
      setShowTimeoutWarning(false);
      onLogout();
    }, TIMEOUT_LOGOUT_MS);
  }, [enabled, onLogout]);

  // Dismiss warning and reset timers (user is still active)
  const dismissWarning = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Dismiss auth expired banner
  const dismissAuthExpired = useCallback(() => {
    setShowAuthExpired(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (!enabled) {
      // Clear timers when not authenticated
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      setShowTimeoutWarning(false);
      return;
    }

    // Start timers
    resetTimers();

    // Throttled activity handler (updates at most once per 30 seconds to avoid perf overhead)
    let lastReset = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > 30_000) {
        lastReset = now;
        resetTimers();
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [enabled, resetTimers]);

  // Listen for auth errors from apiClient (401/403 that couldn't be recovered)
  useEffect(() => {
    const handleAuthError = () => {
      setShowAuthExpired(true);
      // Auto-logout after showing the message briefly
      setTimeout(() => {
        setShowAuthExpired(false);
        onLogout();
      }, 3000);
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, [onLogout]);

  return {
    showTimeoutWarning,
    dismissWarning,
    showAuthExpired,
    dismissAuthExpired,
  };
}
