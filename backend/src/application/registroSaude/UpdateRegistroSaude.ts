import { RegistroSaude, RegistroSaudeInputDTO, TipoRegistro } from '../../domain/RegistroSaude';
import { RegistroSaudeRepository } from '../../infrastructure/repositories/RegistroSaudeRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type UpdateRegistroSaudeInput = {
  registroId: number;
  userId: number;
  data: Partial<Omit<RegistroSaudeInputDTO, 'petId' | 'tipoRegistro' | 'data' | 'horario'>>; 
};

export class UpdateRegistroSaude {
  constructor(
    private readonly registroRepo: RegistroSaudeRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: UpdateRegistroSaudeInput): RegistroSaude {
    const { registroId, userId, data } = input;
    const errors: Record<string, string> = {};

    const registro = this.registroRepo.findById(registroId);
    if (!registro) throw new Error('RegistroNotFound');

    const pet = this.petRepo.findById(registro.petId);
    if (!pet || pet.ownerId !== userId) throw new Error('RegistroAccessDenied');

    if (data.profissional && (data.profissional.trim().length < 3 || data.profissional.length > 100)) {
        errors.profissional = 'Profissional deve ter entre 3 e 100 caracteres';
    }
    if (Object.keys(errors).length) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }

    return this.registroRepo.update(registroId, data);
  }
}