import React, { useState, useEffect } from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { ShoppingCartIcon } from '../icons/ShoppingCartIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';
import { CounterUser } from '../../types';

interface CounterLoginNewProps {
  onLogin: (user: CounterUser) => void;
  onSignup: () => void;
  onForgotPassword: () => void;
}

const CounterLoginNew: React.FC<CounterLoginNewProps> = ({ onLogin, onSignup, onForgotPassword }) => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  const LOGIN_ATTEMPTS_KEY = 'ro_plant_counter_login_attempts';
  const LOCKOUT_KEY = 'ro_plant_counter_lockout';
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

  useEffect(() => {
    checkLockoutStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLockedOut) {
      interval = setInterval(() => {
        checkLockoutStatus();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedOut]);

  const checkLockoutStatus = () => {
    const lockoutData = localStorage.getItem(LOCKOUT_KEY);
    if (lockoutData) {
      const { until } = JSON.parse(lockoutData);
      const now = Date.now();
      if (now < until) {
        setIsLockedOut(true);
        setLockoutTimeRemaining(Math.ceil((until - now) / 1000));
      } else {
        setIsLockedOut(false);
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      }
    } else {
      setIsLockedOut(false);
    }
  };

  const hashPassword = async (plain: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const recordFailedAttempt = () => {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    let attempts = attemptsData ? JSON.parse(attemptsData) : { count: 0, lastAttempt: 0 };

    attempts.count += 1;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ until: lockoutUntil }));
      setIsLockedOut(true);
      setLockoutTimeRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
    } else {
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLockedOut) {
      checkLockoutStatus();
      return;
    }

    // Validate identifier based on login method
    if (loginMethod === 'email') {
      if (!identifier.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (!validateEmail(identifier)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      if (!identifier.trim()) {
        setError('Please enter your phone number.');
        return;
      }
      if (!validatePhone(identifier)) {
        setError('Please enter a valid phone number.');
        return;
      }
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem('ro_plant_counter_users') || '[]');
      
      // Find user by email or phone
      const user = users.find((u: CounterUser) => {
        if (loginMethod === 'email') {
          return u.email === identifier.toLowerCase().trim();
        } else {
          return u.phone === identifier.trim();
        }
      });

      if (!user) {
        recordFailedAttempt();
        setError(`No account found with this ${loginMethod}.`);
        setIsLoading(false);
        return;
      }

      const inputHash = await hashPassword(password, user.salt);
      const passwordMatch = inputHash === user.passwordHash;

      if (!passwordMatch) {
        recordFailedAttempt();
        setError('Invalid password.');
        setIsLoading(false);
        return;
      }

      // Successful login
      clearFailedAttempts();
      
      // Set session with timeout
      const sessionData = {
        userId: user.id,
        active: true,
        expiresAt: Date.now() + SESSION_TIMEOUT,
        createdAt: Date.now()
      };
      localStorage.setItem('ro_plant_counter_session_active', JSON.stringify(sessionData));
      
      onLogin(user);
    } catch (err) {
      setError('An error occurred. Please try again.');
      recordFailedAttempt();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-lightblue">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-brand-accent rounded-full mb-4">
            <WaterDropIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-brand-text-primary">
            Counter Login
          </h2>
          <p className="mt-2 text-center text-md text-brand-text-secondary">
            Sign in to start your counter session
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'email'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === 'phone'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Phone
            </button>
          </div>

          <div>
            <label htmlFor="counter-identifier" className="block text-sm font-medium text-brand-text-secondary">
              {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              id="counter-identifier"
              type={loginMethod === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={e => handleIdentifierChange(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              placeholder={loginMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
            />
          </div>

          <div>
            <label htmlFor="counter-password" className="block text-sm font-medium text-brand-text-secondary">Password</label>
            <div className="relative">
              <input
                id="counter-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isLockedOut && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm font-medium">Account temporarily locked</p>
              <p className="text-red-600 text-xs mt-1">
                Too many failed login attempts. Please try again in {formatTimeRemaining(lockoutTimeRemaining)}.
              </p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || isLockedOut}
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-3" />
            {isLoading ? 'Signing In…' : isLockedOut ? 'Account Locked' : 'Sign In'}
          </button>

          <div className="space-y-3">
            <div className="text-center">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-brand-blue hover:text-brand-lightblue"
              >
                Forgot your password?
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={onSignup}
                className="text-sm text-brand-blue hover:text-brand-lightblue"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounterLoginNew;
