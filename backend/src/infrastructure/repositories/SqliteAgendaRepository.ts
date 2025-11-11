import { db } from '../db';
import { Agenda, AgendaInputDTO } from '../../domain/Agenda';
import { AgendaRepository } from './AgendaRepository';

export class SqliteAgendaRepository implements AgendaRepository {
  
  create(data: AgendaInputDTO): Agenda {
    const stmt = db.prepare(`
      INSERT INTO agenda (petId, procedimento, data, horario, profissional, observacoes)
      VALUES (@petId, @procedimento, @data, @horario, @profissional, @observacoes)
    `.trim());
    
    const info = stmt.run({
      petId: data.petId,
      procedimento: data.procedimento,
      data: data.data,
      horario: data.horario,
      profissional: data.profissional ?? null,
      observacoes: data.observacoes ?? null,
    });
    
    const row = db.prepare('SELECT * FROM agenda WHERE id = ?').get(info.lastInsertRowid as number) as Agenda;
    return row;
  }

  update(id: number, data: Partial<AgendaInputDTO>): Agenda {
    const current = this.findById(id);
    if (!current) throw new Error('AgendaNotFound');
    
    const next: Agenda = { ...current, ...data };

    db.prepare(`
      UPDATE agenda SET
        procedimento = ?,
        data = ?,
        horario = ?,
        profissional = ?,
        observacoes = ?
      WHERE id = ?
    `).run(
      next.procedimento,
      next.data,
      next.horario,
      next.profissional ?? null,
      next.observacoes ?? null,
      id,
    );
    
    return this.findById(id)!;
  }

  delete(id: number): void {
    db.prepare('DELETE FROM agenda WHERE id = ?').run(id);
  }

  findById(id: number): Agenda | null {
    const row = db.prepare('SELECT * FROM agenda WHERE id = ?').get(id) as Agenda | undefined;
    return row ?? null;
  }

  findByPetId(petId: number): Agenda[] {
    const sql = `SELECT * FROM agenda WHERE petId = ? ORDER BY data, horario`;
    return db.prepare(sql).all(petId) as Agenda[];
  }
}