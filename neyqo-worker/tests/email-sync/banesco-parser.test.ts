import { describe, expect, it } from 'vitest';
import { PendingEmailTransactionParser } from '../../src/jobs/email-sync/email-transaction-parser';
import type { EmailMessage } from '../../src/jobs/email-sync/types';

describe('Banesco email transaction parser', () => {
  it('extrae un consumo aprobado de tarjeta Banesco', async () => {
    const message: EmailMessage = {
      provider: 'gmail',
      externalMessageId: 'banesco-message-1',
      userId: '00000000-0000-0000-0000-000000000000',
      receivedAt: '2026-06-17T12:00:00.000Z',
      safeSnippet:
        'Estimado(a) CARLOS ARIAS, te notificamos que tu tarjeta VISA CLASICA SUPERCASHBACK Banesco terminada en 0027, en fecha 17/06/26, presenta un consumo de RD$ 771.00, en BRAVO JACOBO MAJLUTA y su estado es aprobada. Dispones de RD$ 4,432.61.',
    };

    const parsed = await new PendingEmailTransactionParser().parse(message);

    expect(parsed).toMatchObject({
      userId: message.userId,
      provider: 'gmail',
      externalMessageId: message.externalMessageId,
      bankCode: 'banesco',
      eventType: 'purchase',
      status: 'approved',
      productName: 'VISA CLASICA SUPERCASHBACK',
      cardLastDigits: '0027',
      merchant: 'BRAVO JACOBO MAJLUTA',
      amount: 771,
      currency: 'DOP',
      transactionDate: '2026-06-17',
    });
    expect(parsed?.confidence).toBeGreaterThan(0.9);
  });

  it('ignora correos que no tienen la firma esperada de Banesco', async () => {
    const parsed = await new PendingEmailTransactionParser().parse({
      provider: 'gmail',
      externalMessageId: 'other-message',
      userId: '00000000-0000-0000-0000-000000000000',
      receivedAt: '2026-06-17T12:00:00.000Z',
      safeSnippet: 'Tu compra fue aprobada por otro proveedor.',
    });

    expect(parsed).toBeNull();
  });
});
