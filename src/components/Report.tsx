import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, RotateCcw, Clock, FileText, Calendar, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Lancamento, ItemSaida } from '../types';
import { cn } from '../lib/utils';

export function Report() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [itens, setItens] = useState<Record<number, ItemSaida[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'Faturado' | 'Devolvido';
    item: ItemSaida | null;
  }>({ isOpen: false, type: 'Faturado', item: null });
  
  const [nfNumero, setNfNumero] = useState('');
  const [dataStatus, setDataStatus] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: lancData, error: lancError } = await supabase
        .from('lancamentos')
        .select('*')
        .order('id', { ascending: false });

      if (lancError) throw lancError;
      setLancamentos(lancData || []);

      const { data: itensData, error: itensError } = await supabase
        .from('itens_saida')
        .select('*');

      if (itensError) throw itensError;

      // Group items by lancamento_id
      const groupedItens: Record<number, ItemSaida[]> = {};
      (itensData || []).forEach(item => {
        if (!groupedItens[item.lancamento_id]) {
          groupedItens[item.lancamento_id] = [];
        }
        groupedItens[item.lancamento_id].push(item);
      });
      setItens(groupedItens);

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os relatórios. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openActionModal = (item: ItemSaida, type: 'Faturado' | 'Devolvido') => {
    setActionModal({ isOpen: true, type, item });
    setNfNumero('');
    setDataStatus(new Date().toISOString().split('T')[0]);
  };

  const closeActionModal = () => {
    setActionModal({ isOpen: false, type: 'Faturado', item: null });
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.item) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<ItemSaida> = {
        status: actionModal.type,
        data_status: dataStatus,
      };

      if (actionModal.type === 'Faturado') {
        updates.nf_numero = nfNumero;
      }

      const { error } = await supabase
        .from('itens_saida')
        .update(updates)
        .eq('id', actionModal.item.id);

      if (error) throw error;

      // Update local state
      setItens(prev => {
        const newItens = { ...prev };
        const lancItens = newItens[actionModal.item!.lancamento_id];
        const index = lancItens.findIndex(i => i.id === actionModal.item!.id);
        if (index !== -1) {
          lancItens[index] = { ...lancItens[index], ...updates };
        }
        return newItens;
      });

      closeActionModal();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between px-2">
        <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Relatório de Saídas</h2>
        <span className="bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1 rounded-full">
          {lancamentos.length} registros
        </span>
      </div>

      <div className="space-y-4">
        {lancamentos.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          lancamentos.map((lancamento) => {
            const isExpanded = expandedId === lancamento.id;
            const lancItens = itens[lancamento.id] || [];
            const dataFormatada = new Date(lancamento.data || new Date()).toLocaleDateString('pt-BR');

            return (
              <div key={lancamento.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                {/* Header / Clickable Area */}
                <div 
                  onClick={() => toggleExpand(lancamento.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        ID: {lancamento.id}
                      </span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {dataFormatada}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800">{lancamento.cliente}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Resp: {lancamento.responsaveis}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                      <Package className="w-4 h-4" />
                      {lancItens.length} itens
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Itens do Lançamento</h4>
                    <div className="space-y-3">
                      {lancItens.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            
                            {/* Item Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-slate-800">{item.produto}</h5>
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                                  item.status === 'Pendente' && "bg-amber-100 text-amber-700",
                                  item.status === 'Faturado' && "bg-emerald-100 text-emerald-700",
                                  item.status === 'Devolvido' && "bg-blue-100 text-blue-700"
                                )}>
                                  {item.status === 'Pendente' && <Clock className="w-3 h-3" />}
                                  {item.status === 'Faturado' && <CheckCircle2 className="w-3 h-3" />}
                                  {item.status === 'Devolvido' && <RotateCcw className="w-3 h-3" />}
                                  {item.status}
                                </span>
                              </div>
                              <div className="text-sm text-slate-600 flex items-center gap-3">
                                <span>{item.quantidade}x {item.sku}</span>
                                {item.nf_numero && (
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <FileText className="w-3.5 h-3.5" /> NF: {item.nf_numero}
                                  </span>
                                )}
                              </div>
                              {item.data_status && item.status !== 'Pendente' && (
                                <div className="text-xs text-slate-400 mt-1">
                                  {item.status === 'Faturado' ? 'Faturado em: ' : 'Devolvido em: '}
                                  {new Date(item.data_status).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {item.foto_url && (
                                <a 
                                  href={item.foto_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-block mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                                >
                                  Ver Foto Anexada
                                </a>
                              )}
                            </div>

                            {/* Actions */}
                            {item.status === 'Pendente' && (
                              <div className="flex items-center gap-2 sm:flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
                                <button
                                  onClick={() => openActionModal(item, 'Faturado')}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Faturar
                                </button>
                                <button
                                  onClick={() => openActionModal(item, 'Devolvido')}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Devolver
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Marcar como {actionModal.type}
              </h3>
              <button onClick={closeActionModal} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleActionSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <p className="text-sm font-medium text-slate-700">{actionModal.item?.produto}</p>
                <p className="text-xs text-slate-500">{actionModal.item?.quantidade}x {actionModal.item?.sku}</p>
              </div>

              {actionModal.type === 'Faturado' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número da NF *</label>
                  <input
                    type="text"
                    value={nfNumero}
                    onChange={(e) => setNfNumero(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data {actionModal.type === 'Faturado' ? 'do Faturamento' : 'da Devolução'} *
                </label>
                <input
                  type="date"
                  value={dataStatus}
                  onChange={(e) => setDataStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-70",
                    actionModal.type === 'Faturado' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
