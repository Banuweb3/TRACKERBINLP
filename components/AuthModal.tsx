import React, { useState } from 'react';
import { authService, type RegisterData, type LoginData } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting login process...');
      await authService.login(loginData);
      console.log('✅ Login successful, calling onSuccess...');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Login failed in AuthModal:', error);
      
      let errorMessage = 'Login failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific JSON parse errors
        if (error.message.includes('JSON.parse: unexpected end of data')) {
          errorMessage = 'Server connection error. Please check if the backend server is running.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check if the server is accessible.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(registerData);
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setLoginData({ email: '', password: '' });
    setRegisterData({ username: '', email: '', password: '', firstName: '', lastName: '' });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="glass-dark p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-light drop-shadow-lg">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="h-6 w-6 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent text-text-light font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-primary/30"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-light mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-light mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 backdrop-blur-sm border border-white/30 rounded-xl text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:border-primary/70 transition-all duration-200"
                placeholder="Create a password"
              />
              <p className="text-xs text-text-light/60 mt-1">
                Must contain at least one uppercase, lowercase, and number
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent text-text-light font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 border border-primary/30"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-text-light/70 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={switchMode}
              className="ml-2 text-primary hover:text-primary-focus font-semibold transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
