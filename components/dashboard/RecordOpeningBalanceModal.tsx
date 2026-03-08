import React, { useState, useEffect } from 'react';
import { DailyOpeningBalance } from '../../types';

interface RecordOpeningBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: string, cash: number, bank: number) => void;
    selectedDate: string;
    currentBalance?: DailyOpeningBalance;
}

const RecordOpeningBalanceModal: React.FC<RecordOpeningBalanceModalProps> = ({ isOpen, onClose, onSave, selectedDate, currentBalance }) => {
    const [cash, setCash] = useState<number | ''>('');
    const [bank, setBank] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen) {
            setCash(currentBalance?.cash ?? '');
            setBank(currentBalance?.bank ?? '');
        }
    }, [isOpen, currentBalance]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(selectedDate, Number(cash) || 0, Number(bank) || 0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">Record Opening Balance</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-sm text-brand-text-secondary mb-6">
                    Set the starting balance for <span className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</span>.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="opening-cash" className="block text-sm font-medium text-brand-text-secondary">Opening Cash (PKR)</label>
                        <input
                            type="number"
                            id="opening-cash"
                            value={cash}
                            onChange={(e) => setCash(e.target.value === '' ? '' : Number(e.target.value))}
                            min="0"
                            placeholder="e.g., 5000"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="opening-bank" className="block text-sm font-medium text-brand-text-secondary">Opening Bank (PKR)</label>
                        <input
                            type="number"
                            id="opening-bank"
                            value={bank}
                            onChange={(e) => setBank(e.target.value === '' ? '' : Number(e.target.value))}
                            min="0"
                            placeholder="e.g., 25000"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Save Balance</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordOpeningBalanceModal;