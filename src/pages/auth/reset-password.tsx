import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

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
    return (
      <div className="min-h-screen bg-bg-primary/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
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

      <div className="min-h-screen bg-bg-primary/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Finance Buddy</h1>
            <p className="text-text-secondary mb-8">Gmail Financial Email Automation</p>
          </div>
          
          <div className="bg-bg-secondary py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {!isCompleted ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-primary text-center">
                    Create new password
                  </h2>
                  <p className="mt-2 text-center text-sm text-text-secondary">
                    Enter a new password for your account
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
                    <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                      New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        placeholder="Enter your new password"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                      Confirm New Password
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
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating password...
                        </span>
                      ) : (
                        'Update password'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="text-center">
                    <a
                      href="/auth"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Back to sign in
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent-emerald/10 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Password updated successfully!
                </h2>
                
                <p className="text-text-secondary mb-6">
                  Your password has been updated. You'll be redirected to your dashboard shortly.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="text-sm text-green-700">
                    <p className="font-medium mb-2">What's next:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You're now signed in with your new password</li>
                      <li>Make sure to store your password securely</li>
                      <li>You can now access all Finance Buddy features</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full btn-primary"
                  >
                    Go to Dashboard
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    Redirecting automatically in 3 seconds...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
