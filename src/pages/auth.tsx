import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const AuthPage: NextPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp, user, loading, error } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      const redirectTo = router.query.redirectTo as string || '/';
      router.replace(redirectTo);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    // Validation
    if (!email || !password) {
      setFormError('Email and password are required');
      setIsSubmitting(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setFormError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        setFormError(result.error.message || 'Authentication failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormError('');
    setPassword('');
    setConfirmPassword('');
  };

  // Show loading if checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if already authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Finance Buddy - {isSignUp ? 'Sign Up' : 'Sign In'}</title>
        <meta name="description" content={`${isSignUp ? 'Create an account' : 'Sign in'} to access Finance Buddy`} />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Buddy</h1>
            <p className="text-gray-600 mb-8">Gmail Financial Email Automation</p>
          </div>
          
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {isSignUp ? 'Get started with Finance Buddy' : 'Welcome back to Finance Buddy'}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {(formError || error) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">
                    {formError || error}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </span>
                  ) : (
                    isSignUp ? 'Create account' : 'Sign in'
                  )}
                </button>
              </div>

              {!isSignUp && (
                <div className="text-center">
                  <a
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </a>
                </div>
              )}
            </form>

            <div className="mt-6">
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">After creating your account, you'll be able to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Connect multiple Gmail accounts via OAuth</li>
                    <li>Sync financial emails with manual control</li>
                    <li>Review and manage email data with advanced filtering</li>
                    <li>Access comprehensive testing and admin tools</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
