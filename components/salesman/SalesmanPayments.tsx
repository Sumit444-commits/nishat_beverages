import React from 'react';
import { SalesmanPayment, Salesman } from '../../types';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';

interface SalesmanPaymentsProps {
    payments: SalesmanPayment[];
    salesmen: Salesman[];
    onAddPayment: () => void;
}

const SalesmanPayments: React.FC<SalesmanPaymentsProps> = ({ payments, salesmen, onAddPayment }) => {
    
    const getSalesmanName = (salesmanId: number): string => {
        return salesmen.find(s => s.id === salesmanId)?.name || 'Unknown Salesman';
    };

    const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-bold text-brand-text-primary">Salesman Payments</h2>
                <button 
                  onClick={onAddPayment}
                  className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Record Payment
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Salesman</th>
                            <th scope="col" className="px-6 py-3">Payment Method</th>
                            <th scope="col" className="px-6 py-3">Notes</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPayments.length > 0 ? sortedPayments.map((payment) => (
                            <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">{new Date(payment.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-brand-text-primary">{getSalesmanName(payment.salesmanId)}</td>
                                <td className="px-6 py-4">{payment.paymentMethod}</td>
                                <td className="px-6 py-4 truncate max-w-xs">{payment.notes || '-'}</td>
                                <td className="px-6 py-4 font-semibold text-right">{payment.amount.toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 px-6 text-brand-text-secondary">
                                    No payments have been recorded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesmanPayments;
