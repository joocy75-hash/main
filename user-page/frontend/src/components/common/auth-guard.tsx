'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useLoginModalStore } from '@/stores/login-modal-store';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const openLoginModal = useLoginModalStore((s) => s.open);

  useEffect(() => {
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal();
    }
  }, [isLoading, isAuthenticated, openLoginModal]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-6">
          <Skeleton className="mx-auto h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
