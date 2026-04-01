import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthData, isAuthenticated } from '../../utils/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Eye, EyeOff, User as UserIcon, Lock, Building2, Shield } from 'lucide-react';
import { loginSchema } from '../../schemas';
import type { User } from '../../types';

interface LoginResponse {
  token: string;
  user: User;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Get the intended destination from state, default to root
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setError('');
      
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: value.username.trim(),
            password: value.password.trim(),
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid username or password');
          }
          throw new Error(`Login failed: ${response.statusText}`);
        }

        const data: LoginResponse = await response.json();
        
        if (!data.token || !data.user) {
          throw new Error('Invalid response from server');
        }

        // Store both token and user info
        setAuthData(data.token, data.user);
        
        queryClient.invalidateQueries({ queryKey: ['grievances'] });
        navigate(from, { replace: true });

      } catch (err) {
        console.error('Login error:', err);
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-orange-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Municipality Portal
                  </h1>
                  <p className="text-lg text-blue-600 font-medium">
                    Public Grievance Redressal System
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Secure Access to Government Services
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span>Secure authentication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <span>Government verified platform</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <UserIcon className="h-5 w-5 text-orange-500" />
                    <span>Citizen service portal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full">
            <Card className="w-full max-w-md mx-auto p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              {/* Mobile header */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Municipality Portal</h1>
                <p className="text-blue-600 font-medium">PGRS Login</p>
              </div>

              {/* Desktop header */}
              <div className="hidden lg:block text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to access the grievance system</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-6"
              >
                {/* Username Field */}
                <form.Field
                  name="username"
                  validators={{
                    onChange: ({ value }) => {
                      const result = loginSchema.shape.username.safeParse(value);
                      if (!result.success) {
                        return result.error.issues[0]?.message;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Enter your username"
                          disabled={form.state.isSubmitting}
                          className={`pl-10 h-12 border-2 ${
                            field.state.meta.errors.length > 0
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                          } rounded-lg transition-all duration-200`}
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Password Field */}
                <form.Field
                  name="password"
                  validators={{
                    onChange: ({ value }) => {
                      const result = loginSchema.shape.password.safeParse(value);
                      if (!result.success) {
                        return result.error.issues[0]?.message;
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id={field.name}
                          name={field.name}
                          type={showPassword ? 'text' : 'password'}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Enter your password"
                          disabled={form.state.isSubmitting}
                          className={`pl-10 pr-10 h-12 border-2 ${
                            field.state.meta.errors.length > 0
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                          } rounded-lg transition-all duration-200`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                          disabled={form.state.isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={form.state.isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {form.state.isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Sign in to Portal</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>© 2024 Municipality Portal. All rights reserved.</p>
                <p className="mt-1">Secure access to government services</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;