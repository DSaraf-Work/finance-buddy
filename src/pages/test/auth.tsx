import { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';

const TestAuthPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <>
      <Head>
        <title>Finance Buddy - Authentication Testing</title>
        <meta name="description" content="Test authentication flows and components" />
      </Head>

      <div className="min-h-screen bg-bg-primary/50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Authentication Testing Suite
            </h1>
            <p className="text-text-secondary">
              Comprehensive testing interface for all authentication flows and components
            </p>
            <div className="mt-4 text-sm text-blue-600">
              <span className="font-medium">Test Route:</span> /test/auth
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sign In/Up */}
            <div className="bg-bg-secondary rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Sign In / Sign Up</h2>
              <p className="text-text-secondary mb-4">
                Main authentication page with toggle between sign-in and sign-up modes.
              </p>
              <a
                href="/auth"
                className="block w-full text-center btn-primary"
              >
                Go to Auth Page
              </a>
            </div>

            {/* Forgot Password */}
            <div className="bg-bg-secondary rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Forgot Password</h2>
              <p className="text-text-secondary mb-4">
                Password reset flow - enter email to receive reset link.
              </p>
              <a
                href="/auth/forgot-password"
                className="block w-full text-center btn-primary"
              >
                Test Forgot Password
              </a>
            </div>

            {/* Reset Password */}
            <div className="bg-bg-secondary rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Reset Password</h2>
              <p className="text-text-secondary mb-4">
                Password reset completion - requires valid session from email link.
              </p>
              <a
                href="/auth/reset-password"
                className="block w-full text-center btn-secondary"
              >
                Test Reset Password
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Note: Requires valid reset session
              </p>
            </div>

            {/* Protected Routes */}
            <div className="bg-bg-secondary rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Protected Routes</h2>
              <p className="text-text-secondary mb-4">
                Test route protection - should redirect to auth if not signed in.
              </p>
              <div className="space-y-2">
                <a href="/test" className="block w-full text-center btn-secondary text-sm">
                  Testing Dashboard
                </a>
                <a href="/admin" className="block w-full text-center btn-secondary text-sm">
                  Admin Dashboard
                </a>
                <a href="/emails" className="block w-full text-center btn-secondary text-sm">
                  Email Management
                </a>
                <a href="/transactions" className="block w-full text-center btn-secondary text-sm">
                  Transactions
                </a>
              </div>
            </div>

            {/* Authentication Flow */}
            <div className="bg-bg-secondary rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Authentication Flow</h2>
              <div className="text-sm text-text-secondary space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>User visits protected route</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Redirected to /auth with return URL</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Sign in or create account</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Redirected to original destination</span>
                </div>
              </div>
            </div>

            {/* Password Reset Flow */}
            <div className="bg-bg-secondary rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Password Reset Flow</h2>
              <div className="text-sm text-text-secondary space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Click "Forgot password?" link</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Enter email address</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Check email for reset link</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Click link to reset password</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Create new password</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Test Form */}
          <div className="mt-8 bg-bg-secondary rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Test Form</h2>
            <p className="text-text-secondary mb-4">
              Test form validation and UI components without actual authentication.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="test@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button className="btn-primary">Test Sign In</button>
              <button className="btn-secondary">Test Sign Up</button>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                Test Reset
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center space-y-2">
            <div>
              <a
                href="/test"
                className="text-blue-600 hover:text-blue-500 mr-4"
              >
                ← Back to Testing Dashboard
              </a>
              <a
                href="/"
                className="text-blue-600 hover:text-blue-500"
              >
                Home
              </a>
            </div>
            <div className="text-sm text-gray-500">
              Part of the /test/** testing suite
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestAuthPage;
