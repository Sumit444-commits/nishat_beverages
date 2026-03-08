import React from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { HomeIcon } from '../icons/HomeIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { PackageIcon } from '../icons/PackageIcon';
import { TruckIcon } from '../icons/TruckIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { ShoppingCartIcon } from '../icons/ShoppingCartIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { BellIcon } from '../icons/BellIcon';
import { SideNavItem } from '../../types';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
    const navItems: SideNavItem[] = [
        { name: 'Dashboard', icon: <HomeIcon />, type: 'link' },
        { name: 'OPERATIONS', type: 'header' },
        { name: 'Customers', icon: <UsersIcon />, type: 'link' },
        { name: 'Salesmen', icon: <TruckIcon />, type: 'link' },
        { name: 'Area Assignment', icon: <PackageIcon />, type: 'link' },
        { name: 'Daily Sales', icon: <ShoppingCartIcon />, type: 'link' },
        { name: 'Daily Reminders', icon: <BellIcon />, type: 'link' },
        { name: 'Delivery Schedule', icon: <CalendarIcon />, type: 'link' },
        { name: 'Daily Assignments', icon: <FileTextIcon />, type: 'link' },
        { name: 'Inventory', icon: <PackageIcon />, type: 'link' },
        { name: 'FINANCIALS', type: 'header' },
        { name: 'Outstanding', icon: <TrendingUpIcon />, type: 'link' },
        { name: 'Expenses', icon: <DollarSignIcon />, type: 'link' },
        { name: 'Account Management', icon: <DollarSignIcon />, type: 'link' },
        { name: 'Salesman Payments', icon: <DollarSignIcon />, type: 'link' },
        { name: 'Cash / Bank Recon', icon: <DollarSignIcon />, type: 'link' },
        { name: 'Closing Report', icon: <FileTextIcon />, type: 'link' },
        { name: 'ANALYSIS', type: 'header' },
        { name: 'Business Reports', icon: <BarChartIcon />, type: 'link' },
    ];

    return (
        <div className="w-64 bg-brand-blue text-white flex flex-col h-full">
            <div className="flex items-center justify-center h-20 border-b border-blue-700 flex-shrink-0">
                <WaterDropIcon className="h-8 w-8 mr-3" />
                <h1 className="text-xl font-bold">Nishat Beverages</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <ul>
                    {navItems.map((item) => {
                        if (item.type === 'header') {
                            return (
                                <li key={item.name} className="px-4 pt-4 pb-1 text-xs font-bold uppercase text-blue-300">
                                    {item.name}
                                </li>
                            );
                        }
                        return (
                            <li key={item.name} className="relative group">
                                <button
                                    onClick={() => onNavigate(item.name)}
                                    className={`flex items-center w-full text-left py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm ${
                                        activeView === item.name || 
                                        (activeView === 'CustomerDetail' && item.name === 'Customers') ||
                                        (activeView === 'SalesmanDetail' && item.name === 'Salesmen') ||
                                        (activeView === 'Area Assignment' && item.name === 'Area Assignment') ||
                                        (activeView === 'InventoryDetail' && item.name === 'Inventory')
                                            ? 'bg-brand-lightblue text-white'
                                            : 'hover:bg-brand-lightblue hover:text-white text-blue-200'
                                    }`}
                                >
                                    {React.cloneElement(item.icon, { className: 'h-5 w-5 mr-3' })}
                                    <span className="font-medium">{item.name}</span>
                                </button>
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-text-primary text-white text-xs font-semibold rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 pointer-events-none z-10 whitespace-nowrap">
                                    {item.name}
                                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-brand-text-primary rotate-45"></div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;