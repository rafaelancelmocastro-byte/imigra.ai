import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateOnboardingConfig } from '../services/geminiService';
import { GlobalState, ImmigrationProcess } from '../types';
import { Check, ChevronRight, Globe, Briefcase, User, Loader2, Flag } from 'lucide-react';

const COUNTRIES = [
  { 
    id: 'USA', name: 'Estados Unidos', flag: '🇺🇸', 
    visas: ['EB2-NIW', 'EB3-Skilled', 'H1B', 'F1-Student'] 
  },
  { 
    id: 'Canada', name: 'Canadá', flag: '🇨🇦', 
    visas: ['Express Entry', 'Study Permit', 'Provincial Nominee (PNP)'] 
  },
  { 
    id: 'Portugal', name: 'Portugal / Europa', flag: '🇵🇹', 
    visas: ['Visto D7', 'Visto D8 (Nômade)', 'Visto CPLP', 'Blue Card UE'] 
  },
  { 
    id: 'Australia', name: 'Austrália', flag: '🇦🇺', 
    visas: ['Skilled Independent (189)', 'Student Visa (500)'] 
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    visa: '',
    profession: ''
  });

  const handleNext = () => setStep(prev => prev + 1);

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingMsg("Conectando com o Agente de Imigração...");

    setTimeout(() => setLoadingMsg("Analisando regras de 2026 para " + formData.country + "..."), 1500);
    setTimeout(() => setLoadingMsg("Criando seu Roadmap de Execução..."), 3000);

    const data = await generateOnboardingConfig(formData.country, formData.visa, formData.profession);

    if (data && data.config) {
      const processId = `proc_${formData.country.substring(0,3).toLowerCase()}_${Date.now()}`;
      
      const newProcess: ImmigrationProcess = {
        id: processId,
        country: formData.country,
        visa_type: formData.visa,
        profession: formData.profession,
        status: 'Planning',
        config: data.config,
        active_roadmap: data.active_roadmap, // Inject Roadmap
        uploaded_documents: data.config.requirements.documents_list.map(d => ({
            doc_name: d.name,
            status: 'PENDING_UPLOAD',
            date: null
        })),
        study_state: {
            current_material: null,
            material_content_chunk: null,
            last_quiz_score: null,
            weak_topics: []
        }
      };

      // Check for existing state to merge or create new
      const existingStateStr = localStorage.getItem('imigra_global_state');
      let newState: GlobalState;

      if (existingStateStr) {
          const existingState = JSON.parse(existingStateStr) as GlobalState;
          newState = {
              ...existingState,
              active_process_id: processId,
              processes: [...existingState.processes, newProcess]
          };
      } else {
          newState = {
              user_identity: {
                  name: formData.name,
                  email: formData.email,
                  token: 'demo_token'
              },
              active_process_id: processId,
              processes: [newProcess]
          };
      }

      localStorage.setItem('imigra_global_state', JSON.stringify(newState));
      
      // Clear legacy state if exists to avoid conflicts
      localStorage.removeItem('imigra_user_state'); 
      localStorage.removeItem('imigra_chat_history'); // Clear chat history to trigger Cold Start
      
      setLoadingMsg("Tudo pronto! Redirecionando...");
      setTimeout(() => navigate('/'), 1000);
    } else {
      alert("Erro ao gerar configuração. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between mb-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
            <span>Identidade</span>
            <span>Destino</span>
            <span>Perfil</span>
            <span>Configuração</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${step * 25}%` }}></div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl min-h-[400px] flex flex-col">
        {loading ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <h2 className="text-xl font-bold text-gray-800">{loadingMsg}</h2>
              <p className="text-gray-500">Estamos construindo seu plano personalizado.</p>
           </div>
        ) : (
          <>
            {step === 1 && (
                <div className="flex-1 space-y-6 animate-fade-in">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <User size={24}/>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Vamos começar</h1>
                        <p className="text-gray-500">Crie sua conta para acessar o Imigra.AI</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Ex: Rafael Silva"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            disabled={!formData.name || !formData.email}
                            onClick={handleNext}
                            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            Próximo <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                 <div className="flex-1 space-y-6 animate-fade-in">
                    <div className="text-center">
                         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Globe size={24}/>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Para onde vamos?</h1>
                        <p className="text-gray-500">Escolha o país dos seus sonhos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {COUNTRIES.map(c => (
                            <div 
                                key={c.id}
                                onClick={() => setFormData({...formData, country: c.id, visa: ''})}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.country === c.id ? 'border-primary bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
                            >
                                <span className="text-3xl mb-2 block">{c.flag}</span>
                                <h3 className="font-bold text-gray-800">{c.name}</h3>
                            </div>
                        ))}
                    </div>

                    {formData.country && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Qual caminho (Visto) você pretende aplicar?</label>
                            <select 
                                value={formData.visa}
                                onChange={e => setFormData({...formData, visa: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Selecione o Visto</option>
                                {COUNTRIES.find(c => c.id === formData.country)?.visas.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                         <button onClick={() => setStep(1)} className="text-gray-500 font-medium">Voltar</button>
                        <button 
                            disabled={!formData.country || !formData.visa}
                            onClick={handleNext}
                            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            Próximo <ChevronRight size={20} />
                        </button>
                    </div>
                 </div>
            )}

            {step === 3 && (
                <div className="flex-1 space-y-6 animate-fade-in">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                            <Briefcase size={24}/>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Qual seu perfil profissional?</h1>
                        <p className="text-gray-500">Isso nos ajuda a calibrar os módulos de validação de diploma.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profissão Principal</label>
                         <select 
                                value={formData.profession}
                                onChange={e => setFormData({...formData, profession: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Selecione...</option>
                                <option value="Enfermagem">Enfermagem (Saúde)</option>
                                <option value="Medicina">Medicina (Saúde)</option>
                                <option value="Engenharia">Engenharia</option>
                                <option value="TI / Tech">Tecnologia (TI/Dev)</option>
                                <option value="Direito">Direito</option>
                                <option value="Outro">Outra Área</option>
                            </select>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 text-sm mb-1">Por que isso importa?</h4>
                        <p className="text-xs text-yellow-700">
                            Se você selecionar "Enfermagem" para os EUA, o Imigra.AI ativará automaticamente o módulo NCLEX. 
                            Se for TI, ativará dicas de Tech Interview.
                        </p>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button onClick={() => setStep(2)} className="text-gray-500 font-medium">Voltar</button>
                        <button 
                            disabled={!formData.profession}
                            onClick={handleSubmit}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            Gerar Meu Plano Inteligente <Check size={20} />
                        </button>
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;