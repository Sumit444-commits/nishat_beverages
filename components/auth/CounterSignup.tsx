import React, { useState, useEffect } from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { ShoppingCartIcon } from '../icons/ShoppingCartIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';
import { CounterUser } from '../../types';

interface CounterSignupProps {
  onSignup: (user: CounterUser) => void;
  onLogin: () => void;
}

const CounterSignup: React.FC<CounterSignupProps> = ({ onSignup, onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({ score: 0, feedback: '' });

  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    }
  }, [formData.password]);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required.';
    if (formData.name.trim().length < 2) return 'Name must be at least 2 characters.';
    
    if (!formData.email.trim()) return 'Email is required.';
    if (!validateEmail(formData.email)) return 'Please enter a valid email address.';
    
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (!validatePhone(formData.phone)) return 'Please enter a valid phone number.';
    
    if (formData.password.length < 8) return 'Password must be at least 8 characters long.';
    if (passwordStrength.score < 4) return 'Password is too weak. ' + passwordStrength.feedback;
    
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('ro_plant_counter_users') || '[]');
      const emailExists = existingUsers.some((user: CounterUser) => user.email === formData.email.toLowerCase());
      const phoneExists = existingUsers.some((user: CounterUser) => user.phone === formData.phone);

      if (emailExists) {
        setError('An account with this email already exists.');
        setIsLoading(false);
        return;
      }

      if (phoneExists) {
        setError('An account with this phone number already exists.');
        setIsLoading(false);
        return;
      }

      const salt = generateSalt();
      const passwordHash = await hashPassword(formData.password, salt);
      
      const newUser: CounterUser = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        passwordHash,
        salt,
        createdAt: new Date().toISOString()
      };

      existingUsers.push(newUser);
      localStorage.setItem('ro_plant_counter_users', JSON.stringify(existingUsers));
      
      onSignup(newUser);
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-lightblue">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-brand-accent rounded-full mb-4">
            <WaterDropIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-brand-text-primary">
            Counter Staff Signup
          </h2>
          <p className="mt-2 text-center text-md text-brand-text-secondary">
            Create your counter sales account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="counter-name" className="block text-sm font-medium text-brand-text-secondary">Full Name</label>
            <input
              id="counter-name"
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="counter-email" className="block text-sm font-medium text-brand-text-secondary">Email Address</label>
            <input
              id="counter-email"
              type="email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="counter-phone" className="block text-sm font-medium text-brand-text-secondary">Phone Number</label>
            <input
              id="counter-phone"
              type="tel"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label htmlFor="counter-password" className="block text-sm font-medium text-brand-text-secondary">Password</label>
            <div className="relative">
              <input
                id="counter-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
                placeholder="Create a password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {formData.password && (
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

          <div>
            <label htmlFor="counter-confirm" className="block text-sm font-medium text-brand-text-secondary">Confirm Password</label>
            <div className="relative">
              <input
                id="counter-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
                placeholder="Confirm your password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300 disabled:opacity-60"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-3" />
            {isLoading ? 'Creating Account…' : 'Create Account'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onLogin}
              className="text-sm text-brand-blue hover:text-brand-lightblue"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CounterSignup;
