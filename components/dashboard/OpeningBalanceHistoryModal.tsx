import React, { useMemo } from 'react';
import { Sale, Expense } from '../../types';

interface OpeningBalanceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    sales: Sale[];
    expenses: Expense[];
}

const OpeningBalanceHistoryModal: React.FC<OpeningBalanceHistoryModalProps> = ({ isOpen, onClose, sales, expenses }) => {
    
    const history = useMemo(() => {
        if (!isOpen) return [];

        // Combine sales and expenses into a single sorted transaction list
        const allTransactions = [
            ...sales.map(s => ({ date: new Date(s.date), amount: s.amountReceived })),
            ...expenses.map(e => ({ date: new Date(e.date), amount: -e.amount })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        const dailyHistory: { date: string; openingBalance: number }[] = [];
        
        // Iterate backwards for the last 30 days
        for (let i = 0; i < 30; i++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            targetDate.setHours(0, 0, 0, 0);

            // The opening balance for a day is the closing balance of the day before
            const dayBefore = new Date(targetDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const endOfDayBefore = new Date(dayBefore);
            endOfDayBefore.setHours(23, 59, 59, 999);

            let closingBalanceDayBefore = 0;
            // Sum all transactions up to the end of the previous day
            for (const trans of allTransactions) {
                if (trans.date <= endOfDayBefore) {
                    closingBalanceDayBefore += trans.amount;
                } else {
                    break; // Optimization: transactions are sorted by date
                }
            }
            
            dailyHistory.push({
                date: targetDate.toLocaleDateString('en-CA'), // YYYY-MM-DD format
                openingBalance: closingBalanceDayBefore
            });
        }

        return dailyHistory;
    }, [sales, expenses, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-text-primary">Opening Balance History (Last 30 Days)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <div className="overflow-y-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Opening Balance (PKR)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {history.map(({ date, openingBalance }) => (
                                <tr key={date} className="border-b">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{new Date(date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{openingBalance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-4 mt-auto flex-shrink-0">
                     <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Close</button>
                </div>
            </div>
        </div>
    );
};

export default OpeningBalanceHistoryModal;