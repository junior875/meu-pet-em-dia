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
    if (!pet || pet.ownerId !== userId) throw new Error('RegistroAccessDenied');
        
    const isOwner = pet.ownerId === userId;
    const isObservacao = registro.tipoRegistro === 'Observação';
    const isCreator = registro.userId === userId; 

    if (userType !== 'Tutor' || !isObservacao || !isCreator) {
        throw new Error('DeletionNotAllowed: Somente o tutor pode remover registros de Observação que ele próprio criou.');
    }

    this.registroRepo.delete(registroId);
  }
}