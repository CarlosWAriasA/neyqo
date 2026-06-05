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

  async checkHealth(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      headers: {
        'X-Internal-Service-Secret': this.internalServiceSecret,
      },
    });

    return response.ok;
  }
}
