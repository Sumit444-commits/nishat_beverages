import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sale, Expense, InventoryItem, DailyOpeningBalance } from '../../types';
import { is19LItemName, is6LItemName } from '../../utils/payment-category';
import { getLocalDateString, getTodayLocalDateString } from '../../utils/date';
import Chart from 'chart.js/auto';

interface CashReconProps {
    sales: Sale[];
    expenses: Expense[];
    inventory: InventoryItem[];
    openingBalances: DailyOpeningBalance[];
}

const CashRecon: React.FC<CashReconProps> = ({ sales, expenses, inventory, openingBalances }) => {
    const [selectedDate, setSelectedDate] = useState(getTodayLocalDateString());
    const [registerCash, setRegisterCash] = useState('');
    const [registerBank, setRegisterBank] = useState('');
    const revenueChartRef = useRef<HTMLCanvasElement>(null);
    const revenueChartInstance = useRef<Chart | null>(null);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const reconData = useMemo(() => {
        const selected = new Date(selectedDate);
        // Set to midnight of the selected date to ensure correct comparison
        selected.setHours(0, 0, 0, 0);

        // Filter transactions for *before* selected day for opening balance
        const priorSales = sales.filter(s => getLocalDateString(s.date) < selectedDate);
        const priorExpenses = expenses.filter(e => getLocalDateString(e.date) < selectedDate);
        
        // Check if there's a recorded opening balance for the selected date
        const recordedOpeningBalance = openingBalances.find(ob => ob.date === selectedDate);
        
        // Opening balance calculation - use recorded balance if available, otherwise calculate
        let openingCash, openingBank;
        
        if (recordedOpeningBalance) {
            openingCash = recordedOpeningBalance.cash;
            openingBank = recordedOpeningBalance.bank;
        } else {
            // Calculate from historical transactions if no recorded opening balance
            openingCash = priorSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.amount, 0) - priorExpenses.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0);
            openingBank = priorSales.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + s.amount, 0) - priorExpenses.filter(e => e.paymentMethod === 'Bank').reduce((sum, e) => sum + e.amount, 0);
        }

        // Filter transactions for *selected day*
        const todaySales = sales.filter(s => getLocalDateString(s.date) === selectedDate);
        const todayExpenses = expenses.filter(e => getLocalDateString(e.date) === selectedDate);

        // Get inventory item IDs with safety checks
        const bottle19L = inventory.find(i => is19LItemName(i.name));
        const bottle6L = inventory.find(i => is6LItemName(i.name));

        // Revenue calculations for today
        const calcRevenue = (itemId: number | undefined) => {
            if (!itemId) {
                // Handle counter sales (items without specific inventory ID)
                // Exclude payment-only transactions (quantity = 0, amount = 0)
                const productSales = todaySales.filter(s => s.inventoryItemId === null && s.quantity > 0);
                const productCash = productSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.amountReceived, 0);
                const productBank = productSales.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + s.amountReceived, 0);
                return { cash: productCash, bank: productBank, total: productCash + productBank };
            }

            const productSales = todaySales.filter(s => s.inventoryItemId === itemId);
            const productCash = productSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.amountReceived, 0);
            const productBank = productSales.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + s.amountReceived, 0);

            const paymentOnlyForItem = todaySales.filter(s => s.inventoryItemId === null && s.quantity === 0 && s.amount === 0);
            const payments19L = paymentOnlyForItem.filter(s => s.paymentForCategory === '19Ltr Collection');
            const payments6L = paymentOnlyForItem.filter(s => s.paymentForCategory === '6Ltr Collection');

            const extraCash = (itemId === bottle19L?.id)
                ? payments19L.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + (s.amountReceived || 0), 0)
                : (itemId === bottle6L?.id)
                    ? payments6L.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + (s.amountReceived || 0), 0)
                    : 0;

            const extraBank = (itemId === bottle19L?.id)
                ? payments19L.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + (s.amountReceived || 0), 0)
                : (itemId === bottle6L?.id)
                    ? payments6L.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + (s.amountReceived || 0), 0)
                    : 0;

            const cash = productCash + extraCash;
            const bank = productBank + extraBank;
            return { cash, bank, total: cash + bank };
        };

        const collection19L = calcRevenue(bottle19L?.id);
        const collection6L = calcRevenue(bottle6L?.id);
        
        const otherSales = todaySales.filter(s => 
            s.inventoryItemId !== bottle19L?.id && 
            s.inventoryItemId !== bottle6L?.id && 
            s.inventoryItemId !== null // Exclude payment-only transactions
        );
        const counterSaleCash = otherSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.amountReceived, 0);
        const counterSaleBank = otherSales.filter(s => s.paymentMethod === 'Bank').reduce((sum, s) => sum + s.amountReceived, 0);
        const counterSale = { cash: counterSaleCash, bank: counterSaleBank, total: counterSaleCash + counterSaleBank };

        const totalRevenue = {
            cash: collection19L.cash + collection6L.cash + counterSale.cash,
            bank: collection19L.bank + collection6L.bank + counterSale.bank,
            get total() { return this.cash + this.bank }
        };

        // Expense calculations for today
        const calcExpense = (category?: string) => {
            const filtered = category ? todayExpenses.filter(e => e.category === category) : todayExpenses;
            const cash = filtered.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0);
            const bank = filtered.filter(e => e.paymentMethod === 'Bank').reduce((sum, e) => sum + e.amount, 0);
            return { cash, bank, total: cash + bank };
        };
        
        const totalExpense = calcExpense();
        const salaryExpense = calcExpense('Salaries');
        const homeExpense = calcExpense('Home');
        const shopExpense = calcExpense('Shop');
        
        const closingCash = openingCash + totalRevenue.cash - totalExpense.cash;
        const closingBank = openingBank + totalRevenue.bank - totalExpense.bank;
        
        return {
            opening: { cash: openingCash, bank: openingBank, total: openingCash + openingBank },
            collection19L,
            collection6L,
            counterSale,
            totalRevenue,
            totalExpense,
            salaryExpense,
            homeExpense,
            shopExpense,
            closing: { cash: closingCash, bank: closingBank, total: closingCash + closingBank },
        };
    }, [selectedDate, sales, expenses, inventory, openingBalances]);
    
    useEffect(() => {
        if (revenueChartRef.current) {
            const { collection19L, collection6L, counterSale } = reconData;
            const chartData = {
                labels: ['19L Collection', '6L Collection', 'Counter Sale'],
                datasets: [{
                    data: [collection19L.total, collection6L.total, counterSale.total],
                    backgroundColor: ['#1976D2', '#29B6F6', '#64B5F6'],
                    hoverBackgroundColor: ['#0D47A1', '#039BE5', '#42A5F5']
                }]
            };

            if (revenueChartInstance.current) {
                revenueChartInstance.current.destroy();
                revenueChartInstance.current = null;
            }

            const hasData = collection19L.total > 0 || collection6L.total > 0 || counterSale.total > 0;
            
            if (hasData) {
                 revenueChartInstance.current = new Chart(revenueChartRef.current, {
                    type: 'pie',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        }
                    }
                });
            }
        }
        
        // Cleanup function
        return () => {
            if (revenueChartInstance.current) {
                revenueChartInstance.current.destroy();
                revenueChartInstance.current = null;
            }
        };
    }, [reconData]);


    const numRegisterCash = Number(registerCash) || 0;
    const numRegisterBank = Number(registerBank) || 0;
    const differenceCash = reconData.closing.cash - numRegisterCash;
    const differenceBank = reconData.closing.bank - numRegisterBank;

    const renderRow = (title: string, data: {cash: number, bank: number, total: number}, isBold = false, isSub = false) => (
        <tr className={`border-b ${isBold ? 'bg-gray-100 font-semibold' : ''}`}>
            <td className={`px-6 py-3 text-sm ${isSub ? 'pl-10' : ''} text-brand-text-primary`}>{title}</td>
            <td className="px-6 py-3 text-right">{formatCurrency(data.cash)}</td>
            <td className="px-6 py-3 text-right">{formatCurrency(data.bank)}</td>
            <td className="px-6 py-3 text-right font-semibold">{formatCurrency(data.total)}</td>
        </tr>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold text-brand-text-primary">Cash / Bank Reconciliation</h1>
                 <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
            </div>
            
            <div className="bg-brand-surface rounded-xl shadow-md p-6 h-80">
                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Revenue Breakdown for {new Date(selectedDate).toLocaleDateString()}</h2>
                {(reconData.totalRevenue.total > 0) ? 
                    <canvas ref={revenueChartRef}></canvas> : 
                    <div className="flex items-center justify-center h-full text-brand-text-secondary"><p>No revenue data for the selected date.</p></div>
                }
            </div>

            <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-1/2">Cash / bank recon</th>
                                <th scope="col" className="px-6 py-3 text-right">Cash</th>
                                <th scope="col" className="px-6 py-3 text-right">Bank</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRow('Opening', reconData.opening)}
                            {renderRow('19L collection', reconData.collection19L)}
                            {renderRow('6L', reconData.collection6L)}
                            {renderRow('Counter sale', reconData.counterSale)}
                            {renderRow('Total Revenue', reconData.totalRevenue, true)}
                            {renderRow('Expense', reconData.totalExpense)}
                            {renderRow('Salary', reconData.salaryExpense, false, true)}
                            {renderRow('Home', reconData.homeExpense, false, true)}
                            {renderRow('Shop', reconData.shopExpense, false, true)}
                            {renderRow('Closing', reconData.closing, true)}
                            <tr className="border-b">
                                <td className="px-6 py-3 text-sm text-brand-text-primary">As per register</td>
                                <td className="px-2 py-1 text-right">
                                    <input type="number" value={registerCash} onChange={e => setRegisterCash(e.target.value)} className="w-full text-right bg-gray-50 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue"/>
                                </td>
                                <td className="px-2 py-1 text-right">
                                     <input type="number" value={registerBank} onChange={e => setRegisterBank(e.target.value)} className="w-full text-right bg-gray-50 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue"/>
                                </td>
                                <td className="px-6 py-3 text-right font-semibold">{formatCurrency(numRegisterCash + numRegisterBank)}</td>
                            </tr>
                             <tr className="bg-yellow-100 font-bold">
                                <td className="px-6 py-3 text-sm text-yellow-800">Difference</td>
                                <td className={`px-6 py-3 text-right ${differenceCash !== 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(differenceCash)}</td>
                                <td className={`px-6 py-3 text-right ${differenceBank !== 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(differenceBank)}</td>
                                <td className={`px-6 py-3 text-right ${(differenceCash + differenceBank) !== 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(differenceCash + differenceBank)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashRecon;
