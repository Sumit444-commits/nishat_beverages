import React from 'react';
import { Expense, Salesman, ExpenseOwner } from '../../types';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { EditIcon } from '../icons/EditIcon';

interface ExpensesProps {
    expenses: Expense[];
    salesmen: Salesman[];
    expenseOwners: ExpenseOwner[];
    onAddExpense: () => void;
    onEditExpense: (expense: Expense) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, salesmen, expenseOwners, onAddExpense, onEditExpense }) => {
    
    const getOwnerName = (expense: Expense): string => {
        if (!expense.ownerId || !expense.ownerType) {
            return 'N/A';
        }
        if (expense.ownerType === 'salesman') {
            return salesmen.find(s => s.id === expense.ownerId)?.name || 'Unknown';
        }
        return expenseOwners.find(o => o.id === expense.ownerId)?.name || 'Unknown';
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-text-primary">Expenses Management</h1>
                <button 
                  onClick={onAddExpense}
                  className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add Expense
                </button>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-brand-text-primary mb-4">Accounts</h3>
                    <button className="bg-white text-brand-text-secondary px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-semibold">
                        View All Accounts
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Account Holder</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Payment From</th>
                                <th scope="col" className="px-6 py-3">Amount (PKR)</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? expenses.map((expense) => (
                                <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{getOwnerName(expense)}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{expense.paymentMethod}</td>
                                    <td className="px-6 py-4 font-semibold">{expense.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => onEditExpense(expense)} className="font-medium text-brand-blue hover:text-brand-accent transition-colors" title="Edit Expense">
                                            <EditIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 px-6 text-brand-text-secondary">
                                        No expenses recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Expenses;