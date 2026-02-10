// pages/Login.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { useAuthStore } from '@/stores/authStore';

type AuthMode = 'signin' | 'signup' | 'magic-link' | 'forgot-password';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, error, signIn, signInMagicLink, register, clearError } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Clear error when changing modes
  useEffect(() => {
    clearError();
    setMagicLinkSent(false);
  }, [mode, clearError]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signIn(email, password);
    if (success) {
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(email, password, fullName);
    if (success) {
      navigate('/');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signInMagicLink(email);
    if (success) {
      setMagicLinkSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">4J Inspector</h1>
          <p className="text-gray-500 mt-2">Property Inspection App</p>
        </div>

        <Card>
          <CardContent>
            {/* Mode Tabs */}
            {mode !== 'forgot-password' && (
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    mode === 'signin'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    mode === 'signup'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />

                <Button type="submit" fullWidth disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => setMode('magic-link')}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Sign in with magic link instead
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Sign Up Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <TextField
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  required
                  autoComplete="name"
                />

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 chars)"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />

                <Button type="submit" fullWidth disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            )}

            {/* Magic Link Form */}
            {mode === 'magic-link' && (
              <div className="space-y-4">
                {magicLinkSent ? (
                  <div className="text-center py-4">
                    <span className="text-4xl block mb-4">📧</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Check your email
                    </h3>
                    <p className="text-gray-500 mb-4">
                      We sent a magic link to <strong>{email}</strong>. Click the
                      link in the email to sign in.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setEmail('');
                      }}
                    >
                      Use a different email
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter your email and we'll send you a magic link to sign in
                      without a password.
                    </p>

                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />

                    <Button type="submit" fullWidth disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Magic Link'}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="block w-full text-sm text-gray-500 hover:underline text-center"
                    >
                      Back to password sign in
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot-password' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Reset your password
                </h3>
                <p className="text-sm text-gray-500">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // Use magic link as password reset
                    const success = await signInMagicLink(email);
                    if (success) {
                      setMagicLinkSent(true);
                    }
                  }}
                  className="space-y-4"
                >
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />

                  <Button type="submit" fullWidth disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="block w-full text-sm text-gray-500 hover:underline text-center"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          For demo: Use any email/password or magic link
        </p>
      </div>
    </div>
  );
}

export default Login;
