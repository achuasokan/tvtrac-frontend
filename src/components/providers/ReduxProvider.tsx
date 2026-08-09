"use client";

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import React, { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export function ReduxProvider({ children }: { children: React.ReactNode }) {

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthGuard>
          {children}
        </AuthGuard>
      </PersistGate>
    </Provider>
  );
}
