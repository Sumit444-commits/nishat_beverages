import React, { useState, useEffect } from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { CounterUser } from '../../types';

interface CounterForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CounterForgotPassword: React.FC<CounterForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const generateResetToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate identifier based on reset method
    if (resetMethod === 'email') {
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

    setIsLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem('ro_plant_counter_users') || '[]');
      
      // Find user by email or phone
      const user = users.find((u: CounterUser) => {
        if (resetMethod === 'email') {
          return u.email === identifier.toLowerCase().trim();
        } else {
          return u.phone === identifier.trim();
        }
      });

      if (!user) {
        setError(`No account found with this ${resetMethod}.`);
        setIsLoading(false);
        return;
      }

      // Generate reset token and set expiry (1 hour)
      const resetToken = generateResetToken();
      const resetTokenExpires = Date.now() + (60 * 60 * 1000); // 1 hour

      // Update user with reset token
      const updatedUsers = users.map((u: CounterUser) => {
        if (u.id === user.id) {
          return {
            ...u,
            resetToken,
            resetTokenExpires
          };
        }
        return u;
      });

      localStorage.setItem('ro_plant_counter_users', JSON.stringify(updatedUsers));

      // In a real application, you would send an email/SMS here
      // For demo purposes, we'll show the token to the user
      const resetMessage = resetMethod === 'email' 
        ? `Password reset instructions have been sent to ${identifier}.`
        : `Password reset instructions have been sent to ${identifier}.`;

      setSuccess(`${resetMessage} For demo purposes, your reset token is: ${resetToken}`);
      
      // Store the reset token temporarily for the reset process
      localStorage.setItem('ro_plant_pending_reset', JSON.stringify({
        userId: user.id,
        token: resetToken,
        expires: resetTokenExpires
      }));

      setTimeout(() => {
        onSuccess();
      }, 3000);

    } catch (err) {
      setError('Failed to process password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setError('');
    setSuccess('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-lightblue">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-brand-accent rounded-full mb-4">
            <WaterDropIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-brand-text-primary">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-md text-brand-text-secondary">
            Choose how you want to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reset Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setResetMethod('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                resetMethod === 'email'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setResetMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                resetMethod === 'phone'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Phone
            </button>
          </div>

          <div>
            <label htmlFor="reset-identifier" className="block text-sm font-medium text-brand-text-secondary">
              {resetMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              id="reset-identifier"
              type={resetMethod === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={e => handleIdentifierChange(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              placeholder={resetMethod === 'email' ? 'Enter your email' : 'Enter your phone number'}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300 disabled:opacity-60"
            >
              {isLoading ? 'Sending Reset…' : success ? 'Reset Sent' : 'Send Reset Instructions'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-brand-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-300"
            >
              Back to Login
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-brand-text-secondary">
            Note: This is a demo. In production, reset instructions would be sent via email or SMS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CounterForgotPassword;
