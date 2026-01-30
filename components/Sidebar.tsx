import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, GraduationCap, Calculator, LogOut, PlusCircle, ChevronDown } from 'lucide-react';
import { GlobalState, ImmigrationProcess } from '../types';

const Sidebar = () => {
  const navigate = useNavigate();
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [activeProcess, setActiveProcess] = useState<ImmigrationProcess | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  useEffect(() => {
    const loadState = () => {
        const saved = localStorage.getItem('imigra_global_state');
        if (saved) {
            const parsed = JSON.parse(saved) as GlobalState;
            setGlobalState(parsed);
            const active = parsed.processes.find(p => p.id === parsed.active_process_id);
            setActiveProcess(active || null);
        }
    };
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, []);

  const switchProcess = (processId: string) => {
    if (!globalState) return;
    const newState = { ...globalState, active_process_id: processId };
    localStorage.setItem('imigra_global_state', JSON.stringify(newState));
    setGlobalState(newState);
    const active = newState.processes.find(p => p.id === processId);
    setActiveProcess(active || null);
    setIsSwitcherOpen(false);
    window.location.reload(); 
  };

  const handleLogout = () => {
    if(confirm('Sair da conta?')) {
        localStorage.removeItem('imigra_global_state');
        navigate('/onboarding');
    }
  };

  // ESTILO NOVO: Pílula Escura para item ativo
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 font-medium text-sm ${
      isActive
        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 transform scale-[1.02]' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const getFlag = (country: string) => {
      if(country.includes('EUA') || country === 'USA') return '🇺🇸';
      if(country.includes('Canad')) return '🇨🇦';
      if(country.includes('Austr')) return '🇦🇺';
      if(country.includes('Port') || country.includes('Euro')) return '🇵🇹';
      return '🌍';
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-gray-100">
         <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
            I
            </div>
            <div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">Imigra.AI</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Consultoria Inteligente</p>
            </div>
        </div>

        {/* Process Switcher */}
        {activeProcess && (
            <div className="relative">
                <button 
                    onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xl">{getFlag(activeProcess.country)}</span>
                        <div className="text-left">
                            <p className="text-xs font-bold text-gray-800 truncate max-w-[100px]">{activeProcess.country}</p>
                            <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{activeProcess.visa_type}</p>
                        </div>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </button>

                {isSwitcherOpen && globalState && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-2 z-20 overflow-hidden animate-fade-in">
                        <p className="px-3 py-2 text-[10px] text-gray-400 font-semibold uppercase bg-gray-50">Meus Processos</p>
                        {globalState.processes.map(proc => (
                            <button
                                key={proc.id}
                                onClick={() => switchProcess(proc.id)}
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 ${proc.id === globalState.active_process_id ? 'bg-blue-50/50 text-accent' : 'text-gray-700'}`}
                            >
                                <span>{getFlag(proc.country)}</span>
                                <span className="text-xs font-medium truncate">{proc.country}</span>
                            </button>
                        ))}
                        <button 
                            onClick={() => {navigate('/onboarding'); setIsSwitcherOpen(false);}}
                            className="w-full text-left px-3 py-3 flex items-center gap-2 text-accent hover:bg-gray-50 border-t border-gray-100"
                        >
                            <PlusCircle size={14} />
                            <span className="text-xs font-bold">Novo Processo</span>
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink to="/" className={navClass} end>
          <LayoutDashboard size={20} />
          <span>Visão Geral</span>
        </NavLink>
        <NavLink to="/chat" className={navClass}>
          <MessageSquare size={20} />
          <span>Consultor IA</span>
        </NavLink>
        <NavLink to="/documents" className={navClass}>
          <FileText size={20} />
          <span>Documentação</span>
        </NavLink>
        <NavLink to="/tests" className={navClass}>
          <GraduationCap size={20} />
          <span>Tutor de Estudos</span>
        </NavLink>
        <NavLink to="/calculator" className={navClass}>
          <Calculator size={20} />
          <span>Planejador Financeiro</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
          <LogOut size={20} />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;