import React, { useState, useEffect } from 'react';
import { EyeIcon } from '../icons/EyeIcon';
import { EyeOffIcon } from '../icons/EyeOffIcon';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ResetStep = 'enterIdentifier' | 'enterNewPassword' | 'success';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<ResetStep>('enterIdentifier');
    const [identifier, setIdentifier] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    const resetState = () => {
        setStep('enterIdentifier');
        setIdentifier('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300); // Reset state after transition
    };
    
    useEffect(() => {
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    const handleIdentifierSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const registeredUserJson = localStorage.getItem('ro_plant_registered_user');
        if (registeredUserJson) {
            const registeredUser = JSON.parse(registeredUserJson);
            if (identifier === registeredUser.email || identifier === registeredUser.phone) {
                setStep('enterNewPassword');
                return;
            }
        }
        setError('No account found with that email or phone number.');
    };

    const handlePasswordResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        const registeredUserJson = localStorage.getItem('ro_plant_registered_user');
        if (registeredUserJson) {
            let registeredUser = JSON.parse(registeredUserJson);
            registeredUser.password = newPassword;
            localStorage.setItem('ro_plant_registered_user', JSON.stringify(registeredUser));
            setStep('success');
        } else {
            // This should not happen if the first step worked, but as a fallback
            setError('An unexpected error occurred. Please try again.');
        }
    };

    if (!isOpen) return null;

    const renderStepContent = () => {
        switch (step) {
            case 'enterIdentifier':
                return (
                    <form onSubmit={handleIdentifierSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="reset-identifier" className="block text-sm font-medium text-brand-text-secondary">Email or Phone Number</label>
                            <input 
                                type="text" 
                                id="reset-identifier" 
                                value={identifier} 
                                onChange={e => setIdentifier(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div className="flex justify-end pt-4 space-x-2">
                            <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Verify Account</button>
                        </div>
                    </form>
                );
            case 'enterNewPassword':
                 return (
                    <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                        <p className="text-sm text-brand-text-secondary">Enter a new password for <span className="font-semibold">{identifier}</span>.</p>
                        <div className="relative">
                            <label htmlFor="new-password" className="block text-sm font-medium text-brand-text-secondary">New Password</label>
                            <input 
                                type={showNewPassword ? 'text' : 'password'}
                                id="new-password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                             <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                                {showNewPassword ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                            </button>
                        </div>
                        <div className="relative">
                           <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-text-secondary">Confirm New Password</label>
                           <input 
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirm-password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                required 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5">
                                {showConfirmPassword ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div className="flex justify-end pt-4 space-x-2">
                            <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Set New Password</button>
                        </div>
                    </form>
                );
            case 'success':
                 return (
                    <div className="text-center">
                        <p className="text-brand-text-secondary mb-4">Your password has been successfully reset. You can now log in with your new password.</p>
                        <button onClick={handleClose} className="w-full px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">
                            Close
                        </button>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Reset Password</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                {renderStepContent()}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;