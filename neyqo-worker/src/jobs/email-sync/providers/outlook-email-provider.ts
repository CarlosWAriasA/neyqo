import type { EmailMessage, EmailProvider } from '../types';

export class OutlookEmailProvider implements EmailProvider {
  readonly name = 'outlook' as const;

  async refreshAccessTokenIfNeeded(_userId: string): Promise<void> {
    throw new Error('Outlook email sync todavía no está implementado.');
  }

  async fetchNewMessages(_userId: string, _cursor?: string): Promise<EmailMessage[]> {
    throw new Error('Outlook email sync todavía no está implementado.');
  }
}
