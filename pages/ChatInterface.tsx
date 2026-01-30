import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Paperclip, Bot, User, Trash2 } from 'lucide-react';
import { Message, GlobalState } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const savedState = localStorage.getItem('imigra_global_state');
    if (savedState) {
        try {
            setGlobalState(JSON.parse(savedState));
        } catch(e) { console.error("Error parsing user state", e); }
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = localStorage.getItem('imigra_chat_history');
    if (saved) {
      try {
        const parsedMsgs = JSON.parse(saved);
        if (parsedMsgs.length > 0) {
            setMessages(parsedMsgs);
            return;
        }
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }

    // COLD START LOGIC
    const savedState = localStorage.getItem('imigra_global_state');
    if (savedState) {
        const state = JSON.parse(savedState) as GlobalState;
        const activeProcess = state.processes.find(p => p.id === state.active_process_id);
        
        if (activeProcess && activeProcess.active_roadmap) {
            const currentStep = activeProcess.active_roadmap.steps.find(s => s.status === 'PENDING');
            if (currentStep) {
                triggerColdStart(state, currentStep.title, currentStep.description);
                return;
            }
        }
    }

    const initialMsg: Message = {
        id: 'init',
        role: 'model',
        content: `**Consultor Imigra.AI Iniciado.**\n\nEstou analisando seu processo ativo no sistema. Por favor, aguarde instruções ou faça sua pergunta.`,
        timestamp: Date.now()
    };
    setMessages([initialMsg]);

  }, []);

  const triggerColdStart = async (state: GlobalState, stepTitle: string, stepDesc: string) => {
      setIsLoading(true);
      
      const hiddenTrigger = `
      O usuário acabou de entrar na tela de chat.
      O passo atual do Roadmap é: "${stepTitle}".
      Descrição: "${stepDesc}".
      
      AÇÃO: Inicie a conversa explicando este passo e já pedindo a informação necessária para EXECUTARMOS a tarefa agora.
      Não dê "Bom dia" genérico. Atue como um advogado sênior dando instruções.
      `;

      const responseText = await sendMessageToGemini([], "", state, [], hiddenTrigger);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };

      setMessages([aiMsg]);
      setIsLoading(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
        localStorage.setItem('imigra_chat_history', JSON.stringify(messages));
        scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const responseText = await sendMessageToGemini(messages, inputText, globalState);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const clearHistory = () => {
    if(confirm("Tem certeza que deseja apagar o histórico?")) {
      setMessages([]);
      localStorage.removeItem('imigra_chat_history');
      window.location.reload();
    }
  };

  const getActiveContextName = () => {
      if (!globalState) return "Carregando...";
      const active = globalState.processes.find(p => p.id === globalState.active_process_id);
      return active ? `${active.country} - ${active.visa_type}` : "Sem Processo Ativo";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Imigra.AI Executor</h2>
            <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Sistema Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-semibold hidden md:inline-block border border-slate-300">
                {getActiveContextName()}
            </span>
            <button onClick={clearHistory} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-full" title="Limpar conversa">
              <Trash2 size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
              msg.role === 'user' ? 'bg-white border-gray-200' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              {msg.role === 'user' ? <User size={20} className="text-gray-600" /> : <Bot size={20} />}
            </div>
            
            {/* Conteúdo da Mensagem (Estilo Documento) */}
            <div className={`group relative px-6 py-5 rounded-2xl shadow-sm border text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-white border-gray-200 text-gray-800 rounded-tr-none' 
                : 'bg-white border-gray-200 text-gray-800 rounded-tl-none w-full' 
            }`}>
               <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-accent prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <span className="text-[10px] text-gray-300 absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
               <Bot size={20} />
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none flex gap-2 items-center shadow-sm">
              <span className="text-xs text-gray-500 font-medium animate-pulse">Digitando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-inner">
            <button className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-200">
                <Paperclip size={20} />
            </button>
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
                }}
                placeholder="Digite sua dúvida ou cole um texto aqui..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 text-gray-800 placeholder:text-gray-400"
                rows={1}
            />
            <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="p-2 bg-primary text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md transform active:scale-95"
            >
                <Send size={20} />
            </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
            O Imigra.AI é um assistente inteligente. Verifique informações críticas com fontes oficiais.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;