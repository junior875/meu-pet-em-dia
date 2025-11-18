import type { DespesaFinanceira, CategoriaDespesa } from '../../domain/DespesaFinanceira';

export interface DespesaFinanceiraRepository {
  create(despesa: Omit<DespesaFinanceira, 'id' | 'createdAt'>): DespesaFinanceira;
  findById(id: number): DespesaFinanceira | null;
  findByPetId(petId: number): DespesaFinanceira[];
  findByUserId(userId: number): DespesaFinanceira[];
  findAll(filters?: { petId?: number; categoria?: CategoriaDespesa; dataInicio?: string; dataFim?: string }): DespesaFinanceira[];
  update(id: number, data: Partial<Omit<DespesaFinanceira, 'id' | 'petId' | 'createdAt'>>): DespesaFinanceira;
  delete(id: number): void;
}

