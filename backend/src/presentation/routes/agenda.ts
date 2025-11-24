import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SqliteAgendaRepository } from '../../infrastructure/repositories/SqliteAgendaRepository';
import { SqlitePetRepository } from '../../infrastructure/repositories/SqlitePetRepository';
import { ListAgendaByPet } from '../../application/agenda/ListAgendaByPet';
import { CreateAgenda } from '../../application/agenda/CreateAgenda';
import { UpdateAgenda } from '../../application/agenda/UpdateAgenda';
import { DeleteAgenda } from '../../application/agenda/DeleteAgenda';
import { AvaliarAgenda } from '../../application/agenda/AvaliarAgenda';

export const agendaRouter = Router();

agendaRouter.get('/pet/:petId', requireAuth, async (req: any, res) => {
  try {
    const agendaRepo = new SqliteAgendaRepository();
    const petRepo = new SqlitePetRepository();
    
    const listAgenda = new ListAgendaByPet(agendaRepo, petRepo);
    const petId = Number(req.params.petId);
    const userId = req.user.id;

    const agenda = listAgenda.execute({ petId, userId }); 
    res.json(agenda);
  
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao buscar agenda' });
  }
});

agendaRouter.post('/', requireAuth, async (req: any, res) => {
  try {
    const agendaRepo = new SqliteAgendaRepository();
    const petRepo = new SqlitePetRepository();

    const createAgenda = new CreateAgenda(agendaRepo, petRepo);

    const agenda = createAgenda.execute({ 
      userId: req.user.id, 
      data: req.body 
    });
    res.status(201).json(agenda);

  } catch (error: any) {
    if (error?.errors) return res.status(400).json({ message: 'ValidationError', errors: error.errors });
    res.status(400).json({ message: error.message || 'Erro ao criar agendamento' });
  }
});

agendaRouter.put('/:id', requireAuth, async (req: any, res) => {
  try {
    const agendaRepo = new SqliteAgendaRepository();
    const petRepo = new SqlitePetRepository();

    const updateAgenda = new UpdateAgenda(agendaRepo, petRepo);
    const agendaId = Number(req.params.id);
    const userId = req.user.id;
    
    const agenda = updateAgenda.execute({ 
      agendaId, 
      userId, 
      data: req.body 
    });
    res.json(agenda);

  } catch (error: any) {
    if (error?.errors) return res.status(400).json({ message: 'ValidationError', errors: error.errors });
    res.status(400).json({ message: error.message || 'Erro ao atualizar agendamento' });
  }
});

agendaRouter.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const agendaRepo = new SqliteAgendaRepository();
    const petRepo = new SqlitePetRepository();

    const deleteAgenda = new DeleteAgenda(agendaRepo, petRepo);
    const agendaId = Number(req.params.id);
    const userId = req.user.id;

    deleteAgenda.execute({ agendaId, userId });
    res.status(204).send();

  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao excluir agendamento' });
  }
});

agendaRouter.post('/:id/avaliar', requireAuth, async (req: any, res) => {
  try {
    const agendaRepo = new SqliteAgendaRepository();
    const petRepo = new SqlitePetRepository();
    const avaliarAgenda = new AvaliarAgenda(agendaRepo, petRepo);

    const { nota, comentario } = req.body;
    const agendaId = Number(req.params.id);

    avaliarAgenda.execute({
      agendaId,
      userId: req.user.id, 
      nota: Number(nota),
      comentario: String(comentario || ''),
    });

    res.status(200).json({ message: 'Avaliação registrada com sucesso' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Erro ao avaliar agendamento' });
  }
});