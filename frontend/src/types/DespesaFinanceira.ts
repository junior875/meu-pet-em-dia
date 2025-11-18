export type CategoriaDespesa =
  | 'Alimentação'
  | 'Saúde'
  | 'Higiene'
  | 'Acessórios'
  | 'Hospedagem'
  | 'Transporte'
  | 'Outros';

export interface DespesaFinanceira {
  id: number;
  petId: number;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
  observacoes: string | null;
  createdAt: string;
}

export interface DespesaSummary {
  total: number;
  porCategoria: Record<CategoriaDespesa, number>;
}

