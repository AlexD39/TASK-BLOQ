import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import healthRoutes from './routes/health.routes.js';

const app = express();

app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
);

app.use(express.json());

app.get('/api', (_request, response) => {
  return response.status(200).json({
    ok: true,
    message: 'TASK BLOQ API funcionando',
  });
});

app.use('/api/health', healthRoutes);

app.use((_request, response) => {
  return response.status(404).json({
    ok: false,
    message: 'Ruta no encontrada',
  });
});

export default app;