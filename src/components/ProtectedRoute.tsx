import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page with the current path as redirect target
      const redirectTo = encodeURIComponent(router.asPath);
      router.replace(`/auth?redirectTo=${redirectTo}`);
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  // BUT: Don't show the loading UI, just render nothing to prevent flash
  if (loading) {
    return null; // Return null instead of loading UI to prevent flash
  }

  // Show fallback or redirect if not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // This will only show briefly before the redirect happens
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { fallback?: React.ReactNode }
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute fallback={options?.fallback}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AuthenticatedComponent;
}
