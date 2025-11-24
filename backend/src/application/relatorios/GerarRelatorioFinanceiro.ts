import { DespesaFinanceiraRepository } from '../../infrastructure/repositories/DespesaFinanceiraRepository';
import { DespesaFinanceira } from '../../domain/DespesaFinanceira';

interface RelatorioFinanceiroInput {
  userId: number;
  dataInicio?: string;
  dataFim?: string;
}

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

export class GerarRelatorioFinanceiro {
  constructor(private readonly despesaRepo: DespesaFinanceiraRepository) {}

  execute(input: RelatorioFinanceiroInput): RelatorioFinanceiro {
    let despesas = this.despesaRepo.findByUserId(input.userId);

    if (input.dataInicio) {
      despesas = despesas.filter(d => d.data >= input.dataInicio!);
    }
    if (input.dataFim) {
      despesas = despesas.filter(d => d.data <= input.dataFim!);
    }

    despesas.sort((a, b) => b.data.localeCompare(a.data));

    const resumoPorCategoria: Record<string, number> = {};
    let totalGeral = 0;

    for (const d of despesas) {
      totalGeral += d.valor;
      resumoPorCategoria[d.categoria] = (resumoPorCategoria[d.categoria] || 0) + d.valor;
    }

    return {
      periodo: {
        inicio: input.dataInicio || null,
        fim: input.dataFim || null,
      },
      despesas,
      resumo: {
        totalGeral,
        porCategoria: resumoPorCategoria,
      },
      geradoEm: new Date().toISOString(),
    };
  }
}