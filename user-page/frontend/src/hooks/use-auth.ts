'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
};
