'use client';

import { useEffect, useState } from 'react';

/**
 * Ticket 028 — one rotation, shared by everything in the hero that shows today's deals.
 *
 * The hero has two of them: the chip under the badge and the card the pair presents. Two independent
 * timers would drift apart within seconds and the hero would contradict itself — the chip announcing
 * France while the card sells Japan. So the index lives here and both read from it.
 *
 * Pausing is shared for the same reason. Hovering either one stops both, because they are two views
 * of one thing, and because a card that changes under a cursor already travelling toward *Add to
 * cart* is how visitors buy the wrong country.
 *
 * `prefers-reduced-motion` stops the advance entirely rather than merely shortening it. Beside a
 * purchase control that preference has to be taken literally.
 */

const ADVANCE_MS = 6000;

export interface PauseHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocusCapture: () => void;
  onBlurCapture: () => void;
}

export function useDealRotation(count: number) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex((i) => i + 1), ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const pauseHandlers: PauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: () => setPaused(false),
  };

  // Modulo rather than a wrapped counter: the deal list can shrink under us when the query refetches.
  return { active: count > 0 ? index % count : 0, setIndex, pauseHandlers };
}
