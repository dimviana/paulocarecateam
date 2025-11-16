

import React, { useState, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { AppContext } from '../../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { themeSettings } = useContext(AppContext);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text-primary)]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
        </main>
        <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-[var(--theme-text-primary)]/60 border-t border-[var(--theme-text-primary)]/10 shrink-0">
            © {new Date().getFullYear()} {themeSettings.copyrightText} - <a href="https://github.com/dimviana/paulocarecateam" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--theme-accent)] transition-colors">Versão {themeSettings.systemVersion}</a>
        </footer>
      </div>
    </div>
  );
};

export default Layout;