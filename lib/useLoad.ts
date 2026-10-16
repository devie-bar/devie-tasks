"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const LOAD_TIMEOUT_MS = 10_000;

export interface Load<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
  /** Replace the held data without a fetch (optimistic updates, realtime merges). */
  set: (next: T | ((prev: T | undefined) => T)) => void;
}

/**
 * DESIGN.md principle 6 and 3.5: every fetch has a 10 second timeout, an error
 * that says what failed, and a reload. `what` completes "Could not load ...".
 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[], what: string): Load<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const depsKey = useRef<string>("");

  useEffect(() => {
    const mine = ++seq.current;
    // A change of deps (another date, another range) must not leave the old
    // result on screen; a plain reload keeps it while the new one arrives.
    const key = JSON.stringify(deps);
    if (depsKey.current !== key) { depsKey.current = key; setData(undefined); }
    setLoading(true);
    setError(null);
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, rej) => {
      timer = setTimeout(() => rej(new Error("It took longer than 10 seconds.")), LOAD_TIMEOUT_MS);
    });
    Promise.race([fn(), timeout])
      .then((d) => { if (seq.current === mine) { setData(d); setLoading(false); } })
      .catch((e: unknown) => {
        if (seq.current !== mine) return;
        const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Unknown error.";
        setError(`Could not load ${what}. ${msg}`);
        setLoading(false);
      })
      .finally(() => clearTimeout(timer));
    return () => { seq.current++; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const set = useCallback((next: T | ((prev: T | undefined) => T)) => {
    setData((prev) => (typeof next === "function" ? (next as (p: T | undefined) => T)(prev) : next));
  }, []);
  return { data, error, loading, reload, set };
}
