export interface InternalTransactionPayload {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  sourceAccountId: string;
  categoryId: string;
  description: string;
  date: string;
  status: 'completed';
  note?: string;
  source: 'scheduled_transaction' | 'email_sync' | 'system';
  scheduledTransactionId?: string;
  scheduledExecutionDate?: string;
  processedAt?: string;
}

export interface InternalImportedTransactionPayload {
  userId: string;
  provider: 'gmail' | 'outlook';
  externalMessageId: string;
  bankCode:
    | 'popular'
    | 'qik'
    | 'santa_cruz'
    | 'banesco'
    | 'asociacion_popular'
    | 'lafise'
    | 'bhd'
    | 'banreservas'
    | 'bdi'
    | 'unknown';
  eventType: 'purchase' | 'reversal' | 'payment' | 'withdrawal' | 'deposit' | 'transfer' | 'unknown';
  providerStatus: 'approved' | 'declined' | 'pending' | 'unknown';
  productName?: string;
  cardLastDigits?: string;
  merchant: string;
  amount: number;
  currency: 'DOP' | 'USD' | 'EUR';
  transactionDate: string;
  rawDescription: string;
  confidence: number;
}

export class NeyqoApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }

  get retryable(): boolean {
    return this.statusCode === 408 || this.statusCode === 429 || this.statusCode >= 500;
  }
}

export class NeyqoApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalServiceSecret: string,
  ) {}

  async createInternalTransaction(payload: InternalTransactionPayload): Promise<{ transactionId: string; duplicate: boolean }> {
    const response = await fetch(`${this.baseUrl}/internal/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Secret': this.internalServiceSecret,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = (await response.json().catch(() => ({}))) as {
      message?: string;
      duplicate?: boolean;
      transaction?: { id?: string };
    };

    if (!response.ok) {
      throw new NeyqoApiError(response.status, responseBody.message ?? 'La API de Neyqo rechazó la solicitud interna.');
    }

    const transactionId = responseBody.transaction?.id;

    if (!transactionId) {
      throw new NeyqoApiError(502, 'La API de Neyqo no devolvió la transacción creada.');
    }

    return {
      transactionId,
      duplicate: responseBody.duplicate === true,
    };
  }

  async createInternalImportedTransaction(
    payload: InternalImportedTransactionPayload,
  ): Promise<{ importedTransactionId: string; duplicate: boolean; matchedRuleId?: string }> {
    const response = await fetch(`${this.baseUrl}/internal/email-sync/imported-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Secret': this.internalServiceSecret,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = (await response.json().catch(() => ({}))) as {
      message?: string;
      duplicate?: boolean;
      matchedRuleId?: string;
      importedTransaction?: { id?: string };
    };

    if (!response.ok) {
      throw new NeyqoApiError(response.status, responseBody.message ?? 'La API de Neyqo rechazó la detección interna.');
    }

    const importedTransactionId = responseBody.importedTransaction?.id;

    if (!importedTransactionId) {
      throw new NeyqoApiError(502, 'La API de Neyqo no devolvió la transacción detectada.');
    }

    return {
      importedTransactionId,
      duplicate: responseBody.duplicate === true,
      matchedRuleId: responseBody.matchedRuleId,
    };
  }

  async checkHealth(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      headers: {
        'X-Internal-Service-Secret': this.internalServiceSecret,
      },
    });

    return response.ok;
  }
}
