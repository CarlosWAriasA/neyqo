import type { EmailMessage, EmailTransactionParser, ParsedEmailTransaction } from './types';

export class PendingEmailTransactionParser implements EmailTransactionParser {
  async parse(_message: EmailMessage): Promise<ParsedEmailTransaction | null> {
    return null;
  }
}
