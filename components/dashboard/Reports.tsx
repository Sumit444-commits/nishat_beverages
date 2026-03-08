import React, { useEffect, useRef, useMemo } from 'react';
import StatCard from './StatCard';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { CreditCardIcon } from '../icons/CreditCardIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { Sale, Expense, Customer } from '../../types';
import Chart from 'chart.js/auto';

interface ReportsProps {
    sales: Sale[];
    expenses: Expense[];
    customers: Customer[];
}

const Reports: React.FC<ReportsProps> = ({ sales, expenses, customers }) => {
    const salesChartRef = useRef<HTMLCanvasElement>(null);
    const expensesChartRef = useRef<HTMLCanvasElement>(null);
    const salesChartInstance = useRef<Chart | null>(null);
    const expensesChartInstance = useRef<Chart | null>(null);

    const stats = useMemo(() => {
        const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const pendingBalances = customers.reduce((sum, c) => sum + c.totalBalance, 0);
        return {
            totalSales,
            totalExpenses,
            netProfit: totalSales - totalExpenses,
            pendingBalances,
        }
    }, [sales, expenses, customers]);

    useEffect(() => {
        // --- Sales Chart ---
        if (salesChartRef.current && sales.length > 0) {
            const salesByDate = sales.reduce((acc, sale) => {
                const date = new Date(sale.date).toLocaleDateString();
                acc[date] = (acc[date] || 0) + sale.amount;
                return acc;
            }, {} as Record<string, number>);

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toLocaleDateString();
            }).reverse();
            
            if (salesChartInstance.current) {
                salesChartInstance.current.destroy();
            }

            salesChartInstance.current = new Chart(salesChartRef.current, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Revenue (PKR)',
                        data: last7Days.map(date => salesByDate[date] || 0),
                        borderColor: '#29B6F6',
                        backgroundColor: 'rgba(41, 182, 246, 0.1)',
                        fill: true,
                        tension: 0.3,
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        // --- Expenses Chart ---
        if (expensesChartRef.current && expenses.length > 0) {
             const expensesByCategory = expenses.reduce((acc, expense) => {
                acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                return acc;
            }, {} as Record<string, number>);

            if (expensesChartInstance.current) {
                expensesChartInstance.current.destroy();
            }

            expensesChartInstance.current = new Chart(expensesChartRef.current, {
                type: 'pie',
                data: {
                    labels: Object.keys(expensesByCategory),
                    datasets: [{
                        data: Object.values(expensesByCategory),
                        backgroundColor: ['#EF5350', '#66BB6A', '#FFA726', '#29B6F6', '#AB47BC', '#78909C', '#FFCA28'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        return () => {
            if (salesChartInstance.current) salesChartInstance.current.destroy();
            if (expensesChartInstance.current) expensesChartInstance.current.destroy();
        }

    }, [sales, expenses]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-brand-text-primary mb-6">Business Reports</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard 
                    title="Total Revenue" 
                    value={`PKR ${stats.totalSales.toLocaleString()}`} 
                    icon={<DollarSignIcon />} 
                    color="text-green-500" 
                />
                <StatCard 
                    title="Total Expenses" 
                    value={`PKR ${stats.totalExpenses.toLocaleString()}`} 
                    icon={<CreditCardIcon />} 
                    color="text-red-500" 
                />
                <StatCard 
                    title="Net Profit" 
                    value={`PKR ${stats.netProfit.toLocaleString()}`} 
                    icon={<BarChartIcon />} 
                    color={stats.netProfit >= 0 ? "text-brand-blue" : "text-red-500"}
                />
                 <StatCard 
                    title="Outstanding Balances" 
                    value={`PKR ${stats.pendingBalances.toLocaleString()}`} 
                    icon={<CreditCardIcon />} 
                    color="text-yellow-500" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-brand-surface rounded-xl shadow-md p-6 h-96">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Sales Trend (Last 7 Days)</h2>
                    {sales.length > 0 ? <canvas ref={salesChartRef}></canvas> : <p className="text-center text-brand-text-secondary pt-16">No sales data available for the last 7 days.</p>}
                </div>
                <div className="bg-brand-surface rounded-xl shadow-md p-6 h-96">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Expenses by Category</h2>
                     {expenses.length > 0 ? <canvas ref={expensesChartRef}></canvas> : <p className="text-center text-brand-text-secondary pt-16">No expense data available.</p>}
                </div>
            </div>
        </div>
    );
};

export default Reports;
