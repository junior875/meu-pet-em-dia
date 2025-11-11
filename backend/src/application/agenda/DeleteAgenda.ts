import { AgendaRepository } from '../../infrastructure/repositories/AgendaRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type DeleteAgendaInput = {
  agendaId: number;
  userId: number;
};

export class DeleteAgenda {
  constructor(
    private readonly agendaRepo: AgendaRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: DeleteAgendaInput): void {
    
    const agenda = this.agendaRepo.findById(input.agendaId); 
    if (!agenda) {
      throw new Error('AgendaNotFound');
    }

    const pet = this.petRepo.findById(agenda.petId); 
    if (!pet || pet.ownerId !== input.userId) {
      throw new Error('AgendaAccessDenied');
    }

    this.agendaRepo.delete(input.agendaId);
  }
}