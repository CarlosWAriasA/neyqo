export type EmailProviderName = 'gmail' | 'outlook';
export type DominicanBankCode =
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
export type ParsedEmailTransactionEventType =
  | 'purchase'
  | 'reversal'
  | 'payment'
  | 'withdrawal'
  | 'deposit'
  | 'transfer'
  | 'unknown';
export type ParsedEmailTransactionStatus = 'approved' | 'declined' | 'pending' | 'unknown';

export interface EmailMessage {
  provider: EmailProviderName;
  externalMessageId: string;
  userId: string;
  receivedAt: string;
  subject?: string;
  safeSnippet?: string;
  bodyText?: string;
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
  bankCode: DominicanBankCode;
  eventType: ParsedEmailTransactionEventType;
  status: ParsedEmailTransactionStatus;
  productName?: string;
  cardLastDigits?: string;
  merchant: string;
  amount: number;
  currency: 'DOP' | 'USD' | 'EUR';
  transactionDate: string;
  rawDescription: string;
  confidence: number;
}

export interface EmailTransactionParserStrategy {
  readonly name: string;
  canParse(message: EmailMessage): boolean;
  parse(message: EmailMessage): Promise<ParsedEmailTransaction | null>;
}

export interface EmailTransactionParser {
  parse(message: EmailMessage): Promise<ParsedEmailTransaction | null>;
}
