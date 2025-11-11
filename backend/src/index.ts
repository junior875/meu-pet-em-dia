import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { adminRouter } from './presentation/routes/admin';
import { authRouter } from './presentation/routes/auth';
import { petsRouter } from './presentation/routes/pets';
import { agendaRouter } from './presentation/routes/agenda';

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  const startedAt = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);
  // attach simple timing log on finish
  _res.on('finish', () => {
    const ms = Date.now() - startedAt;
    console.log(`[RES] ${req.method} ${req.url} -> ${_res.statusCode} (${ms}ms)`);
  });
  next();
});

// arquivos estáticos de upload
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// rotas admin
app.use('/admin', adminRouter);
// rotas públicas de auth
app.use('/auth', authRouter);
// rotas autenticadas de pets
app.use('/pets', petsRouter);
// rotas autenticadas de agenda
app.use('/agenda', agendaRouter);

// health check
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