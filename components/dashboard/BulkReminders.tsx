import React, { useState, useMemo } from 'react';
import { Customer, Sale } from '../../types';
import { WhatsAppIcon } from '../icons';

interface BulkRemindersProps {
    customers: Customer[];
    sales: Sale[];
    onSend: (targets: Customer[], messageTemplate: string) => void;
}

const DEFAULT_TEMPLATE = `Dear {customerName},\n\nThis is a friendly reminder from Nishat Beverages that your outstanding balance is PKR {outstandingBalance}.\n\nPlease arrange for payment at your earliest convenience.\n\nThank you!`;

const PLACEHOLDERS = [
    '{customerName}',
    '{outstandingBalance}',
    '{address}',
    '{mobileNumber}',
    '{lastSaleDate}',
];

const BulkReminders: React.FC<BulkRemindersProps> = ({ customers, sales, onSend }) => {
    const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE);
    const [targetFilter, setTargetFilter] = useState<'outstanding' | 'all'>('outstanding');

    const targetedCustomers = useMemo(() => {
        if (targetFilter === 'all') {
            return customers;
        }
        return customers.filter(c => c.totalBalance > 0);
    }, [customers, targetFilter]);

    const handleSendReminders = () => {
        if (targetedCustomers.length === 0) {
            alert("No customers to send reminders to.");
            return;
        }
        const confirmation = window.confirm(`Are you sure you want to send this reminder to ${targetedCustomers.length} customer(s)?`);
        if (confirmation) {
            onSend(targetedCustomers, messageTemplate);
            alert(`${targetedCustomers.length} reminders have been queued for sending.`);
        }
    };

    const insertPlaceholder = (placeholder: string) => {
        setMessageTemplate(prev => prev + placeholder);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-brand-text-primary">Bulk Customer Reminders</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-surface rounded-xl shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">1. Compose Your Message</h2>
                    <div>
                        <label htmlFor="message-template" className="block text-sm font-medium text-brand-text-secondary">Message Template</label>
                        <textarea
                            id="message-template"
                            rows={8}
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm font-mono"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-brand-text-secondary mb-2">Click to insert a placeholder:</p>
                        <div className="flex flex-wrap gap-2">
                            {PLACEHOLDERS.map(p => (
                                <button key={p} onClick={() => insertPlaceholder(p)} className="px-2 py-1 bg-gray-200 text-brand-text-secondary text-xs font-mono rounded-md hover:bg-gray-300">
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-brand-surface rounded-xl shadow-md p-6 space-y-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">2. Select Audience & Send</h2>
                     <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">Target Audience</label>
                        <div className="mt-2 flex space-x-4">
                            <button onClick={() => setTargetFilter('outstanding')} className={`px-4 py-2 text-sm font-semibold rounded-md ${targetFilter === 'outstanding' ? 'bg-brand-blue text-white' : 'bg-gray-200'}`}>
                                Customers with Balance
                            </button>
                             <button onClick={() => setTargetFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-md ${targetFilter === 'all' ? 'bg-brand-blue text-white' : 'bg-gray-200'}`}>
                                All Customers
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-brand-text-secondary"><span className="font-bold text-brand-text-primary">{targetedCustomers.length}</span> customer(s) will receive this message.</p>
                    </div>
                    <div className="pt-4">
                         <button
                            onClick={handleSendReminders}
                            disabled={targetedCustomers.length === 0}
                            className="w-full flex items-center justify-center bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <WhatsAppIcon className="h-6 w-6 mr-3" />
                            Send Reminders
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b">
                     <h2 className="text-xl font-bold text-brand-text-primary">Targeted Customers List</h2>
                </div>
                 <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Mobile</th>
                                <th className="px-6 py-3 text-right">Balance (PKR)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                             {targetedCustomers.map(customer => (
                                <tr key={customer.id} className="border-b">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{customer.name}</td>
                                    <td className="px-6 py-4">{customer.mobile}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{customer.totalBalance.toLocaleString()}</td>
                                </tr>
                            ))}
                            {targetedCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center p-8">No customers match the selected filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BulkReminders;
