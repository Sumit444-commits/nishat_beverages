import React from 'react';
import { Customer, Sale } from '../../types';
import CustomerAccountCard from './CustomerAccountCard';

interface CustomerAccountsProps {
    customers: Customer[];
    sales: Sale[];
    onAddSale: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
    onEditCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customerId: number) => void;
    onCollectEmpties: (customer: Customer) => void;
}

const CustomerAccounts: React.FC<CustomerAccountsProps> = (props) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {props.customers.map((customer, index) => (
                <CustomerAccountCard 
                    key={customer.id}
                    customer={customer}
                    index={index}
                    {...props}
                />
            ))}
             {props.customers.length === 0 && (
                <div className="col-span-full text-center py-10 px-6 text-brand-text-secondary bg-brand-surface rounded-xl shadow-md">
                    No customers found matching your filters.
                </div>
            )}
        </div>
    );
};

export default CustomerAccounts;
