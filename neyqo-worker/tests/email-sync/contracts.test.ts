import { describe, expect, it } from 'vitest';
import { EmailSyncJob } from '../../src/jobs/email-sync/job';
import { PendingEmailTransactionParser } from '../../src/jobs/email-sync/email-transaction-parser';
import { GmailEmailProvider } from '../../src/jobs/email-sync/providers/gmail-email-provider';
import { OutlookEmailProvider } from '../../src/jobs/email-sync/providers/outlook-email-provider';

describe('email sync contracts', () => {
  it('registra el job desactivado por defecto cuando la configuración lo indique', () => {
    const job = new EmailSyncJob(false, 60000, [], new PendingEmailTransactionParser());

    expect(job.name).toBe('email-sync');
    expect(job.enabled).toBe(false);
  });

  it('expone contratos separados para Gmail y Outlook', () => {
    expect(new GmailEmailProvider().name).toBe('gmail');
    expect(new OutlookEmailProvider().name).toBe('outlook');
  });
});
