import React, { useState, useMemo } from 'react';
import { Customer, Sale, CustomerDailySummary } from '../../types';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface DailyRemindersProps {
    customers: Customer[];
    sales: Sale[];
    onSendReminder: (summary: CustomerDailySummary) => void;
}

const DailyReminders: React.FC<DailyRemindersProps> = ({ customers, sales, onSendReminder }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const dailySummaries = useMemo<CustomerDailySummary[]>(() => {
        const summaries: CustomerDailySummary[] = [];

        for (const customer of customers) {
            const todaySales = sales.filter(s =>
                s.customerId === customer.id &&
                new Date(s.date).toISOString().split('T')[0] === selectedDate
            );

            if (todaySales.length > 0) {
                 const totalSaleAmount = todaySales.reduce((sum, s) => sum + s.amount, 0);
                 const paidAmount = todaySales.reduce((sum, s) => sum + s.amountReceived, 0);
                 const unpaidAmount = totalSaleAmount - paidAmount;
                 const previousBalance = customer.totalBalance - unpaidAmount;
                 const bottlesPurchased = todaySales.reduce((sum, s) => sum + s.quantity, 0);

                 summaries.push({
                     customerId: customer.id,
                     customerName: customer.name,
                     customerMobile: customer.mobile,
                     date: selectedDate,
                     bottlesPurchased,
                     totalSaleAmount,
                     paidAmount,
                     unpaidAmount,
                     previousBalance,
                     closingBalance: customer.totalBalance,
                     remainingEmpties: customer.emptyBottlesHeld,
                 });
            }
        }
        return summaries.sort((a,b) => a.customerName.localeCompare(b.customerName));
    }, [selectedDate, customers, sales]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-brand-text-primary">Daily Customer Reminders</h1>
                 <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
            </div>

            {dailySummaries.length > 0 ? (
                <div className="space-y-4">
                    {dailySummaries.map(summary => (
                        <div key={summary.customerId} className="bg-brand-surface rounded-xl shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                           <div className="flex-1">
                                <h3 className="font-bold text-lg text-brand-text-primary">{summary.customerName}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-2 text-sm">
                                    <p><span className="font-semibold text-brand-text-secondary">Prev Balance:</span> {summary.previousBalance.toLocaleString()}</p>
                                    <p><span className="font-semibold text-brand-text-secondary">Today's Sales:</span> {summary.totalSaleAmount.toLocaleString()}</p>
                                    <p><span className="font-semibold text-brand-text-secondary">Today's Paid:</span> {summary.paidAmount.toLocaleString()}</p>
                                    <p><span className="font-semibold text-brand-text-secondary text-yellow-600">Today's Unpaid:</span> {summary.unpaidAmount.toLocaleString()}</p>
                                    <p className="font-bold"><span className="font-semibold text-brand-text-secondary">Closing Balance:</span> {summary.closingBalance.toLocaleString()}</p>
                                    <p><span className="font-semibold text-brand-text-secondary">Bottles Today:</span> {summary.bottlesPurchased}</p>
                                    <p><span className="font-semibold text-brand-text-secondary text-red-600">Empties Held:</span> {summary.remainingEmpties}</p>
                                </div>
                           </div>
                           <div className="flex-shrink-0 w-full md:w-auto">
                                <button
                                    onClick={() => onSendReminder(summary)}
                                    className="w-full flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                                >
                                    <WhatsAppIcon className="h-5 w-5 mr-2" />
                                    Send Reminder
                                </button>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-brand-surface rounded-xl shadow-md">
                    <p className="text-brand-text-secondary">No customer sales were recorded on {new Date(selectedDate).toLocaleDateString()}.</p>
                    <p className="text-sm text-gray-400 mt-2">Change the date to view summaries for other days.</p>
                </div>
            )}
        </div>
    );
};

export default DailyReminders;