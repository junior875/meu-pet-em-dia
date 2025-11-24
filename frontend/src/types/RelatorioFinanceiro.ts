import { DespesaFinanceira } from './DespesaFinanceira';

export interface RelatorioFinanceiro {
  periodo: {
    inicio: string | null;
    fim: string | null;
  };
  despesas: DespesaFinanceira[];
  resumo: {
    totalGeral: number;
    porCategoria: Record<string, number>;
  };
  geradoEm: string;
}