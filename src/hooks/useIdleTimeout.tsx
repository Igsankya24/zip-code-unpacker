import { useEffect, useRef, useCallback } from "react";

interface UseIdleTimeoutProps {
  timeout: number; // in milliseconds
  onTimeout: () => void;
  enabled?: boolean;
}

export const useIdleTimeout = ({ timeout, onTimeout, enabled = true }: UseIdleTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep callback ref updated
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeout);
  }, [timeout, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Start the timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, enabled]);

  return { resetTimer };
};

