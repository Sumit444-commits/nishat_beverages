import React from 'react';
import { Customer, Sale } from '../../types';
import { WhatsAppIcon, PlusCircleIcon, EditIcon, TrashIcon, BoxIcon, DollarSignIcon, PackageIcon, RefreshCwIcon } from '../icons';

interface CustomerAccountCardProps {
    customer: Customer;
    sales: Sale[];
    index: number;
    onAddSale: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
    onEditCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customerId: number) => void;
    onCollectEmpties: (customer: Customer) => void;
}

const CustomerAccountCard: React.FC<CustomerAccountCardProps> = ({ 
    customer, 
    sales, 
    index,
    onAddSale, 
    onViewDetails, 
    onEditCustomer, 
    onDeleteCustomer,
    onCollectEmpties
}) => {

    const totalItemsPurchased = sales
        .filter(s => s.customerId === customer.id)
        .reduce((sum, s) => sum + s.quantity, 0);

    const openWhatsApp = (mobile: string) => {
        const url = `https://wa.me/${mobile.replace(/\D/g, '')}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="bg-brand-surface rounded-xl shadow-md p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div>
                <div className="border-b pb-3 mb-3">
                    <button onClick={() => onViewDetails(customer)} className="w-full text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-brand-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
                                #{index + 1}
                            </span>
                            <h3 className="font-bold text-lg text-brand-blue hover:underline truncate">{customer.name}</h3>
                        </div>
                    </button>
                    <p className="text-sm text-brand-text-secondary truncate">{customer.address}</p>
                    <p className="text-sm text-brand-text-secondary">{customer.mobile}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                    <div>
                        <p className="font-semibold text-brand-text-secondary">Balance</p>
                        <p className={`font-bold text-lg ${customer.totalBalance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {customer.totalBalance.toLocaleString()}
                        </p>
                    </div>
                     <div>
                        <p className="font-semibold text-brand-text-secondary">Bottles Held</p>
                        <p className={`font-bold text-lg ${customer.emptyBottlesHeld > 5 ? 'text-red-600' : 'text-brand-text-primary'}`}>
                            {customer.emptyBottlesHeld}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-brand-text-secondary">Total Bought</p>
                        <p className="font-bold text-lg text-brand-text-primary">
                            {totalItemsPurchased}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t">
                <button onClick={() => onAddSale(customer)} className="flex-1 text-xs bg-green-500 text-white px-2 py-1.5 rounded font-semibold hover:bg-green-600 transition-colors">Sale</button>
                <button onClick={() => onCollectEmpties(customer)} className="flex-1 text-xs bg-blue-500 text-white px-2 py-1.5 rounded font-semibold hover:bg-blue-600 transition-colors">Collect</button>
                <button onClick={() => onViewDetails(customer)} className="flex-1 text-xs bg-gray-500 text-white px-2 py-1.5 rounded font-semibold hover:bg-gray-600 transition-colors">Details</button>
                <button onClick={() => onEditCustomer(customer)} className="p-1.5 text-brand-blue hover:bg-blue-100 rounded-full"><EditIcon className="h-4 w-4" /></button>
                <button onClick={() => openWhatsApp(customer.mobile)} className="p-1.5 text-green-500 hover:bg-green-100 rounded-full"><WhatsAppIcon className="h-4 w-4" /></button>
                <button onClick={() => onDeleteCustomer(customer.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="h-4 w-4" /></button>
            </div>
        </div>
    );
};

export default CustomerAccountCard;
