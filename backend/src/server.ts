import { env } from './config/env';
import { appDataSource } from './database/data-source';
import { buildApp } from './app';
import { logAppEvent, logBackendError } from './utils/file-logger';

async function bootstrap() {
  await appDataSource.initialize();

  const app = await buildApp();

  await app.listen({
    host: '0.0.0.0',
    port: env.port,
  });

  logAppEvent('Backend started.', {
    nodeEnv: env.nodeEnv,
    port: env.port,
  });
}

bootstrap().catch((error) => {
  logBackendError('Backend startup failed.', error);
  console.error('No fue posible iniciar el backend.', error);
  process.exit(1);
});
