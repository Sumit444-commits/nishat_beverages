import React from 'react';
import { Customer, Sale } from '../../types';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { BoxIcon } from '../icons/BoxIcon';
import { isDeliveryDue } from '../../utils/delivery-helper';

interface CustomerTableProps {
    customers: Customer[];
    sales: Sale[];
    onAddSale: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
    onEditCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customerId: number) => void;
    onCollectEmpties: (customer: Customer) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, sales, onAddSale, onViewDetails, onEditCustomer, onDeleteCustomer, onCollectEmpties }) => {
    
    const openWhatsApp = (mobile: string) => {
        const url = `https://wa.me/${mobile.replace(/\D/g, '')}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Customer Name</th>
                            <th scope="col" className="px-6 py-3">Address</th>
                            <th scope="col" className="px-6 py-3">Mobile</th>
                            <th scope="col" className="px-6 py-3">Balance (PKR)</th>
                            <th scope="col" className="px-6 py-3">Empties Held</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => {
                            const deliveryDue = isDeliveryDue(customer, sales);
                            return (
                                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary whitespace-nowrap">
                                        <button onClick={() => onViewDetails(customer)} className="hover:underline">
                                            {customer.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-xs">{customer.address}</td>
                                    <td className="px-6 py-4">{customer.mobile}</td>
                                    <td className={`px-6 py-4 font-semibold ${customer.totalBalance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {customer.totalBalance.toLocaleString()}
                                    </td>
                                     <td className={`px-6 py-4 font-semibold ${customer.emptyBottlesHeld > 5 ? 'text-red-600' : 'text-brand-text-primary'}`}>
                                        {customer.emptyBottlesHeld}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deliveryDue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {deliveryDue ? 'Due Today' : 'Scheduled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => onAddSale(customer)}
                                                className="bg-green-500 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-600 transition-colors"
                                            >
                                                Sale
                                            </button>
                                             <button
                                                onClick={() => onCollectEmpties(customer)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-blue-600 transition-colors flex items-center"
                                            >
                                                <BoxIcon className="h-3 w-3 mr-1"/>
                                                Collect
                                            </button>
                                            <button onClick={() => onEditCustomer(customer)} className="font-medium text-sm text-brand-blue hover:underline">
                                                Edit
                                            </button>
                                            <button onClick={() => openWhatsApp(customer.mobile)} title="Contact on WhatsApp" className="text-green-500 hover:text-green-700 transition-colors">
                                                <WhatsAppIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => onDeleteCustomer(customer.id)} title="Delete Customer" className="text-red-500 hover:text-red-700 transition-colors">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
             {customers.length === 0 && (
                <div className="text-center py-10 px-6 text-brand-text-secondary">
                    No customers found matching your filters.
                </div>
            )}
        </div>
    );
};

export default CustomerTable;