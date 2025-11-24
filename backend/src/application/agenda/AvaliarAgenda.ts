import { AgendaRepository } from '../../infrastructure/repositories/AgendaRepository';
import { PetRepository } from '../../infrastructure/repositories/PetRepository';

interface AvaliarAgendaInput {
  agendaId: number;
  userId: number;
  nota: number;
  comentario: string;
}

export class AvaliarAgenda {
  constructor(
    private readonly agendaRepo: AgendaRepository,
    private readonly petRepo: PetRepository
  ) {}

  execute(input: AvaliarAgendaInput): void {
    if (input.nota < 1 || input.nota > 5) {
      throw new Error('A nota deve ser entre 1 e 5');
    }

    const agenda = this.agendaRepo.findById(input.agendaId);
    if (!agenda) {
      throw new Error('Agendamento não encontrado');
    }

    const pet = this.petRepo.findById(agenda.petId);
    if (!pet || pet.ownerId !== input.userId) {
      throw new Error('Você não tem permissão para avaliar este agendamento');
    }

    this.agendaRepo.avaliar(input.agendaId, input.nota, input.comentario);
  }
}