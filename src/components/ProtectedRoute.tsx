import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to auth page with the current path as redirect target
        const redirectTo = encodeURIComponent(router.asPath);
        router.replace(`/auth?redirectTo=${redirectTo}`);
      } else {
        // User is authenticated, allow rendering
        setShouldRender(true);
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  // Show a proper loading UI instead of blank screen to prevent confusion
  if (loading || !shouldRender) {
    return (
      <div className="min-h-screen bg-airbnb-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D5FEF] mb-4"></div>
          <p className="text-airbnb-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if not authenticated (shouldn't reach here due to redirect)
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
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
