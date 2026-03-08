import React, { useState, useMemo, useEffect } from 'react';
import { getDatabase, saveDatabase } from '../../db/database';
import { Sale, CounterUser } from '../../types';
import { getLocalDateString, getTodayLocalDateString } from '../../utils/date';
import { inferPaymentCategoryFromInventory } from '../../utils/payment-category';
import { PlusCircleIcon, LogoutIcon, WaterDropIcon, DollarSignIcon, CreditCardIcon, PackageIcon, TrashIcon } from '../icons';
import AddCounterSaleModal from './AddCounterSaleModal';
import StatCard from '../dashboard/StatCard';
import ConfirmationModal from '../common/ConfirmationModal';

const CounterView: React.FC<{ user: CounterUser | null; onLogout: () => void }> = ({ user, onLogout }) => {
    const [db, setDb] = useState(getDatabase());
    const [isAddSaleOpen, setAddSaleOpen] = useState(false);
    const [quickSalePaymentMethod, setQuickSalePaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [saleToDeleteId, setSaleToDeleteId] = useState<number | null>(null);

    useEffect(() => {
        saveDatabase(db);
    }, [db]);

    // Check session expiration periodically
    useEffect(() => {
        const checkSession = () => {
            const counterSession = localStorage.getItem('ro_plant_counter_session_active');
            if (counterSession) {
                try {
                    const sessionData = JSON.parse(counterSession);
                    if (sessionData.expiresAt && Date.now() >= sessionData.expiresAt) {
                        // Session expired
                        localStorage.removeItem('ro_plant_counter_session_active');
                        alert('Your session has expired. Please login again.');
                        onLogout();
                    }
                } catch (e) {
                    // Invalid session data
                    localStorage.removeItem('ro_plant_counter_session_active');
                    onLogout();
                }
            } else {
                onLogout();
            }
        };

        // Check every minute
        const interval = setInterval(checkSession, 60 * 1000);
        checkSession(); // Check immediately

        return () => clearInterval(interval);
    }, [onLogout]);

    const handleAddSale = (saleData: Omit<Sale, 'id' | 'customerId'>) => {
        setDb(prevDb => {
            const inferredCategory = inferPaymentCategoryFromInventory(
                prevDb.inventory,
                saleData.inventoryItemId,
                saleData.amountReceived,
                saleData.paymentForCategory
            );

            const newSale: Sale = {
                ...saleData,
                id: Date.now(),
                customerId: null,
                paymentForCategory: inferredCategory,
            };
            const sales = [...prevDb.sales, newSale];
            
            let inventory = prevDb.inventory;
            if (newSale.inventoryItemId) {
                inventory = prevDb.inventory.map(item => {
                    if (item.id === newSale.inventoryItemId) {
                        return { ...item, stock: item.stock - newSale.quantity };
                    }
                    return item;
                });
            }

            return { ...prevDb, sales, inventory };
        });
    };
    
    const handleQuickSale = (itemName: '19 Ltr Bottle' | '6 Ltr Bottle') => {
        const item = db.inventory.find(i => i.name === itemName);
        if (!item) {
            alert(`${itemName} not found in inventory. Please add it first.`);
            return;
        }

        const newSale: Omit<Sale, 'id' | 'customerId'> = {
            salesmanId: null,
            inventoryItemId: item.id,
            quantity: 1,
            emptiesCollected: 0,
            amount: item.sellingPrice,
            amountReceived: item.sellingPrice,
            date: new Date().toISOString(),
            paymentMethod: quickSalePaymentMethod,
            description: undefined,
        };
        handleAddSale(newSale);
    };
    
    const openDeleteConfirmation = (saleId: number) => {
        setSaleToDeleteId(saleId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSale = () => {
        if (!saleToDeleteId) return;

        setDb(prevDb => {
            const saleToDelete = prevDb.sales.find(s => s.id === saleToDeleteId);
            if (!saleToDelete) return prevDb;

            const updatedSales = prevDb.sales.filter(s => s.id !== saleToDeleteId);
            
            let updatedInventory = prevDb.inventory;
            if (saleToDelete.inventoryItemId && saleToDelete.quantity > 0) {
                updatedInventory = prevDb.inventory.map(item => {
                    if (item.id === saleToDelete.inventoryItemId) {
                        return { ...item, stock: item.stock + saleToDelete.quantity };
                    }
                    return item;
                });
            }

            return { ...prevDb, sales: updatedSales, inventory: updatedInventory };
        });

        setDeleteConfirmOpen(false);
        setSaleToDeleteId(null);
    };

    const today = useMemo(() => getTodayLocalDateString(), []);

    const todaySales = useMemo(() => {
        return db.sales
            .filter(s => s.customerId === null && getLocalDateString(s.date) === today)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [db.sales, today]);

    const salesSummary = useMemo(() => {
        return todaySales.reduce((acc, sale) => {
            if (sale.paymentMethod === 'Cash') {
                acc.cash += sale.amountReceived;
            } else if (sale.paymentMethod === 'Bank') {
                acc.bank += sale.amountReceived;
            }
            acc.total += sale.amountReceived;
            return acc;
        }, { total: 0, cash: 0, bank: 0 });
    }, [todaySales]);

    const getItemName = (sale: Sale) => {
        if (sale.description) return sale.description;
        if (sale.inventoryItemId) {
            return db.inventory.find(i => i.id === sale.inventoryItemId)?.name || 'Unknown Item';
        }
        return 'N/A';
    };

    return (
        <>
            <div className="min-h-screen bg-brand-bg">
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-brand-text-primary">Counter Sales</h1>
                            {user && <p className="text-sm text-brand-text-secondary">Welcome, {user.name}</p>}
                        </div>
                        <button onClick={onLogout} className="flex items-center text-brand-text-secondary hover:text-red-600 transition-colors">
                            <LogoutIcon className="h-6 w-6 mr-2" />
                            <span className="text-sm font-medium">End Session</span>
                        </button>
                    </div>
                </header>
                <main className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <StatCard title="Total Revenue Today" value={`PKR ${salesSummary.total.toLocaleString()}`} icon={<DollarSignIcon />} color="text-green-500" />
                        <StatCard title="Cash Sales" value={`PKR ${salesSummary.cash.toLocaleString()}`} icon={<DollarSignIcon />} color="text-brand-blue" />
                        <StatCard title="Bank/Card Sales" value={`PKR ${salesSummary.bank.toLocaleString()}`} icon={<CreditCardIcon />} color="text-brand-accent" />
                    </div>

                     <div className="bg-brand-surface rounded-xl shadow-md p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleQuickSale('19 Ltr Bottle')}
                                    className="flex items-center justify-center bg-blue-100 text-brand-blue px-6 py-4 rounded-lg font-semibold hover:bg-blue-200 transition-colors shadow-sm text-lg"
                                >
                                    <PackageIcon className="h-6 w-6 mr-3" />
                                    Quick Sale: 19L Bottle
                                </button>
                                <button 
                                     onClick={() => handleQuickSale('6 Ltr Bottle')}
                                    className="flex items-center justify-center bg-blue-100 text-brand-blue px-6 py-4 rounded-lg font-semibold hover:bg-blue-200 transition-colors shadow-sm text-lg"
                                >
                                    <PackageIcon className="h-6 w-6 mr-3" />
                                    Quick Sale: 6L Bottle
                                </button>
                            </div>
                             <div className="flex flex-col items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
                                 <label className="text-sm font-medium text-brand-text-secondary">Payment for Quick Sale</label>
                                 <div className="flex items-center rounded-lg bg-gray-200 p-1">
                                    <button onClick={() => setQuickSalePaymentMethod('Cash')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${quickSalePaymentMethod === 'Cash' ? 'bg-white text-brand-blue shadow' : 'text-gray-600'}`}>Cash</button>
                                    <button onClick={() => setQuickSalePaymentMethod('Bank')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${quickSalePaymentMethod === 'Bank' ? 'bg-white text-brand-blue shadow' : 'text-gray-600'}`}>Bank</button>
                                 </div>
                            </div>
                        </div>
                        <div className="mt-4 border-t pt-4">
                             <button 
                                onClick={() => setAddSaleOpen(true)}
                                className="w-full flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                            >
                                <PlusCircleIcon className="h-6 w-6 mr-2" />
                                Add Manual / Other Sale
                            </button>
                        </div>
                    </div>

                    <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-brand-text-primary">Today's Counter Sales Log</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-brand-text-secondary">
                                <thead className="text-xs uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Time</th>
                                        <th className="px-6 py-3">Item / Description</th>
                                        <th className="px-6 py-3">Quantity</th>
                                        <th className="px-6 py-3">Payment Method</th>
                                        <th className="px-6 py-3 text-right">Amount (PKR)</th>
                                        <th className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todaySales.map(sale => (
                                        <tr key={sale.id} className="border-b">
                                            <td className="px-6 py-4">{new Date(sale.date).toLocaleTimeString()}</td>
                                            <td className="px-6 py-4 font-medium text-brand-text-primary">{getItemName(sale)}</td>
                                            <td className="px-6 py-4">{sale.quantity > 0 ? sale.quantity : '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    sale.paymentMethod === 'Cash' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`
                                                }>
                                                    {sale.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold">{sale.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => openDeleteConfirmation(sale.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete Sale">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {todaySales.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10 text-brand-text-secondary">No counter sales recorded today.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
            <AddCounterSaleModal 
                isOpen={isAddSaleOpen}
                onClose={() => setAddSaleOpen(false)}
                onAddSale={handleAddSale}
                inventory={db.inventory}
            />
            <ConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteSale}
                title="Confirm Sale Deletion"
                message="Are you sure you want to delete this sale? This action will restore any stock used and cannot be undone."
            />
        </>
    );
};

export default CounterView;
