export interface Lancamento {
  id: number;
  data: string;
  cliente: string;
  responsaveis: string;
}

export interface ItemSaida {
  id: number;
  lancamento_id: number;
  produto: string;
  sku: 'Galão' | 'Balde' | 'Litro' | '';
  quantidade: number;
  status: 'Pendente' | 'Faturado' | 'Devolvido';
  nf_numero?: string | null;
  data_status?: string | null;
  foto_url?: string | null;
}
