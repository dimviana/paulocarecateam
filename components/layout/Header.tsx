
import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { IconChevronDown, IconLogOut, IconMenu } from '../../constants';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { themeSettings, user, logout } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          <div className="flex items-center">
            {/* Hamburger menu button for mobile */}
            <button
              className="text-gray-500 hover:text-gray-300 lg:hidden"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <IconMenu/>
            </button>
            <div className="hidden lg:block ml-4 text-2xl font-bold text-white tracking-wider">
              {themeSettings.systemName}
            </div>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <div className="relative inline-flex">
              <button
                className="inline-flex justify-center items-center group"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <img className="w-8 h-8 rounded-full" src={`https://i.pravatar.cc/150?u=${user?.email}`} alt="User" />
                <div className="flex items-center truncate">
                  <span className="truncate ml-2 text-sm font-medium text-gray-300 group-hover:text-white">
                    {user?.name}
                  </span>
                  <IconChevronDown />
                </div>
              </button>
              {dropdownOpen && (
                <div
                  className="origin-top-right z-10 absolute top-full right-0 min-w-44 bg-gray-800 border border-gray-700 py-1.5 rounded shadow-lg overflow-hidden mt-1"
                >
                  <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-700">
                    <div className="font-medium text-gray-200">{user?.name}</div>
                    <div className="text-xs text-gray-400 italic">{user?.role.replace('_', ' ')}</div>
                  </div>
                  <ul>
                    <li>
                      <button
                        className="font-medium text-sm text-red-500 hover:text-red-400 flex items-center py-1 px-3 w-full text-left"
                        onClick={logout}
                      >
                         <IconLogOut/>
                        <span className="ml-2">Sign Out</span>
                      </button>
                    </li>
                  </ul>
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
