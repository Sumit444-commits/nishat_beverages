import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';

interface OutstandingProps {
    customers: Customer[];
}

type SortKey = 'name' | 'totalBalance' | 'address';
type SortDirection = 'asc' | 'desc';

const Outstanding: React.FC<OutstandingProps> = ({ customers }) => {
    const [sortKey, setSortKey] = useState<SortKey>('totalBalance');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const openWhatsApp = (mobile: string, name: string, balance: number) => {
        const message = `Dear ${name}, this is a friendly reminder from Nishat Beverages that your outstanding balance is PKR ${balance.toLocaleString()}. Thank you!`;
        const url = `https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const sortedCustomers = useMemo(() => {
        const filtered = customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.mobile.includes(searchTerm)
        );

        return [...filtered].sort((a, b) => {
            let valA, valB;
            switch(sortKey) {
                case 'name':
                case 'address':
                    valA = a[sortKey].toLowerCase();
                    valB = b[sortKey].toLowerCase();
                    break;
                case 'totalBalance':
                    valA = a.totalBalance;
                    valB = b.totalBalance;
                    break;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [customers, sortKey, sortDirection, searchTerm]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const totalOutstanding = useMemo(() => customers.reduce((sum, c) => sum + c.totalBalance, 0), [customers]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-brand-text-primary">Outstanding Balances</h1>
                 <div className="p-4 rounded-lg bg-yellow-100 text-yellow-800">
                     <span className="font-semibold">Total Outstanding:</span>
                     <span className="font-bold text-xl ml-2">PKR {totalOutstanding.toLocaleString()}</span>
                 </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b">
                    <input 
                        type="text"
                        placeholder="Search by name, address, or phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('name')}>Name</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('address')}>Address</th>
                                <th scope="col" className="px-6 py-3">Mobile</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer text-right" onClick={() => handleSort('totalBalance')}>Balance (PKR)</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCustomers.map(customer => (
                                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{customer.name}</td>
                                    <td className="px-6 py-4 truncate max-w-sm">{customer.address}</td>
                                    <td className="px-6 py-4">{customer.mobile}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-yellow-600">{customer.totalBalance.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => openWhatsApp(customer.mobile, customer.name, customer.totalBalance)}
                                            className="flex items-center justify-center mx-auto bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-green-600 transition-colors"
                                        >
                                            <WhatsAppIcon className="h-4 w-4 mr-2" />
                                            Send Reminder
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {sortedCustomers.length === 0 && (
                    <div className="text-center py-10 px-6 text-brand-text-secondary">
                        No customers with outstanding balances found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Outstanding;