import type { DataSource } from 'typeorm';
import { ExternalConnection } from '../../../database/entities/external-connection.entity';
import type { EmailMessage, EmailProvider } from '../types';
import type { ExternalTokenCipher } from '../token-cipher';

export class OutlookEmailProvider implements EmailProvider {
  readonly name = 'outlook' as const;

  constructor(
    private readonly dataSource: DataSource,
    private readonly tokenCipher: ExternalTokenCipher,
    private readonly config: {
      clientId: string;
      clientSecret: string;
      tenantId: string;
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
      throw new Error('La conexión de Outlook no tiene refresh token.');
    }

    const tenant = this.config.tenantId || 'common';
    const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
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
      refresh_token?: string;
      expires_in?: number;
    };

    if (!response.ok || !payload.access_token) {
      await this.markConnectionError(connection);
      throw new Error('Microsoft rechazó el refresh token.');
    }

    connection.encryptedAccessToken = this.tokenCipher.encrypt(payload.access_token);
    connection.encryptedRefreshToken = payload.refresh_token
      ? this.tokenCipher.encrypt(payload.refresh_token)
      : connection.encryptedRefreshToken;
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
    const url = new URL('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages');
    url.searchParams.set('$top', String(options.limit));
    url.searchParams.set('$orderby', 'receivedDateTime desc');
    url.searchParams.set('$select', 'id,subject,bodyPreview,receivedDateTime,body');

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.body-content-type="text"',
      },
    });

    if (!response.ok) {
      throw new Error('No fue posible leer mensajes de Outlook.');
    }

    const payload = (await response.json()) as {
      value?: OutlookApiMessage[];
    };

    return (payload.value ?? [])
      .filter((message) => isLikelyBankMessage([message.subject, message.bodyPreview, message.body?.content].join(' ')))
      .map((message) => ({
        provider: this.name,
        externalMessageId: message.id,
        userId: connection.userId,
        receivedAt: message.receivedDateTime ?? new Date().toISOString(),
        subject: message.subject,
        safeSnippet: message.bodyPreview,
        bodyText: message.body?.content,
      }));
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

interface OutlookApiMessage {
  id: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  body?: {
    content?: string;
  };
}

function isLikelyBankMessage(value: string): boolean {
  return /\b(banesco|qik)\b/i.test(value) && /(RD\$|US\$|consumo|transacci[oó]n)/i.test(value);
}
