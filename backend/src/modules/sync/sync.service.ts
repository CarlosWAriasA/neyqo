import { DataSource, QueryFailedError } from 'typeorm';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../../config/env';
import { Account } from '../../entities/account.entity';
import { Category } from '../../entities/category.entity';
import { EmailImportRule } from '../../entities/email-import-rule.entity';
import { ExternalConnection, type ExternalConnectionProvider } from '../../entities/external-connection.entity';
import { ImportedTransaction } from '../../entities/imported-transaction.entity';
import { AuthError } from '../auth/auth.service';
import type { TransactionsService } from '../transactions/transactions.service';
import type {
  CreateImportRuleInput,
  CreateInternalImportedTransactionInput,
  ListImportedTransactionsQuery,
  ListImportRulesQuery,
  UpdateImportedTransactionInput,
  UpdateImportRuleInput,
} from './sync.schemas';
import type { PaginatedResponse } from '../../utils/pagination';
import { encodeCursor, decodeCursor, toPaginatedResponse } from '../../utils/pagination';
import { z } from 'zod';

export interface EmailImportRuleResponse {
  id: string;
  bankCode: EmailImportRule['bankCode'];
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  productKind: EmailImportRule['productKind'];
  cardLastDigits?: string;
  merchantPattern?: string;
  status: EmailImportRule['status'];
  createdAt: string;
  updatedAt: string;
}

export interface ImportedTransactionResponse {
  id: string;
  provider: ImportedTransaction['provider'];
  externalMessageId: string;
  bankCode: ImportedTransaction['bankCode'];
  eventType: ImportedTransaction['eventType'];
  providerStatus: ImportedTransaction['providerStatus'];
  productName?: string;
  cardLastDigits?: string;
  merchant: string;
  amount: number;
  currency: ImportedTransaction['currency'];
  transactionDate: string;
  accountId?: string;
  accountName?: string;
  categoryId?: string;
  categoryName?: string;
  confidence: number;
  status: ImportedTransaction['status'];
  reviewNote?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalImportedTransactionResponse {
  importedTransaction: ImportedTransactionResponse;
  duplicate: boolean;
  matchedRuleId?: string;
}

export interface ExternalConnectionResponse {
  id: string;
  provider: ExternalConnection['provider'];
  email: string;
  status: ExternalConnection['status'];
  scopes: string[];
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MailOAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

const importedTransactionCursorSchema = z.object({
  transactionDate: z.string(),
  createdAt: z.string(),
  id: z.uuid(),
});

export class SyncService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionsService?: TransactionsService,
  ) {}

  async listExternalConnections(userId: string): Promise<ExternalConnectionResponse[]> {
    const connections = await this.dataSource.getRepository(ExternalConnection).find({
      where: { userId },
      order: { provider: 'ASC' },
    });

    return connections.map((connection) => this.toExternalConnectionResponse(connection));
  }

