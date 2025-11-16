import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

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
    return (
      <div className="min-h-screen bg-bg-primary/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
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
        <title>Finance Buddy - Forgot Password</title>
        <meta name="description" content="Reset your Finance Buddy password" />
      </Head>

      <div className="min-h-screen bg-bg-primary/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Finance Buddy</h1>
            <p className="text-text-secondary mb-8">Gmail Financial Email Automation</p>
          </div>
          
          <div className="bg-bg-secondary py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {!isSubmitted ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-text-primary text-center">
                    Forgot your password?
                  </h2>
                  <p className="mt-2 text-center text-sm text-text-secondary">
                    Enter your email address and we'll send you a link to reset your password.
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
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
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
                        placeholder="Enter your email address"
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
                          Sending reset email...
                        </span>
                      ) : (
                        'Send reset email'
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
                  Check your email
                </h2>
                
                <p className="text-text-secondary mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
                  <div className="text-sm text-purple-700">
                    <p className="font-medium mb-2">Next steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the reset link in the email</li>
                      <li>Create a new password</li>
                      <li>Sign in with your new password</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                      setFormError('');
                    }}
                    className="w-full btn-secondary"
                  >
                    Send to a different email
                  </button>

                  <a
                    href="/auth"
                    className="block w-full text-center text-sm text-purple-600 hover:text-purple-500"
                  >
                    Back to sign in
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
