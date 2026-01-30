import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const MobileHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            I
          </div>
          <span className="font-bold text-gray-800">Imigra.AI</span>
        </div>
        <button onClick={toggleMenu} className="text-gray-600">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <nav className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg p-4 space-y-2">
          <NavLink to="/" className={navClass} onClick={toggleMenu}>Dashboard</NavLink>
          <NavLink to="/chat" className={navClass} onClick={toggleMenu}>Consultoria</NavLink>
          <NavLink to="/documents" className={navClass} onClick={toggleMenu}>Documentos</NavLink>
          <NavLink to="/tests" className={navClass} onClick={toggleMenu}>Provas</NavLink>
          <NavLink to="/calculator" className={navClass} onClick={toggleMenu}>Calculadora</NavLink>
        </nav>
      )}
    </header>
  );
};

export default MobileHeader;