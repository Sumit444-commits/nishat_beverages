import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    onConfirm: (customerId: number, amount: number, paymentMethod: 'Cash' | 'Bank', date: string) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, customer, onConfirm }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setPaymentMethod('Cash');
            setDate(new Date().toISOString().split('T')[0]);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen || !customer) return null;

    const handleConfirm = () => {
        const numAmount = Number(amount);
        if (numAmount <= 0) {
            setError("Please enter a valid payment amount.");
            return;
        }
        if (numAmount > customer.totalBalance) {
            setError(`Payment cannot be greater than the outstanding balance of PKR ${customer.totalBalance.toLocaleString()}.`);
            return;
        }
        setError('');
        onConfirm(customer.id, numAmount, paymentMethod, date);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">Record Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-brand-text-secondary mb-4">
                    For: <span className="font-bold">{customer.name}</span>
                </p>
                <p className="text-sm text-brand-text-secondary mb-6">
                    Outstanding Balance: <span className="font-bold text-yellow-600">PKR {customer.totalBalance.toLocaleString()}</span>
                </p>
                
                <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="space-y-4">
                     <div>
                        <label htmlFor="payment-date" className="block text-sm font-medium text-brand-text-secondary">Payment Date</label>
                        <input
                            type="date"
                            id="payment-date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="amount-paid" className="block text-sm font-medium text-brand-text-secondary">Amount Paid (PKR)</label>
                        <input
                            type="number"
                            id="amount-paid"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            required
                            min="1"
                            max={customer.totalBalance}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="payment-method-record" className="block text-sm font-medium text-brand-text-secondary">Payment Method</label>
                        <select
                            id="payment-method-record"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Bank')}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 font-semibold">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">
                            Record Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;