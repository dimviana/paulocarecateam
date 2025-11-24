
import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { IconMenu, IconChevronDown, IconLogOut, IconUsers, IconBookOpen } from '../../constants';
import Modal from '../ui/Modal';
import Documentation from '../Documentation';

interface HeaderProps {
  toggleSidebar: () => void;
}

const IconSearch = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--theme-icon)]"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
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
    <>
      <header className="sticky top-0 z-30 bg-[var(--theme-card-bg)]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 border-b border-[var(--theme-text-primary)]/10">
            <div className="flex items-center">
              {/* Hamburger menu button for mobile */}
              <button
                className="text-[var(--theme-icon)] hover:text-[var(--theme-text-primary)] lg:hidden"
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
                          className="w-full max-w-xs bg-[var(--theme-bg)] border border-transparent rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
                      />
                  </div>
              </div>
            </div>

            {/* Header: Right side */}
            <div className="flex items-center space-x-3">
               <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="p-2 rounded-full text-[var(--theme-icon)] hover:bg-[var(--theme-bg)] transition-colors"
                  title="Documentação do Sistema"
                >
                    <IconBookOpen />
                </button>

               <div className="relative" ref={dropdownRef}>
                  <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="bg-[var(--theme-card-bg)] rounded-lg p-2 border border-[var(--theme-text-primary)]/10 flex items-center space-x-3 hover:bg-[var(--theme-bg)] transition w-full"
                  >
                      <img className="w-10 h-10 rounded-full" src={`https://i.pravatar.cc/150?u=${user?.email}`} alt="User" />
                      <div className="flex-1 text-left hidden sm:block">
                          <div className="font-semibold text-[var(--theme-text-primary)] truncate">{user?.name}</div>
                          <div className="text-xs text-[var(--theme-text-primary)]/70 truncate">{user?.email}</div>
                      </div>
                      <IconChevronDown className={`w-5 h-5 text-[var(--theme-icon)] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                      <div 
                          className="absolute right-0 mt-2 w-56 bg-[var(--theme-card-bg)] rounded-xl shadow-lg py-1.5 border border-[var(--theme-text-primary)]/10 z-50 animate-fade-in-down"
                      >
                          <div className="px-4 py-2 border-b border-[var(--theme-text-primary)]/10 mb-1">
                              <p className="text-sm font-medium text-[var(--theme-text-primary)]">Logado como</p>
                              <p className="text-sm text-[var(--theme-text-primary)]/70 truncate" title={user?.name}>{user?.name}</p>
                          </div>
                          <NavLink
                              to="/profile"
                              className="flex items-center w-full px-4 py-2 text-sm text-[var(--theme-text-primary)]/90 hover:bg-[var(--theme-bg)] rounded-md transition-colors"
                              onClick={() => setDropdownOpen(false)}
                          >
                              <IconUsers className="w-4 h-4 mr-3 text-[var(--theme-icon)]" />
                              <span>Editar Perfil</span>
                          </NavLink>
                          <div className="my-1 h-px bg-[var(--theme-text-primary)]/10"></div>
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

      <Modal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
        title="Documentação do Sistema"
        size="2xl"
      >
        <Documentation />
      </Modal>
    </>
  );
};

export default Header;
