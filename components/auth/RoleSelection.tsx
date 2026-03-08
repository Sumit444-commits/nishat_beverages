import React from 'react';
import { WaterDropIcon } from '../icons/WaterDropIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { ShoppingCartIcon } from '../icons/ShoppingCartIcon';

interface RoleSelectionProps {
  onSelectRole: (role: 'admin' | 'counter') => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-lightblue">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-brand-accent rounded-full mb-4">
            <WaterDropIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center text-brand-text-primary">
            Welcome to Nishat Beverages
          </h2>
          <p className="mt-2 text-center text-sm text-brand-text-secondary">
            Please select your role to sign in.
          </p>
        </div>
        <div className="space-y-4 pt-4">
          <button
            onClick={() => onSelectRole('admin')}
            className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-colors duration-300"
          >
            <UserCircleIcon className="h-5 w-5 mr-3" />
            Admin Login
          </button>
          <button
            onClick={() => onSelectRole('counter')}
            className="group relative w-full flex items-center justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-brand-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-300"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-3" />
            Counter Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;