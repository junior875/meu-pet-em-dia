import type { DespesaFinanceiraRepository } from '../../infrastructure/repositories/DespesaFinanceiraRepository';
import type { PetRepository } from '../../infrastructure/repositories/PetRepository';

interface DeleteDespesaInput {
  despesaId: number;
  userId: number;
}

export class DeleteDespesa {
  constructor(
    private readonly despesaRepo: DespesaFinanceiraRepository,
    private readonly petRepo: PetRepository
  ) {}

  execute(input: DeleteDespesaInput): void {
    const despesa = this.despesaRepo.findById(input.despesaId);
    if (!despesa) {
      throw new Error('Despesa não encontrada');
    }

    // Verificar se o pet pertence ao usuário
    const pet = this.petRepo.findById(despesa.petId);
    if (!pet || pet.ownerId !== input.userId) {
      throw new Error('Você não tem permissão para deletar esta despesa');
    }

    this.despesaRepo.delete(input.despesaId);
  }
}

