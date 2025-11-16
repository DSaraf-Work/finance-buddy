import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authHelpers, AuthUser, AuthState } from '@/lib/auth-client';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with null user and loading true
  // Don't try to read from localStorage synchronously as it's unreliable
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check initial session immediately
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = authHelpers.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && session?.access_token && session?.refresh_token) {
          // Set user immediately
          setUser({
            id: session.user.id,
            email: session.user.email!,
            email_confirmed_at: session.user.email_confirmed_at,
            created_at: session.user.created_at!,
          });
          setError(null);
          setLoading(false);

          // Establish server-side session in background
          fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          }).catch(error => {
            console.error('Failed to establish server session:', error);
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
          setLoading(false);

          // Clear server-side session in background
          fetch('/api/auth/session', {
            method: 'DELETE',
          }).catch(error => {
            console.error('Failed to clear server session:', error);
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user on token refresh
          setUser({
            id: session.user.id,
            email: session.user.email!,
            email_confirmed_at: session.user.email_confirmed_at,
            created_at: session.user.created_at!,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      // First check if we have a session (faster than getUser)
      const { session } = await authHelpers.getSession();

      if (session?.user) {
        // We have a valid session, set user immediately
        setUser({
          id: session.user.id,
          email: session.user.email!,
          email_confirmed_at: session.user.email_confirmed_at,
          created_at: session.user.created_at!,
        });
        setError(null);
        setLoading(false);

        // Establish server-side session in background (don't await)
        if (session.access_token && session.refresh_token) {
          fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          }).catch(error => {
            console.error('Failed to establish server session:', error);
          });
        }
      } else {
        // No session found
        setUser(null);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to check authentication status');
      setUser(null);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authHelpers.signIn(email, password);
      
      if (error) {
        setError(error.message);
        return { error };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at!,
        });
        
        // Redirect to intended destination or dashboard
        const redirectTo = router.query.redirectTo as string || '/';
        router.push(redirectTo);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await authHelpers.signUp(email, password);
      
      if (error) {
        setError(error.message);
        return { error };
      }

      // Note: User might need to confirm email before being fully authenticated
      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at!,
        });
        
        // Redirect to intended destination or dashboard
        const redirectTo = router.query.redirectTo as string || '/';
        router.push(redirectTo);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authHelpers.signOut();
      setUser(null);
      setError(null);
      router.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await authHelpers.resetPassword(email);

      if (error) {
        setError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await authHelpers.updatePassword(password);

      if (error) {
        setError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
