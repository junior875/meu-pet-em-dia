import type { DespesaFinanceiraRepository } from '../../infrastructure/repositories/DespesaFinanceiraRepository';
import type { PetRepository } from '../../infrastructure/repositories/PetRepository';
import type { DespesaFinanceira, CategoriaDespesa } from '../../domain/DespesaFinanceira';

interface UpdateDespesaInput {
  despesaId: number;
  userId: number;
  data: {
    categoria?: CategoriaDespesa;
    descricao?: string;
    valor?: number;
    data?: string;
    observacoes?: string | null;
  };
}

export class UpdateDespesa {
  constructor(
    private readonly despesaRepo: DespesaFinanceiraRepository,
    private readonly petRepo: PetRepository
  ) {}

  execute(input: UpdateDespesaInput): DespesaFinanceira {
    const despesa = this.despesaRepo.findById(input.despesaId);
    if (!despesa) {
      throw new Error('Despesa não encontrada');
    }

    // Verificar se o pet pertence ao usuário
    const pet = this.petRepo.findById(despesa.petId);
    if (!pet || pet.ownerId !== input.userId) {
      throw new Error('Você não tem permissão para editar esta despesa');
    }

    const errors: Record<string, string> = {};

    // Validar categoria se fornecida
    if (input.data.categoria) {
      const categoriasValidas: CategoriaDespesa[] = [
        'Alimentação',
        'Saúde',
        'Higiene',
        'Acessórios',
        'Hospedagem',
        'Transporte',
        'Outros'
      ];
      if (!categoriasValidas.includes(input.data.categoria)) {
        errors.categoria = 'Categoria inválida';
      }
    }

    // Validar descrição se fornecida
    if (input.data.descricao !== undefined) {
      if (!input.data.descricao || input.data.descricao.trim().length < 3) {
        errors.descricao = 'Descrição deve ter pelo menos 3 caracteres';
      }
      if (input.data.descricao && input.data.descricao.length > 200) {
        errors.descricao = 'Descrição deve ter no máximo 200 caracteres';
      }
    }

    // Validar valor se fornecido
    if (input.data.valor !== undefined) {
      if (input.data.valor <= 0) {
        errors.valor = 'Valor deve ser maior que zero';
      }
      if (input.data.valor > 999999.99) {
        errors.valor = 'Valor muito alto';
      }
    }

    // Validar data se fornecida
    if (input.data.data !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data.data)) {
        errors.data = 'Data inválida (use YYYY-MM-DD)';
      }
    }

    if (Object.keys(errors).length > 0) {
      const err: any = new Error('ValidationError');
      err.errors = errors;
      throw err;
    }

    const updateData: any = {};
    if (input.data.categoria !== undefined) updateData.categoria = input.data.categoria;
    if (input.data.descricao !== undefined) updateData.descricao = input.data.descricao.trim();
    if (input.data.valor !== undefined) updateData.valor = parseFloat(input.data.valor.toFixed(2));
    if (input.data.data !== undefined) updateData.data = input.data.data;
    if (input.data.observacoes !== undefined) updateData.observacoes = input.data.observacoes?.trim() || null;

    return this.despesaRepo.update(input.despesaId, updateData);
  }
}

