import React, { useState } from 'react';
import { Form } from './components/Form';
import { Report } from './components/Report';
import { ClipboardList, PlusCircle, Sprout, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'nova' | 'relatorio'>('nova');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Configuração Necessária</h1>
          <p className="text-slate-600 mb-6">
            Para usar o AgroEstoque, você precisa configurar as variáveis de ambiente do Supabase.
          </p>
          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-2">
            <p>Adicione as seguintes variáveis no painel de configurações (Settings &gt; Secrets):</p>
            <ul className="list-disc list-inside font-mono text-xs text-slate-500 mt-2 space-y-1">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-emerald-700 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Sprout className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">AgroEstoque</h1>
            <p className="text-xs text-emerald-200 font-medium">Precisão Agrícola</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-4 pt-6">
        {activeTab === 'nova' ? <Form /> : <Report />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-20">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => setActiveTab('nova')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === 'nova' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle className={`w-6 h-6 ${activeTab === 'nova' ? 'fill-emerald-50' : ''}`} />
            <span className="text-xs font-medium">Nova Saída</span>
          </button>
          <button
            onClick={() => setActiveTab('relatorio')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === 'relatorio' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className={`w-6 h-6 ${activeTab === 'relatorio' ? 'fill-emerald-50' : ''}`} />
            <span className="text-xs font-medium">Relatório</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
