import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SqliteDespesaFinanceiraRepository } from '../../infrastructure/repositories/SqliteDespesaFinanceiraRepository';
import { SqlitePetRepository } from '../../infrastructure/repositories/SqlitePetRepository';
import { CreateDespesa } from '../../application/despesas/CreateDespesa';
import { UpdateDespesa } from '../../application/despesas/UpdateDespesa';
import { DeleteDespesa } from '../../application/despesas/DeleteDespesa';
import { ListDespesas } from '../../application/despesas/ListDespesas';

export const despesasRouter = Router();

// Todas as rotas exigem autenticação
despesasRouter.use(requireAuth);

// Listar despesas do tutor
despesasRouter.get('/', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode acessar despesas' });
  }

  try {
    const despesaRepo = new SqliteDespesaFinanceiraRepository();
    const listDespesas = new ListDespesas(despesaRepo);

    const petId = req.query.petId ? Number(req.query.petId) : undefined;
    const categoria = req.query.categoria ? String(req.query.categoria) : undefined;
    const dataInicio = req.query.dataInicio ? String(req.query.dataInicio) : undefined;
    const dataFim = req.query.dataFim ? String(req.query.dataFim) : undefined;

    const despesas = listDespesas.executeWithFilters({
      userId: req.user.id,
      filters: { petId, categoria: categoria as any, dataInicio, dataFim },
    });

    res.json(despesas);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao buscar despesas' });
  }
});

// Obter resumo financeiro
despesasRouter.get('/summary', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode acessar despesas' });
  }

  try {
    const despesaRepo = new SqliteDespesaFinanceiraRepository();
    const listDespesas = new ListDespesas(despesaRepo);

    const petId = req.query.petId ? Number(req.query.petId) : undefined;
    const categoria = req.query.categoria ? String(req.query.categoria) : undefined;
    const dataInicio = req.query.dataInicio ? String(req.query.dataInicio) : undefined;
    const dataFim = req.query.dataFim ? String(req.query.dataFim) : undefined;

    const summary = listDespesas.getSummary({
      userId: req.user.id,
      filters: { petId, categoria: categoria as any, dataInicio, dataFim },
    });

    res.json(summary);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao calcular resumo' });
  }
});

// Criar despesa
despesasRouter.post('/', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode cadastrar despesas' });
  }

  try {
    const despesaRepo = new SqliteDespesaFinanceiraRepository();
    const petRepo = new SqlitePetRepository();
    const createDespesa = new CreateDespesa(despesaRepo, petRepo);

    const despesa = createDespesa.execute({
      userId: req.user.id,
      data: req.body,
    });

    res.status(201).json(despesa);
  } catch (error: any) {
    if (error?.errors) {
      console.warn('[DESPESAS][CREATE][VALIDATION_ERROR]', {
        userId: req.user?.id,
        payload: req.body,
        errors: error.errors,
      });
      return res.status(400).json({ message: 'ValidationError', errors: error.errors });
    }
    console.error('[DESPESAS][CREATE][ERROR]', error?.message, {
      userId: req.user?.id,
      payload: req.body,
    });
    res.status(400).json({ message: error.message || 'Erro ao criar despesa' });
  }
});

// Atualizar despesa
despesasRouter.put('/:id', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode alterar despesas' });
  }

  try {
    const despesaRepo = new SqliteDespesaFinanceiraRepository();
    const petRepo = new SqlitePetRepository();
    const updateDespesa = new UpdateDespesa(despesaRepo, petRepo);

    const despesaId = Number(req.params.id);

    const despesa = updateDespesa.execute({
      despesaId,
      userId: req.user.id,
      data: req.body,
    });

    res.json(despesa);
  } catch (error: any) {
    if (error?.errors) {
      console.warn('[DESPESAS][UPDATE][VALIDATION_ERROR]', {
        userId: req.user?.id,
        despesaId: req.params?.id,
        payload: req.body,
        errors: error.errors,
      });
      return res.status(400).json({ message: 'ValidationError', errors: error.errors });
    }
    console.error('[DESPESAS][UPDATE][ERROR]', error?.message, {
      userId: req.user?.id,
      despesaId: req.params?.id,
      payload: req.body,
    });
    res.status(400).json({ message: error.message || 'Erro ao atualizar despesa' });
  }
});

// Deletar despesa
despesasRouter.delete('/:id', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode deletar despesas' });
  }

  try {
    const despesaRepo = new SqliteDespesaFinanceiraRepository();
    const petRepo = new SqlitePetRepository();
    const deleteDespesa = new DeleteDespesa(despesaRepo, petRepo);

    const despesaId = Number(req.params.id);

    deleteDespesa.execute({
      despesaId,
      userId: req.user.id,
    });

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao deletar despesa' });
  }
});

