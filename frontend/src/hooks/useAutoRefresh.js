import { useEffect, useRef, useState } from "react";

export function useAutoRefresh(callback, intervalMs = 30000, enabled = true) {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(intervalMs / 1000);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const tick = setInterval(() => {
      cbRef.current();
      setLastRefresh(new Date());
      setCountdown(intervalMs / 1000);
    }, intervalMs);

    const counter = setInterval(() => {
      setCountdown(p => (p <= 1 ? intervalMs / 1000 : p - 1));
    }, 1000);

    return () => {
      clearInterval(tick);
      clearInterval(counter);
    };
  }, [intervalMs, enabled]);

  const refresh = () => {
    cbRef.current();
    setLastRefresh(new Date());
    setCountdown(intervalMs / 1000);
  };

  return { lastRefresh, countdown, refresh };
}
