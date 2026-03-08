import React, { useMemo, useState } from 'react';
import { Customer, Sale, InventoryItem, DailyReminder, Salesman } from '../../types';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import StatCard from './StatCard';
import { PackageIcon } from '../icons/PackageIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { EditIcon } from '../icons/EditIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { RefreshCwIcon } from '../icons/RefreshCwIcon';
import { BoxIcon } from '../icons/BoxIcon';
import { PrinterIcon } from '../icons/PrinterIcon';
import { BellIcon, WhatsAppIcon } from '../icons';
import EditSaleModal from '../customer/EditSaleModal';

interface CustomerDetailProps {
    customer: Customer;
    sales: Sale[];
    reminders: DailyReminder[];
    inventory: InventoryItem[];
    salesmen: Salesman[];
    onBack: () => void;
    onEditCustomer: () => void;
    onAddSale: () => void;
    onUpdateSale: (sale: Sale) => void;
    onClearBalance: () => void;
    onCollectEmpties: () => void;
    onRecordPayment: () => void;
    onSendSummary: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, sales, reminders, inventory, salesmen, onBack, onEditCustomer, onAddSale, onUpdateSale, onClearBalance, onCollectEmpties, onRecordPayment, onSendSummary }) => {
    
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const [expandedReminder, setExpandedReminder] = useState<number | null>(null);
    const [isEditSaleOpen, setIsEditSaleOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const getItemName = (itemId: number | null) => {
        if (itemId === null) return 'Payment Received';
        return inventory.find(i => i.id === itemId)?.name || 'Unknown Item';
    }
    
    const accountStatementEntries = useMemo(() => {
        const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const totalDebits = sortedSales.reduce((sum, s) => sum + s.amount, 0);
        const totalCredits = sortedSales.reduce((sum, s) => sum + s.amountReceived, 0);
        const openingBalance = customer.totalBalance - (totalDebits - totalCredits);
        
        let runningBalance = openingBalance;

        const buildOpeningEntry = (dateISO: string) => {
            const debit = openingBalance > 0 ? openingBalance : 0;
            const credit = openingBalance < 0 ? Math.abs(openingBalance) : 0;

            return {
                id: 'opening',
                date: dateISO,
                description: 'Outstanding Balance',
                debit,
                credit,
                balance: openingBalance,
                amount: debit,
                amountReceived: credit,
                quantity: 0,
            };
        };

        const statement = sortedSales.map(sale => {
            const debit = sale.amount;
            const credit = sale.amountReceived;
            runningBalance += debit - credit;
            
            const description = sale.description || (sale.quantity > 0 
                ? `Sale: ${getItemName(sale.inventoryItemId)} x ${sale.quantity}` 
                : `Payment Received (${sale.paymentMethod})`);

            return { ...sale, description, debit, credit, balance: runningBalance };
        });

        if (statement.length > 0 && statement[0].date) {
            const firstDate = new Date(statement[0].date);
            firstDate.setDate(firstDate.getDate() - 1);
            return [
                buildOpeningEntry(firstDate.toISOString()),
                ...statement,
            ];
        } else if (statement.length === 0 && openingBalance !== 0) {
             return [
                buildOpeningEntry(new Date().toISOString()),
            ];
        }
        return statement;

    }, [sales, inventory, customer.totalBalance]);

    const reversedStatement = useMemo(() => [...accountStatementEntries].reverse(), [accountStatementEntries]);
    const sortedReminders = useMemo(() => [...reminders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [reminders]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start print:hidden">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-brand-text-secondary hover:text-brand-blue mb-2">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Customers
                    </button>
                    <h1 className="text-3xl font-bold text-brand-text-primary">{customer.name}</h1>
                    <p className="text-brand-text-secondary">{customer.address}</p>
                    <p className="text-brand-text-secondary">Mobile: {customer.mobile} | Delivery every {customer.deliveryFrequencyDays} day(s)</p>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        Last Empties Collection: {customer.lastEmptiesCollectionDate ? new Date(customer.lastEmptiesCollectionDate).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
                 <div className="flex flex-wrap items-center justify-end gap-2 max-w-lg">
                    <button onClick={onEditCustomer} className="flex items-center bg-white text-brand-blue border border-brand-blue px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        <EditIcon className="h-4 w-4 mr-2" />
                        Edit
                    </button>
                    <button onClick={onSendSummary} className="flex items-center bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                        <WhatsAppIcon className="h-5 w-5 mr-2" />
                        Send Summary
                    </button>
                    <button onClick={onRecordPayment} className="flex items-center bg-teal-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-600 transition-colors">
                        <DollarSignIcon className="h-5 w-5 mr-2" />
                        Record Payment
                    </button>
                    <button onClick={onCollectEmpties} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                        <BoxIcon className="h-5 w-5 mr-2" />
                        Collect Empties
                    </button>
                    {customer.totalBalance > 0 && (
                        <button onClick={onClearBalance} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Clear Balance
                        </button>
                    )}
                     <button onClick={onAddSale} className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Add Sale
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
                 <StatCard 
                    title="Outstanding Balance" 
                    value={`PKR ${customer.totalBalance.toLocaleString()}`} 
                    icon={<DollarSignIcon />}
                    color={customer.totalBalance > 0 ? "text-yellow-500" : "text-green-500"}
                />
                 <StatCard 
                    title="Total Items Purchased" 
                    value={totalItems.toString()} 
                    icon={<PackageIcon />}
                />
                 <StatCard 
                    title="Empty Bottles Held" 
                    value={customer.emptyBottlesHeld.toString()} 
                    icon={<RefreshCwIcon />}
                    color={customer.emptyBottlesHeld > 5 ? "text-orange-500" : "text-brand-text-secondary"}
                />
                 <StatCard 
                    title="Total Revenue Generated" 
                    value={`PKR ${totalRevenue.toLocaleString()}`} 
                    icon={<DollarSignIcon />}
                    color="text-brand-blue"
                />
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden print:shadow-none print:rounded-none">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center print:hidden">
                    <h2 className="text-xl font-bold text-brand-text-primary">Customer Account Statement</h2>
                    <button onClick={handlePrint} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                        <PrinterIcon className="h-5 w-5 mr-2" />
                        Print Statement
                    </button>
                </div>
                 <div className="p-6 border-b border-gray-200 hidden print:block">
                    <h1 className="text-2xl font-bold text-center">Nishat Beverages</h1>
                    <h2 className="text-xl font-semibold text-center">Account Statement</h2>
                    <div className="mt-4 text-sm">
                        <p><span className="font-semibold">Customer:</span> {customer.name}</p>
                        <p><span className="font-semibold">Address:</span> {customer.address}</p>
                        <p><span className="font-semibold">Date Printed:</span> {new Date().toLocaleDateString()}</p>
                        <p className="font-bold mt-2">Current Balance: PKR {customer.totalBalance.toLocaleString()}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50 print:text-black">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-right">Debit (PKR)</th>
                                <th scope="col" className="px-6 py-3 text-right">Credit (PKR)</th>
                                <th scope="col" className="px-6 py-3 text-right">Balance (PKR)</th>
                                <th scope="col" className="px-6 py-3 print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                             {reversedStatement.map(entry => (
                                <tr key={entry.id} className={`bg-white border-b ${entry.id === 'opening' ? 'italic' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{entry.description}</td>
                                    <td className="px-6 py-4 text-right text-yellow-600">
                                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-green-600">
                                        {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-right text-brand-text-primary">
                                        {entry.balance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 print:hidden">
                                        {entry.id !== 'opening' && entry.debit > 0 && (
                                            <button
                                                onClick={() => {
                                                    const sale = sales.find(s => s.id === entry.id);
                                                    if (sale) {
                                                        setSelectedSale(sale);
                                                        setIsEditSaleOpen(true);
                                                    }
                                                }}
                                                className="flex items-center text-brand-blue hover:underline text-sm font-medium"
                                            >
                                                <EditIcon className="h-4 w-4 mr-1"/>
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {accountStatementEntries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 px-6 text-brand-text-secondary">
                                        No transactions have been recorded for this customer yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden print:hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-text-primary flex items-center"><BellIcon className="h-5 w-5 mr-3 text-brand-blue" />Daily Reminder History</h2>
                </div>
                <div className="p-4 space-y-2">
                    {sortedReminders.length > 0 ? sortedReminders.map(reminder => (
                        <div key={reminder.id} className="border rounded-lg">
                            <button 
                                className="w-full text-left p-3 flex justify-between items-center hover:bg-gray-50"
                                onClick={() => setExpandedReminder(prev => prev === reminder.id ? null : reminder.id)}
                            >
                                <span className="font-semibold">Reminder Sent: {new Date(reminder.date).toLocaleString()}</span>
                                <span className="text-sm">{expandedReminder === reminder.id ? 'Hide' : 'Show'} Details</span>
                            </button>
                            {expandedReminder === reminder.id && (
                                <div className="p-4 border-t bg-gray-50">
                                    <pre className="whitespace-pre-wrap text-sm text-brand-text-secondary font-sans">{reminder.message}</pre>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="text-center text-brand-text-secondary py-6">No reminders have been sent to this customer.</p>
                    )}
                </div>
            </div>

            <EditSaleModal
                isOpen={isEditSaleOpen}
                onClose={() => setIsEditSaleOpen(false)}
                sale={selectedSale}
                customers={[customer]}
                salesmen={salesmen}
                inventory={inventory}
                onUpdateSale={onUpdateSale}
            />
        </div>
    );
};

export default CustomerDetail;