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

const ResetPasswordPage: NextPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formError, setFormError] = useState('');

  const { updatePassword, user, loading, error } = useAuth();
  const router = useRouter();

  // Check if user has a valid session for password reset
  useEffect(() => {
    if (!loading && !user) {
      // No valid session, redirect to forgot password
      router.replace('/auth/forgot-password');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    // Validation
    if (!password || !confirmPassword) {
      setFormError('Both password fields are required');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
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
      const result = await updatePassword(password);

      if (result.error) {
        setFormError(result.error.message || 'Failed to update password');
      } else {
        setIsCompleted(true);
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
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

  // Don't render if no valid session (will redirect)
  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Finance Buddy - Reset Password</title>
        <meta name="description" content="Create a new password for your Finance Buddy account" />
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
            {!isCompleted ? (
              <>
                <CardHeader className="space-y-1 pb-4">
                  <h2 className="text-2xl font-bold text-center">
                    Create new password
                  </h2>
                  <p className="text-center text-sm text-muted-foreground">
                    Enter a new password for your account
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
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters long
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
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
                          Updating password...
                        </span>
                      ) : (
                        'Update password'
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
                    Password updated successfully!
                  </h2>

                  <p className="text-muted-foreground mb-6">
                    Your password has been updated. You'll be redirected to your dashboard shortly.
                  </p>

                  <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2 text-foreground">What's next:</p>
                      <ul className="list-disc list-inside space-y-1 text-left">
                        <li>You're now signed in with your new password</li>
                        <li>Make sure to store your password securely</li>
                        <li>You can now access all Finance Buddy features</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/')}
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      Redirecting automatically in 3 seconds...
                    </div>
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

export default ResetPasswordPage;