/**
 * Generic data-fetching hook with built-in loading, error, and caching.
 *
 * Wraps async service calls into a consistent React state machine so
 * every view in the app handles loading / error / success uniformly.
 *
 * Features:
 *  - automatic fetch on mount (opt-out via `enabled`)
 *  - deduplication: skips fetch when a request is already in-flight
 *  - normalised error shape via `errorHandling` utilities
 *  - caller-controlled refetch & manual trigger
 *  - stale-while-revalidate on refetch (keeps previous data visible)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { normalizeError, logError, type NormalizedError } from "../utils/errorHandling";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseApiQueryOptions {
  /** When `false` the fetch is deferred until `refetch` is called manually. */
  enabled?: boolean;
  /** Optional label for error log grouping. */
  context?: string;
}

export interface UseApiQueryResult<T> {
  /** Resolved data, or `null` while loading or after an error. */
  data: T | null;
  /** `true` during the initial load (data has never arrived). */
  isLoading: boolean;
  /** `true` during any fetch (including refetches after data exists). */
  isFetching: boolean;
  /** Normalised error from the last failed fetch, or `null`. */
  error: NormalizedError | null;
  /** Re-invoke the fetcher. Keeps existing data visible while loading. */
  refetch: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useApiQuery(
 *   () => getAnalyticsDashboard(),
 *   { context: "SalesOverview" },
 * );
 * ```
 */
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  options: UseApiQueryOptions = {},
): UseApiQueryResult<T> {
  const { enabled = true, context } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);

  // Avoid stale closures by keeping a ref to the latest fetcher.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Guard against concurrent fetches.
  const inFlight = useRef(false);

  const execute = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    setIsFetching(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized);
      if (context) logError(err, context);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      inFlight.current = false;
    }
  }, [context]);

  useEffect(() => {
    if (enabled) {
      void execute();
    }
    // Only re-run when `enabled` or `execute` identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute]);

  return { data, isLoading, isFetching, error, refetch: execute };
}

// ---------------------------------------------------------------------------
// Parallel multi-query helper
// ---------------------------------------------------------------------------

/**
 * Fire several API queries in parallel and return a typed tuple.
 *
 * @example
 * ```tsx
 * const [overview, plans] = useParallelQueries(
 *   () => getAnalyticsOverview(),
 *   () => getSubscriptionTypes(),
 * );
 * ```
 */
export function useParallelQueries<TResults extends readonly unknown[]>(
  ...fetchers: { [K in keyof TResults]: () => Promise<TResults[K]> }
): {
  data: { [K in keyof TResults]: TResults[K] | null };
  isLoading: boolean;
  isFetching: boolean;
  error: NormalizedError | null;
  refetch: () => Promise<void>;
} {
  type DataTuple = { [K in keyof TResults]: TResults[K] | null };

  const [data, setData] = useState<DataTuple>(
    () => fetchers.map(() => null) as unknown as DataTuple,
  );
  const [error, setError] = useState<NormalizedError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;
  const inFlight = useRef(false);

  const execute = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsFetching(true);
    setError(null);

    try {
      const results = await Promise.all(
        fetchersRef.current.map((fn) => fn()),
      );
      setData(results as unknown as DataTuple);
    } catch (err: unknown) {
      setError(normalizeError(err));
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void execute();
  }, [execute]);

  return { data, isLoading, isFetching, error, refetch: execute };
}
