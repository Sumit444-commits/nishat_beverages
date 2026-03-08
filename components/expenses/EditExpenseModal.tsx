import React, { useState, useEffect, useMemo } from 'react';
import { Expense, EXPENSE_CATEGORIES, Salesman, ExpenseOwner } from '../../types';

interface EditExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: Expense | null;
    onUpdateExpense: (expense: Expense) => void;
    salesmen: Salesman[];
    expenseOwners: ExpenseOwner[];
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ isOpen, onClose, expense, onUpdateExpense, salesmen, expenseOwners }) => {
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
    const [selectedOwner, setSelectedOwner] = useState('');

    const accounts = useMemo(() => {
        const salesmanAccounts = salesmen.map(s => ({ id: `salesman-${s.id}`, name: s.name }));
        const ownerAccounts = expenseOwners.map(o => ({ id: `owner-${o.id}`, name: o.name }));
        return [...salesmanAccounts, ...ownerAccounts].sort((a,b) => a.name.localeCompare(b.name));
    }, [salesmen, expenseOwners]);

    useEffect(() => {
        if (expense) {
            setDate(expense.date.split('T')[0]);
            setCategory(expense.category);
            setName(expense.name);
            setDescription(expense.description || '');
            setAmount(expense.amount);
            setPaymentMethod(expense.paymentMethod);
            setSelectedOwner(expense.ownerType && expense.ownerId ? `${expense.ownerType}-${expense.ownerId}` : '');
        }
    }, [expense]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expense) return;

        const [ownerType, ownerIdStr] = selectedOwner.split('-');
        const ownerId = ownerIdStr ? parseInt(ownerIdStr, 10) : null;

        const updatedExpense: Expense = {
            ...expense,
            date,
            category,
            name,
            description,
            amount: Number(amount),
            paymentMethod,
            ownerId,
            ownerType: ownerId ? (ownerType as 'salesman' | 'owner') : null,
        };
        onUpdateExpense(updatedExpense);
    };

    if (!isOpen || !expense) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Edit Expense</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="edit-account-owner" className="block text-sm font-medium text-brand-text-secondary">Account / Owner (optional)</label>
                        <select
                            id="edit-account-owner"
                            value={selectedOwner}
                            onChange={e => setSelectedOwner(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        >
                            <option value="">-- Select existing account --</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-date" className="block text-sm font-medium text-brand-text-secondary">Date</label>
                        <input type="date" id="edit-date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="edit-category" className="block text-sm font-medium text-brand-text-secondary">Category</label>
                        <input type="text" id="edit-category" list="expense-categories" value={category} placeholder="e.g., Utilities, Rent" onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                         <datalist id="expense-categories">
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>
                     <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-brand-text-secondary">Name</label>
                        <input type="text" id="edit-name" value={name} placeholder="e.g., Electricity, Rent" onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-brand-text-secondary">Description</label>
                        <input type="text" id="edit-description" value={description} placeholder="Optional details" onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="edit-amount" className="block text-sm font-medium text-brand-text-secondary">Amount (PKR)</label>
                        <input type="number" id="edit-amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="edit-paymentMethod" className="block text-sm font-medium text-brand-text-secondary">Payment From</label>
                        <select id="edit-paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Bank')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option>Cash</option>
                            <option>Bank</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Update Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditExpenseModal;
