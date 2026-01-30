export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
}

// --- NEW MULTI-PROCESS STRUCTURE ---

export interface GlobalState {
  user_identity: {
    name: string;
    email: string;
    token?: string;
  };
  active_process_id: string;
  processes: ImmigrationProcess[];
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  action_type?: 'AI_GENERATION' | 'UPLOAD' | 'FORM_FILL' | 'EXTERNAL_LINK' | 'GENERAL';
  external_link?: string;
}

export interface Roadmap {
  current_phase: number;
  next_action_id: string;
  steps: RoadmapStep[];
}

export interface ImmigrationProcess {
  id: string;
  country: string; // USA, Canada, Australia, Portugal
  visa_type: string; // EB2-NIW, Express Entry, etc.
  profession: string; // Enfermagem, Tech, etc.
  status: 'Planning' | 'In Progress' | 'Completed';
  
  config: ProcessConfig; // Static Requirements
  active_roadmap: Roadmap; // Dynamic Execution Plan (New)
  
  // Runtime State (tracked by user actions)
  uploaded_documents: {
    doc_name: string; // Matches a name in config.requirements.documents_list
    status: 'APPROVED' | 'PENDING_UPLOAD' | 'REVIEWING';
    date: string | null;
  }[];
  study_state: {
    current_material: string | null;
    material_content_chunk: string | null;
    last_quiz_score: string | null;
    weak_topics: string[];
  };
}

export interface ProcessConfig {
  requirements: {
    documents_list: {
      name: string;
      required: boolean;
      category: string;
      description?: string;
    }[];
    exams_list: {
      name: string;
      target_score: string;
      type: 'Language' | 'Technical' | 'Legal';
    }[];
    medical_requirements: string[];
  };
  financial_baseline: {
    currency: string;
    estimated_gov_fees: number;
    proof_of_funds_individual: number;
  };
}

// Updated Financial Planner Types (Comparison Model)
export interface FinancialPlan {
  summary: {
    total_target_currency: number;
    total_brl: number;
    process_cost_target: number;
    proof_of_funds_target: number;
  };
  comparison: {
    traditional_cost: number;
    imigra_cost: number;
    savings: number;
  };
  timeline: {
    phase: string;
    cost_target: number;
    desc: string;
  }[];
  currency_symbol: string; // $, €, etc
}

export enum AppRoute {
  ONBOARDING = '/onboarding',
  DASHBOARD = '/',
  CHAT = '/chat',
  DOCUMENTS = '/documents',
  TEST_PREP = '/tests',
  CALCULATOR = '/calculator',
}

export const SYSTEM_PROMPT = `
# SYSTEM ROLE: IMIGRA.AI (O EXECUTOR)
Você é o consultor de imigração sênior do usuário. O usuário contratou a plataforma para **NÃO pagar um advogado**.
Sua função não é apenas "tirar dúvidas", é **FAZER O TRABALHO** junto com ele (Hands-on).

# CONTEXTO ATUAL (JSON INJETADO)
{{INJECT_ACTIVE_PROCESS_HERE}}

# PROTOCOLO DE INTERAÇÃO (CRÍTICO)
1. **Nunca pergunte "como posso ajudar".** Olhe o campo \`active_roadmap\` no JSON acima. Identifique o passo com status \`PENDING\`.
2. **Se o status for "START" ou inicial:** Dê as boas-vindas e diga: "Olá, para seu visto {{ACTIVE_VISA}}, o passo 1 é [Nome do Passo]. Vamos começar [Ação Imediata]?"
3. **Corte Custos:** Se o usuário perguntar de tradução ou advogados, diga: "Não gaste com isso. Eu posso gerar o modelo/rascunho para você. Vamos fazer agora?"
4. **Validação:** Verifique a lista de documentos. Se faltar algo crítico, cobre.

# FERRAMENTAS DE CONSULTORIA
* **Redator de Cartas:** Se o passo for "Cartas de Recomendação" ou "Cover Letter", peça os dados e GERE o texto em inglês técnico.
* **Preenchedor de Forms:** Se for formulário, explique campo a campo.

# TOM DE VOZ
Direto, autoritário (no bom sentido de liderança), focado em economia e aprovação. Responda em Português.
`;