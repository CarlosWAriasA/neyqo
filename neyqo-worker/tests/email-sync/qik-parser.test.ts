import { describe, expect, it } from 'vitest';
import { PendingEmailTransactionParser } from '../../src/jobs/email-sync/email-transaction-parser';
import type { EmailMessage } from '../../src/jobs/email-sync/types';

describe('Qik email transaction parser', () => {
  it('extrae una transacción aprobada de tarjeta Qik', async () => {
    const message: EmailMessage = {
      provider: 'gmail',
      externalMessageId: 'qik-message-1',
      userId: '00000000-0000-0000-0000-000000000000',
      receivedAt: '2026-06-15T22:05:00.000Z',
      bodyText: `
        email-logo

        ¡Hola CARLOS WILMER ARIAS ALMANZAR!
        Tarjeta 53*************4737

        Se hizo una transacción de RD$ 300.00 en CLARO DOMINICANA 7622 con tu tarjeta crédito Qik que termina en 53*************4737

        Localidad CLARO DOMINICANA 7622

        Fecha y hora 06-15-2026 06:05 PM (AST)

        Monto RD$ 300.00

        Balance Disponible RD$ 4,903.40

        Si no hiciste esta acción, escríbenos al Qik Chat en el app o llámanos al 809-364-2161.
      `,
    };

    const parsed = await new PendingEmailTransactionParser().parse(message);

    expect(parsed).toMatchObject({
      userId: message.userId,
      provider: 'gmail',
      externalMessageId: message.externalMessageId,
      bankCode: 'qik',
      eventType: 'purchase',
      status: 'approved',
      productName: 'tarjeta crédito Qik',
      cardLastDigits: '4737',
      merchant: 'CLARO DOMINICANA 7622',
      amount: 300,
      currency: 'DOP',
      transactionDate: '2026-06-15',
    });
    expect(parsed?.confidence).toBeGreaterThan(0.9);
  });
});