  buildMailOAuthUrl(userId: string, provider: ExternalConnectionProvider, state: string): string {
    if (!this.mailOAuthConfigured(provider)) {
      throw new AuthError(501, 'La conexión de correos no está configurada.');
    }

    if (provider === 'gmail') {
      const params = new URLSearchParams({
        client_id: env.googleClientId,
        redirect_uri: env.googleGmailRedirectUri,
        response_type: 'code',
        scope: this.gmailScopes().join(' '),
        state,
        access_type: 'offline',
        prompt: 'consent select_account',
        include_granted_scopes: 'true',
      });

      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    const tenant = env.microsoftTenantId || 'common';
    const params = new URLSearchParams({
      client_id: env.microsoftClientId,
      redirect_uri: env.microsoftMailRedirectUri,
      response_type: 'code',
      scope: this.outlookScopes().join(' '),
      state,
      prompt: 'select_account',
      response_mode: 'query',
    });

    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async completeMailOAuth(userId: string, provider: ExternalConnectionProvider, code: string): Promise<ExternalConnectionResponse> {
    if (!this.mailOAuthConfigured(provider)) {
      throw new AuthError(501, 'La conexión de correos no está configurada.');
    }

    const tokens = provider === 'gmail'
      ? await this.exchangeGoogleMailCode(code)
      : await this.exchangeMicrosoftMailCode(code);

    if (!tokens.access_token) {
      throw new AuthError(401, 'El proveedor no devolvió un access token válido.');
    }

    const profile = provider === 'gmail'
      ? await this.getGoogleEmailProfile(tokens.access_token)
      : await this.getMicrosoftEmailProfile(tokens.access_token);
    const scopes = this.resolveScopes(provider, tokens.scope);
    const now = new Date();
    const existing = await this.dataSource.getRepository(ExternalConnection).findOne({
      where: { userId, provider },
    });
    const encryptedAccessToken = this.encryptExternalToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? this.encryptExternalToken(tokens.refresh_token)
      : existing?.encryptedRefreshToken ?? null;
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : existing?.tokenExpiresAt ?? null;

    const connection = existing ?? this.dataSource.getRepository(ExternalConnection).create({ userId, provider });
    connection.email = profile.email.toLowerCase();
    connection.status = 'connected';
    connection.scopes = scopes;
    connection.encryptedAccessToken = encryptedAccessToken;
    connection.encryptedRefreshToken = encryptedRefreshToken;
    connection.tokenExpiresAt = tokenExpiresAt;
    connection.revokedAt = null;
    if (!connection.createdAt) {
      connection.createdAt = now;
    }

    const saved = await this.dataSource.getRepository(ExternalConnection).save(connection);
    return this.toExternalConnectionResponse(saved);
  }

  async listImportRules(userId: string, filters: ListImportRulesQuery): Promise<EmailImportRuleResponse[]> {
    const rules = await this.dataSource.getRepository(EmailImportRule).find({
      where: {
        userId,
        ...(filters.bankCode ? { bankCode: filters.bankCode } : {}),
        ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
      },
      relations: {
        account: true,
        category: true,
      },
      order: {
        status: 'ASC',
        bankCode: 'ASC',
        cardLastDigits: 'ASC',
        createdAt: 'DESC',
      },
    });

    return rules.map((rule) => this.toRuleResponse(rule));
  }

  async createImportRule(userId: string, payload: CreateImportRuleInput): Promise<EmailImportRuleResponse> {
    const { account, category } = await this.resolveOwnedTargets(userId, payload.accountId, payload.categoryId);
    const rule = this.dataSource.getRepository(EmailImportRule).create({
      userId,
      bankCode: payload.bankCode,
      accountId: account.id,
      categoryId: category.id,
      productKind: payload.productKind,
      cardLastDigits: payload.cardLastDigits ?? null,
      merchantPattern: payload.merchantPattern ?? null,
      status: 'active',
    });

    const savedRule = await this.dataSource.getRepository(EmailImportRule).save(rule);
    return this.toRuleResponse({ ...savedRule, account, category });
  }

  async updateImportRule(userId: string, ruleId: string, payload: UpdateImportRuleInput): Promise<EmailImportRuleResponse> {
    const rule = await this.findOwnedRule(userId, ruleId);

    if (payload.accountId || payload.categoryId) {
      const { account, category } = await this.resolveOwnedTargets(
        userId,
        payload.accountId ?? rule.accountId,
        payload.categoryId ?? rule.categoryId,
      );
      rule.account = account;
      rule.accountId = account.id;
      rule.category = category;
      rule.categoryId = category.id;
    }

    if (payload.bankCode !== undefined) rule.bankCode = payload.bankCode;
    if (payload.productKind !== undefined) rule.productKind = payload.productKind;
    if (payload.cardLastDigits !== undefined) rule.cardLastDigits = payload.cardLastDigits ?? null;
    if (payload.merchantPattern !== undefined) rule.merchantPattern = payload.merchantPattern ?? null;
    if (payload.status !== undefined) rule.status = payload.status;

    const savedRule = await this.dataSource.getRepository(EmailImportRule).save(rule);
    return this.toRuleResponse(await this.findOwnedRule(userId, savedRule.id));
  }

  async listImportedTransactions(
    userId: string,
    filters: ListImportedTransactionsQuery,
  ): Promise<PaginatedResponse<ImportedTransactionResponse>> {
    const cursor = decodeCursor(filters.cursor, importedTransactionCursorSchema);
    const query = this.dataSource
      .getRepository(ImportedTransaction)
      .createQueryBuilder('imported')
      .leftJoinAndSelect('imported.account', 'account')
      .leftJoinAndSelect('imported.category', 'category')
      .where('imported.userId = :userId', { userId });

    if (filters.status && filters.status !== 'all') {
      query.andWhere('imported.status = :status', { status: filters.status });
    }

    if (filters.bankCode) {
      query.andWhere('imported.bankCode = :bankCode', { bankCode: filters.bankCode });
    }

    if (cursor) {
      query.andWhere(
        '(imported.transactionDate < :cursorDate OR (imported.transactionDate = :cursorDate AND imported.createdAt < :cursorCreatedAt) OR (imported.transactionDate = :cursorDate AND imported.createdAt = :cursorCreatedAt AND imported.id < :cursorId))',
        {
          cursorDate: cursor.transactionDate,
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        },
      );
    }

    const rows = await query
      .orderBy('imported.transactionDate', 'DESC')
      .addOrderBy('imported.createdAt', 'DESC')
      .addOrderBy('imported.id', 'DESC')
      .take(filters.limit + 1)
      .getMany();

    const paginated = toPaginatedResponse(rows, filters.limit, (row) =>
      encodeCursor({
        transactionDate: row.transactionDate,
        createdAt: row.createdAt.toISOString(),
        id: row.id,
      }),
    );

    return {
      items: paginated.items.map((item) => this.toImportedResponse(item)),
      pageInfo: paginated.pageInfo,
    };
  }

  async updateImportedTransaction(
    userId: string,
    importedTransactionId: string,
    payload: UpdateImportedTransactionInput,
  ): Promise<ImportedTransactionResponse> {
    const imported = await this.findOwnedImportedTransaction(userId, importedTransactionId);

    if (payload.accountId || payload.categoryId) {
      const { account, category } = await this.resolveOwnedTargets(
        userId,
        payload.accountId ?? imported.accountId ?? '',
        payload.categoryId ?? imported.categoryId ?? '',
      );
      imported.accountId = account.id;
      imported.account = account;
      imported.categoryId = category.id;
      imported.category = category;
    }

    if (payload.status !== undefined) imported.status = payload.status;
    if (payload.reviewNote !== undefined) imported.reviewNote = payload.reviewNote || null;

    const saved = await this.dataSource.getRepository(ImportedTransaction).save(imported);
    return this.toImportedResponse(await this.findOwnedImportedTransaction(userId, saved.id));
  }

  async createInternalImportedTransaction(
    payload: CreateInternalImportedTransactionInput,
  ): Promise<InternalImportedTransactionResponse> {
    const existing = await this.dataSource.getRepository(ImportedTransaction).findOne({
      where: {
        userId: payload.userId,
        provider: payload.provider,
        externalMessageId: payload.externalMessageId,
      },
      relations: {
        account: true,
        category: true,
      },
    });

    if (existing) {
      return {
        importedTransaction: this.toImportedResponse(existing),
        duplicate: true,
      };
    }

    const matchedRule = await this.findMatchingRule(payload);
    const canAutoImport =
      Boolean(matchedRule) &&
      payload.eventType === 'purchase' &&
      payload.providerStatus === 'approved' &&
      payload.confidence >= 0.85;

    try {
      let transactionId: string | null = null;
      let status: ImportedTransaction['status'] = canAutoImport ? 'ready_for_review' : 'needs_review';
      let reviewNote: string | null = matchedRule ? null : 'No encontramos una regla activa para asociar este correo con una cuenta.';

      if (canAutoImport && matchedRule && this.transactionsService) {
        const result = await this.transactionsService.createInternal({
          userId: payload.userId,
          source: 'email_sync',
          type: 'expense',
          amount: payload.amount,
          sourceAccountId: matchedRule.accountId,
          categoryId: matchedRule.categoryId,
          description: payload.merchant,
          date: payload.transactionDate,
          status: 'completed',
          note: `Importado desde ${payload.bankCode} (${payload.provider}). Mensaje: ${payload.externalMessageId}`,
        });
        transactionId = result.transaction.id;
        status = 'imported';
      } else if (canAutoImport && !this.transactionsService) {
        reviewNote = 'La detección tiene regla válida, pero el importador automático no está disponible.';
      }

      const imported = this.dataSource.getRepository(ImportedTransaction).create({
        userId: payload.userId,
        provider: payload.provider,
        externalMessageId: payload.externalMessageId,
        bankCode: payload.bankCode,
        eventType: payload.eventType,
        providerStatus: payload.providerStatus,
        productName: payload.productName ?? null,
        cardLastDigits: payload.cardLastDigits ?? null,
        merchant: payload.merchant,
        amount: payload.amount.toFixed(2),
        currency: payload.currency,
        transactionDate: payload.transactionDate,
        accountId: matchedRule?.accountId ?? null,
        categoryId: matchedRule?.categoryId ?? null,
        confidence: payload.confidence.toFixed(3),
        rawDescription: payload.rawDescription,
        status,
        reviewNote,
        transactionId,
      });

      const saved = await this.dataSource.getRepository(ImportedTransaction).save(imported);
      return {
        importedTransaction: this.toImportedResponse(await this.findOwnedImportedTransaction(payload.userId, saved.id)),
        duplicate: false,
        matchedRuleId: matchedRule?.id,
      };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const duplicate = await this.dataSource.getRepository(ImportedTransaction).findOneOrFail({
          where: {
            userId: payload.userId,
            provider: payload.provider,
            externalMessageId: payload.externalMessageId,
          },
          relations: {
            account: true,
            category: true,
          },
        });

        return {
          importedTransaction: this.toImportedResponse(duplicate),
          duplicate: true,
        };
      }

      throw error;
    }
  }

  private async resolveOwnedTargets(userId: string, accountId: string, categoryId: string) {
    const [account, category] = await Promise.all([
      this.dataSource.getRepository(Account).findOne({ where: { id: accountId, userId } }),
      this.dataSource.getRepository(Category).findOne({ where: { id: categoryId, userId } }),
    ]);

    if (!account) {
      throw new AuthError(404, 'No encontramos esa cuenta.');
    }

    if (account.status !== 'active') {
      throw new AuthError(400, 'La cuenta asociada debe estar activa.');
    }

    if (!category) {
      throw new AuthError(404, 'No encontramos esa categoría.');
    }

    if (category.status !== 'active' || category.type !== 'expense') {
      throw new AuthError(400, 'La categoría asociada debe ser de gasto y estar activa.');
    }

    return { account, category };
  }

  private async findOwnedRule(userId: string, ruleId: string): Promise<EmailImportRule> {
    const rule = await this.dataSource.getRepository(EmailImportRule).findOne({
      where: {
        id: ruleId,
        userId,
      },
      relations: {
        account: true,
        category: true,
      },
    });

    if (!rule) {
      throw new AuthError(404, 'No encontramos esa regla de importación.');
    }

    return rule;
  }

  private async findOwnedImportedTransaction(userId: string, importedTransactionId: string): Promise<ImportedTransaction> {
    const imported = await this.dataSource.getRepository(ImportedTransaction).findOne({
      where: {
        id: importedTransactionId,
        userId,
      },
      relations: {
        account: true,
        category: true,
      },
    });

    if (!imported) {
      throw new AuthError(404, 'No encontramos esa transacción detectada.');
    }

    return imported;
  }

  private async findMatchingRule(payload: CreateInternalImportedTransactionInput): Promise<EmailImportRule | null> {
    const rules = await this.dataSource.getRepository(EmailImportRule).find({
      where: {
        userId: payload.userId,
        bankCode: payload.bankCode,
        status: 'active',
      },
      relations: {
        account: true,
        category: true,
      },
      order: {
        cardLastDigits: 'DESC',
        merchantPattern: 'DESC',
        createdAt: 'DESC',
      },
    });

    return (
      rules.find((rule) => {
        const cardMatches = !rule.cardLastDigits || rule.cardLastDigits === payload.cardLastDigits;
        const merchantMatches =
          !rule.merchantPattern ||
          payload.merchant.toLowerCase().includes(rule.merchantPattern.toLowerCase());

        return cardMatches && merchantMatches;
      }) ?? null
    );
  }

  private isUniqueViolation(error: unknown) {
    return error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505';
  }

  private mailOAuthConfigured(provider: ExternalConnectionProvider) {
    if (!env.externalTokenEncryptionKey) {
      return false;
    }

    if (provider === 'gmail') {
      return Boolean(env.googleClientId && env.googleClientSecret && env.googleGmailRedirectUri);
    }

    return Boolean(env.microsoftClientId && env.microsoftClientSecret && env.microsoftMailRedirectUri);
  }

  private gmailScopes() {
    return ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'];
  }

  private outlookScopes() {
    return ['openid', 'email', 'profile', 'offline_access', 'User.Read', 'Mail.Read'];
  }

  private resolveScopes(provider: ExternalConnectionProvider, scope?: string) {
    return scope?.split(/\s+/).filter(Boolean) ?? (provider === 'gmail' ? this.gmailScopes() : this.outlookScopes());
  }

  private async exchangeGoogleMailCode(code: string): Promise<MailOAuthTokenResponse> {
    const body = new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      redirect_uri: env.googleGmailRedirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible intercambiar el código de Gmail.');
    }

    return (await response.json()) as MailOAuthTokenResponse;
  }

