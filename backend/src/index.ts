import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'kiln-backend' });
});

app.use('/api/ai', require('./routes/ai'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/execution', require('./routes/execution'));
app.use('/api/auth', require('./routes/auth'));

app.use((error: any, req: Request, res: Response, next: any) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🔥 Kiln backend running on http://localhost:${PORT}`);
});
