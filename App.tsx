import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Dashboard from './pages/Dashboard';
import ChatInterface from './pages/ChatInterface';
import DocReview from './pages/DocReview';
import TestPrep from './pages/TestPrep';
import Calculator from './pages/Calculator';
import Onboarding from './pages/Onboarding';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const hasState = localStorage.getItem('imigra_global_state');
        if (!hasState) {
            navigate('/onboarding');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#F7F7F7] flex flex-col md:flex-row font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
                <MobileHeader />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/chat" element={<ProtectedLayout><ChatInterface /></ProtectedLayout>} />
        <Route path="/documents" element={<ProtectedLayout><DocReview /></ProtectedLayout>} />
        <Route path="/tests" element={<ProtectedLayout><TestPrep /></ProtectedLayout>} />
        <Route path="/calculator" element={<ProtectedLayout><Calculator /></ProtectedLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;