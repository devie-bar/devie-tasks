"use client";

import type { ReactNode } from "react";
import type { Load } from "@/lib/useLoad";
import { useSkeleton } from "@/components/useSkeleton";

/** A flat skeleton block at the real element's size and radius (DESIGN.md 3.5). Always aria-hidden. */
export function Skel({ w, h, r }: { w?: number | string; h: number; r?: number }) {
  return <span aria-hidden className="tk-skel" style={{ width: w ?? "100%", height: h, borderRadius: r ?? 8 }} />;
}

/** An error says what failed and offers Retry (DESIGN.md 3.5). */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="tk-err">
      <p>{message}</p>
      <button type="button" className="tk-btn" onClick={onRetry}>Try Again</button>
    </div>
  );
}

/**
 * loading -> skeleton (after 200ms, held 400ms), error -> sentence plus Retry,
 * otherwise the content. Empty states are the caller's job (DESIGN.md 3.3).
 */
export function AsyncView<T>({ load, skeleton, children }: { load: Load<T>; skeleton: ReactNode; children: (data: T) => ReactNode }) {
  const { skeleton: showSkel, ready } = useSkeleton(load.loading && load.data === undefined);
  if (load.error && load.data === undefined) return <LoadError message={load.error} onRetry={load.reload} />;
  if (showSkel) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="tk-sr">Loading</span>
        {skeleton}
      </div>
    );
  }
  if (load.data !== undefined && (ready || !load.loading)) {
    return (
      <>
        {load.error && <LoadError message={load.error} onRetry={load.reload} />}
        {children(load.data)}
      </>
    );
  }
  return null;
}
