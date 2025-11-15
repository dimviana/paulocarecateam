
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { IconMenu } from '../../constants';

interface HeaderProps {
  toggleSidebar: () => void;
}

const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user } = useContext(AppContext);

  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 border-b border-slate-200/60">
          <div className="flex items-center">
            {/* Hamburger menu button for mobile */}
            <button
              className="text-slate-500 hover:text-slate-800 lg:hidden"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <IconMenu/>
            </button>
            
            {/* Search bar */}
            <div className="hidden lg:block ml-4">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IconSearch />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full max-w-xs bg-slate-100 border border-transparent rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>
            </div>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
             <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex items-center space-x-3">
                <img className="w-10 h-10 rounded-full" src={`https://i.pravatar.cc/150?u=${user?.email}`} alt="User" />
                <div>
                  <div className="font-semibold text-slate-800">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;