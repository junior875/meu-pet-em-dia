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
  data: string; // YYYY-MM-DD
  observacoes: string | null;
  createdAt: string;
}

