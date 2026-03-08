import React, { useState, useEffect } from 'react';
import { Salesman, SalesmanPayment } from '../../types';

interface AddSalesmanPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddPayment: (payment: Omit<SalesmanPayment, 'id'>) => void;
    salesmen: Salesman[];
    preselectedSalesmanId?: number;
}

const AddSalesmanPaymentModal: React.FC<AddSalesmanPaymentModalProps> = ({ isOpen, onClose, onAddPayment, salesmen, preselectedSalesmanId }) => {
    const [salesmanId, setSalesmanId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setSalesmanId('');
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setPaymentMethod('Cash');
        setNotes('');
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
            if (preselectedSalesmanId) {
                setSalesmanId(preselectedSalesmanId.toString());
            }
        }
    }, [isOpen, preselectedSalesmanId]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!salesmanId || !amount) {
            alert('Please select a salesman and enter an amount.');
            return;
        }

        const newPayment: Omit<SalesmanPayment, 'id'> = {
            salesmanId: Number(salesmanId),
            date,
            amount: Number(amount),
            paymentMethod,
            notes,
        };
        onAddPayment(newPayment);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Record Salesman Payment</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="payment-salesman" className="block text-sm font-medium text-brand-text-secondary">Salesman</label>
                        <select
                            id="payment-salesman"
                            value={salesmanId}
                            onChange={e => setSalesmanId(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        >
                            <option value="" disabled>-- Select a salesman --</option>
                            {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="payment-date" className="block text-sm font-medium text-brand-text-secondary">Payment Date</label>
                        <input type="date" id="payment-date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-brand-text-secondary">Amount (PKR)</label>
                        <input type="number" id="payment-amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="payment-method-salesman" className="block text-sm font-medium text-brand-text-secondary">Payment Method</label>
                        <select id="payment-method-salesman" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Bank')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option>Cash</option>
                            <option>Bank</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="payment-notes" className="block text-sm font-medium text-brand-text-secondary">Notes (optional)</label>
                        <textarea
                            id="payment-notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="e.g., Salary advance, commission payout"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Add Payment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSalesmanPaymentModal;
