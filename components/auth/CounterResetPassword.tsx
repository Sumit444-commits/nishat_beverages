import React, { useState, useEffect } from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';
import { CounterUser } from '../../types';

interface CounterResetPasswordProps {
  onBack: () => void;
  onSuccess: (user: CounterUser) => void;
}

const CounterResetPassword: React.FC<CounterResetPasswordProps> = ({ onBack, onSuccess }) => {
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({ score: 0, feedback: '' });

  useEffect(() => {
    // Check if there's a pending reset
    const pendingReset = localStorage.getItem('ro_plant_pending_reset');
    if (pendingReset) {
      const resetData = JSON.parse(pendingReset);
      if (resetData.expires && Date.now() < resetData.expires) {
        setResetToken(resetData.token);
      } else {
        // Token expired
        localStorage.removeItem('ro_plant_pending_reset');
        setError('Reset token has expired. Please request a new password reset.');
      }
    }
  }, []);

  useEffect(() => {
    if (newPassword) {
      const strength = checkPasswordStrength(newPassword);
      setPasswordStrength(strength);
    }
  }, [newPassword]);

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

  const validateForm = (): string | null => {
    if (!resetToken.trim()) return 'Reset token is required.';
    
    if (newPassword.length < 8) return 'Password must be at least 8 characters long.';
    if (passwordStrength.score < 4) return 'Password is too weak. ' + passwordStrength.feedback;
    
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const pendingReset = JSON.parse(localStorage.getItem('ro_plant_pending_reset') || '{}');
      
      if (!pendingReset.token || pendingReset.token !== resetToken) {
        setError('Invalid reset token.');
        setIsLoading(false);
        return;
      }

      if (pendingReset.expires && Date.now() >= pendingReset.expires) {
        setError('Reset token has expired. Please request a new password reset.');
        localStorage.removeItem('ro_plant_pending_reset');
        setIsLoading(false);
        return;
      }

      const users = JSON.parse(localStorage.getItem('ro_plant_counter_users') || '[]');
      const userIndex = users.findIndex((u: CounterUser) => u.id === pendingReset.userId);

      if (userIndex === -1) {
        setError('User not found.');
        setIsLoading(false);
        return;
      }

      // Generate new salt and hash
      const salt = generateSalt();
      const passwordHash = await hashPassword(newPassword, salt);

      // Update user password and clear reset token
      users[userIndex] = {
        ...users[userIndex],
        passwordHash,
        salt,
        resetToken: undefined,
        resetTokenExpires: undefined
      };

      localStorage.setItem('ro_plant_counter_users', JSON.stringify(users));
      localStorage.removeItem('ro_plant_pending_reset');

      setSuccess('Password has been reset successfully!');
      
      setTimeout(() => {
        onSuccess(users[userIndex]);
      }, 2000);

    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            Enter your reset token and new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-token" className="block text-sm font-medium text-brand-text-secondary">Reset Token</label>
            <input
              id="reset-token"
              type="text"
              value={resetToken}
              onChange={e => {
                setResetToken(e.target.value);
                setError('');
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
              placeholder="Enter your reset token"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-text-secondary">New Password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {newPassword && (
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
            <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-text-secondary">Confirm New Password</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm pr-10"
                placeholder="Confirm new password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
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
              {isLoading ? 'Resetting…' : success ? 'Password Reset' : 'Reset Password'}
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
      </div>
    </div>
  );
};

export default CounterResetPassword;
