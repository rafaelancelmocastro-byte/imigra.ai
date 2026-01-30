import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck, Globe, Bell, X, Loader2, Target, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { GlobalState, ImmigrationProcess } from '../types';

interface Notification {
  id: number;
  message: string;
  type: 'warning' | 'info';
}

const Dashboard = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeProcess, setActiveProcess] = useState<ImmigrationProcess | null>(null);
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const globalStateStr = localStorage.getItem('imigra_global_state');
    if (globalStateStr) {
        const globalState = JSON.parse(globalStateStr) as GlobalState;
        setUserName(globalState.user_identity.name.split(' ')[0]); // Apenas primeiro nome
        
        const current = globalState.processes.find(p => p.id === globalState.active_process_id);
        if (current) {
            setActiveProcess(current);
            // Notificações baseadas em pendências reais
            const pendingDocs = current.uploaded_documents.filter(d => d.status === 'PENDING_UPLOAD');
            if (pendingDocs.length > 0) {
                setNotifications([{
                    id: 1,
                    message: `${pendingDocs.length} documentos pendentes para o visto ${current.visa_type}`,
                    type: 'warning'
                }]);
            }
        }
    }
  }, []);

  if (!activeProcess) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>;

  // Lógica para encontrar o passo atual (Missão)
  const currentStep = activeProcess.active_roadmap?.steps.find(s => s.status === 'PENDING') 
      || activeProcess.active_roadmap?.steps[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Olá, {userName} 👋</h1>
          <div className="flex items-center gap-2 mt-1 text-secondary text-sm font-medium">
             <span>Gerenciando processo:</span>
             <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700 flex items-center gap-1 shadow-sm">
                {activeProcess.country === 'USA' ? '🇺🇸' : activeProcess.country === 'Canada' ? '🇨🇦' : '🌍'} 
                {activeProcess.country} • {activeProcess.visa_type}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {notifications.length > 0 && (
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-orange-100">
                    <Bell size={16} />
                    {notifications[0].message}
                </div>
            )}
        </div>
      </header>

      {/* HERO SECTION: A "Missão Atual" (Design Refinado) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card Principal - Missão */}
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden group">
            {/* Efeitos de Fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <span className="bg-accent/20 text-blue-200 border border-blue-400/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <Target size={14} /> Prioridade Máxima
                    </span>
                    <span className="text-slate-400 text-xs font-mono tracking-wider">FASE {activeProcess.active_roadmap?.current_phase || 1} DE 4</span>
                </div>
                
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                    {currentStep?.title || "Carregando próxima missão..."}
                </h2>
                <p className="text-slate-300 text-base max-w-xl leading-relaxed mb-8">
                    {currentStep?.description || "A inteligência artificial está calculando seus próximos passos..."}
                </p>
                
                <div className="flex flex-wrap gap-4">
                    <Link to="/chat" className="bg-accent hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-glow transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                        <PlayCircle size={20} />
                        Executar Missão com IA
                    </Link>
                    {currentStep?.external_link && (
                        <a href={currentStep.external_link} target="_blank" rel="noreferrer" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
                            Acessar Link Externo <ArrowRight size={16} />
                        </a>
                    )}
                </div>
            </div>
        </div>

        {/* Card Lateral - Status Resumo */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-card flex flex-col justify-between">
            <div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6">Saúde do Processo</h3>
                
                <div className="space-y-6">
                    {/* Progresso Geral */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-700 font-medium">Progresso da Fase</span>
                            <span className="text-accent font-bold">25%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-accent w-1/4 rounded-full shadow-sm"></div>
                        </div>
                    </div>

                    {/* Documentos */}
                    <Link to="/documents" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-accent/30 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2.5 rounded-lg shadow-sm text-gray-500 group-hover:text-accent transition-colors">
                                <FileCheck size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Documentação</p>
                                <p className="text-base font-bold text-gray-800">
                                    {activeProcess.uploaded_documents.filter(d => d.status === 'APPROVED').length} 
                                    <span className="text-gray-400 mx-1">/</span> 
                                    {activeProcess.uploaded_documents.length}
                                </p>
                            </div>
                        </div>
                        {activeProcess.uploaded_documents.some(d => d.status === 'PENDING_UPLOAD') && (
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                        )}
                    </Link>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50">
                <p className="text-xs text-gray-400 mb-2 font-medium">Próximo Marco Oficial</p>
                <div className="flex items-center gap-2 text-gray-700 font-semibold bg-gray-50 px-3 py-2 rounded-lg">
                    <Globe size={16} className="text-gray-400"/>
                    <span>Protocolo {activeProcess.country}</span>
                </div>
            </div>
        </div>
      </div>

      {/* ROADMAP SECTION: Visual Timeline */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">Roadmap de Execução</h3>
        </div>
        <div className="divide-y divide-gray-100">
            {activeProcess.active_roadmap?.steps.map((step, idx) => {
                const isCompleted = step.status === 'COMPLETED';
                const isPending = step.status === 'PENDING';
                const isLocked = step.status === 'LOCKED';
                
                return (
                    <div key={idx} className={`p-5 flex items-start gap-4 transition-colors ${isPending ? 'bg-blue-50/40' : ''}`}>
                        <div className="mt-1">
                            {isCompleted ? (
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
                                    <CheckCircle2 size={18} />
                                </div>
                            ) : isPending ? (
                                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-blue-200 border border-blue-400 ring-4 ring-blue-50">
                                    <Target size={16} />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border border-gray-200">
                                    <Lock size={16} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className={`text-base font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {step.title}
                                </h4>
                                {isPending && (
                                    <Link to="/chat" className="text-accent text-xs font-bold hover:text-white hover:bg-accent px-4 py-1.5 rounded-full border border-accent/20 transition-all">
                                        Iniciar Tarefa →
                                    </Link>
                                )}
                            </div>
                            <p className={`text-sm mt-1 leading-relaxed ${isLocked ? 'text-gray-300' : 'text-gray-600'}`}>
                                {step.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;