'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Calculator, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { AnimatedBackground, FloatingInput, MagneticButton, GradientText, GlassCard } from '@/components/ui/modern';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid username or password');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl mb-4 shadow-glow-lg animate-float">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <GradientText animated gradient="rainbow">
              Smart Cost Calculator
            </GradientText>
          </h1>
          <p className="text-gray-600 flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Sign in to access your account</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </p>
        </div>

        {/* Login Form */}
        <GlassCard className="p-8 hover3D glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FloatingInput
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />

            <div className="relative">
              <FloatingInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-700 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <MagneticButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              glow
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="text-xl">→</span>
                </>
              )}
            </MagneticButton>
          </form>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-3xl -z-10"></div>
        </GlassCard>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-gray-500 text-sm backdrop-blur-sm bg-white/30 rounded-full px-4 py-2 inline-block">
            © 2024 Smart Cost Calculator. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 