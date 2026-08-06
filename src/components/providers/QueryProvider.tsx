"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create a new QueryClient for each session, stored in state so it survives renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000 * 5, // 5 minutes: data is considered fresh for 5 mins
            refetchOnWindowFocus: true, // Automatically refresh when user comes back to the tab
            retry: 1, // Only retry failed requests once
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only render in development mode */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
