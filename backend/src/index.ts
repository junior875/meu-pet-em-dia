import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { adminRouter } from './presentation/routes/admin';
import { authRouter } from './presentation/routes/auth';
import { petsRouter } from './presentation/routes/pets';
import { agendaRouter } from './presentation/routes/agenda';
import { registrosSaudeRouter } from './presentation/routes/registroSaude';
import { despesasRouter } from './presentation/routes/despesas';
import { relatoriosRouter } from './presentation/routes/relatorios';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  const startedAt = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);
  _res.on('finish', () => {
    const ms = Date.now() - startedAt;
    console.log(`[RES] ${req.method} ${req.url} -> ${_res.statusCode} (${ms}ms)`);
  });
  next();
});

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/pets', petsRouter);
app.use('/agenda', agendaRouter);
app.use('/registros_saude', registrosSaudeRouter);
app.use('/despesas', despesasRouter);
app.use('/relatorios', relatoriosRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR] Unhandled error:', err?.stack || err);
  res.status(500).json({ message: 'InternalError' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`ADMIN_KEY set: ${process.env.ADMIN_KEY ? 'yes' : 'no'}`);
});