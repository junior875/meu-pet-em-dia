import { Agenda, AgendaInputDTO } from '../../domain/Agenda';
import { AgendaRepository } from '../../infrastructure/repositories/AgendaRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type UpdateAgendaInput = {
  agendaId: number;
  userId: number;
  data: Partial<Omit<AgendaInputDTO, 'petId'>>; 
};

export class UpdateAgenda {
  constructor(
    private readonly agendaRepo: AgendaRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: UpdateAgendaInput): Agenda {
    
    const agenda = this.agendaRepo.findById(input.agendaId);
    if (!agenda) {
      throw new Error('AgendaNotFound');
    }

    const pet = this.petRepo.findById(agenda.petId);
    if (!pet || pet.ownerId !== input.userId) {
      throw new Error('AgendaAccessDenied');
    }
    
    const errors: Record<string, string> = {};
    const { data } = input;

    if (data.procedimento !== undefined && data.procedimento.trim().length < 3) {
       errors.procedimento = 'Procedimento deve ter no mínimo 3 caracteres';
    }
    if (data.profissional && data.profissional.length > 100) {
      errors.profissional = 'Profissional deve ter no máximo 100 caracteres';
    }
    if (data.observacoes && data.observacoes.length > 300) {
      errors.observacoes = 'Observações deve ter no máximo 300 caracteres';
    }
    
    if (Object.keys(errors).length) {
      const err = new Error('ValidationError') as Error & { errors?: Record<string, string> };
      err.errors = errors;
      throw err;
    }

    const updatedAgenda = this.agendaRepo.update(input.agendaId, data);
    return updatedAgenda;
  }
}