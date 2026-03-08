import React, { useState } from 'react';
import { Customer } from '../../types';

interface MarkAsPaidModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentMethod: 'Cash' | 'Bank') => void;
    customer: Customer | null;
}

const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');

    if (!isOpen || !customer) return null;

    const handleConfirm = () => {
        onConfirm(paymentMethod);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">Clear Outstanding Balance</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-brand-text-secondary mb-6">
                    You are clearing an outstanding balance of <span className="font-bold text-yellow-600">PKR {customer.totalBalance.toLocaleString()}</span> for <span className="font-bold text-brand-text-primary">{customer.name}</span>. This will be recorded as a full payment.
                </p>
                <div className="mb-6">
                    <label htmlFor="payment-method-clear" className="block text-sm font-medium text-brand-text-secondary">Payment Method</label>
                    <select
                        id="payment-method-clear"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Bank')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    >
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                    </select>
                </div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 font-semibold">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold">
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarkAsPaidModal;