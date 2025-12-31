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

const ForgotPasswordPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const { resetPassword, user, loading, error } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    // Validation
    if (!email) {
      setFormError('Email is required');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await resetPassword(email);

      if (result.error) {
        setFormError(result.error.message || 'Failed to send reset email');
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
        <title>Finance Buddy - Forgot Password</title>
        <meta name="description" content="Reset your Finance Buddy password" />
      </Head>

      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Finance Buddy</h1>
            <p className="text-muted-foreground">Gmail Financial Email Automation</p>
          </div>

          <Card className="border-border/50">
            {!isSubmitted ? (
              <>
                <CardHeader className="space-y-1 pb-4">
                  <h2 className="text-2xl font-bold text-center">
                    Forgot your password?
                  </h2>
                  <p className="text-center text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </CardHeader>

                <CardContent>
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {(formError || error) && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                        <div className="text-sm text-destructive">
                          {formError || error}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending reset email...
                        </span>
                      ) : (
                        'Send reset email'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <a
                      href="/auth"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Back to sign in
                    </a>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success/10 mb-4">
                    <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Check your email
                  </h2>

                  <p className="text-muted-foreground mb-6">
                    We've sent a password reset link to <strong className="text-foreground">{email}</strong>
                  </p>

                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2 text-foreground">Next steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-left">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the reset link in the email</li>
                        <li>Create a new password</li>
                        <li>Sign in with your new password</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                        setFormError('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Send to a different email
                    </Button>

                    <a
                      href="/auth"
                      className="block w-full text-center text-sm text-primary hover:text-primary/80"
                    >
                      Back to sign in
                    </a>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;