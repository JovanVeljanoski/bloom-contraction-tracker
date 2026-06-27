/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Re-render-friendly clock for components that compute time-based stats
 * (sliding windows, "sustained for 1 hour" checks). Returns a `now` timestamp
 * that updates on an interval so values age out and thresholds flip without
 * requiring a user interaction to force a re-render.
 */

import { useState, useEffect } from 'react';

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
