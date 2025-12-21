import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import paymentsRouter from './routes/payments';
import kpayWebhookRouter from './routes/kpayWebhook';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

  app.use('/api/payments', paymentsRouter);
  app.use('/api/payments/kpay/webhook', kpayWebhookRouter);

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
  });
}
