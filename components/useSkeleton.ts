"use client";

import { useEffect, useRef, useState } from "react";

/**
 * DESIGN.md 3.5: the skeleton appears only after 200ms of waiting and, once
 * shown, stays at least 400ms. `skeleton` says to draw it, `ready` says the
 * real content may be drawn.
 */
export function useSkeleton(loading: boolean) {
  const [show, setShow] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => {
        shownAt.current = Date.now();
        setShow(true);
      }, 200);
      return () => clearTimeout(t);
    }
    if (show) {
      const wait = Math.max(0, 400 - (Date.now() - shownAt.current));
      const t = setTimeout(() => setShow(false), wait);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);
  return { skeleton: show, ready: !loading && !show };
}
