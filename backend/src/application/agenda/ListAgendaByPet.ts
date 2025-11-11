import { Agenda } from '../../domain/Agenda';
import { AgendaRepository } from '../../infrastructure/repositories/AgendaRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

export type ListAgendaInput = {
  petId: number;
  userId: number;
};

export class ListAgendaByPet {
  constructor(
    private readonly agendaRepo: AgendaRepository,
    private readonly petRepo: PetRepository,
  ) {}

  execute(input: ListAgendaInput): Agenda[] {
    
    const pet = this.petRepo.findById(input.petId);
    
    if (!pet) {
      throw new Error('PetNotFound');
    }
    if (pet.ownerId !== input.userId) {
      throw new Error('PetAccessDenied');
    }

    return this.agendaRepo.findByPetId(input.petId);
  }
}