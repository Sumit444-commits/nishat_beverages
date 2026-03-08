import React, { useState } from 'react';
import { Sale, Customer, Salesman, InventoryItem } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface DailySalesProps {
    sales: Sale[];
    customers: Customer[];
    salesmen: Salesman[];
    inventory: InventoryItem[];
    onEditSale: (sale: Sale) => void;
    onDeleteSale: (saleId: number) => void;
}

const DailySales: React.FC<DailySalesProps> = ({ sales, customers, salesmen, inventory, onEditSale, onDeleteSale }) => {

    const getCustomerName = (customerId: number | null) => {
        if (customerId === null) return 'Counter Sale';
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    };

    const getSalesmanName = (salesmanId: number | null) => {
        if (salesmanId === null) return 'N/A';
        return salesmen.find(s => s.id === salesmanId)?.name || 'Unknown Salesman';
    };

    const getItemName = (sale: Sale) => {
        if (sale.description) return sale.description;
        if (sale.inventoryItemId === null) return 'Payment';
        return inventory.find(i => i.id === sale.inventoryItemId)?.name || 'Unknown Item';
    }

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const filteredSales = sales
        .filter(s => new Date(s.date).toISOString().split('T')[0] === selectedDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-bold text-brand-text-primary">Daily Sales Records</h2>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Item Sold</th>
                            <th scope="col" className="px-6 py-3">Salesman</th>
                            <th scope="col" className="px-6 py-3">Quantity</th>
                            <th scope="col" className="px-6 py-3">Amount (PKR)</th>
                            <th scope="col" className="px-6 py-3">Payment</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale) => (
                            <tr key={sale.id} className="bg-white border-b">
                                <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-brand-text-primary">{getCustomerName(sale.customerId)}</td>
                                <td className="px-6 py-4">{getItemName(sale)}</td>
                                <td className="px-6 py-4">{getSalesmanName(sale.salesmanId)}</td>
                                <td className="px-6 py-4">{sale.quantity > 0 ? sale.quantity : '-'}</td>
                                <td className="px-6 py-4 font-semibold">{sale.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                                            sale.paymentMethod === 'Bank' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'}`
                                    }>
                                        {sale.paymentMethod}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => onEditSale(sale)} className="text-brand-blue hover:text-brand-accent"><EditIcon className="h-4 w-4" /></button>
                                        <button onClick={() => onDeleteSale(sale.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DailySales;