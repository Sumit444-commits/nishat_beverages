import React, { useState, useMemo } from 'react';
import { Expense, Salesman, ExpenseOwner } from '../../types';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { EditIcon } from '../icons/EditIcon';

interface AccountManagementProps {
    expenses: Expense[];
    salesmen: Salesman[];
    expenseOwners: ExpenseOwner[];
    onAddExpense: (ownerId: number | null, ownerType: 'salesman' | 'owner' | null) => void;
    onEditExpense: (expense: Expense) => void;
    onAddOwner: (name: string) => Promise<ExpenseOwner>;
}

const AccountManagement: React.FC<AccountManagementProps> = ({ 
    expenses, 
    salesmen, 
    expenseOwners, 
    onAddExpense, 
    onEditExpense,
    onAddOwner 
}) => {
    const [newOwnerName, setNewOwnerName] = useState('');
    const [isCreatingOwner, setIsCreatingOwner] = useState(false);

    // Calculate expenses for each account
    const accountExpenses = useMemo(() => {
        const accounts = new Map();
        
        // Initialize salesman accounts
        salesmen.forEach(salesman => {
            accounts.set(`salesman-${salesman.id}`, {
                id: salesman.id,
                name: salesman.name,
                type: 'salesman' as const,
                expenses: [],
                totalExpenses: 0
            });
        });

        // Initialize owner accounts
        expenseOwners.forEach(owner => {
            accounts.set(`owner-${owner.id}`, {
                id: owner.id,
                name: owner.name,
                type: 'owner' as const,
                expenses: [],
                totalExpenses: 0
            });
        });

        // Add expenses to accounts
        expenses.forEach(expense => {
            if (expense.ownerId && expense.ownerType) {
                const key = `${expense.ownerType}-${expense.ownerId}`;
                const account = accounts.get(key);
                if (account) {
                    account.expenses.push(expense);
                    account.totalExpenses += expense.amount;
                }
            }
        });

        return Array.from(accounts.values());
    }, [expenses, salesmen, expenseOwners]);

    const handleCreateOwner = async () => {
        if (!newOwnerName.trim()) {
            alert("Account name cannot be empty.");
            return;
        }
        setIsCreatingOwner(true);
        try {
            await onAddOwner(newOwnerName.trim());
            setNewOwnerName('');
        } catch (error) {
            alert("Failed to create account. Please try again.");
        } finally {
            setIsCreatingOwner(false);
        }
    };

    const handleAddExpenseForAccount = (accountId: number | null, accountType: 'salesman' | 'owner' | null) => {
        onAddExpense(accountId, accountType);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-text-primary">Account Management</h1>
            </div>

            {/* Create New Account Section */}
            <div className="bg-brand-surface rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-brand-text-primary mb-4">Create New Account</h3>
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Enter account name (e.g., Chander, Sham)"
                        value={newOwnerName}
                        onChange={e => setNewOwnerName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    />
                    <button
                        onClick={handleCreateOwner}
                        disabled={!newOwnerName.trim() || isCreatingOwner}
                        className="px-6 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-lightblue disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCreatingOwner ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accountExpenses.map((account) => (
                    <div key={`${account.type}-${account.id}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-brand-text-primary">{account.name}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    account.type === 'salesman' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {account.type === 'salesman' ? 'Salesman' : 'Owner'}
                                </span>
                            </div>
                            <div className="text-sm text-brand-text-secondary">
                                {account.expenses.length} expense{account.expenses.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-4">
                                <div className="text-sm text-brand-text-secondary mb-1">Total Expenses</div>
                                <div className="text-2xl font-bold text-red-600">
                                    PKR {account.totalExpenses.toLocaleString()}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleAddExpenseForAccount(account.id, account.type)}
                                className="w-full flex items-center justify-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                            >
                                <PlusCircleIcon className="h-4 w-4 mr-2" />
                                Add Expense
                            </button>
                            
                            {account.expenses.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="text-sm font-medium text-brand-text-secondary mb-2">Recent Expenses:</div>
                                    {account.expenses.slice(-3).reverse().map((expense) => (
                                        <div key={expense.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                            <div className="flex-1">
                                                <div className="font-medium text-brand-text-primary">{expense.name}</div>
                                                <div className="text-xs text-brand-text-secondary">
                                                    {new Date(expense.date).toLocaleDateString()} • {expense.category}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-red-600">PKR {expense.amount.toLocaleString()}</span>
                                                <button 
                                                    onClick={() => onEditExpense(expense)}
                                                    className="text-brand-blue hover:text-brand-accent transition-colors"
                                                    title="Edit Expense"
                                                >
                                                    <EditIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {accountExpenses.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <div className="text-brand-text-secondary text-lg">No accounts found</div>
                        <div className="text-brand-text-secondary text-sm mt-2">Create your first account to start tracking expenses</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountManagement;
