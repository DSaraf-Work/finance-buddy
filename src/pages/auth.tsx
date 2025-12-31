import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    return <LoadingScreen message="Loading..." />;
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

      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Finance Buddy</h1>
            <p className="text-muted-foreground">Gmail Financial Email Automation</p>
          </div>

          <Card className="border-border/50">
            <CardHeader className="space-y-1 pb-4">
              <h2 className="text-2xl font-bold text-center">
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
              </h2>
              <p className="text-center text-sm text-muted-foreground">
                {isSignUp ? 'Get started with Finance Buddy' : 'Welcome back to Finance Buddy'}
              </p>
            </CardHeader>

            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {(formError || error) && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-destructive">
                      {formError || error}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </span>
                    ) : (
                      isSignUp ? 'Create account' : 'Sign in'
                    )}
                  </Button>
                </div>

                {!isSignUp && (
                  <div className="text-center">
                    <a
                      href="/auth/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 transition-colors duration-200"
                    >
                      Forgot your password?
                    </a>
                  </div>
                )}
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">or</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 font-medium"
                  >
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"
                    }
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="mt-6 bg-primary/10 border border-primary/30 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold mb-2 text-foreground">After creating your account, you'll be able to:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Connect multiple Gmail accounts via OAuth</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Sync financial emails with manual control</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Review and manage email data with advanced filtering</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Access comprehensive testing and admin tools</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AuthPage;