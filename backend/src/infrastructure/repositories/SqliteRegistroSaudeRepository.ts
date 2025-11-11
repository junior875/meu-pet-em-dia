import { db } from '../db';
import { RegistroSaude, RegistroSaudeInputDTO, TipoRegistro } from '../../domain/RegistroSaude';
import { RegistroSaudeRepository } from './RegistroSaudeRepository';

export class SqliteRegistroSaudeRepository implements RegistroSaudeRepository {
  
  create(data: RegistroSaudeInputDTO & { userId: number }): RegistroSaude {
    const stmt = db.prepare(`INSERT INTO registros_saude (petId, userId, tipoRegistro, data, horario, profissional, filePath) VALUES (@petId, @userId, @tipoRegistro, @data, @horario, @profissional, @filePath)`);
    
    const info = stmt.run({
      petId: data.petId,
      userId: data.userId,
      tipoRegistro: data.tipoRegistro,
      data: data.data,
      horario: data.horario,
      profissional: data.profissional!, 
      filePath: data.filePath || null,
    });
    
    const row = db.prepare('SELECT * FROM registros_saude WHERE id = ?').get(info.lastInsertRowid as number) as RegistroSaude;
    return row;
  }

  update(id: number, data: Partial<RegistroSaudeInputDTO>): RegistroSaude {
    const current = this.findById(id);
    if (!current) throw new Error('RegistroNotFound');
    
    const next: RegistroSaude = { 
        ...current, 
        ...data,
        profissional: data.profissional !== undefined ? (data.profissional?.trim() || '') : current.profissional,
        filePath: data.filePath === undefined ? current.filePath : (data.filePath || null),
    };

    const finalProfissional = next.profissional === '' ? current.profissional : next.profissional;


    db.prepare(`
      UPDATE registros_saude SET
        data = ?,
        horario = ?,
        profissional = ?,
        filePath = ?
      WHERE id = ?
    `).run(
      next.data,
      next.horario,
      finalProfissional,
      next.filePath,
      id,
    );
    
    return this.findById(id)!;
  }

  delete(id: number): void {
    db.prepare('DELETE FROM registros_saude WHERE id = ?').run(id);
  }

  findById(id: number): RegistroSaude | null {
    const row = db.prepare('SELECT * FROM registros_saude WHERE id = ?').get(id) as RegistroSaude | undefined;
    return row ?? null;
  }

  findByPetId(petId: number, filter?: { tipoRegistro?: TipoRegistro }): RegistroSaude[] {
    let sql = `SELECT * FROM registros_saude WHERE petId = ?`;
    const params: (number | string)[] = [petId];
    
    if (filter?.tipoRegistro) {
        sql += ` AND tipoRegistro = ?`;
        params.push(filter.tipoRegistro);
    }
    
    sql += ` ORDER BY data DESC, horario DESC`; 
    
    return db.prepare(sql).all(...params) as RegistroSaude[];
  }

  findAll(ownerId: number): RegistroSaude[] {
    const sql = `
        SELECT r.*, p.name AS petName, p.species AS petSpecies, p.photoPath -- Adicionar p.photoPath
        FROM registros_saude r
        JOIN pets p ON r.petId = p.id
        WHERE p.ownerId = ?
        ORDER BY r.data DESC, r.horario DESC
    `;
    return db.prepare(sql).all(ownerId) as RegistroSaude[]; 
  }
}