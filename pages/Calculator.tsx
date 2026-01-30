import React, { useState } from 'react';
import { generateFinancialPlan } from '../services/geminiService';
import { FinancialPlan } from '../types';
import { DollarSign, Wallet, Plane, RefreshCw, Briefcase, Building2, User } from 'lucide-react';

export default function Calculator() {
  // Estados do Formulário
  const [country, setCountry] = useState('EUA');
  const [visaType, setVisaType] = useState('EB2-NIW');
  const [family, setFamily] = useState('Eu sozinho');
  const [safetyRate, setSafetyRate] = useState(6.0);
  
  // Estado do Resultado (O Plano)
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setFinancialPlan(null); // Limpa anterior

    const result = await generateFinancialPlan(country, visaType, family, safetyRate);
    
    if (result) {
        setFinancialPlan(result);
    } else {
        alert("Erro ao calcular. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculadora de Economia Real</h2>
        <p className="text-gray-600 mb-6 -mt-4">Descubra quanto você economiza fazendo o processo via Imigra.AI vs Assessorias Tradicionais.</p>

        {/* --- INPUTS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País de Destino</label>
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg">
                <option value="EUA">Estados Unidos (USA)</option>
                <option value="Canada">Canadá</option>
                <option value="Australia">Austrália</option>
                <option value="Portugal">Portugal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Visto</label>
              <select value={visaType} onChange={e => setVisaType(e.target.value)} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg">
                <option value="EB2-NIW">Green Card (EB2-NIW)</option>
                <option value="EB3">Skilled Worker (EB3)</option>
                <option value="Express Entry">Express Entry</option>
                <option value="Estudo">Visto de Estudante</option>
                <option value="Nomade">Nômade Digital</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Família</label>
              <select value={family} onChange={e => setFamily(e.target.value)} className="w-full p-2 border border-gray-200 bg-gray-50 rounded-lg">
                <option>Eu sozinho (1 pessoa)</option>
                <option>Casal (2 pessoas)</option>
                <option>Casal + 1 Filho</option>
                <option>Casal + 2 Filhos</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-1">Cotação de Segurança (1 Moeda Local = R$)</label>
             <div className="flex items-center gap-4">
                 <input 
                   type="range" min="3" max="8" step="0.05" 
                   value={safetyRate} onChange={e => setSafetyRate(parseFloat(e.target.value))}
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
                 <div className="text-right text-lg text-primary font-bold font-mono bg-blue-50 px-3 py-1 rounded">
                    R$ {safetyRate.toFixed(2)}
                 </div>
             </div>
          </div>

          <button 
            onClick={handleGeneratePlan}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><RefreshCw className="animate-spin" size={20}/> Consultando Taxas 2026...</> : 'Calcular Economia'}
          </button>
        </div>

        {/* --- RESULTADOS (RENDERIZAÇÃO CONDICIONAL) --- */}
        {financialPlan && (
          <div className="animate-fade-in space-y-6">
            
            {/* COMPARISON CARDS */}
            {financialPlan.comparison && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* Traditional Way */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center opacity-80">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <Building2 size={24} />
                        </div>
                        <h3 className="text-gray-600 font-medium mb-2">Via Assessoria Tradicional</h3>
                        <p className="text-3xl font-bold text-gray-800">
                            {financialPlan.currency_symbol} {financialPlan.comparison.traditional_cost?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Inclui honorários ($5k-$15k)</p>
                    </div>

                    {/* Imigra.AI Way */}
                    <div className="bg-primary text-white rounded-xl p-8 text-center shadow-xl transform scale-105 border-4 border-blue-400/30">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                            <User size={32} />
                        </div>
                        <h3 className="text-blue-100 font-bold mb-2 uppercase tracking-wide">Via Imigra.AI</h3>
                        <p className="text-4xl font-extrabold text-white">
                            {financialPlan.currency_symbol} {financialPlan.comparison.imigra_cost?.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-100 mt-2">Apenas taxas oficiais</p>
                    </div>

                    {/* SAVINGS */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Wallet size={24} />
                        </div>
                        <h3 className="text-green-800 font-medium mb-2">Sua Economia</h3>
                        <p className="text-3xl font-bold text-green-600">
                            {financialPlan.currency_symbol} {financialPlan.comparison.savings?.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-700 mt-2">Dinheiro que fica no seu bolso</p>
                    </div>
                </div>
            )}

            {/* TIMELINE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Cronograma de Desembolso (Taxas Governamentais)</h3>
              <div className="space-y-4">
                {financialPlan.timeline.map((item, index) => (
                  <div key={index} className="flex items-start pb-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                    <div className="bg-blue-100 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-800">{item.phase}</h4>
                          <p className="text-sm font-bold text-primary font-mono bg-blue-50 px-2 py-0.5 rounded">
                            {financialPlan.currency_symbol} {item.cost_target.toLocaleString()}
                          </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
             <div className="bg-gray-800 p-6 rounded-xl text-white flex justify-between items-center">
                <div>
                     <p className="text-sm text-gray-300 font-medium">Custo Total em Reais (Estimado)</p>
                     <p className="text-xs text-gray-500">Considerando Cotação R$ {safetyRate}</p>
                </div>
                <p className="text-3xl font-bold">
                    R$ {financialPlan.summary.total_brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}