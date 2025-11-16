import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { IconHome, IconUsers, IconDollarSign, IconBuilding, IconUserCheck, IconSettings, IconX, IconMedal, IconCalendar, IconBriefcase } from '../../constants';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { themeSettings, user } = useContext(AppContext);

  const navLinks = [
    { to: "/dashboard", text: "Dashboard", icon: <IconHome />, roles: ['general_admin', 'academy_admin', 'student'] },
    { to: "/students", text: "Alunos", icon: <IconUsers />, roles: ['general_admin', 'academy_admin'] },
    { to: "/professors", text: "Professores", icon: <IconBriefcase />, roles: ['general_admin', 'academy_admin'] },
    { to: "/graduations", text: "Graduações", icon: <IconMedal />, roles: ['general_admin'] },
    { to: "/schedules", text: "Horários", icon: <IconCalendar />, roles: ['general_admin', 'academy_admin', 'student'] },
    { to: "/attendance", text: "Frequência", icon: <IconUserCheck />, roles: ['general_admin', 'academy_admin', 'student'] },
    { to: "/finance", text: "Financeiro", icon: <IconDollarSign />, roles: ['general_admin', 'academy_admin'] },
    { to: "/academies", text: "Academias", icon: <IconBuilding />, roles: ['general_admin'] },
    { to: "/profile", text: "Meu Perfil", icon: <IconUsers />, roles: ['student'] },
    { to: "/settings", text: "Configurações", icon: <IconSettings />, roles: ['general_admin'] },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(user?.role || ''));

  const linkClasses = "flex items-center px-4 py-3 text-[var(--theme-text-primary)]/80 hover:text-[var(--theme-accent)] rounded-lg transition-colors duration-200 font-medium";
  const activeLinkClasses = "bg-[var(--theme-accent)] text-[var(--theme-button-text)] shadow-md shadow-amber-500/30";

  return (
    <>
      {/* Sidebar backdrop (for mobile) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      ></div>

      <div
        className={`fixed top-0 left-0 z-40 w-64 h-full bg-[var(--theme-card-bg)] border-r border-[var(--theme-text-primary)]/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between items-center h-20 px-4">
          <NavLink to="/dashboard" className="flex items-center">
            <img src={themeSettings.logoUrl} alt="Logo" className="h-10 w-auto rounded-lg" />
            <span className="text-[var(--theme-text-primary)] text-lg font-bold ml-3">{themeSettings.systemName}</span>
          </NavLink>
          <button className="lg:hidden text-[var(--theme-icon)] hover:text-[var(--theme-text-primary)]" onClick={() => setIsOpen(false)}>
            <IconX />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-4">
          <ul className="space-y-2">
            {filteredLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;