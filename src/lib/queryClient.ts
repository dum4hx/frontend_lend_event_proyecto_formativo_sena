/**
 * TanStack Query client configuration.
 *
 * Centralised so every query/mutation inherits the same defaults.
 * Adjust `staleTime`, `retry`, etc. here to change behaviour globally.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes garbage-collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
