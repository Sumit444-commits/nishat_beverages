import React, { useState, useEffect } from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { ShoppingCartIcon } from '../icons/ShoppingCartIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';

interface CounterLoginProps {
  onLogin: () => void;
}

const STORAGE_KEY = 'ro_plant_counter_credentials';
const LOGIN_ATTEMPTS_KEY = 'ro_plant_counter_login_attempts';
const LOCKOUT_KEY = 'ro_plant_counter_lockout';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

interface Credentials {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface LoginAttempts {
  count: number;
  lastAttempt: number;
}

const CounterLogin: React.FC<CounterLoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({ score: 0, feedback: '' });
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    setHasCredentials(!!data);
    if (!data) setMode('setup');
    checkLockoutStatus();
  }, []);

  useEffect(() => {
    if (mode === 'setup' && password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    }
  }, [password, mode]);

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

  const generateSalt = (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const hashPassword = async (plain: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkPasswordStrength = (pwd: string): { score: number; feedback: string } => {
    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (pwd.length >= 12) score += 1;
    
    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('lowercase letter');
    
    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('uppercase letter');
    
    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('number');
    
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('special character');

    let feedbackText = '';
    if (score < 4) {
      feedbackText = `Password should include: ${feedback.slice(0, 3).join(', ')}`;
    } else if (score < 5) {
      feedbackText = `Consider adding: ${feedback[0]}`;
    }

    return { score, feedback: feedbackText };
  };

  const validateUsername = (user: string): string | null => {
    const trimmed = user.trim();
    if (!trimmed) return 'Username is required.';
    if (trimmed.length < 3) return 'Username must be at least 3 characters.';
    if (trimmed.length > 20) return 'Username must be less than 20 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Username can only contain letters, numbers, and underscores.';
    return null;
  };

  const handleSetup = async () => {
    setError('');
    
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (passwordStrength.score < 4) {
      setError('Password is too weak. ' + passwordStrength.feedback);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const credentials: Credentials = {
        username: username.trim(),
        passwordHash,
        salt,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      setHasCredentials(true);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err) {
      setError('Failed to save credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const recordFailedAttempt = () => {
    const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    let attempts: LoginAttempts = attemptsData 
      ? JSON.parse(attemptsData)
      : { count: 0, lastAttempt: 0 };

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

  const handleLoginSubmit = async () => {
    setError('');

    if (isLockedOut) {
      checkLockoutStatus();
      return;
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      setError('No counter credentials set. Please setup first.');
      setMode('setup');
      return;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError('Please enter a valid username.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const credentials: Credentials = JSON.parse(data);
      
      // Constant-time comparison to prevent timing attacks
      const usernameMatch = credentials.username.toLowerCase() === username.trim().toLowerCase();
      if (!usernameMatch) {
        recordFailedAttempt();
        setError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      const inputHash = await hashPassword(password, credentials.salt);
      const passwordMatch = inputHash === credentials.passwordHash;

      if (!passwordMatch) {
        recordFailedAttempt();
        setError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      // Successful login
      clearFailedAttempts();
      
      // Set session with timeout
      const sessionData = {
        active: true,
        expiresAt: Date.now() + SESSION_TIMEOUT,
        createdAt: Date.now()
      };
      localStorage.setItem('ro_plant_counter_session_active', JSON.stringify(sessionData));
      
      onLogin();
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-lightblue">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-brand-accent rounded-full mb-4">
            <WaterDropIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-brand-text-primary">
            {mode === 'login' ? 'Counter Login' : 'Setup Counter Access'}
          </h2>
          <p className="mt-2 text-center text-md text-brand-text-secondary">
            {mode === 'login' ? 'Enter credentials to start counter session' : 'Create credentials to secure counter sales'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="counter-username" className="block text-sm font-medium text-brand-text-secondary">Username</label>
            <input
              id="counter-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="counter-password" className="block text-sm font-medium text-brand-text-secondary">Password</label>
            <div className="relative">
              <input
                id="counter-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mode === 'setup' && password && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.score < 2 ? 'bg-red-500 w-1/4' :
                      passwordStrength.score < 4 ? 'bg-yellow-500 w-2/4' :
                      passwordStrength.score < 5 ? 'bg-blue-500 w-3/4' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
                <span className="text-xs text-brand-text-secondary">
                  {passwordStrength.score < 2 ? 'Weak' :
                   passwordStrength.score < 4 ? 'Fair' :
                   passwordStrength.score < 5 ? 'Good' : 'Strong'}
                </span>
              </div>
              {passwordStrength.feedback && (
                <p className="text-xs text-yellow-600">{passwordStrength.feedback}</p>
              )}
            </div>
          )}

          {mode === 'setup' && (
            <div>
              <label htmlFor="counter-confirm" className="block text-sm font-medium text-brand-text-secondary">Confirm Password</label>
              <div className="relative">
                <input
                  id="counter-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
                />
                <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {isLockedOut && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm font-medium">Account temporarily locked</p>
              <p className="text-red-600 text-xs mt-1">
                Too many failed login attempts. Please try again in {formatTimeRemaining(lockoutTimeRemaining)}.
              </p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {mode === 'login' ? (
            <button
              type="button"
              onClick={handleLoginSubmit}
              disabled={isLoading || isLockedOut}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-3" />
              {isLoading ? 'Checking…' : isLockedOut ? 'Account Locked' : 'Start Session'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSetup}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300 disabled:opacity-60"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-3" />
              {isLoading ? 'Saving…' : 'Save Credentials'}
            </button>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(m => m === 'login' ? 'setup' : 'login')}
              className="text-sm text-brand-blue hover:text-brand-lightblue"
            >
              {mode === 'login' ? (hasCredentials ? 'Reset credentials' : 'Setup credentials') : 'Back to login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterLogin;
