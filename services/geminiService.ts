import { GoogleGenAI, GenerateContentResponse, Type, Part } from "@google/genai";
import { SYSTEM_PROMPT, Message, GlobalState, ProcessConfig, FinancialPlan, Roadmap } from "../types";

// Initialize GenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = 'gemini-3-flash-preview'; 

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  globalState: GlobalState | null,
  attachments: { mimeType: string; data: string }[] = [],
  hiddenSystemTrigger?: string
): Promise<string> => {
  try {
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Inject Active Process into Prompt
    let dynamicSystemPrompt = SYSTEM_PROMPT;
    
    if (globalState && globalState.active_process_id) {
        const activeProcess = globalState.processes.find(p => p.id === globalState.active_process_id);
        if (activeProcess) {
             const processContext = JSON.stringify({
                user: globalState.user_identity.name,
                country: activeProcess.country,
                visa: activeProcess.visa_type,
                profession: activeProcess.profession,
                roadmap: activeProcess.active_roadmap, // Critical for execution
                status: activeProcess.uploaded_documents
             }, null, 2);

             dynamicSystemPrompt = dynamicSystemPrompt
                .replace('{{INJECT_ACTIVE_PROCESS_HERE}}', `\`\`\`json\n${processContext}\n\`\`\``)
                .replace('{{ACTIVE_COUNTRY}}', activeProcess.country)
                .replace('{{ACTIVE_VISA}}', activeProcess.visa_type);
        } else {
             dynamicSystemPrompt = "Erro: Processo ativo não encontrado.";
        }
    } else {
        dynamicSystemPrompt = "Usuário sem contexto definido.";
    }

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: dynamicSystemPrompt,
        temperature: 0.4, // More precise for execution
      },
      history: chatHistory
    });

    const parts: Part[] = [];
    
    // Check if there is a hidden trigger (Cold Start)
    if (hiddenSystemTrigger) {
        // We append the hidden trigger to the prompt as if it came from the system/context wrapper
        // or effectively acting as the user's "intent" to start without them typing
        parts.push({ text: `[SYSTEM TRIGGER: ${hiddenSystemTrigger}]` });
    }

    if (newMessage) {
        parts.push({ text: newMessage });
    }
    
    attachments.forEach(att => {
      const cleanData = att.data.split(',')[1] || att.data;
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: cleanData
        }
      });
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: parts
    });

    return result.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao conectar com o Imigra.AI. Por favor, tente novamente.";
  }
};

export const analyzeDocumentImg = async (base64Data: string, mimeType: string, docType: string): Promise<string> => {
   try {
    const cleanData = base64Data.split(',')[1] || base64Data;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanData
            }
          },
          {
            text: `Analise este documento. O usuário afirma ser um: ${docType}. 
            1. Confirme se o documento corresponde ao tipo declarado.
            2. Extraia datas de validade e nomes.
            3. Verifique se há erros visíveis, cortes ou baixa resolução.
            4. Responda em Português formatado em Markdown.`
          }
        ]
      },
      config: {
        systemInstruction: "Você é um auditor de documentos de imigração experiente."
      }
    });

    return response.text || "Não foi possível analisar o documento.";

   } catch (error) {
     console.error("Document Analysis Error:", error);
     return "Erro ao analisar o documento.";
   }
};

