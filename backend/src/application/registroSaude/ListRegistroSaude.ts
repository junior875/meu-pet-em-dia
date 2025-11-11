import { RegistroSaude, TipoRegistro } from '../../domain/RegistroSaude';
import { RegistroSaudeRepository } from '../../infrastructure/repositories/RegistroSaudeRepository';

export type ListRegistroSaudeInput = {
  userId: number;
};

export class ListRegistroSaude {
  constructor(
    private readonly registroRepo: RegistroSaudeRepository,
  ) {}

  execute(input: ListRegistroSaudeInput): RegistroSaude[] {
    return this.registroRepo.findAll(input.userId);
  }
}