  private async exchangeMicrosoftMailCode(code: string): Promise<MailOAuthTokenResponse> {
    const tenant = env.microsoftTenantId || 'common';
    const body = new URLSearchParams({
      client_id: env.microsoftClientId,
      client_secret: env.microsoftClientSecret,
      code,
      redirect_uri: env.microsoftMailRedirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible intercambiar el código de Outlook.');
    }

    return (await response.json()) as MailOAuthTokenResponse;
  }

  private async getGoogleEmailProfile(accessToken: string): Promise<{ email: string }> {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible obtener el correo de Google.');
    }

    const data = (await response.json()) as { email?: string };

    if (!data.email) {
      throw new AuthError(401, 'Google no devolvió una dirección de correo.');
    }

    return { email: data.email };
  }

  private async getMicrosoftEmailProfile(accessToken: string): Promise<{ email: string }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible obtener el correo de Microsoft.');
    }

    const data = (await response.json()) as { mail?: string; userPrincipalName?: string };
    const email = data.mail || data.userPrincipalName;

    if (!email) {
      throw new AuthError(401, 'Microsoft no devolvió una dirección de correo.');
    }

    return { email };
  }

  private encryptExternalToken(token: string) {
    if (!env.externalTokenEncryptionKey) {
      throw new AuthError(503, 'La llave de cifrado de conexiones externas no está configurada.');
    }

    const key = createHash('sha256').update(env.externalTokenEncryptionKey).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
  }

  private toRuleResponse(rule: EmailImportRule): EmailImportRuleResponse {
    return {
      id: rule.id,
      bankCode: rule.bankCode,
      accountId: rule.accountId,
      accountName: rule.account.name,
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      productKind: rule.productKind,
      cardLastDigits: rule.cardLastDigits ?? undefined,
      merchantPattern: rule.merchantPattern ?? undefined,
      status: rule.status,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  private toImportedResponse(imported: ImportedTransaction): ImportedTransactionResponse {
    return {
      id: imported.id,
      provider: imported.provider,
      externalMessageId: imported.externalMessageId,
      bankCode: imported.bankCode,
      eventType: imported.eventType,
      providerStatus: imported.providerStatus,
      productName: imported.productName ?? undefined,
      cardLastDigits: imported.cardLastDigits ?? undefined,
      merchant: imported.merchant,
      amount: Number(imported.amount),
      currency: imported.currency,
      transactionDate: imported.transactionDate,
      accountId: imported.accountId ?? undefined,
      accountName: imported.account?.name,
      categoryId: imported.categoryId ?? undefined,
      categoryName: imported.category?.name,
      confidence: Number(imported.confidence),
      status: imported.status,
      reviewNote: imported.reviewNote ?? undefined,
      transactionId: imported.transactionId ?? undefined,
      createdAt: imported.createdAt.toISOString(),
      updatedAt: imported.updatedAt.toISOString(),
    };
  }

  private toExternalConnectionResponse(connection: ExternalConnection): ExternalConnectionResponse {
    return {
      id: connection.id,
      provider: connection.provider,
      email: connection.email,
      status: connection.status,
      scopes: connection.scopes,
      lastSyncAt: connection.lastSyncAt?.toISOString(),
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }
}
