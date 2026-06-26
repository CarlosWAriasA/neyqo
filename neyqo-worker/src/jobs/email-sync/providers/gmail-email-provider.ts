import type { DataSource } from 'typeorm';
import { ExternalConnection } from '../../../database/entities/external-connection.entity';
import type { EmailMessage, EmailProvider } from '../types';
import type { ExternalTokenCipher } from '../token-cipher';

export class GmailEmailProvider implements EmailProvider {
  readonly name = 'gmail' as const;

  constructor(
    private readonly dataSource: DataSource,
    private readonly tokenCipher: ExternalTokenCipher,
    private readonly config: {
      clientId: string;
      clientSecret: string;
    },
  ) {}

  decryptAccessToken(connection: ExternalConnection): string {
    return this.tokenCipher.decrypt(connection.encryptedAccessToken);
  }

  async refreshAccessTokenIfNeeded(connection: ExternalConnection): Promise<ExternalConnection> {
    if (!this.shouldRefresh(connection)) {
      return connection;
    }

    if (!connection.encryptedRefreshToken) {
      await this.markConnectionError(connection);
      throw new Error('La conexión de Gmail no tiene refresh token.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokenCipher.decrypt(connection.encryptedRefreshToken),
        grant_type: 'refresh_token',
      }).toString(),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!response.ok || !payload.access_token) {
      await this.markConnectionError(connection);
      throw new Error('Gmail rechazó el refresh token.');
    }

    connection.encryptedAccessToken = this.tokenCipher.encrypt(payload.access_token);
    connection.tokenExpiresAt = payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000)
      : connection.tokenExpiresAt;
    connection.status = 'connected';

    return this.dataSource.getRepository(ExternalConnection).save(connection);
  }

  async fetchNewMessages(
    connection: ExternalConnection,
    accessToken: string,
    options: { limit: number },
  ): Promise<EmailMessage[]> {
    const query = ['newer_than:30d', '(banesco OR qik)', '("RD$" OR "US$" OR consumo OR transaccion OR transacción)'].join(' ');
    const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    listUrl.searchParams.set('maxResults', String(options.limit));
    listUrl.searchParams.set('q', query);

    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      throw new Error('No fue posible leer mensajes de Gmail.');
    }

    const listPayload = (await listResponse.json()) as { messages?: Array<{ id: string }> };
    const messageIds = listPayload.messages?.map((message) => message.id).filter(Boolean) ?? [];
    const messages: EmailMessage[] = [];

    for (const messageId of messageIds) {
      const messageUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`);
      messageUrl.searchParams.set('format', 'full');

      const messageResponse = await fetch(messageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!messageResponse.ok) {
        continue;
      }

      const message = (await messageResponse.json()) as GmailApiMessage;
      messages.push({
        provider: this.name,
        externalMessageId: message.id,
        userId: connection.userId,
        receivedAt: message.internalDate
          ? new Date(Number(message.internalDate)).toISOString()
          : new Date().toISOString(),
        subject: getGmailHeader(message, 'Subject'),
        safeSnippet: message.snippet,
        bodyText: extractGmailText(message.payload),
      });
    }

    return messages;
  }

  private shouldRefresh(connection: ExternalConnection): boolean {
    if (!connection.tokenExpiresAt) {
      return false;
    }

    return connection.tokenExpiresAt.getTime() - Date.now() < 5 * 60_000;
  }

  private async markConnectionError(connection: ExternalConnection): Promise<void> {
    connection.status = 'error';
    await this.dataSource.getRepository(ExternalConnection).save(connection);
  }
}

interface GmailApiMessage {
  id: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailApiPayload;
}

interface GmailApiPayload {
  mimeType?: string;
  body?: { data?: string };
  headers?: Array<{ name?: string; value?: string }>;
  parts?: GmailApiPayload[];
}

function getGmailHeader(message: GmailApiMessage, name: string): string | undefined {
  return message.payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value;
}

function extractGmailText(payload: GmailApiPayload | undefined): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data));
  }

  const partsText = payload.parts
    ?.map((part) => extractGmailText(part))
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');

  return partsText || undefined;
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
