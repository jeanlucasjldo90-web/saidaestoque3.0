import React, { useState } from 'react';
import { Plus, Trash2, Upload, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ItemForm {
  id: string;
  produto: string;
  sku: 'Galão' | 'Balde' | 'Litro' | '';
  quantidade: number;
  foto: File | null;
}

export function Form() {
  const [cliente, setCliente] = useState('');
  const [responsaveis, setResponsaveis] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([
    { id: crypto.randomUUID(), produto: '', sku: '', quantidade: 1, foto: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddItem = () => {
    setItens([...itens, { id: crypto.randomUUID(), produto: '', sku: '', quantidade: 1, foto: null }]);
  };

  const handleRemoveItem = (id: string) => {
    if (itens.length > 1) {
      setItens(itens.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof ItemForm, value: any) => {
    setItens(itens.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleItemChange(id, 'foto', e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente || !responsaveis || itens.some(i => !i.produto || !i.sku || i.quantidade <= 0)) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // 1. Insert Lancamento
      const { data: lancamento, error: lancamentoError } = await supabase
        .from('lancamentos')
        .insert([{ cliente, responsaveis }])
        .select()
        .single();

      if (lancamentoError) throw lancamentoError;

      // 2. Process Items
      for (const item of itens) {
        let foto_url = null;

        // Upload photo if exists
        if (item.foto) {
          const fileExt = item.foto.name.split('.').pop();
          const fileName = `${lancamento.id}-${item.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('fotos-estoque')
            .upload(filePath, item.foto);

          if (uploadError) {
            console.error('Erro no upload da foto:', uploadError);
            // Continue even if photo fails, or throw? Let's continue but log.
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('fotos-estoque')
              .getPublicUrl(filePath);
            foto_url = publicUrlData.publicUrl;
          }
        }

        // Insert Item
        const { error: itemError } = await supabase
          .from('itens_saida')
          .insert([{
            lancamento_id: lancamento.id,
            produto: item.produto,
            sku: item.sku,
            quantidade: item.quantidade,
            status: 'Pendente',
            foto_url
          }]);

        if (itemError) throw itemError;
      }

      // Reset form
      setCliente('');
      setResponsaveis('');
      setItens([{ id: crypto.randomUUID(), produto: '', sku: '', quantidade: 1, foto: null }]);
      setMessage({ type: 'success', text: 'Saída registrada com sucesso!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: `Erro ao salvar: ${error.message || 'Erro desconhecido'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">Nova Saída de Estoque</h2>
          <p className="text-sm text-slate-500 mt-1">Registre os produtos que estão saindo para o campo.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={cn(
              "p-4 rounded-xl text-sm font-medium",
              message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
            )}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente / Fazenda *</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Ex: Fazenda Boa Esperança"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsáveis *</label>
              <input
                type="text"
                value={responsaveis}
                onChange={(e) => setResponsaveis(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Ex: João e Maria"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-800">Produtos</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Produto {index + 1} *</label>
                      <input
                        type="text"
                        value={item.produto}
                        onChange={(e) => handleItemChange(item.id, 'produto', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Nome do produto"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">SKU *</label>
                      <select
                        value={item.sku}
                        onChange={(e) => handleItemChange(item.id, 'sku', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="Galão">Galão</option>
                        <option value="Balde">Balde</option>
                        <option value="Litro">Litro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Quantidade *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(item.id, 'quantidade', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Foto (Opcional)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-dashed border-slate-300 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors group">
                          <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 mr-2" />
                          <span className="text-sm text-slate-600 group-hover:text-slate-800">
                            {item.foto ? item.foto.name : 'Escolher foto'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(item.id, e)}
                            className="hidden"
                          />
                        </label>
                        {item.foto && (
                          <button
                            type="button"
                            onClick={() => handleItemChange(item.id, 'foto', null)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Registrar Saída
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
