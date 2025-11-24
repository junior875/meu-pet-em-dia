import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SqlitePetRepository } from '../../infrastructure/repositories/SqlitePetRepository';
import { SqliteRegistroSaudeRepository } from '../../infrastructure/repositories/SqliteRegistroSaudeRepository';
import { SqliteDespesaFinanceiraRepository } from '../../infrastructure/repositories/SqliteDespesaFinanceiraRepository';
import { GerarRelatorioSaude } from '../../application/relatorios/GerarRelatorioSaude';
import { GerarRelatorioFinanceiro } from '../../application/relatorios/GerarRelatorioFinanceiro';

export const relatoriosRouter = Router();

// Todas as rotas exigem autenticação
relatoriosRouter.use(requireAuth);

// Gerar relatório de saúde de um pet
relatoriosRouter.get('/saude/:petId', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode gerar relatórios' });
  }

  try {
    const petRepo = new SqlitePetRepository();
    const registroRepo = new SqliteRegistroSaudeRepository();
    const gerarRelatorio = new GerarRelatorioSaude(petRepo, registroRepo);

    const petId = Number(req.params.petId);
    const dataInicio = req.query.dataInicio ? String(req.query.dataInicio) : undefined;
    const dataFim = req.query.dataFim ? String(req.query.dataFim) : undefined;

    const relatorio = gerarRelatorio.execute({
      petId,
      userId: req.user.id,
      dataInicio,
      dataFim,
    });

    res.json(relatorio);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao gerar relatório' });
  }
});

relatoriosRouter.get('/financeiro', (req: any, res) => {
  if (req.user.type !== 'Tutor') {
    return res.status(403).json({ message: 'Apenas tutor pode gerar relatórios financeiros' });
  }

  try {
    const despesaRepo = new SqliteDespesaFinanceiraRepository();
    const gerarRelatorio = new GerarRelatorioFinanceiro(despesaRepo);

    const dataInicio = req.query.dataInicio ? String(req.query.dataInicio) : undefined;
    const dataFim = req.query.dataFim ? String(req.query.dataFim) : undefined;

    const relatorio = gerarRelatorio.execute({
      userId: req.user.id,
      dataInicio,
      dataFim,
    });

    res.json(relatorio);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao gerar relatório financeiro' });
  }
});

