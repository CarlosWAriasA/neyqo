import type { EmailMessage, EmailProvider } from '../types';

export class GmailEmailProvider implements EmailProvider {
  readonly name = 'gmail' as const;

  async refreshAccessTokenIfNeeded(_userId: string): Promise<void> {
    throw new Error('Gmail email sync todavía no está implementado.');
  }

  async fetchNewMessages(_userId: string, _cursor?: string): Promise<EmailMessage[]> {
    throw new Error('Gmail email sync todavía no está implementado.');
  }
}
