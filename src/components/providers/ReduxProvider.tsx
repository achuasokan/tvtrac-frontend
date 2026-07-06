"use client";

import { Provider } from 'react-redux';
import { store } from '@/store';
import React, { useEffect } from 'react';
import { fetchCurrentUser } from '@/store/slices/authSlice';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dispatch fetchCurrentUser on initial load
    store.dispatch(fetchCurrentUser());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
