import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { IconHome, IconUsers, IconDollarSign, IconBuilding, IconUserCheck, IconSettings, IconX, IconMedal, IconCalendar } from '../../constants';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { themeSettings, user } = useContext(AppContext);

  const navLinks = [
    { to: "/dashboard", text: "Dashboard", icon: <IconHome />, roles: ['general_admin', 'academy_admin', 'student'] },
    { to: "/students", text: "Alunos", icon: <IconUsers />, roles: ['general_admin', 'academy_admin'] },
    { to: "/graduations", text: "Graduações", icon: <IconMedal />, roles: ['general_admin'] },
    { to: "/schedules", text: "Horários", icon: <IconCalendar />, roles: ['general_admin', 'academy_admin', 'student'] },
    { to: "/attendance", text: "Frequência", icon: <IconUserCheck />, roles: ['general_admin', 'academy_admin', 'student'] },
    { to: "/finance", text: "Financeiro", icon: <IconDollarSign />, roles: ['general_admin', 'academy_admin'] },
    { to: "/academies", text: "Academias", icon: <IconBuilding />, roles: ['general_admin'] },
    { to: "/profile", text: "Meu Perfil", icon: <IconUsers />, roles: ['student'] },
    { to: "/settings", text: "Configurações", icon: <IconSettings />, roles: ['general_admin'] },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(user?.role || ''));

  const linkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-red-600/30 text-red-400 font-semibold";

  return (
    <>
      {/* Sidebar backdrop (for mobile) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      ></div>

      <div
        className={`fixed top-0 left-0 z-40 w-64 h-full bg-gray-900 border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between items-center h-16 px-4 border-b border-gray-800">
          <NavLink to="/dashboard" className="flex items-center">
            <img src={themeSettings.logoUrl} alt="Logo" className="h-8 w-auto" />
            <span className="text-white text-lg font-bold ml-2">{themeSettings.systemName}</span>
          </NavLink>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <IconX />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-4">
          <ul>
            {filteredLinks.map((link) => (
              <li key={link.to} className="mb-2">
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