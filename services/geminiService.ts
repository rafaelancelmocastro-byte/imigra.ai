import Groq from "groq-sdk";
import { SYSTEM_PROMPT, Message, GlobalState, FinancialPlan, ProcessConfig, Roadmap } from "../types";

// --- INICIALIZAÇÃO SEGURA (LAZY LOAD) ---
// Não iniciamos o Groq aqui fora para evitar CRASH se a chave faltar.
const getGroqClient = () => {
  const apiKey = process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey || apiKey.includes("undefined")) {
    console.error("ERRO CRÍTICO: Chave API do Groq não encontrada no Vercel.");
    return null;
  }

  return new Groq({ 
    apiKey: apiKey, 
    dangerouslyAllowBrowser: true 
  });
};

const MODEL_FAST = "llama-3.3-70b-versatile"; 
const MODEL_VISION = "llama-3.2-11b-vision-preview";

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  globalState: GlobalState | null,
  attachments: { mimeType: string; data: string }[] = [],
  hiddenSystemTrigger?: string
): Promise<string> => {
  try {
    const groq = getGroqClient();
    
    if (!groq) {
      return "⚠️ ERRO DE CONFIGURAÇÃO: A Chave API (VITE_GROQ_API_KEY) não está configurada no Vercel. Adicione a chave nas Configurações do Projeto > Environment Variables.";
    }

    // 1. Monta o Prompt de Sistema com Contexto
    let systemInstruction = SYSTEM_PROMPT;
    
    if (globalState && globalState.active_process_id) {
        const activeProcess = globalState.processes.find(p => p.id === globalState.active_process_id);
        if (activeProcess) {
             const processContext = JSON.stringify({
                user: globalState.user_identity.name,
                country: activeProcess.country,
                visa: activeProcess.visa_type,
                roadmap: activeProcess.active_roadmap,
                status: activeProcess.uploaded_documents
             }, null, 2);

             systemInstruction = systemInstruction
                .replace('{{INJECT_ACTIVE_PROCESS_HERE}}', `CONTEXTO ATUAL:\n\`\`\`json\n${processContext}\n\`\`\``)
                .replace('{{ACTIVE_COUNTRY}}', activeProcess.country)
                .replace('{{ACTIVE_VISA}}', activeProcess.visa_type);
        }
    }

    // 2. Converte histórico
    const messages: any[] = [
        { role: "system", content: systemInstruction }
    ];

    history.forEach(msg => {
        messages.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content });
    });

    if (hiddenSystemTrigger) {
        messages.push({ role: "system", content: `[SYSTEM TRIGGER: ${hiddenSystemTrigger}]` });
    }

    if (newMessage || attachments.length > 0) {
        if (attachments.length > 0) {
            const content = [
                { type: "text", text: newMessage || "Analise esta imagem." },
                { 
                    type: "image_url", 
                    image_url: { url: `data:${attachments[0].mimeType};base64,${attachments[0].data}` } 
                }
            ];
            messages.push({ role: "user", content });
        } else {
            messages.push({ role: "user", content: newMessage });
        }
    }

    // 3. Chamada API
    const completion = await groq.chat.completions.create({
        messages: messages,
        model: attachments.length > 0 ? MODEL_VISION : MODEL_FAST,
        temperature: 0.5,
        max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "Erro ao processar resposta.";
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return `Ocorreu um erro ao conectar com o Imigra.AI: ${error.message || "Erro desconhecido"}`;
  }
};

// --- FUNÇÕES AUXILIARES ---

export const analyzeDocumentImg = async (base64Data: string, mimeType: string, docType: string): Promise<string> => {
   try {
    const groq = getGroqClient();
    if (!groq) return "Erro: Chave API não configurada.";

    const cleanData = base64Data.split(',')[1] || base64Data;
    
    const completion = await groq.chat.completions.create({
        model: MODEL_VISION,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: `Analise este documento: ${docType}. 1. Confirme o tipo. 2. Extraia datas e nomes. 3. Valide legibilidade. Responda em Markdown.` },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${cleanData}` } }
                ]
            }
        ]
    });
    return completion.choices[0]?.message?.content || "Não foi possível analisar.";
   } catch (error) {
     console.error("Doc Analysis Error:", error);
     return "Erro na análise visual.";
   }
};

export const generateQuizFromContent = async (content: string, language: string = 'Português'): Promise<any> => {
  try {
    const groq = getGroqClient();
    if (!groq) return null;

    const prompt = `
      Atue como Professor Sênior.
      TEXTO BASE: "${content.substring(0, 15000)}..."
      TAREFA: Crie um Quiz de 5 questões difíceis.
      SAÍDA: JSON puro com array "questions" (id, question, options, correctAnswerIndex, explanation).
      IDIOMA: ${language}.
    `;

    const completion = await groq.chat.completions.create({
        model: MODEL_FAST,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Quiz Error:", error);
    return null;
  }
};

export const generateFinancialPlan = async (country: string, visa: string, family: string, safetyRate: number): Promise<FinancialPlan | null> => {
  try {
    const groq = getGroqClient();
    if (!groq) return null;

    const prompt = `
      Atue como Planejador Financeiro.
      DADOS: ${country}, ${visa}, ${family}, Câmbio R$ ${safetyRate}.
      TAREFA: Retorne JSON com custos (summary, comparison, timeline).
      Regra: Compare "Via Assessoria" ($$$) vs "Via Imigra.AI" ($0 assessoria).
    `;

    const completion = await groq.chat.completions.create({
        model: MODEL_FAST,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    return null;
  }
};

export const generateOnboardingConfig = async (country: string, visa: string, profession: string): Promise<any> => {
    try {
        const groq = getGroqClient();
        if (!groq) return null;

        const prompt = `
          Atue como Arquiteto de Imigração.
          USER: ${country}, ${visa}, ${profession}.
          TAREFA: Gere JSON com "config" (requirements) e "active_roadmap" (steps).
        `;

        const completion = await groq.chat.completions.create({
            model: MODEL_FAST,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (error) {
        return null;
    }
}