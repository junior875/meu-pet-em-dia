import { db } from '../db';
import type { DespesaFinanceira, CategoriaDespesa } from '../../domain/DespesaFinanceira';
import type { DespesaFinanceiraRepository } from './DespesaFinanceiraRepository';

export class SqliteDespesaFinanceiraRepository implements DespesaFinanceiraRepository {
  create(despesa: Omit<DespesaFinanceira, 'id' | 'createdAt'>): DespesaFinanceira {
    const stmt = db.prepare(`
      INSERT INTO despesas_financeiras (petId, categoria, descricao, valor, data, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      despesa.petId,
      despesa.categoria,
      despesa.descricao,
      despesa.valor,
      despesa.data,
      despesa.observacoes
    );
    const id = result.lastInsertRowid as number;
    return this.findById(id)!;
  }

  findById(id: number): DespesaFinanceira | null {
    const stmt = db.prepare('SELECT * FROM despesas_financeiras WHERE id = ?');
    const row = stmt.get(id) as any;
    return row || null;
  }

  findByPetId(petId: number): DespesaFinanceira[] {
    const stmt = db.prepare('SELECT * FROM despesas_financeiras WHERE petId = ? ORDER BY data DESC');
    return stmt.all(petId) as DespesaFinanceira[];
  }

  findByUserId(userId: number): DespesaFinanceira[] {
    const stmt = db.prepare(`
      SELECT d.* FROM despesas_financeiras d
      INNER JOIN pets p ON d.petId = p.id
      WHERE p.ownerId = ?
      ORDER BY d.data DESC
    `);
    return stmt.all(userId) as DespesaFinanceira[];
  }

  findAll(filters?: { petId?: number; categoria?: CategoriaDespesa; dataInicio?: string; dataFim?: string }): DespesaFinanceira[] {
    let query = 'SELECT * FROM despesas_financeiras WHERE 1=1';
    const params: any[] = [];

    if (filters?.petId) {
      query += ' AND petId = ?';
      params.push(filters.petId);
    }
    if (filters?.categoria) {
      query += ' AND categoria = ?';
      params.push(filters.categoria);
    }
    if (filters?.dataInicio) {
      query += ' AND data >= ?';
      params.push(filters.dataInicio);
    }
    if (filters?.dataFim) {
      query += ' AND data <= ?';
      params.push(filters.dataFim);
    }

    query += ' ORDER BY data DESC';
    const stmt = db.prepare(query);
    return stmt.all(...params) as DespesaFinanceira[];
  }

  update(id: number, data: Partial<Omit<DespesaFinanceira, 'id' | 'petId' | 'createdAt'>>): DespesaFinanceira {
    const existing = this.findById(id);
    if (!existing) throw new Error('NotFound');

    const fields: string[] = [];
    const values: any[] = [];

    if (data.categoria !== undefined) {
      fields.push('categoria = ?');
      values.push(data.categoria);
    }
    if (data.descricao !== undefined) {
      fields.push('descricao = ?');
      values.push(data.descricao);
    }
    if (data.valor !== undefined) {
      fields.push('valor = ?');
      values.push(data.valor);
    }
    if (data.data !== undefined) {
      fields.push('data = ?');
      values.push(data.data);
    }
    if (data.observacoes !== undefined) {
      fields.push('observacoes = ?');
      values.push(data.observacoes);
    }

    if (fields.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE despesas_financeiras SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    return this.findById(id)!;
  }

  delete(id: number): void {
    const stmt = db.prepare('DELETE FROM despesas_financeiras WHERE id = ?');
    stmt.run(id);
  }
}

