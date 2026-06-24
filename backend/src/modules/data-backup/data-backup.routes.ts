import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import { neyqoBackupSchema } from './data-backup.schemas';
import type { DataBackupService } from './data-backup.service';

export const buildDataBackupRoutes =
  (dataBackupService: DataBackupService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

    app.get('/transactions.csv', async (request, reply) => {
      const csv = await dataBackupService.exportTransactionsCsv(request.authUser!.id);

      return reply
        .header('content-type', 'text/csv; charset=utf-8')
        .header('content-disposition', `attachment; filename="neyqo-transacciones-${today()}.csv"`)
        .code(200)
        .send(csv);
    });

    app.get('/backup.json', async (request, reply) => {
      const backup = await dataBackupService.exportBackup(request.authUser!.id);

      return reply
        .header('content-type', 'application/json; charset=utf-8')
        .header('content-disposition', `attachment; filename="neyqo-backup-${today()}.json"`)
        .code(200)
        .send(backup);
    });

    app.post('/import', async (request, reply) => {
      const parsed = neyqoBackupSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('El archivo de backup no es válido.', parsed.error.flatten().fieldErrors));
      }

      const summary = await dataBackupService.importBackup(request.authUser!.id, parsed.data);
      return reply.code(200).send({ summary });
    });
  };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
