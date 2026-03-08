import React, { useMemo, useState } from 'react';
import { Salesman, Customer, Sale } from '../../types';
import { PrinterIcon } from '../icons';

interface SalesmanDailyReportProps {
    salesman: Salesman;
    customers: Customer[];
    sales: Sale[];
    onBack: () => void;
}

const SalesmanDailyReport: React.FC<SalesmanDailyReportProps> = ({ salesman, customers, sales, onBack }) => {
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    const dailyData = useMemo(() => {
        const salesmanSalesToday = sales.filter(s => 
            s.salesmanId === salesman.id && 
            new Date(s.date).toISOString().split('T')[0] === reportDate
        );

        const assignedCustomers = customers.filter(c => c.salesmanId === salesman.id);

        const salesDetails = salesmanSalesToday.map(sale => ({
            customerName: customers.find(c => c.id === sale.customerId)?.name || 'Unknown',
            amount: sale.amount
        }));

        const paymentHistory = salesmanSalesToday
            .filter(sale => sale.amountReceived > 0)
            .map(sale => ({
                date: sale.date,
                customerName: customers.find(c => c.id === sale.customerId)?.name || 'Unknown',
                amount: sale.amountReceived,
                type: sale.paymentMethod
            }));
            
        return {
            bottlesSold: salesmanSalesToday.reduce((sum, s) => sum + s.quantity, 0),
            revenue: salesmanSalesToday.reduce((sum, s) => sum + s.amount, 0),
            collected: salesmanSalesToday.reduce((sum, s) => sum + s.amountReceived, 0),
            assignedCustomers,
            salesDetails,
            paymentHistory
        };
    }, [salesman, customers, sales, reportDate]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center mb-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text-primary">Salesman Daily Report</h1>
                    <p className="text-brand-text-secondary">Report for {salesman.name} on {new Date(reportDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                     <input
                        type="date"
                        value={reportDate}
                        onChange={e => setReportDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                    <button onClick={onBack} className="bg-white border border-gray-300 text-brand-text-secondary px-4 py-2 rounded-lg font-semibold hover:bg-gray-50">
                        &larr; Back to List
                    </button>
                    <button onClick={handlePrint} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue flex items-center">
                        <PrinterIcon className="h-4 w-4 mr-2" /> Print Pay Slip
                    </button>
                </div>
            </div>

            <div className="bg-brand-surface p-8 rounded-xl shadow-md">
                {/* Report Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Salesman Pay Slip & Report</h2>
                    <p className="text-brand-text-secondary">Nishat Beverages</p>
                </div>

                {/* Salesman and Date Info */}
                <div className="flex justify-between items-start mb-8 pb-4 border-b">
                    <div>
                        <p className="text-sm text-brand-text-secondary">Salesman Name:</p>
                        <p className="font-bold text-lg text-brand-text-primary">{salesman.name}</p>
                    </div>
                     <div>
                        <p className="text-sm text-brand-text-secondary text-right">Date:</p>
                        <p className="font-bold text-lg text-brand-text-primary">{new Date(reportDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center">
                    <div>
                        <p className="text-sm text-brand-text-secondary">Today's Bottles Sold</p>
                        <p className="text-2xl font-bold text-brand-text-primary">{dailyData.bottlesSold}</p>
                        <p className="text-sm text-blue-600 font-semibold">Salary Balance</p>
                        <p className="text-sm text-blue-600 font-semibold">PKR {salesman.monthlySalary.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-brand-text-secondary">Today's Revenue</p>
                        <p className="text-2xl font-bold text-green-600">PKR {dailyData.revenue.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-brand-text-secondary">Total Collected (by Salesman)</p>
                        <p className="text-2xl font-bold text-red-600">PKR {dailyData.collected.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-brand-text-secondary">Monthly Salary</p>
                        <p className="text-2xl font-bold text-brand-text-primary">PKR {salesman.monthlySalary.toLocaleString()}</p>
                    </div>
                </div>
                
                {/* Assigned Customers */}
                 <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-bold text-brand-text-primary mb-2">Assigned Customers for Delivery</h3>
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th className="py-2 px-4">Customer</th>
                                <th className="py-2 px-4">Address</th>
                                <th className="py-2 px-4">Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                             {dailyData.assignedCustomers.length > 0 ? dailyData.assignedCustomers.map(c => (
                                <tr key={c.id} className="border-t">
                                    <td className="py-2 px-4">{c.name}</td>
                                    {/* FIX: Property 'area' and 'sector' do not exist on type 'Customer'. Replaced with 'address'. */}
                                    <td className="py-2 px-4">{c.address}</td>
                                    <td className="py-2 px-4">{c.mobile}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-4 text-brand-text-secondary">No customers are assigned to this salesman.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Sales & Payments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-brand-text-primary mb-2">Sales Details for Today</h3>
                        <table className="w-full text-sm">
                             <thead className="text-xs text-brand-text-secondary uppercase">
                                <tr>
                                    <th className="py-2 px-4 text-left">Customer</th>
                                    <th className="py-2 px-4 text-right">Amount (PKR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.salesDetails.length > 0 ? dailyData.salesDetails.map((s, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="py-2 px-4">{s.customerName}</td>
                                        <td className="py-2 px-4 text-right font-semibold">{s.amount.toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={2} className="text-center py-4 text-brand-text-secondary">No sales recorded for this salesman today.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-bold text-brand-text-primary mb-2">Payment History</h3>
                         <table className="w-full text-sm">
                             <thead className="text-xs text-brand-text-secondary uppercase">
                                <tr>
                                    <th className="py-2 px-4 text-left">Date</th>
                                    <th className="py-2 px-4 text-right">Amount (PKR)</th>
                                    <th className="py-2 px-4 text-right">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                               {dailyData.paymentHistory.length > 0 ? dailyData.paymentHistory.map((p, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="py-2 px-4">{new Date(p.date).toLocaleTimeString()}</td>
                                        <td className="py-2 px-4 text-right font-semibold">{p.amount.toLocaleString()}</td>
                                        <td className="py-2 px-4 text-right">{p.type}</td>
                                    </tr>
                                )) : (
                                     <tr>
                                        <td colSpan={3} className="text-center py-4 text-brand-text-secondary">No payment history found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesmanDailyReport;