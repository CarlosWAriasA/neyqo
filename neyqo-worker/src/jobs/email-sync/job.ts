import { IsNull } from 'typeorm';
import type { DataSource } from 'typeorm';
import type { NeyqoApiClient } from '../../clients/neyqo-api/neyqo-api-client';
import { ExternalConnection } from '../../database/entities/external-connection.entity';
import { EmailSyncedMessage } from '../../database/entities/email-synced-message.entity';
import { logger } from '../../core/logging/logger';
import type { JobExecutionContext, JobExecutionResult, WorkerJob } from '../../core/scheduler/types';
import type { EmailProvider, EmailTransactionParser } from './types';

export class EmailSyncJob implements WorkerJob {
  readonly name = 'email-sync';

  constructor(
    readonly enabled: boolean,
    readonly intervalMs: number,
    private readonly dataSource: DataSource,
    private readonly apiClient: NeyqoApiClient,
    private readonly providers: EmailProvider[],
    private readonly parser: EmailTransactionParser,
    private readonly options: { batchSize: number },
  ) {}

  async execute(context: JobExecutionContext): Promise<JobExecutionResult> {
    const connections = await this.listConnections(context.userId);
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const connection of connections) {
      const provider = this.providers.find((candidate) => candidate.name === connection.provider);

      if (!provider) {
        failedCount += 1;
        logger.warn('Proveedor de correo no registrado.', {
          provider: connection.provider,
          userId: connection.userId,
        });
        continue;
      }

      try {
        const refreshedConnection = await provider.refreshAccessTokenIfNeeded(connection);
        const accessToken = provider.decryptAccessToken(refreshedConnection);
        const messages = await provider.fetchNewMessages(refreshedConnection, accessToken, {
          limit: this.options.batchSize,
        });

        for (const message of messages) {
          const wasAlreadySynced = await this.wasAlreadySynced(message.userId, message.provider, message.externalMessageId);

          if (wasAlreadySynced) {
            continue;
          }

          processedCount += 1;

          try {
            const parsed = await this.parser.parse(message);

            if (!parsed) {
              await this.recordSyncedMessage(message.userId, message.provider, message.externalMessageId, 'ignored');
              successCount += 1;
              continue;
            }

            await this.apiClient.createInternalImportedTransaction({
              userId: parsed.userId,
              provider: parsed.provider,
              externalMessageId: parsed.externalMessageId,
              bankCode: parsed.bankCode,
              eventType: parsed.eventType,
              providerStatus: parsed.status,
              productName: parsed.productName,
              cardLastDigits: parsed.cardLastDigits,
              merchant: parsed.merchant,
              amount: parsed.amount,
              currency: parsed.currency,
              transactionDate: parsed.transactionDate,
              rawDescription: truncate(parsed.rawDescription, 1000),
              confidence: parsed.confidence,
            });

            await this.recordSyncedMessage(message.userId, message.provider, message.externalMessageId, 'processed');
            successCount += 1;
          } catch (error) {
            failedCount += 1;
            await this.recordSyncedMessage(message.userId, message.provider, message.externalMessageId, 'failed');
            logger.error('No fue posible procesar un correo sincronizado.', error, {
              provider: message.provider,
              userId: message.userId,
              externalMessageId: message.externalMessageId,
            });
          }
        }

        refreshedConnection.lastSyncAt = new Date();
        await this.dataSource.getRepository(ExternalConnection).save(refreshedConnection);
      } catch (error) {
        failedCount += 1;
        logger.error('Falló la sincronización de una conexión de correo.', error, {
          provider: connection.provider,
          userId: connection.userId,
          connectionId: connection.id,
        });
      }
    }

    return {
      processedCount,
      successCount,
      failedCount,
      status: failedCount === 0 ? 'success' : successCount > 0 ? 'partial_success' : 'failed',
      errorMessage: failedCount > 0 ? 'Una o más conexiones o mensajes no pudieron sincronizarse.' : undefined,
    };
  }

  private async listConnections(userId: string | undefined): Promise<ExternalConnection[]> {
    return this.dataSource.getRepository(ExternalConnection).find({
      where: {
        status: 'connected',
        revokedAt: IsNull(),
        ...(userId ? { userId } : {}),
      },
      order: {
        lastSyncAt: 'ASC',
        createdAt: 'ASC',
      },
      take: this.options.batchSize,
    });
  }

  private async wasAlreadySynced(userId: string, provider: EmailSyncedMessage['provider'], externalMessageId: string) {
    const count = await this.dataSource.getRepository(EmailSyncedMessage).count({
      where: {
        userId,
        provider,
        externalMessageId,
        status: 'processed',
      },
    });

    if (count > 0) {
      return true;
    }

    const ignoredCount = await this.dataSource.getRepository(EmailSyncedMessage).count({
      where: {
        userId,
        provider,
        externalMessageId,
        status: 'ignored',
      },
    });

    return ignoredCount > 0;
  }

  private async recordSyncedMessage(
    userId: string,
    provider: EmailSyncedMessage['provider'],
    externalMessageId: string,
    status: EmailSyncedMessage['status'],
  ): Promise<void> {
    const repository = this.dataSource.getRepository(EmailSyncedMessage);

    try {
      const existing = await repository.findOne({
        where: {
          userId,
          provider,
          externalMessageId,
        },
      });

      if (existing) {
        existing.status = status;
        existing.processedAt = new Date();
        await repository.save(existing);
        return;
      }

      await repository.save(
        repository.create({
          userId,
          provider,
          externalMessageId,
          status,
          processedAt: new Date(),
        }),
      );
    } catch {
      // The unique index is the final duplicate guard across worker instances.
    }
  }
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