export const generateQuizFromContent = async (content: string, language: string = 'Português'): Promise<any> => {
  try {
    const prompt = `
      Atue como um Professor Sênior de Enfermagem/Medicina/Direito.
      CONTEXTO: O usuário está estudando o texto abaixo extraído de um livro técnico.
      TEXTO: "${content.substring(0, 30000)}..."
      
      TAREFA: Crie um Quiz de 5 questões difíceis (nível NCLEX/USMLE/OAB) baseadas APENAS neste texto.
      
      IDIOMA DE SAÍDA: O Quiz deve ser gerado inteiramente em **${language}**.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    let text = response.text || "";
    // Clean markdown fences if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (!text) throw new Error("No response text");
    return JSON.parse(text);

  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return null;
  }
};

export const generateFinancialPlan = async (
  country: string,
  visa: string,
  familyComposition: string,
  safetyRate: number
): Promise<FinancialPlan | null> => {
  try {
    const prompt = `
# REGRA DE CÁLCULO FINANCEIRO
Você NÃO é um estimador genérico. Você é a ferramenta que SUBSTITUI o advogado.
DADOS:
- Destino: ${country}
- Visto: ${visa}
- Família: ${familyComposition}
- Câmbio Segurança: 1 Moeda Local = R$ ${safetyRate}

1. **Custos de Assessoria/Advogado:** Sempre exiba como $0 (Zero) na coluna "Imigra Cost" e o valor de mercado ($5k-$15k) na coluna "Traditional Cost".
2. **Foco em Taxas Reais:** Liste apenas Government Fees (USCIS/IRCC/Gov), Traduções, Validadores (WES/CGFNS).
3. **Imprevistos:** Adicione 10% sobre as taxas.

# VISUALIZAÇÃO OBRIGATÓRIA (JSON)
Retorne APENAS o JSON válido.
Evite comentários (//) dentro do JSON.
Use ponto (.) para decimais.

Exemplo de estrutura (use números reais):
{
    "summary": { 
        "total_target_currency": 0,
        "total_brl": 0,
        "process_cost_target": 0,
        "proof_of_funds_target": 0
    },
    "comparison": {
        "traditional_cost": 15000,
        "imigra_cost": 3000,
        "savings": 12000
    },
    "timeline": [
        { "phase": "Etapa 1", "cost_target": 500, "desc": "Descrição..." }
    ],
    "currency_symbol": "$"
}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        maxOutputTokens: 2000, // Prevent loops
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                total_target_currency: { type: Type.NUMBER },
                total_brl: { type: Type.NUMBER },
                process_cost_target: { type: Type.NUMBER },
                proof_of_funds_target: { type: Type.NUMBER },
              }
            },
            comparison: {
              type: Type.OBJECT,
              properties: {
                traditional_cost: { type: Type.NUMBER },
                imigra_cost: { type: Type.NUMBER },
                savings: { type: Type.NUMBER },
              }
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  cost_target: { type: Type.NUMBER },
                  desc: { type: Type.STRING }
                }
              }
            },
            currency_symbol: { type: Type.STRING }
          }
        }
      }
    });

    let text = response.text || "";
    // Clean markdown fences if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) throw new Error("No response text");
    return JSON.parse(text) as FinancialPlan;

  } catch (error) {
    console.error("Financial Plan Generation Error:", error);
    return null;
  }
};

interface OnboardingResponse {
    config: ProcessConfig;
    active_roadmap: Roadmap;
}

export const generateOnboardingConfig = async (
  country: string,
  visa: string,
  profession: string
): Promise<OnboardingResponse | null> => {
    try {
        const prompt = `
# TASK
Atue como um Arquiteto de Processos de Imigração.
O usuário acabou de se cadastrar: ${country}, ${visa}, ${profession}.

# OBJECTIVE 1: CONFIG
Gere a lista de documentos e requisitos (JSON config).

# OBJECTIVE 2: EXECUTION ROADMAP
Crie um Roadmap Executável de 3 a 5 passos iniciais críticos.
- O passo 1 deve ser "PENDING" e os outros "LOCKED".
- Dê passos concretos (ex: "Validar Diploma no WES", "Definir Proposed Endeavor", "Coletar Cartas").

# REQUIRED JSON STRUCTURE
Retorne APENAS o JSON válido.
`;

    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    config: {
                        type: Type.OBJECT,
                        properties: {
                            requirements: {
                                type: Type.OBJECT,
                                properties: {
                                    documents_list: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: {type: Type.STRING},
                                                required: {type: Type.BOOLEAN},
                                                category: {type: Type.STRING},
                                                description: {type: Type.STRING}
                                            }
                                        }
                                    },
                                    exams_list: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: {type: Type.STRING},
                                                target_score: {type: Type.STRING},
                                                type: {type: Type.STRING}
                                            }
                                        }
                                    },
                                    medical_requirements: {
                                        type: Type.ARRAY,
                                        items: {type: Type.STRING}
                                    }
                                }
                            },
                            financial_baseline: {
                                type: Type.OBJECT,
                                properties: {
                                    currency: {type: Type.STRING},
                                    estimated_gov_fees: {type: Type.NUMBER},
                                    proof_of_funds_individual: {type: Type.NUMBER}
                                }
                            }
                        }
                    },
                    active_roadmap: {
                        type: Type.OBJECT,
                        properties: {
                            current_phase: { type: Type.INTEGER },
                            next_action_id: { type: Type.STRING },
                            steps: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        status: { type: Type.STRING },
                                        action_type: { type: Type.STRING },
                                        external_link: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
             }
        }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) throw new Error("No response text");
    return JSON.parse(text) as OnboardingResponse;

    } catch (error) {
        console.error("Onboarding Config Error", error);
        return null;
    }
}