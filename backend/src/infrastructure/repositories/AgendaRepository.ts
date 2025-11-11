import { Agenda, AgendaInputDTO } from '../../domain/Agenda';

export interface AgendaRepository {
  create(data: AgendaInputDTO): Agenda; 
  update(id: number, data: Partial<AgendaInputDTO>): Agenda;
  delete(id: number): void;
  findById(id: number): Agenda | null;
  findByPetId(petId: number): Agenda[];
}