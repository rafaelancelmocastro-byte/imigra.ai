import React, { useState, useEffect } from 'react';
import { generateQuizFromContent } from '../services/geminiService';
import { CheckCircle, XCircle, BrainCircuit, Loader2, FileText, Upload, ChevronRight, BookOpen } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalState } from '../types';

// Fix for pdfjs-dist import in ESM environments:
// The default export often contains the library in browser ESM builds.
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Set the worker source to CDNJS which serves a reliable classic script for workers
// This fixes the "Failed to execute 'importScripts'" error often seen with esm.sh workers
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

const TestPrep = () => {
  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  // Quiz State
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  
  // New State for Language
  const [quizLanguage, setQuizLanguage] = useState('Português');

  // Update global user state when text is extracted
  const updateUserStateWithMaterial = (text: string, fileName: string) => {
    const savedState = localStorage.getItem('imigra_global_state');
    if (savedState) {
        const state: GlobalState = JSON.parse(savedState);
        const activeProcess = state.processes.find(p => p.id === state.active_process_id);
        
        if (activeProcess) {
            activeProcess.study_state.current_material = fileName;
            activeProcess.study_state.material_content_chunk = text;
            localStorage.setItem('imigra_global_state', JSON.stringify(state));
        }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor, envie apenas arquivos PDF.');
        return;
      }
      setPdfFile(file);
      setExtractedText('');
      setQuiz(null);
      
      try {
        // Load PDF to get page count
        const arrayBuffer = await file.arrayBuffer();
        // Use the normalized pdfjs object
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);
        setEndPage(Math.min(5, pdf.numPages));
      } catch (error) {
        console.error("Error loading PDF metadata:", error);
        alert("Erro ao carregar metadados do PDF.");
        setPdfFile(null);
      }
    }
  };

  const extractTextFromRange = async () => {
    if (!pdfFile) return;
    setIsProcessingPdf(true);
    setExtractedText('');

    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        // Use the normalized pdfjs object
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        const start = Math.max(1, startPage);
        const end = Math.min(pdf.numPages, endPage);

        for (let i = start; i <= end; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `\n--- Página ${i} ---\n${pageText}`;
        }

        setExtractedText(fullText);
        updateUserStateWithMaterial(fullText, pdfFile.name);
    } catch (error) {
        console.error("PDF Error:", error);
        alert("Erro ao ler o PDF. Tente um arquivo diferente.");
    } finally {
        setIsProcessingPdf(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!extractedText.trim()) return;
    setIsGenerating(true);
    setQuiz(null);
    setShowResults(false);
    setUserAnswers({});

    // Pass the selected language to the service
    const result = await generateQuizFromContent(extractedText, quizLanguage);
    if (result && result.questions) {
        setQuiz(result.questions);
    } else {
        alert("Erro ao gerar quiz. Tente novamente.");
    }
    setIsGenerating(false);
  };

  const handleSelectOption = (qId: number, optIdx: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tutor de Estudos Inteligente</h1>
        <p className="text-gray-600">Carregue seus livros técnicos (PDF) e gere quizzes personalizados baseados no capítulo que você está estudando hoje.</p>
      </header>

      {/* PDF Upload & Chunking Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-primary">
            <BookOpen />
            <h3 className="font-bold text-lg">Material de Estudo</h3>
        </div>

        {!pdfFile ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 font-semibold">Clique para carregar seu PDF (NCLEX, OAB, Livros)</p>
                    <p className="text-xs text-gray-400">Processamento 100% local no navegador</p>
                </div>
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
            </label>
        ) : (
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                        <FileText className="text-primary" />
                        <div>
                            <p className="font-bold text-gray-800 text-sm">{pdfFile.name}</p>
                            <p className="text-xs text-gray-500">{totalPages} páginas encontradas</p>
                        </div>
                    </div>
                    <button onClick={() => { setPdfFile(null); setExtractedText(''); }} className="text-xs text-red-500 hover:underline">
                        Remover
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Estudar intervalo de páginas</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" min="1" max={totalPages}
                                value={startPage} onChange={(e) => setStartPage(Number(e.target.value))}
                                className="w-20 p-2 border rounded text-center"
                            />
                            <span className="text-gray-400">até</span>
                            <input 
                                type="number" min={startPage} max={totalPages}
                                value={endPage} onChange={(e) => setEndPage(Number(e.target.value))}
                                className="w-20 p-2 border rounded text-center"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={extractTextFromRange}
                        disabled={isProcessingPdf}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessingPdf ? <Loader2 className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                        Processar Conteúdo
                    </button>
                </div>
            </div>
        )}
      </div>
      
      {/* Extracted Content Preview & Quiz Action */}
      {extractedText && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={20} />
                    <h3 className="font-bold text-lg">Conteúdo Extraído com Sucesso</h3>
                </div>
                
                {/* Language Selector */}
                <select 
                    value={quizLanguage}
                    onChange={(e) => setQuizLanguage(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-medium text-gray-700 focus:ring-primary focus:border-primary"
                >
                    <option value="Português">Responder em Português</option>
                    <option value="English">Responder em Inglês (Modo Treino)</option>
                    <option value="Spanish">Responder em Espanhol</option>
                </select>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg italic border-l-4 border-gray-300 max-h-32 overflow-hidden text-ellipsis whitespace-nowrap">
                "{extractedText.substring(0, 150)}..."
            </p>
            
            <div className="flex justify-end">
                <button 
                    onClick={handleGenerateQuiz}
                    disabled={isGenerating}
                    className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                    {isGenerating ? `Gerando Quiz em ${quizLanguage}...` : `Gerar Quiz (${quizLanguage})`}
                </button>
            </div>
          </div>
      )}

      {/* Quiz Display */}
      {quiz && (
        <div className="space-y-6 animate-fade-in pb-12">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Quiz Gerado ({quizLanguage})</h2>
            {quiz.map((q, index) => (
                <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 text-lg">{index + 1}. {q.question}</h4>
                    <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                            const isSelected = userAnswers[q.id] === idx;
                            const isCorrect = q.correctAnswerIndex === idx;
                            
                            let bgClass = "bg-gray-50 hover:bg-gray-100 border-gray-200";
                            if (showResults) {
                                if (isCorrect) bgClass = "bg-green-100 border-green-300 text-green-800";
                                else if (isSelected && !isCorrect) bgClass = "bg-red-100 border-red-300 text-red-800";
                            } else if (isSelected) {
                                bgClass = "bg-primary/10 border-primary text-primary font-medium";
                            }

                            return (
                                <div 
                                    key={idx}
                                    onClick={() => handleSelectOption(q.id, idx)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${bgClass}`}
                                >
                                    <span>{opt}</span>
                                    {showResults && isCorrect && <CheckCircle size={18} className="text-green-600"/>}
                                    {showResults && isSelected && !isCorrect && <XCircle size={18} className="text-red-600"/>}
                                </div>
                            );
                        })}
                    </div>
                    {showResults && (
                        <div className="mt-4 p-4 bg-blue-50 text-blue-900 text-sm rounded-lg border border-blue-100">
                            <strong>Explicação Técnica:</strong> {q.explanation}
                        </div>
                    )}
                </div>
            ))}
            
            {!showResults && (
                <button 
                    onClick={() => setShowResults(true)}
                    className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 shadow-md transition-transform transform hover:scale-[1.01]"
                >
                    Verificar Respostas
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default TestPrep;