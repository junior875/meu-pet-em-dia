import { Agenda } from '../../domain/Agenda';

export interface AgendaRepository {
  create(agenda: Omit<Agenda, 'id' | 'createdAt'>): Agenda;
  findById(id: number): Agenda | null;
  findByPetId(petId: number): Agenda[];
  update(id: number, data: Partial<Omit<Agenda, 'id' | 'petId' | 'createdAt'>>): Agenda;
  delete(id: number): void;
  avaliar(id: number, nota: number, comentario: string): void;
}