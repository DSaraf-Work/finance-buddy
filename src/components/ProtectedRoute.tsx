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
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
          <button
            onClick={() => {
              const redirectTo = encodeURIComponent(router.asPath);
              router.push(`/auth?redirectTo=${redirectTo}`);
            }}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
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
