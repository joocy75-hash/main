'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return store;
};

export const useRequireAuth = () => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      const { useLoginModalStore } = require('@/stores/login-modal-store');
      useLoginModalStore.getState().open();
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
};
