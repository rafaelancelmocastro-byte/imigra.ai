import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeDocumentImg } from '../services/geminiService';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  analysis?: string;
}

const DocReview = () => {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [docType, setDocType] = useState('Outro');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending' as const
      }));
      setUploads(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const handleAnalyzeAll = async () => {
    const pending = uploads.filter(u => u.status === 'pending');
    if (pending.length === 0) return;

    setUploads(prev => prev.map(u => u.status === 'pending' ? { ...u, status: 'analyzing' } : u));

    for (const upload of pending) {
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(upload.file);
            await new Promise<void>((resolve) => {
                reader.onloadend = async () => {
                   const base64 = reader.result as string;
                   const result = await analyzeDocumentImg(base64, upload.file.type, docType);
                   setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'done', analysis: result } : u));
                   resolve();
                };
            });
        } catch (e) {
            setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u));
        }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Auditor Documental IA</h1>
        <p className="text-gray-600 mb-6">
          Selecione o tipo de documento e envie os arquivos. A IA analisará consistência e dados.
        </p>

        <div className="flex gap-4 mb-6">
            <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white"
            >
                <option value="Passaporte">Passaporte</option>
                <option value="Diploma">Diploma Universitário</option>
                <option value="Certificado IELTS/TOEFL">Certificado de Inglês</option>
                <option value="Carta de Oferta">Carta de Oferta de Emprego</option>
                <option value="Extrato Bancário">Extrato Bancário</option>
                <option value="Outro">Outro Documento</option>
            </select>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors mb-6">
            <div className="flex flex-col items-center justify-center pt-2">
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500"><span className="font-semibold">Clique para enviar múltiplos arquivos</span></p>
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
        </label>

        {uploads.length > 0 && (
            <div className="space-y-4">
                {uploads.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={item.preview} alt="preview" className="w-16 h-16 object-cover rounded bg-gray-100" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-medium truncate">{item.file.name}</p>
                                <p className="text-xs text-gray-500 uppercase">{item.status}</p>
                            </div>
                            {item.status === 'analyzing' && <Loader2 className="animate-spin text-primary" />}
                            {item.status === 'done' && <CheckCircle className="text-green-500" />}
                            <button onClick={() => removeFile(item.id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        
                        {item.analysis && (
                            <div className="bg-gray-50 p-4 rounded text-sm prose prose-sm max-w-none">
                                <ReactMarkdown>{item.analysis}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                ))}

                <button 
                  onClick={handleAnalyzeAll}
                  disabled={uploads.some(u => u.status === 'analyzing') || !uploads.some(u => u.status === 'pending')}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploads.some(u => u.status === 'analyzing') ? 'Processando...' : 'Iniciar Análise'}
                </button>
            </div>
        )}
      </div>
      
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3">
        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-orange-700">
            Isenção de responsabilidade: Esta análise é gerada por IA e não substitui a validação oficial.
        </p>
      </div>
    </div>
  );
};

export default DocReview;