import type { DespesaFinanceiraRepository } from '../../infrastructure/repositories/DespesaFinanceiraRepository';
import type { DespesaFinanceira, CategoriaDespesa } from '../../domain/DespesaFinanceira';

interface ListDespesasInput {
  userId: number;
  filters?: {
    petId?: number;
    categoria?: CategoriaDespesa;
    dataInicio?: string;
    dataFim?: string;
  };
}

interface DespesaSummary {
  total: number;
  porCategoria: Record<CategoriaDespesa, number>;
}

export class ListDespesas {
  constructor(private readonly despesaRepo: DespesaFinanceiraRepository) {}

  execute(input: ListDespesasInput): DespesaFinanceira[] {
    return this.despesaRepo.findByUserId(input.userId);
  }

  executeWithFilters(input: ListDespesasInput): DespesaFinanceira[] {
    // Buscar todas as despesas do usuário
    const todasDespesas = this.despesaRepo.findByUserId(input.userId);

    // Aplicar filtros manualmente
    let filtered = todasDespesas;

    if (input.filters?.petId) {
      filtered = filtered.filter(d => d.petId === input.filters!.petId);
    }

    if (input.filters?.categoria) {
      filtered = filtered.filter(d => d.categoria === input.filters!.categoria);
    }

    if (input.filters?.dataInicio) {
      filtered = filtered.filter(d => d.data >= input.filters!.dataInicio!);
    }

    if (input.filters?.dataFim) {
      filtered = filtered.filter(d => d.data <= input.filters!.dataFim!);
    }

    return filtered;
  }

  getSummary(input: ListDespesasInput): DespesaSummary {
    const despesas = this.executeWithFilters(input);

    const summary: DespesaSummary = {
      total: 0,
      porCategoria: {
        'Alimentação': 0,
        'Saúde': 0,
        'Higiene': 0,
        'Acessórios': 0,
        'Hospedagem': 0,
        'Transporte': 0,
        'Outros': 0,
      },
    };

    for (const despesa of despesas) {
      summary.total += despesa.valor;
      summary.porCategoria[despesa.categoria] += despesa.valor;
    }

    // Arredondar para 2 casas decimais
    summary.total = parseFloat(summary.total.toFixed(2));
    for (const cat in summary.porCategoria) {
      summary.porCategoria[cat as CategoriaDespesa] = parseFloat(summary.porCategoria[cat as CategoriaDespesa].toFixed(2));
    }

    return summary;
  }
}

