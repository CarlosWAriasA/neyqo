export type EmailProviderName = 'gmail' | 'outlook';

export interface EmailMessage {
  provider: EmailProviderName;
  externalMessageId: string;
  userId: string;
  receivedAt: string;
  subject?: string;
  safeSnippet?: string;
}

export interface EmailProvider {
  readonly name: EmailProviderName;
  refreshAccessTokenIfNeeded(userId: string): Promise<void>;
  fetchNewMessages(userId: string, cursor?: string): Promise<EmailMessage[]>;
}

export interface ParsedEmailTransaction {
  userId: string;
  provider: EmailProviderName;
  externalMessageId: string;
  merchant: string;
  amount: number;
  currency: 'DOP' | 'USD' | 'EUR';
  transactionDate: string;
  rawDescription: string;
}

export interface EmailTransactionParser {
  parse(message: EmailMessage): Promise<ParsedEmailTransaction | null>;
}
