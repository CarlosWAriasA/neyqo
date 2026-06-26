import { describe, expect, it } from 'vitest';
import type { DataSource } from 'typeorm';
import type { NeyqoApiClient } from '../../src/clients/neyqo-api/neyqo-api-client';
import { EmailSyncJob } from '../../src/jobs/email-sync/job';
import { PendingEmailTransactionParser } from '../../src/jobs/email-sync/email-transaction-parser';
import { GmailEmailProvider } from '../../src/jobs/email-sync/providers/gmail-email-provider';
import { OutlookEmailProvider } from '../../src/jobs/email-sync/providers/outlook-email-provider';
import type { ExternalTokenCipher } from '../../src/jobs/email-sync/token-cipher';

const dataSource = {} as DataSource;
const apiClient = {} as NeyqoApiClient;
const tokenCipher = {} as ExternalTokenCipher;

describe('email sync contracts', () => {
  it('registra el job desactivado por defecto cuando la configuración lo indique', () => {
    const job = new EmailSyncJob(false, 60000, dataSource, apiClient, [], new PendingEmailTransactionParser(), {
      batchSize: 50,
    });

    expect(job.name).toBe('email-sync');
    expect(job.enabled).toBe(false);
  });

  it('expone contratos separados para Gmail y Outlook', () => {
    expect(new GmailEmailProvider(dataSource, tokenCipher, { clientId: 'google-client', clientSecret: 'secret' }).name).toBe('gmail');
    expect(
      new OutlookEmailProvider(dataSource, tokenCipher, {
        clientId: 'microsoft-client',
        clientSecret: 'secret',
        tenantId: 'common',
      }).name,
    ).toBe('outlook');
  });
});
