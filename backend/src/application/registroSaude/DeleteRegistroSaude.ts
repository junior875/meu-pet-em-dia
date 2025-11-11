import { RegistroSaudeRepository } from '../../infrastructure/repositories/RegistroSaudeRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type DeleteRegistroSaudeInput = {
  registroId: number;
  userId: number;
  userType: 'Tutor' | 'Veterinário';
};

export class DeleteRegistroSaude {
  constructor(
    private readonly registroRepo: RegistroSaudeRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: DeleteRegistroSaudeInput): void {
    const { registroId, userId, userType } = input;

    const registro = this.registroRepo.findById(registroId);
    if (!registro) throw new Error('RegistroNotFound');

    const pet = this.petRepo.findById(registro.petId);
    if (!pet) throw new Error('PetNotFound');

    if (userType === 'Tutor') {
      if (pet.ownerId !== userId) {
        throw new Error('RegistroAccessDenied: Tutor só pode remover registros de seus próprios pets.');
      }
      this.registroRepo.delete(registroId);
      return;
    }

    if (userType === 'Veterinário') {
      this.registroRepo.delete(registroId);
      return;
    }

    throw new Error('DeletionNotAllowed: Tipo de usuário inválido.');
  }
}
