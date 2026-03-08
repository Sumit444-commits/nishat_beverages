import React, { useState, useMemo } from 'react';
import { Salesman, Customer, Sale, SalesmanPayment, AreaAssignment } from '../../types';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import StatCard from './StatCard';
import { UsersIcon } from '../icons/UsersIcon';
import { PackageIcon } from '../icons/PackageIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';


interface SalesmanDetailProps {
    salesman: Salesman;
    customers: Customer[];
    sales: Sale[];
    salesmanPayments: SalesmanPayment[];
    areaAssignments: AreaAssignment[];
    onBack: () => void;
    onViewCustomerDetails: (customer: Customer) => void;
    onViewReport: () => void;
    onAddPayment: () => void;
}

type PerformancePeriod = 'Weekly' | 'Monthly' | 'Yearly';

const SalesmanDetail: React.FC<SalesmanDetailProps> = ({ salesman, customers, sales, salesmanPayments, areaAssignments, onBack, onViewCustomerDetails, onViewReport, onAddPayment }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [performancePeriod, setPerformancePeriod] = useState<PerformancePeriod>('Monthly');

    const assignedCustomers = customers.filter(c => c.salesmanId === salesman.id);
    const salesBySalesman = sales.filter(s => s.salesmanId === salesman.id);
    const totalQuantitySoldAllTime = salesBySalesman.reduce((sum, s) => sum + s.quantity, 0);
    
    const assignedAreas = useMemo(() => {
        return areaAssignments
            .filter(a => a.salesmanId === salesman.id)
            .map(a => a.area);
    }, [areaAssignments, salesman.id]);
    
    const customersByArea = useMemo(() => {
        const grouped: { [area: string]: Customer[] } = {};
        assignedCustomers.forEach(customer => {
            if (customer.area) {
                if (!grouped[customer.area]) {
                    grouped[customer.area] = [];
                }
                grouped[customer.area].push(customer);
            }
        });
        return grouped;
    }, [assignedCustomers]);

    const paymentsForSalesman = useMemo(() => {
        return salesmanPayments
            .filter(p => p.salesmanId === salesman.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [salesmanPayments, salesman.id]);

    const salaryStats = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const paidThisMonth = paymentsForSalesman
            .filter(p => {
                const d = new Date(p.date);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((sum, p) => sum + p.amount, 0);
        const balanceThisMonth = Math.max(salesman.monthlySalary - paidThisMonth, 0);
        const totalPaidAllTime = paymentsForSalesman.reduce((sum, p) => sum + p.amount, 0);
        return { paidThisMonth, balanceThisMonth, totalPaidAllTime };
    }, [paymentsForSalesman, salesman.monthlySalary]);

    const getCustomerName = (customerId: number) => {
        return customers.find(c => c.id === customerId)?.name || 'Unknown';
    };

    const performanceStats = useMemo(() => {
        const now = new Date();
        let periodStartDate = new Date();

        switch (performancePeriod) {
            case 'Weekly':
                periodStartDate.setDate(now.getDate() - 7);
                break;
            case 'Monthly':
                periodStartDate.setMonth(now.getMonth() - 1);
                break;
            case 'Yearly':
                periodStartDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        const salesInPeriod = salesBySalesman.filter(sale => new Date(sale.date) >= periodStartDate);
        
        return {
            quantity: salesInPeriod.reduce((sum, s) => sum + s.quantity, 0),
            revenue: salesInPeriod.reduce((sum, s) => sum + s.amount, 0),
            transactions: salesInPeriod.length,
        };

    }, [salesBySalesman, performancePeriod]);

    const filteredSales = useMemo(() => {
        const sorted = salesBySalesman.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (!startDate && !endDate) {
            return sorted;
        }
        return sorted.filter(sale => {
            const saleDate = sale.date.split('T')[0]; // YYYY-MM-DD format
            if (startDate && saleDate < startDate) {
                return false;
            }
            if (endDate && saleDate > endDate) {
                return false;
            }
            return true;
        });
    }, [salesBySalesman, startDate, endDate]);
    
    const periodButtons: PerformancePeriod[] = ['Weekly', 'Monthly', 'Yearly'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
                 <div>
                     <button onClick={onBack} className="flex items-center text-sm font-semibold text-brand-text-secondary hover:text-brand-blue mb-2">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Salesmen
                    </button>
                    <h1 className="text-3xl font-bold text-brand-text-primary">{salesman.name}</h1>
                    <p className="text-brand-text-secondary">Mobile: {salesman.mobile} | Hired: {new Date(salesman.hireDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onAddPayment}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Record Payment
                    </button>
                    <button
                        onClick={onViewReport}
                        className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                    >
                        View Daily Report
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Assigned Customers" 
                    value={assignedCustomers.length.toString()} 
                    icon={<UsersIcon />}
                />
                 <StatCard 
                    title="Assigned Areas" 
                    value={assignedAreas.length.toString()} 
                    icon={<PackageIcon />}
                    color="text-blue-500"
                />
                 <StatCard 
                    title="Total Items Sold (All Time)" 
                    value={totalQuantitySoldAllTime.toString()} 
                    icon={<PackageIcon />}
                />
                 <StatCard 
                    title="Items Sold Today" 
                    value={salesman.quantitySoldToday.toString()} 
                    icon={<PackageIcon />}
                    color="text-green-500"
                />
            </div>
            
            {/* Assigned Areas Section */}
            {assignedAreas.length > 0 && (
                <div className="bg-brand-surface rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Assigned Areas ({assignedAreas.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedAreas.map(area => (
                            <div key={area} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-brand-text-primary">{area}</h3>
                                    <span className="text-sm text-brand-text-secondary bg-gray-100 px-2 py-1 rounded">
                                        {customersByArea[area]?.length || 0} customers
                                    </span>
                                </div>
                                {customersByArea[area] && customersByArea[area].length > 0 && (
                                    <div className="mt-2 text-xs text-brand-text-secondary">
                                        {customersByArea[area].slice(0, 3).map(c => c.name).join(', ')}
                                        {customersByArea[area].length > 3 && ` +${customersByArea[area].length - 3} more`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Monthly Salary"
                    value={`PKR ${salesman.monthlySalary.toLocaleString()}`}
                    icon={<DollarSignIcon />}
                    color="text-purple-500"
                />
            </div>
            
            {/* Payment Summary Section - Prominent */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-md p-6 border-2 border-green-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Salary Payment Summary</h2>
                    <button 
                        onClick={onAddPayment}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Record Payment
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Salary Paid (This Month)" 
                        value={`PKR ${salaryStats.paidThisMonth.toLocaleString()}`} 
                        icon={<DollarSignIcon />} 
                        color="text-green-600"
                    />
                    <StatCard 
                        title="Salary Balance (This Month)" 
                        value={`PKR ${salaryStats.balanceThisMonth.toLocaleString()}`} 
                        icon={<DollarSignIcon />} 
                        color="text-blue-600"
                    />
                    <StatCard 
                        title="Total Paid (All Time)" 
                        value={`PKR ${salaryStats.totalPaidAllTime.toLocaleString()}`} 
                        icon={<DollarSignIcon />} 
                        color="text-purple-600"
                    />
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-xl font-bold text-brand-text-primary">Sales Performance</h2>
                    <div className="flex items-center space-x-2">
                        {periodButtons.map(period => (
                            <button 
                                key={period} 
                                onClick={() => setPerformancePeriod(period)}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${performancePeriod === period ? 'bg-brand-blue text-white shadow' : 'bg-gray-100 text-brand-text-secondary hover:bg-gray-200'}`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title={`Items Sold (${performancePeriod})`}
                        value={performanceStats.quantity.toLocaleString()}
                        icon={<PackageIcon />}
                        color="text-indigo-500"
                    />
                     <StatCard 
                        title={`Total Revenue (${performancePeriod})`}
                        value={`PKR ${performanceStats.revenue.toLocaleString()}`}
                        icon={<DollarSignIcon />}
                        color="text-green-500"
                    />
                     <StatCard 
                        title={`Transactions (${performancePeriod})`}
                        value={performanceStats.transactions.toLocaleString()}
                        icon={<UsersIcon />}
                        color="text-blue-500"
                    />
                </div>
            </div>


            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-text-primary">Assigned Customers ({assignedCustomers.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Customer Name</th>
                                <th scope="col" className="px-6 py-3">Address</th>
                                <th scope="col" className="px-6 py-3">Mobile</th>
                                <th scope="col" className="px-6 py-3">Balance (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignedCustomers.map(customer => (
                                <tr key={customer.id} className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">
                                        <button onClick={() => onViewCustomerDetails(customer)} className="hover:underline">
                                            {customer.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-sm">{customer.address}</td>
                                    <td className="px-6 py-4">{customer.mobile}</td>
                                    <td className={`px-6 py-4 font-semibold ${customer.totalBalance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {customer.totalBalance.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {assignedCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 px-6 text-brand-text-secondary">
                                        No customers are assigned to this salesman.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                         <h2 className="text-xl font-bold text-brand-text-primary">Sales History</h2>
                         <div className="flex items-center space-x-2 flex-wrap">
                            <label htmlFor="start-date" className="text-sm font-medium text-brand-text-secondary">From:</label>
                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                             <label htmlFor="end-date" className="text-sm font-medium text-brand-text-secondary">To:</label>
                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-3 py-1 bg-gray-200 text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-gray-300">Clear</button>
                         </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Quantity Sold</th>
                                <th scope="col" className="px-6 py-3">Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map(sale => (
                                <tr key={sale.id} className="bg-white border-b">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{getCustomerName(sale.customerId)}</td>
                                    <td className="px-6 py-4">{sale.quantity}</td>
                                    <td className="px-6 py-4 font-semibold">{sale.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                             {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 px-6 text-brand-text-secondary">
                                        No sales found for the selected date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-brand-text-primary">Payment History ({paymentsForSalesman.length})</h2>
                        <p className="text-brand-text-secondary">All salary payments recorded for {salesman.name}</p>
                    </div>
                    <button 
                        onClick={onAddPayment}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Record New Payment
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Amount (PKR)</th>
                                <th scope="col" className="px-6 py-3">Method</th>
                                <th scope="col" className="px-6 py-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentsForSalesman.length > 0 ? paymentsForSalesman.map(p => (
                                <tr key={p.id} className="bg-white border-b">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(p.date).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-semibold">{p.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">{p.paymentMethod}</td>
                                    <td className="px-6 py-4">{p.notes || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 px-6 text-brand-text-secondary">
                                        No payments recorded for this salesman.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesmanDetail;