import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '../icons/BellIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { LogoutIcon } from '../icons/LogoutIcon';
import { User, Notification } from '../../types';

interface HeaderProps {
    user: User | null;
    notifications: Notification[];
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, notifications, onLogout }) => {
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="h-20 bg-brand-surface border-b border-gray-200 flex items-center justify-end px-6">
            <div className="flex items-center space-x-6">
                <div ref={notificationRef} className="relative">
                    <button
                        onClick={() => setNotificationsOpen(prev => !prev)}
                        className="relative text-brand-text-secondary hover:text-brand-blue"
                    >
                        <BellIcon className="h-6 w-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
                            <div className="p-3 border-b font-semibold text-brand-text-primary">
                                Notifications
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(notification => (
                                    <div key={notification.id} className={`p-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-sm text-brand-text-primary">{notification.title}</p>
                                            {!notification.read && <span className="h-2 w-2 bg-brand-blue rounded-full"></span>}
                                        </div>
                                        <p className="text-sm text-brand-text-secondary">{notification.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(notification.date).toLocaleString()}</p>
                                    </div>
                                )) : (
                                    <p className="text-center text-brand-text-secondary p-6">No new notifications.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center">
                    <UserCircleIcon className="h-10 w-10 text-brand-text-secondary" />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-brand-text-primary">{user?.name || 'User'}</p>
                        <p className="text-xs text-brand-text-secondary">{user?.role || 'Role'}</p>
                    </div>
                </div>
                <button onClick={onLogout} className="flex items-center text-brand-text-secondary hover:text-red-600 transition-colors">
                    <LogoutIcon className="h-6 w-6 mr-2" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;