import { Agenda, AgendaInputDTO } from '../../domain/Agenda';
import { AgendaRepository } from '../../infrastructure/repositories/AgendaRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type CreateAgendaInput = {
  userId: number;
  data: AgendaInputDTO;
};

export class CreateAgenda {
  constructor(
    private readonly agendaRepo: AgendaRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: CreateAgendaInput): Agenda {
    const { data, userId } = input;

    const pet = this.petRepo.findById(data.petId);
    if (!pet) {
      throw new Error('PetNotFound');
    }
    if (pet.ownerId !== userId) {
      throw new Error('PetAccessDenied');
    }

    const errors: Record<string, string> = {};
    
    if (!data.procedimento || data.procedimento.trim().length < 3) errors.procedimento = 'Procedimento é obrigatório (mín. 3 caracteres)';
    if (!data.data) errors.data = 'Data é obrigatória';
    if (!data.horario) errors.horario = 'Horário é obrigatório';
    if (data.profissional && data.profissional.length > 100) errors.profissional = 'Profissional deve ter no máximo 100 caracteres';
    if (data.observacoes && data.observacoes.length > 300) errors.observacoes = 'Observações deve ter no máximo 300 caracteres';

    if (Object.keys(errors).length) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }

    const newAgenda = this.agendaRepo.create(data);
    return newAgenda;
  }
}