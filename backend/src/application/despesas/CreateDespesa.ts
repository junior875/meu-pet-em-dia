import type { DespesaFinanceiraRepository } from '../../infrastructure/repositories/DespesaFinanceiraRepository';
import type { PetRepository } from '../../infrastructure/repositories/PetRepository';
import type { DespesaFinanceira, CategoriaDespesa } from '../../domain/DespesaFinanceira';

interface CreateDespesaInput {
  userId: number;
  data: {
    petId: number;
    categoria: CategoriaDespesa;
    descricao: string;
    valor: number;
    data: string;
    observacoes?: string | null;
  };
}

export class CreateDespesa {
  constructor(
    private readonly despesaRepo: DespesaFinanceiraRepository,
    private readonly petRepo: PetRepository
  ) {}

  execute(input: CreateDespesaInput): DespesaFinanceira {
    const errors: Record<string, string> = {};

    // Validar pet
    const pet = this.petRepo.findById(input.data.petId);
    if (!pet) {
      errors.petId = 'Pet não encontrado';
    } else if (pet.ownerId !== input.userId) {
      errors.petId = 'Você não tem permissão para cadastrar despesas para este pet';
    }

    // Validar categoria
    const categoriasValidas: CategoriaDespesa[] = [
      'Alimentação',
      'Saúde',
      'Higiene',
      'Acessórios',
      'Hospedagem',
      'Transporte',
      'Outros'
    ];
    if (!input.data.categoria || !categoriasValidas.includes(input.data.categoria)) {
      errors.categoria = 'Categoria inválida';
    }

    // Validar descrição
    if (!input.data.descricao || input.data.descricao.trim().length < 3) {
      errors.descricao = 'Descrição deve ter pelo menos 3 caracteres';
    }
    if (input.data.descricao && input.data.descricao.length > 200) {
      errors.descricao = 'Descrição deve ter no máximo 200 caracteres';
    }

    // Validar valor
    if (!input.data.valor || input.data.valor <= 0) {
      errors.valor = 'Valor deve ser maior que zero';
    }
    if (input.data.valor && input.data.valor > 999999.99) {
      errors.valor = 'Valor muito alto';
    }

    // Validar data
    if (!input.data.data || !/^\d{4}-\d{2}-\d{2}$/.test(input.data.data)) {
      errors.data = 'Data inválida (use YYYY-MM-DD)';
    }

    if (Object.keys(errors).length > 0) {
      const err: any = new Error('ValidationError');
      err.errors = errors;
      throw err;
    }

    return this.despesaRepo.create({
      petId: input.data.petId,
      categoria: input.data.categoria,
      descricao: input.data.descricao.trim(),
      valor: parseFloat(input.data.valor.toFixed(2)),
      data: input.data.data,
      observacoes: input.data.observacoes?.trim() || null,
    });
  }
}

