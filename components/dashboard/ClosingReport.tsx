import React, { useState, useMemo } from 'react';
import { Sale, Expense, Customer, ClosingRecord, ClosingPeriodData } from '../../types';
import { PrinterIcon } from '../icons/PrinterIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CreditCardIcon } from '../icons/CreditCardIcon';

interface ClosingReportProps {
    sales: Sale[];
    expenses: Expense[];
    customers: Customer[];
    closingRecords: ClosingRecord[];
    onInitiateClose: (data: ClosingPeriodData) => void;
}

type Period = 'Today' | 'This Month' | 'This Year' | 'Custom';
type PaymentMethodFilter = 'All' | 'Cash' | 'Bank';

const ClosingReport: React.FC<ClosingReportProps> = ({ sales, expenses, customers, closingRecords, onInitiateClose }) => {
    const [activePeriod, setActivePeriod] = useState<Period>('Today');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('All');

    const getCustomerName = (customerId: number | null) => {
        if (customerId === null) return 'Counter Sale';
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    };

    const previousMonthData = useMemo(() => {
        const now = new Date();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = prevMonthDate.getFullYear();
        const month = prevMonthDate.getMonth(); // 0-indexed
        const periodString = `${year}-${String(month + 1).padStart(2, '0')}`; // YYYY-MM format
    
        const salesForMonth = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate.getFullYear() === year && saleDate.getMonth() === month;
        });
        const expensesForMonth = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
        });
    
        const cashRevenue = salesForMonth.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.amountReceived, 0);
        const bankRevenue = salesForMonth.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + s.amountReceived, 0);
        const cashExpenses = expensesForMonth.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0);
        const bankExpenses = expensesForMonth.filter(e => e.paymentMethod === 'Bank').reduce((sum, e) => sum + e.amount, 0);
        const totalRevenue = cashRevenue + bankRevenue;
        const totalExpenses = cashExpenses + bankExpenses;
        const netBalance = totalRevenue - totalExpenses;
    
        return {
            period: periodString,
            periodName: prevMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
            cashRevenue,
            bankRevenue,
            totalRevenue,
            cashExpenses,
            bankExpenses,
            totalExpenses,
            netBalance,
        };
    }, [sales, expenses]);

    const isPreviousMonthClosed = useMemo(() => {
        return (closingRecords || []).some(r => r.period === previousMonthData.period);
    }, [closingRecords, previousMonthData.period]);

    const handleCloseMonthClick = () => {
        onInitiateClose(previousMonthData);
    };

    const filteredData = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);

        const filteredSales = sales.filter(s => {
            const saleDate = new Date(s.date);
            switch (activePeriod) {
                case 'Today':
                    return saleDate >= today;
                case 'This Month':
                    return saleDate >= thisMonthStart;
                case 'This Year':
                    return saleDate >= thisYearStart;
                default:
                    return true;
            }
        }).filter(s => {
            if (paymentMethodFilter === 'All') return true;
            return s.paymentMethod === paymentMethodFilter || (s.paymentMethod === 'Pending' && s.amountReceived > 0 && paymentMethodFilter === (s.amountReceived > 0 ? 'Cash' : 'Bank')); // A bit tricky logic here
        });

        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
             switch (activePeriod) {
                case 'Today':
                    return expenseDate >= today;
                case 'This Month':
                    return expenseDate >= thisMonthStart;
                case 'This Year':
                    return expenseDate >= thisYearStart;
                default:
                    return true;
            }
        }).filter(e => {
            if (paymentMethodFilter === 'All') return true;
            return e.paymentMethod === paymentMethodFilter;
        });

        return { filteredSales, filteredExpenses };
    }, [sales, expenses, activePeriod, paymentMethodFilter]);

    const stats = useMemo(() => {
        const { filteredSales, filteredExpenses } = filteredData;
        
        const cashRevenue = filteredSales.filter(s => s.paymentMethod === 'Cash' || (s.paymentMethod === 'Pending' && s.amountReceived > 0)).reduce((sum, s) => sum + s.amountReceived, 0);
        const bankRevenue = filteredSales.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + s.amountReceived, 0);
        const cashExpenses = filteredExpenses.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0);
        const bankExpenses = filteredExpenses.filter(e => e.paymentMethod === 'Bank').reduce((sum, e) => sum + e.amount, 0);
        const totalRevenue = cashRevenue + bankRevenue;
        const totalExpenses = cashExpenses + bankExpenses;
        const netCashFlow = totalRevenue - totalExpenses;

        // Calculate expenses by category
        const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = { cash: 0, bank: 0, total: 0 };
            }
            if (expense.paymentMethod === 'Cash') {
                acc[expense.category].cash += expense.amount;
            } else {
                acc[expense.category].bank += expense.amount;
            }
            acc[expense.category].total += expense.amount;
            return acc;
        }, {} as Record<string, { cash: number; bank: number; total: number }>);

        return { cashRevenue, bankRevenue, cashExpenses, bankExpenses, totalRevenue, totalExpenses, netCashFlow, expensesByCategory };
    }, [filteredData]);

    const handlePrint = () => window.print();

    const periodButtons: Period[] = ['Today', 'This Month', 'This Year', 'Custom'];
    const paymentMethodButtons: PaymentMethodFilter[] = ['All', 'Cash', 'Bank'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2 print:hidden">
                <h1 className="text-3xl font-bold text-brand-text-primary">Closing Report</h1>
                <div className="flex items-center space-x-2 flex-wrap">
                    {periodButtons.map(period => (
                        <button 
                            key={period} 
                            onClick={() => setActivePeriod(period)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activePeriod === period ? 'bg-brand-blue text-white shadow' : 'bg-white text-brand-text-secondary hover:bg-gray-100'}`}
                        >
                            {period}
                        </button>
                    ))}
                    <div className="h-6 border-l border-gray-300 mx-1"></div>
                     {paymentMethodButtons.map(method => (
                        <button 
                            key={method} 
                            onClick={() => setPaymentMethodFilter(method)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${paymentMethodFilter === method ? 'bg-brand-lightblue text-white shadow' : 'bg-white text-brand-text-secondary hover:bg-gray-100'}`}
                        >
                            {method}
                        </button>
                    ))}
                    <button onClick={handlePrint} className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-md font-semibold hover:bg-brand-lightblue transition-colors">
                        <PrinterIcon className="h-4 w-4 mr-2" />
                        Print Report
                    </button>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md p-6 mb-6 print:hidden">
                <h2 className="text-xl font-bold text-brand-text-primary">Monthly Closing</h2>
                <p className="text-brand-text-secondary mt-1">Finalize the financial records for the previous month: <span className="font-semibold">{previousMonthData.periodName}</span>.</p>
                <div className="mt-4">
                    <button 
                        onClick={handleCloseMonthClick}
                        disabled={isPreviousMonthClosed}
                        className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isPreviousMonthClosed ? `✓ ${previousMonthData.periodName} Closed` : `Close ${previousMonthData.periodName}`}
                    </button>
                </div>
            </div>

            <div className="text-center py-4">
                <h2 className="text-2xl font-bold text-brand-text-primary">Closing Report</h2>
                <p className="text-brand-text-secondary">For Period: {activePeriod} | Payment Method: {paymentMethodFilter}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm font-medium text-green-800">CASH REVENUE</p>
                    <p className="text-3xl font-bold text-green-600">PKR {stats.cashRevenue.toLocaleString()}</p>
                </div>
                 <div className="p-6 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800">BANK REVENUE</p>
                    <p className="text-3xl font-bold text-yellow-600">PKR {stats.bankRevenue.toLocaleString()}</p>
                </div>
                 <div className="p-6 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-sm font-medium text-orange-800">EXPENSES</p>
                    <p className="text-lg font-semibold text-orange-600">Cash: PKR {stats.cashExpenses.toLocaleString()}</p>
                    <p className="text-lg font-semibold text-orange-600">Bank: PKR {stats.bankExpenses.toLocaleString()}</p>
                </div>
                 <div className="p-6 rounded-lg bg-indigo-50 border border-indigo-200">
                    <p className="text-sm font-medium text-indigo-800">NET CASH FLOW</p>
                    <p className="text-3xl font-bold text-indigo-600">PKR {stats.netCashFlow.toLocaleString()}</p>
                    <p className="text-xs text-indigo-500">Total Revenue: PKR {stats.totalRevenue.toLocaleString()}</p>
                     <p className="text-xs text-indigo-500">Total Expenses: PKR {stats.totalExpenses.toLocaleString()}</p>
                </div>
            </div>

            {/* Expense Categories Breakdown */}
            {Object.keys(stats.expensesByCategory).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b">
                        <h3 className="font-bold text-brand-text-primary">Expense Categories Breakdown</h3>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(stats.expensesByCategory).map(([category, amounts]: [string, { cash: number; bank: number; total: number }]) => (
                                <div key={category} className="border rounded-lg p-4">
                                    <h4 className="font-semibold text-brand-text-primary mb-2">{category}</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-green-600">Cash:</span>
                                            <span className="font-medium">PKR {amounts.cash.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-600">Bank:</span>
                                            <span className="font-medium">PKR {amounts.bank.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t">
                                            <span className="font-semibold">Total:</span>
                                            <span className="font-bold text-brand-text-primary">PKR {amounts.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b flex items-center">
                        <DollarSignIcon className="h-5 w-5 mr-2 text-green-600" />
                        <h3 className="font-bold text-brand-text-primary">Sales Details ({filteredData.filteredSales.length})</h3>
                    </div>
                    <div className="overflow-x-auto p-4 min-h-[100px]">
                        {filteredData.filteredSales.length > 0 ? (
                             <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left font-semibold text-brand-text-secondary py-2 px-2">Date</th>
                                        <th className="text-left font-semibold text-brand-text-secondary py-2 px-2">Customer</th>
                                        <th className="text-center font-semibold text-brand-text-secondary py-2 px-2">Bottles</th>
                                        <th className="text-center font-semibold text-brand-text-secondary py-2 px-2">Payment</th>
                                        <th className="text-right font-semibold text-brand-text-secondary py-2 px-2">Amount (PKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.filteredSales.map(sale => (
                                        <tr key={sale.id} className="border-b last:border-b-0">
                                            <td className="py-2 px-2 text-brand-text-primary whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="py-2 px-2 text-brand-text-primary font-medium">{getCustomerName(sale.customerId)}</td>
                                            <td className="py-2 px-2 text-center">{sale.quantity}</td>
                                            <td className="py-2 px-2 text-center">
                                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {sale.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="text-right py-2 px-2 font-semibold">{sale.amountReceived.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-center text-brand-text-secondary pt-4">No sales in this period.</p>}
                    </div>
                </div>
                 <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b flex items-center">
                        <CreditCardIcon className="h-5 w-5 mr-2 text-red-600" />
                        <h3 className="font-bold text-brand-text-primary">Expense Details ({filteredData.filteredExpenses.length})</h3>
                    </div>
                     <div className="p-4 min-h-[100px]">
                        {filteredData.filteredExpenses.length > 0 ? (
                             <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left font-semibold text-brand-text-secondary py-2">Name</th>
                                        <th className="text-left font-semibold text-brand-text-secondary py-2">Category</th>
                                        <th className="text-center font-semibold text-brand-text-secondary py-2">Payment</th>
                                        <th className="text-right font-semibold text-brand-text-secondary py-2">Amount (PKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.filteredExpenses.map(expense => (
                                        <tr key={expense.id} className="border-b">
                                            <td className="py-2 text-brand-text-primary">{expense.name}</td>
                                            <td className="py-2 text-brand-text-primary">
                                                <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="py-2 text-center">
                                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${expense.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {expense.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="text-right py-2">{expense.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-center text-brand-text-secondary pt-4">No expenses in this period.</p>}
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                     <h3 className="font-bold text-brand-text-primary">Historical Monthly Closings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Period</th>
                                <th className="px-6 py-3">Cash Revenue</th>
                                <th className="px-6 py-3">Bank Revenue</th>
                                <th className="px-6 py-3">Cash Expenses</th>
                                <th className="px-6 py-3">Bank Expenses</th>
                                <th className="px-6 py-3">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {closingRecords.length > 0 ? closingRecords.map(record => (
                                <tr key={record.id} className="border-b">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{record.period}</td>
                                    <td className="px-6 py-4">PKR {record.cashRevenue.toLocaleString()}</td>
                                    <td className="px-6 py-4">PKR {record.bankRevenue.toLocaleString()}</td>
                                    <td className="px-6 py-4">PKR {record.cashExpenses.toLocaleString()}</td>
                                    <td className="px-6 py-4">PKR {record.bankExpenses.toLocaleString()}</td>
                                    <td className={`px-6 py-4 font-bold ${record.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>PKR {record.netBalance.toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 px-6 text-brand-text-secondary">
                                        No historical closing data available.
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

export default ClosingReport;