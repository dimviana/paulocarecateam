

import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { IconMenu, IconChevronDown, IconLogOut, IconUsers } from '../../constants';

interface HeaderProps {
  toggleSidebar: () => void;
}

const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => {
        document.removeEventListener('mousedown', clickOutside);
    };
  }, []);

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
             <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="bg-white rounded-lg p-2 border border-slate-200/60 flex items-center space-x-3 hover:bg-slate-50 transition w-full"
                >
                    <img className="w-10 h-10 rounded-full" src={`https://i.pravatar.cc/150?u=${user?.email}`} alt="User" />
                    <div className="flex-1 text-left hidden sm:block">
                        <div className="font-semibold text-slate-800 truncate">{user?.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                    </div>
                    <IconChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                    <div 
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-1.5 border border-slate-200/60 z-50 animate-fade-in-down"
                    >
                        <div className="px-4 py-2 border-b border-slate-200/60 mb-1">
                            <p className="text-sm font-medium text-slate-800">Logado como</p>
                            <p className="text-sm text-slate-500 truncate" title={user?.name}>{user?.name}</p>
                        </div>
                        <NavLink
                            to="/profile"
                            className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            onClick={() => setDropdownOpen(false)}
                        >
                            <IconUsers className="w-4 h-4 mr-3 text-slate-500" />
                            <span>Editar Perfil</span>
                        </NavLink>
                        <div className="my-1 h-px bg-slate-200/60"></div>
                        <button
                            onClick={() => { logout(); setDropdownOpen(false); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <IconLogOut className="w-4 h-4 mr-3" />
                            <span>Sair</span>
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;