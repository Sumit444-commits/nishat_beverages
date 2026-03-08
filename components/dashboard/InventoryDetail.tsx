import React from 'react';
import { InventoryItem, Sale, Customer, StockAdjustment } from '../../types';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import StatCard from './StatCard';
// Fix: Import each icon from its respective file.
import { PackageIcon } from '../icons/PackageIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { BarChartIcon } from '../icons/BarChartIcon';

interface InventoryDetailProps {
    item: InventoryItem;
    sales: Sale[];
    customers: Customer[];
    adjustments: StockAdjustment[];
    onBack: () => void;
}

const InventoryDetail: React.FC<InventoryDetailProps> = ({ item, sales, customers, adjustments, onBack }) => {

    const getCustomerName = (customerId: number | null) => {
        if (customerId === null) return 'Counter Sale';
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    };

    const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedAdjustments = [...adjustments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-brand-text-secondary hover:text-brand-blue mb-2">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Inventory
                </button>
                <h1 className="text-3xl font-bold text-brand-text-primary">{item.name}</h1>
                <p className="text-brand-text-secondary">Category: {item.category}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Current Stock" value={item.stock.toLocaleString()} icon={<PackageIcon />} />
                <StatCard title="Selling Price" value={`PKR ${item.sellingPrice.toLocaleString()}`} icon={<DollarSignIcon />} />
                <StatCard title="Current Stock Value" value={`PKR ${(item.stock * item.sellingPrice).toLocaleString()}`} icon={<BarChartIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-brand-text-primary">Sales History</h2>
                    </div>
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full text-sm text-left text-brand-text-secondary">
                             <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Customer</th>
                                    <th scope="col" className="px-6 py-3">Quantity</th>
                                    <th scope="col" className="px-6 py-3">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {sortedSales.length === 0 && (
                                    <tr><td colSpan={4} className="text-center p-8">No sales recorded for this item.</td></tr>
                                )}
                                {sortedSales.map(sale => (
                                    <tr key={sale.id} className="border-b">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-brand-text-primary">{getCustomerName(sale.customerId)}</td>
                                        {/* FIX: Property 'bottlesSold' does not exist on type 'Sale'. Replaced with 'quantity'. */}
                                        <td className="px-6 py-4">{sale.quantity}</td>
                                        <td className="px-6 py-4 font-semibold">PKR {sale.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-brand-text-primary">Stock Adjustment History</h2>
                    </div>
                    <div className="overflow-y-auto max-h-96">
                        <table className="w-full text-sm text-left text-brand-text-secondary">
                            <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Reason</th>
                                    <th scope="col" className="px-6 py-3">Adjustment</th>
                                    <th scope="col" className="px-6 py-3">New Level</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {sortedAdjustments.length === 0 && (
                                    <tr><td colSpan={4} className="text-center p-8">No stock adjustments recorded.</td></tr>
                                )}
                                {sortedAdjustments.map(adj => (
                                    <tr key={adj.id} className="border-b">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(adj.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-brand-text-primary">{adj.reason}</td>
                                        <td className={`px-6 py-4 font-semibold ${adj.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{adj.newStockLevel}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

             <div className="bg-brand-surface rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-brand-text-primary">Supplier Information</h2>
                <p className="text-brand-text-secondary mt-2">Supplier details for this item are not yet available.</p>
             </div>
        </div>
    );
};

export default InventoryDetail;