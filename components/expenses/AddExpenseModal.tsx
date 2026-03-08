import React, { useState, useMemo, useEffect } from 'react';
import { Expense, EXPENSE_CATEGORIES, Salesman, ExpenseOwner } from '../../types';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    salesmen: Salesman[];
    expenseOwners: ExpenseOwner[];
    onAddOwner: (name: string) => Promise<ExpenseOwner>;
    preselectedAccountId?: { id: number | null; type: 'salesman' | 'owner' | null } | null;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense, salesmen, expenseOwners, onAddOwner, preselectedAccountId }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
    const [selectedOwner, setSelectedOwner] = useState(''); // Format: "salesman-1" or "owner-2"
    const [newOwnerName, setNewOwnerName] = useState('');
    const [isCreatingOwner, setIsCreatingOwner] = useState(false);

    const accounts = useMemo(() => {
        const salesmanAccounts = salesmen.map(s => ({ id: `salesman-${s.id}`, name: s.name }));
        const ownerAccounts = expenseOwners.map(o => ({ id: `owner-${o.id}`, name: o.name }));
        return [...salesmanAccounts, ...ownerAccounts].sort((a,b) => a.name.localeCompare(b.name));
    }, [salesmen, expenseOwners]);

    useEffect(() => {
        if (!isOpen) {
            // Reset form on close
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('');
            setName('');
            setDescription('');
            setAmount('');
            setPaymentMethod('Cash');
            setSelectedOwner('');
            setNewOwnerName('');
        } else if (preselectedAccountId && preselectedAccountId.id && preselectedAccountId.type) {
            // Set preselected account when modal opens
            setSelectedOwner(`${preselectedAccountId.type}-${preselectedAccountId.id}`);
        }
    }, [isOpen, preselectedAccountId]);


    const handleCreateOwner = async () => {
        if (!newOwnerName.trim()) {
            alert("Owner name cannot be empty.");
            return;
        }
        setIsCreatingOwner(true);
        const newOwner = await onAddOwner(newOwnerName.trim());
        setNewOwnerName('');
        setSelectedOwner(`owner-${newOwner.id}`);
        setIsCreatingOwner(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const [ownerType, ownerIdStr] = selectedOwner.split('-');
        const ownerId = ownerIdStr ? parseInt(ownerIdStr, 10) : null;

        const newExpense: Omit<Expense, 'id'> = {
            date,
            category,
            name,
            description,
            amount: Number(amount),
            paymentMethod,
            ownerId,
            ownerType: ownerId ? (ownerType as 'salesman' | 'owner') : null,
        };
        onAddExpense(newExpense);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Add New Expense</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="account-owner" className="block text-sm font-medium text-brand-text-secondary">Account / Owner (optional)</label>
                        <select
                            id="account-owner"
                            value={selectedOwner}
                            onChange={e => setSelectedOwner(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        >
                            <option value="">-- Select existing account --</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                        <div className="flex items-center mt-2 space-x-2">
                            <input
                                type="text"
                                placeholder="Create new owner (e.g., Sham)"
                                value={newOwnerName}
                                onChange={e => setNewOwnerName(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleCreateOwner}
                                disabled={!newOwnerName.trim() || isCreatingOwner}
                                className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {isCreatingOwner ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-brand-text-secondary">Date</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-brand-text-secondary">Category</label>
                        <input type="text" id="category" list="expense-categories" value={category} placeholder="e.g., Utilities, Rent" onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                        <datalist id="expense-categories">
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary">Name</label>
                        <input type="text" id="name" value={name} placeholder="e.g., Electricity, Rent" onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-brand-text-secondary">Description</label>
                        <input type="text" id="description" value={description} placeholder="Optional details" onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-brand-text-secondary">Amount (PKR)</label>
                        <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-brand-text-secondary">Payment From</label>
                        <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Bank')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option>Cash</option>
                            <option>Bank</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Add Expense</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
