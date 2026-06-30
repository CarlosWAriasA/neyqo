import bcrypt from 'bcryptjs';
import { createHash, randomInt, randomUUID } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { IsNull, type DataSource, type Repository } from 'typeorm';
import { env } from '../../config/env';
import { Account } from '../../entities/account.entity';
import { AuthIdentity } from '../../entities/auth-identity.entity';
import { AuthSession } from '../../entities/auth-session.entity';
import { Budget } from '../../entities/budget.entity';
import { BudgetPeriodRecord } from '../../entities/budget-period.entity';
import { Category } from '../../entities/category.entity';
import { EmailImportRule } from '../../entities/email-import-rule.entity';
import { EmailSyncedMessage } from '../../entities/email-synced-message.entity';
import { ExternalConnection } from '../../entities/external-connection.entity';
import { ImportedTransaction } from '../../entities/imported-transaction.entity';
import { ScheduledTransaction } from '../../entities/scheduled-transaction.entity';
import { Transaction } from '../../entities/transaction.entity';
import { UserPreference } from '../../entities/user-preference.entity';
import type { AuthProvider } from '../../entities/user.entity';
import { User } from '../../entities/user.entity';
import type { AccountsService } from '../accounts/accounts.service';
import type { BudgetsService } from '../budgets/budgets.service';
import type { CategoriesService } from '../categories/categories.service';
import type { PreferencesService } from '../preferences/preferences.service';
import type { ScheduledTransactionsService } from '../scheduled-transactions/scheduled-transactions.service';
import { AuthEmailDeliveryError, AuthEmailService } from './auth-email.service';
import type {
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  ResendVerificationCodeInput,
  DeleteAccountInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.schemas';

interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  sid?: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
  sid?: string;
  type: 'refresh';
}

interface GoogleUserProfile {
  sub: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface MicrosoftUserProfile {
  sub: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  providers: AuthProvider[];
  emailVerified: boolean;
  hasPasswordAccess: boolean;
  hasGoogleAccess: boolean;
  hasMicrosoftAccess: boolean;
  avatarUrl?: string;
  initialDataNoticeShown: boolean;
  createdAt: string;
}

export interface AuthSessionResponse {
  user: PublicUser;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthActionResponse {
  message: string;
  email?: string;
}

export interface AuthSessionDevice {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  current: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const providerSortOrder: AuthProvider[] = ['email', 'google', 'microsoft'];
const invalidVerificationEmailMessage =
  'No pudimos confirmar ese correo. Revisa la dirección e inténtalo nuevamente.';
const verificationEmailSendFailedMessage =
  'No pudimos enviar el código de verificación. Intenta nuevamente.';
const deviceIdCookieName = 'neyqo.device-id';
const deviceIdCookieMaxAgeSeconds = 60 * 60 * 24 * 730;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: Repository<User>,
    private readonly authEmailService: AuthEmailService,
    private readonly authIdentityRepository: Repository<AuthIdentity>,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
    private readonly budgetsService: BudgetsService,
    private readonly preferencesService: PreferencesService,
    private readonly scheduledTransactionsService: ScheduledTransactionsService,
  ) {}

  async register(payload: RegisterInput): Promise<AuthActionResponse> {
    const existingUser = await this.findByEmail(payload.email);

    if (existingUser) {
      const socialProvider = this.getSocialOnlyProvider(existingUser);

      if (socialProvider) {
        throw new AuthError(409, this.getSocialLoginMessage(socialProvider));
      }

      throw new AuthError(
        409,
        'Ya existe una cuenta con ese correo. Inicia sesión con tu correo y contraseña.',
      );
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = this.usersRepository.create({
      fullName: payload.fullName.trim(),
      email: payload.email,
      passwordHash,
      emailVerified: false,
      avatarUrl: null,
      initialDataNoticeShown: false,
      emailVerificationCodeHash: null,
      emailVerificationCodeExpiresAt: null,
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      lastLoginAt: null,
    });

    const savedUser = await this.usersRepository.save(user);
    await this.ensureIdentity({
      userId: savedUser.id,
      provider: 'email',
      providerUserId: savedUser.email,
      providerEmail: savedUser.email,
    });

    try {
      await this.issueEmailVerificationCode(savedUser);
    } catch (error) {
      await this.discardPendingRegistration(savedUser.id);

      if (error instanceof AuthEmailDeliveryError) {
        if (error.reason === 'recipientRejected') {
          throw new AuthError(400, invalidVerificationEmailMessage);
        }

        throw new AuthError(503, verificationEmailSendFailedMessage);
      }

      throw error;
    }

    return {
      message: 'Te enviamos un codigo para confirmar tu correo.',
      email: savedUser.email,
    };
  }

  async verifyEmail(
    payload: VerifyEmailInput,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    const user = await this.findByEmailWithVerificationCode(payload.email);

    if (!user) {
      throw new AuthError(400, 'El codigo no es valido o ya expiro.');
    }

    if (user.emailVerified) {
      throw new AuthError(409, 'Esta cuenta ya fue verificada.');
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationCodeExpiresAt ||
      user.emailVerificationCodeExpiresAt.getTime() < Date.now() ||
      user.emailVerificationCodeHash !== this.hashCode(payload.code)
    ) {
      throw new AuthError(400, 'El codigo no es valido o ya expiro.');
    }

    await this.usersRepository.update(
      {
        id: user.id,
      },
      {
        emailVerified: true,
        emailVerificationCodeHash: null,
        emailVerificationCodeExpiresAt: null,
      },
    );

    const verifiedUser = await this.findById(user.id);

    if (!verifiedUser) {
      throw new Error('No fue posible recuperar la cuenta verificada.');
    }

    await this.authEmailService.sendWelcomeEmail({
      to: verifiedUser.email,
      fullName: verifiedUser.fullName,
    });

    return this.createSession(verifiedUser, reply, request);
  }

  async resendEmailVerificationCode(
    payload: ResendVerificationCodeInput,
  ): Promise<AuthActionResponse> {
    const user = await this.findByEmail(payload.email);

    if (user && !user.emailVerified) {
      await this.issueEmailVerificationCode(user);
    }

    return {
      message: 'Si la cuenta existe, te enviamos un nuevo codigo.',
      email: payload.email,
    };
  }

  async login(
    payload: LoginInput,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    const user = await this.findByEmailWithPassword(payload.email);

    if (!user) {
      throw new AuthError(401, 'Correo o contraseña incorrectos.');
    }

    if (!this.userCanLoginWithPassword(user)) {
      const socialProvider = this.getSocialOnlyProvider(user);

      if (socialProvider) {
        throw new AuthError(401, this.getSocialLoginMessage(socialProvider));
      }

      throw new AuthError(401, 'Correo o contraseña incorrectos.');
    }

    if (!user.emailVerified) {
      throw new AuthError(403, 'Confirma tu correo antes de iniciar sesión.');
    }

    const passwordHash = user.passwordHash;

    if (!passwordHash) {
      throw new AuthError(401, 'Correo o contraseña incorrectos.');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, passwordHash);

    if (!isPasswordValid) {
      throw new AuthError(401, 'Correo o contraseña incorrectos.');
    }

    return this.createSession(user, reply, request);
  }

  async loginWithGoogle(
    payload: GoogleLoginInput,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    if (!env.googleClientId) {
      throw new AuthError(500, 'Google no está configurado en el backend.');
    }

    const googleProfile = await this.getGoogleUserProfile(payload.accessToken);
    const existingByGoogleSub = await this.findByIdentity('google', googleProfile.sub);

    if (existingByGoogleSub) {
      if (this.getPrimaryProvider(existingByGoogleSub) !== 'google') {
        throw new AuthError(409, this.getExistingAccountLoginMessage(existingByGoogleSub));
      }

      await this.usersRepository.update(
        {
          id: existingByGoogleSub.id,
        },
        {
          emailVerified: true,
          emailVerificationCodeHash: null,
          emailVerificationCodeExpiresAt: null,
          avatarUrl: existingByGoogleSub.avatarUrl ?? googleProfile.avatarUrl ?? null,
        },
      );

      await this.ensureIdentity({
        userId: existingByGoogleSub.id,
        provider: 'google',
        providerUserId: googleProfile.sub,
        providerEmail: googleProfile.email,
      });

      const savedUser = await this.findById(existingByGoogleSub.id);

      if (!savedUser) {
        throw new Error('No fue posible recuperar la cuenta vinculada con Google.');
      }

      return this.createSession(savedUser, reply, request);
    }

    const existingByEmail = await this.findByEmail(googleProfile.email);

    if (existingByEmail) {
      throw new AuthError(409, this.getExistingAccountLoginMessage(existingByEmail));
    }

    const user = this.usersRepository.create({
      fullName: googleProfile.fullName,
      email: googleProfile.email,
      emailVerified: true,
      avatarUrl: googleProfile.avatarUrl ?? null,
      initialDataNoticeShown: false,
      passwordHash: null,
      emailVerificationCodeHash: null,
      emailVerificationCodeExpiresAt: null,
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      lastLoginAt: null,
    });

    const savedUser = await this.usersRepository.save(user);

    await this.ensureIdentity({
      userId: savedUser.id,
      provider: 'google',
      providerUserId: googleProfile.sub,
      providerEmail: googleProfile.email,
    });

    await this.authEmailService.sendWelcomeEmail({
      to: savedUser.email,
      fullName: savedUser.fullName,
    });

    return this.createSession(savedUser, reply, request);
  }

  async requestPasswordReset(payload: ForgotPasswordInput): Promise<AuthActionResponse> {
    const user = await this.findByEmailWithPassword(payload.email);

    if (user) {
      const socialProvider = this.getSocialOnlyProvider(user);

      if (socialProvider) {
        return {
          message: this.getSocialLoginMessage(socialProvider),
          email: payload.email,
        };
      }
    }

    if (user && user.emailVerified && this.userCanLoginWithPassword(user)) {
      await this.issuePasswordResetCode(user);
    }

    return {
      message: 'Si la cuenta existe, te enviamos un codigo para continuar.',
      email: payload.email,
    };
  }

  async resetPassword(payload: ResetPasswordInput): Promise<AuthActionResponse> {
    const user = await this.findByEmailWithPasswordResetCode(payload.email);

    if (user) {
      const socialProvider = this.getSocialOnlyProvider(user);

      if (socialProvider) {
        throw new AuthError(409, this.getSocialLoginMessage(socialProvider));
      }
    }

    if (
      !user ||
      !user.emailVerified ||
      !user.passwordResetCodeHash ||
      !user.passwordResetCodeExpiresAt ||
      user.passwordResetCodeExpiresAt.getTime() < Date.now() ||
      user.passwordResetCodeHash !== this.hashCode(payload.code)
    ) {
      throw new AuthError(400, 'El codigo no es valido o ya expiro.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    await this.usersRepository.update(
      {
        id: user.id,
      },
      {
        passwordHash,
        emailVerified: true,
        passwordResetCodeHash: null,
        passwordResetCodeExpiresAt: null,
      },
    );

    await this.clearPersistedRefreshToken(user.id);

    await this.ensureIdentity({
      userId: user.id,
      provider: 'email',
      providerUserId: user.email,
      providerEmail: user.email,
    });

    return {
      message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
      email: user.email,
    };
  }

  async refreshSession(
    refreshToken: string | undefined,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    if (!refreshToken) {
      throw new AuthError(401, 'No hay refresh token disponible.');
    }

    const payload = this.verifyRefreshToken(refreshToken);

    if (!payload.sid) {
      const legacyUser = await this.findByIdWithRefreshToken(payload.sub);

      if (!legacyUser || !legacyUser.refreshTokenHash) {
        throw new AuthError(401, 'La sesión ya no es válida.');
      }

      if (legacyUser.refreshTokenExpiresAt && legacyUser.refreshTokenExpiresAt.getTime() < Date.now()) {
        await this.clearPersistedRefreshToken(legacyUser.id);
        throw new AuthError(401, 'El refresh token expiró.');
      }

      const legacyRefreshTokenMatches = await bcrypt.compare(refreshToken, legacyUser.refreshTokenHash);

      if (!legacyRefreshTokenMatches) {
        throw new AuthError(401, 'La sesión ya no es válida.');
      }

      await this.clearPersistedRefreshToken(legacyUser.id);
      return this.createSession(legacyUser, reply, request);
    }

    const session = payload.sid ? await this.findSessionWithRefreshToken(payload.sid, payload.sub) : null;

    if (!session || session.revokedAt) {
      throw new AuthError(401, 'La sesión ya no es válida.');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.revokePersistedSession(session.id, payload.sub);
      throw new AuthError(401, 'El refresh token expiró.');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, session.refreshTokenHash);

    if (!refreshTokenMatches) {
      throw new AuthError(401, 'La sesión ya no es válida.');
    }

    const user = await this.findById(payload.sub);

    if (!user) {
      throw new AuthError(401, 'El usuario de la sesión no existe.');
    }

    return this.rotateSession(user, session, reply, request);
  }

  async getCurrentUser(accessToken: string | undefined): Promise<PublicUser> {
    if (!accessToken) {
      throw new AuthError(401, 'Falta el access token.');
    }

    const payload = this.verifyAccessToken(accessToken);
    const user = await this.findById(payload.sub);

    if (!user) {
      throw new AuthError(401, 'El usuario de la sesión no existe.');
    }

    return this.toPublicUser(user);
  }

  async initializeUserData(accessToken: string | undefined): Promise<PublicUser> {
    if (!accessToken) {
      throw new AuthError(401, 'Falta el access token.');
    }

    const payload = this.verifyAccessToken(accessToken);
    const user = await this.findById(payload.sub);

    if (!user) {
      throw new AuthError(401, 'El usuario de la sesión no existe.');
    }

    await this.createInitialFinancialRecords(user.id);

    if (!user.initialDataNoticeShown) {
      await this.usersRepository.update(
        {
          id: user.id,
        },
        {
          initialDataNoticeShown: true,
        },
      );
    }

    const persistedUser = await this.findById(user.id);

    if (!persistedUser) {
      throw new Error('No fue posible recuperar el usuario tras inicializar sus datos.');
    }

    return this.toPublicUser(persistedUser);
  }

  async logout(refreshToken: string | undefined, reply: FastifyReply): Promise<void> {
    if (refreshToken) {
      try {
        const payload = this.verifyRefreshToken(refreshToken);
        if (payload.sid) {
          await this.revokePersistedSession(payload.sid, payload.sub);
        } else {
          await this.clearPersistedRefreshToken(payload.sub);
        }
      } catch {
        // Si el token ya no es válido, igualmente limpiamos la cookie.
      }
    }

    this.clearRefreshCookie(reply);
  }

  async listSessions(accessToken: string | undefined): Promise<{ sessions: AuthSessionDevice[] }> {
    const payload = this.verifyRequiredAccessToken(accessToken);
    const sessions = await this.dataSource.getRepository(AuthSession).find({
      where: {
        userId: payload.sub,
        revokedAt: IsNull(),
      },
      order: {
        lastUsedAt: 'DESC',
      },
    });
    const now = Date.now();

    return {
      sessions: sessions
        .filter((session) => session.expiresAt.getTime() > now)
        .map((session) => this.toSessionDevice(session, payload.sid)),
    };
  }

  async revokeSession(
    accessToken: string | undefined,
    refreshToken: string | undefined,
    sessionId: string,
    reply: FastifyReply,
  ): Promise<{ revokedCurrentSession: boolean }> {
    const payload = this.verifyRequiredAccessToken(accessToken);
    const session = await this.dataSource.getRepository(AuthSession).findOne({
      where: {
        id: sessionId,
        userId: payload.sub,
      },
    });

    if (!session) {
      throw new AuthError(404, 'No encontramos esa sesión.');
    }

    await this.revokePersistedSession(session.id, payload.sub);
    const revokedCurrentSession = session.id === payload.sid || this.refreshTokenBelongsToSession(refreshToken, session.id);

    if (revokedCurrentSession) {
      this.clearRefreshCookie(reply);
    }

    return { revokedCurrentSession };
  }

  async revokeOtherSessions(
    accessToken: string | undefined,
    reply: FastifyReply,
  ): Promise<{ revokedCount: number }> {
    const payload = this.verifyRequiredAccessToken(accessToken);

    if (!payload.sid) {
      const result = await this.dataSource.getRepository(AuthSession).update(
        {
          userId: payload.sub,
          revokedAt: IsNull(),
        },
        {
          revokedAt: new Date(),
        },
      );
      this.clearRefreshCookie(reply);
      return { revokedCount: result.affected ?? 0 };
    }

    const result = await this.dataSource
      .getRepository(AuthSession)
      .createQueryBuilder()
      .update(AuthSession)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId: payload.sub })
      .andWhere('id != :sessionId', { sessionId: payload.sid })
      .andWhere('revoked_at IS NULL')
      .execute();

    return { revokedCount: result.affected ?? 0 };
  }

  async revokeAllSessions(
    accessToken: string | undefined,
    reply: FastifyReply,
  ): Promise<{ revokedCount: number }> {
    const payload = this.verifyRequiredAccessToken(accessToken);
    const result = await this.dataSource.getRepository(AuthSession).update(
      {
        userId: payload.sub,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );

    this.clearRefreshCookie(reply);
    return { revokedCount: result.affected ?? 0 };
  }

  async deleteOwnAccount(
    accessToken: string | undefined,
    payload: DeleteAccountInput,
    reply: FastifyReply,
  ): Promise<{ userId: string }> {
    if (payload.confirmationText !== 'ELIMINAR MI CUENTA' || payload.acceptedIrreversibleDeletion !== true) {
      throw new AuthError(400, 'Confirmación de eliminación inválida.');
    }

    const sessionUser = await this.getCurrentUser(accessToken);
    const user = await this.findById(sessionUser.id);

    if (!user) {
      throw new AuthError(401, 'El usuario de la sesión no existe.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EmailSyncedMessage, { userId: user.id });
      await manager.delete(ImportedTransaction, { userId: user.id });
      await manager.delete(EmailImportRule, { userId: user.id });
      await manager.delete(ExternalConnection, { userId: user.id });
      await manager.delete(BudgetPeriodRecord, { userId: user.id });
      await manager
        .createQueryBuilder()
        .delete()
        .from('budget_categories')
        .where('budget_id IN (SELECT id FROM budgets WHERE user_id = :userId)', { userId: user.id })
        .execute();
      await manager.delete(Budget, { userId: user.id });
      await manager.delete(Transaction, { userId: user.id });
      await manager.delete(ScheduledTransaction, { userId: user.id });
      await manager.delete(Account, { userId: user.id });
      await manager.delete(Category, { userId: user.id });
      await manager.delete(UserPreference, { userId: user.id });
      await manager.delete(AuthIdentity, { userId: user.id });
      await manager.delete(User, { id: user.id });
    });

    this.clearRefreshCookie(reply);
    this.clearDeviceIdCookie(reply);
    return { userId: user.id };
  }

  private async createSession(
    user: User,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    const accessTokenExpiresIn = env.jwtAccessExpiresIn as SignOptions['expiresIn'];
    const refreshTokenExpiresIn = env.jwtRefreshExpiresIn as SignOptions['expiresIn'];
    const refreshTokenExpiresAt = this.resolveFutureDate(env.jwtRefreshExpiresIn);
    const now = new Date();
    const deviceId = this.getOrCreateDeviceId(request, reply);
    const session = await this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(AuthSession);

      await sessionRepository
        .createQueryBuilder()
        .update(AuthSession)
        .set({ revokedAt: now })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('device_id = :deviceId', { deviceId })
        .andWhere('revoked_at IS NULL')
        .execute();

      return sessionRepository.save(
        sessionRepository.create({
          userId: user.id,
          refreshTokenHash: 'pending',
          userAgent: this.getUserAgent(request),
          ipAddress: this.getRequestIp(request),
          deviceId,
          lastUsedAt: now,
          expiresAt: refreshTokenExpiresAt,
          revokedAt: null,
        }),
      );
    });

    const accessToken = jwt.sign(
      {
        sub: user.id,
        sid: session.id,
        email: user.email,
        type: 'access',
      } satisfies AccessTokenPayload,
      env.jwtAccessSecret,
      {
        expiresIn: accessTokenExpiresIn,
      },
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        sid: session.id,
        type: 'refresh',
      } satisfies RefreshTokenPayload,
      env.jwtRefreshSecret,
      {
        expiresIn: refreshTokenExpiresIn,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.dataSource
      .getRepository(AuthSession)
      .update({ id: session.id }, { refreshTokenHash });
    await this.usersRepository.update({ id: user.id }, { lastLoginAt: now });

    const persistedUser = await this.findById(user.id);

    if (!persistedUser) {
      throw new Error('No fue posible recuperar el usuario tras crear la sesión.');
    }

    this.setRefreshCookie(reply, refreshToken, refreshTokenExpiresAt);

    return {
      user: this.toPublicUser(persistedUser),
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.jwtAccessExpiresIn,
    };
  }

  private async rotateSession(
    user: User,
    session: AuthSession,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    const accessTokenExpiresIn = env.jwtAccessExpiresIn as SignOptions['expiresIn'];
    const refreshTokenExpiresIn = env.jwtRefreshExpiresIn as SignOptions['expiresIn'];
    const refreshTokenExpiresAt = this.resolveFutureDate(env.jwtRefreshExpiresIn);
    const now = new Date();
    const deviceId = this.getOrCreateDeviceId(request, reply);

    const accessToken = jwt.sign(
      {
        sub: user.id,
        sid: session.id,
        email: user.email,
        type: 'access',
      } satisfies AccessTokenPayload,
      env.jwtAccessSecret,
      {
        expiresIn: accessTokenExpiresIn,
      },
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        sid: session.id,
        type: 'refresh',
      } satisfies RefreshTokenPayload,
      env.jwtRefreshSecret,
      {
        expiresIn: refreshTokenExpiresIn,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(AuthSession);

      await sessionRepository
        .createQueryBuilder()
        .update(AuthSession)
        .set({ revokedAt: now })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('device_id = :deviceId', { deviceId })
        .andWhere('id != :sessionId', { sessionId: session.id })
        .andWhere('revoked_at IS NULL')
        .execute();

      await sessionRepository.update(
        {
          id: session.id,
        },
        {
          refreshTokenHash,
          userAgent: this.getUserAgent(request) ?? session.userAgent,
          ipAddress: this.getRequestIp(request) ?? session.ipAddress,
          deviceId,
          lastUsedAt: now,
          expiresAt: refreshTokenExpiresAt,
        },
      );
    });
    await this.usersRepository.update({ id: user.id }, { lastLoginAt: now });

    const persistedUser = await this.findById(user.id);

    if (!persistedUser) {
      throw new Error('No fue posible recuperar el usuario tras refrescar la sesión.');
    }

    this.setRefreshCookie(reply, refreshToken, refreshTokenExpiresAt);

    return {
      user: this.toPublicUser(persistedUser),
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.jwtAccessExpiresIn,
    };
  }

  private setRefreshCookie(reply: FastifyReply, refreshToken: string, expiresAt: Date): void {
    reply.setCookie(env.jwtRefreshCookieName, refreshToken, {
      httpOnly: true,
      sameSite: env.cookieSameSite,
      secure: env.cookieSecure,
      path: '/api/auth',
      domain: env.cookieDomain,
      expires: expiresAt,
    });
  }

  private clearRefreshCookie(reply: FastifyReply): void {
    reply.clearCookie(env.jwtRefreshCookieName, {
      sameSite: env.cookieSameSite,
      secure: env.cookieSecure,
      path: '/api/auth',
      domain: env.cookieDomain,
    });
  }

  private getOrCreateDeviceId(request: FastifyRequest | undefined, reply: FastifyReply): string {
    const cookieDeviceId = request?.cookies[deviceIdCookieName]?.trim();

    if (cookieDeviceId && uuidPattern.test(cookieDeviceId)) {
      return cookieDeviceId.toLowerCase();
    }

    const deviceId = randomUUID();
    reply.setCookie(deviceIdCookieName, deviceId, {
      httpOnly: true,
      sameSite: env.cookieSameSite,
      secure: env.cookieSecure,
      path: '/api/auth',
      domain: env.cookieDomain,
      maxAge: deviceIdCookieMaxAgeSeconds,
    });
    return deviceId;
  }

  private clearDeviceIdCookie(reply: FastifyReply): void {
    reply.clearCookie(deviceIdCookieName, {
      sameSite: env.cookieSameSite,
      secure: env.cookieSecure,
      path: '/api/auth',
      domain: env.cookieDomain,
    });
  }

  private async createInitialFinancialRecords(userId: string): Promise<void> {
    await this.accountsService.createInitialAccounts(userId);
    await this.categoriesService.createInitialCategories(userId);
    await this.budgetsService.createInitialBudgets(userId);
    await this.scheduledTransactionsService.createInitialScheduledTransactions(userId);
    await this.preferencesService.createInitialPreferences(userId);
  }

  private verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwtAccessSecret);

      if (typeof decoded === 'string' || decoded.type !== 'access' || !decoded.sub) {
        throw new AuthError(401, 'El access token no es válido.');
      }

      return decoded as AccessTokenPayload;
    } catch {
      throw new AuthError(401, 'El access token no es válido.');
    }
  }

  private verifyRequiredAccessToken(token: string | undefined): AccessTokenPayload {
    if (!token) {
      throw new AuthError(401, 'Falta el access token.');
    }

    return this.verifyAccessToken(token);
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwtRefreshSecret);

      if (typeof decoded === 'string' || decoded.type !== 'refresh' || !decoded.sub) {
        throw new AuthError(401, 'El refresh token no es válido.');
      }

      return decoded as RefreshTokenPayload;
    } catch {
      throw new AuthError(401, 'El refresh token no es válido.');
    }
  }

  private async getGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );

    if (!tokenInfoResponse.ok) {
      throw new AuthError(401, 'Google rechazó el token enviado.');
    }

    const tokenInfo = (await tokenInfoResponse.json()) as {
      aud?: string;
      scope?: string;
    };

    if (tokenInfo.aud !== env.googleClientId) {
      throw new AuthError(401, 'El token de Google no pertenece a esta aplicación.');
    }

    const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!googleUserResponse.ok) {
      throw new AuthError(401, 'No fue posible obtener el perfil de Google.');
    }

    const googleUser = (await googleUserResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!googleUser.sub || !googleUser.email || !googleUser.name || !googleUser.email_verified) {
      throw new AuthError(401, 'Google no devolvió un perfil válido y verificado.');
    }

    return {
      sub: googleUser.sub,
      email: googleUser.email.toLowerCase(),
      fullName: googleUser.name,
      avatarUrl: googleUser.picture,
    };
  }

  private async issueEmailVerificationCode(user: User): Promise<void> {
    const code = this.generateOneTimeCode();
    const expiresAt = this.resolveMinutesFromNow(env.emailVerificationCodeExpiresMinutes);

    await this.usersRepository.update(
      {
        id: user.id,
      },
      {
        emailVerificationCodeHash: this.hashCode(code),
        emailVerificationCodeExpiresAt: expiresAt,
      },
    );

    await this.authEmailService.sendEmailVerificationCode({
      to: user.email,
      fullName: user.fullName,
      code,
      expiresInMinutes: env.emailVerificationCodeExpiresMinutes,
    });
  }

  private async issuePasswordResetCode(user: User): Promise<void> {
    const code = this.generateOneTimeCode();
    const expiresAt = this.resolveMinutesFromNow(env.passwordResetCodeExpiresMinutes);

    await this.usersRepository.update(
      {
        id: user.id,
      },
      {
        passwordResetCodeHash: this.hashCode(code),
        passwordResetCodeExpiresAt: expiresAt,
      },
    );

    await this.authEmailService.sendPasswordResetCode({
      to: user.email,
      fullName: user.fullName,
      code,
      expiresInMinutes: env.passwordResetCodeExpiresMinutes,
    });
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(`${code}:${env.jwtAccessSecret}`).digest('hex');
  }

  private generateOneTimeCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async clearPersistedRefreshToken(userId: string): Promise<void> {
    await this.usersRepository.update(
      {
        id: userId,
      },
      {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    );
    await this.dataSource.getRepository(AuthSession).update(
      {
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  private async findSessionWithRefreshToken(
    sessionId: string,
    userId: string,
  ): Promise<AuthSession | null> {
    return this.dataSource
      .getRepository(AuthSession)
      .createQueryBuilder('session')
      .addSelect('session.refreshTokenHash')
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.userId = :userId', { userId })
      .getOne();
  }

  private async revokePersistedSession(sessionId: string, userId: string): Promise<void> {
    await this.dataSource.getRepository(AuthSession).update(
      {
        id: sessionId,
        userId,
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  private refreshTokenBelongsToSession(
    refreshToken: string | undefined,
    sessionId: string,
  ): boolean {
    if (!refreshToken) {
      return false;
    }

    try {
      return this.verifyRefreshToken(refreshToken).sid === sessionId;
    } catch {
      return false;
    }
  }

  private toSessionDevice(session: AuthSession, currentSessionId: string | undefined): AuthSessionDevice {
    return {
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      current: session.id === currentSessionId,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  private getUserAgent(request: FastifyRequest | undefined): string | null {
    const userAgent = request?.headers['user-agent'];
    const value = Array.isArray(userAgent) ? userAgent[0] : userAgent;

    if (!value) {
      return null;
    }

    return value.slice(0, 500);
  }

  private getRequestIp(request: FastifyRequest | undefined): string | null {
    return request?.ip?.slice(0, 80) ?? null;
  }

  private async discardPendingRegistration(userId: string): Promise<void> {
    try {
      await this.usersRepository.delete({
        id: userId,
      });
    } catch {
      // Si el cleanup falla, el error original del registro sigue siendo la mejor señal para el cliente.
    }
  }

  private async findByEmail(email: string): Promise<User | null> {
    return this.buildUserByEmailQuery(email).getOne();
  }

  private async findById(userId: string): Promise<User | null> {
    return this.buildUserByIdQuery(userId).getOne();
  }

  private async findByIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<User | null> {
    const authIdentity = await this.authIdentityRepository.findOne({
      where: {
        provider,
        providerUserId: this.normalizeProviderUserId(provider, providerUserId),
      },
      relations: {
        user: {
          authIdentities: true,
        },
      },
    });

    return authIdentity?.user ?? null;
  }

  private async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.buildUserByEmailQuery(email).addSelect('user.passwordHash').getOne();
  }

  private async findByEmailWithVerificationCode(email: string): Promise<User | null> {
    return this.buildUserByEmailQuery(email).addSelect('user.emailVerificationCodeHash').getOne();
  }

  private async findByEmailWithPasswordResetCode(email: string): Promise<User | null> {
    return this.buildUserByEmailQuery(email)
      .addSelect('user.passwordHash')
      .addSelect('user.passwordResetCodeHash')
      .getOne();
  }

  private async findByIdWithRefreshToken(userId: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  private buildUserByIdQuery(userId: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.authIdentities', 'authIdentity')
      .where('user.id = :userId', { userId });
  }

  private buildUserByEmailQuery(email: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.authIdentities', 'authIdentity')
      .where('LOWER(user.email) = LOWER(:email)', { email });
  }

  private toPublicUser(user: User): PublicUser {
    const providers = this.getLinkedProviders(user);

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      providers,
      emailVerified: user.emailVerified,
      hasPasswordAccess: this.userCanLoginWithPassword(user),
      hasGoogleAccess: providers.includes('google'),
      hasMicrosoftAccess: providers.includes('microsoft'),
      avatarUrl: user.avatarUrl ?? undefined,
      initialDataNoticeShown: user.initialDataNoticeShown,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private getLinkedProviders(user: User): AuthProvider[] {
    const providers = new Set<AuthProvider>();

    for (const authIdentity of user.authIdentities ?? []) {
      providers.add(authIdentity.provider);
    }

    return [...providers].sort(
      (left, right) => providerSortOrder.indexOf(left) - providerSortOrder.indexOf(right),
    );
  }

  private userCanLoginWithPassword(user: User): boolean {
    const primaryProvider = this.getPrimaryProvider(user);
    return this.userHasPasswordHash(user) && (primaryProvider === null || primaryProvider === 'email');
  }

  private getSocialOnlyProvider(user: User): 'google' | 'microsoft' | null {
    const primaryProvider = this.getPrimaryProvider(user);
    return primaryProvider === 'google' || primaryProvider === 'microsoft' ? primaryProvider : null;
  }

  private getPrimaryProvider(user: User): AuthProvider | null {
    const identities = user.authIdentities ?? [];

    if (identities.length === 0) {
      return null;
    }

    return [...identities].sort((left, right) => {
      const createdAtDifference = left.createdAt.getTime() - right.createdAt.getTime();
      return (
        createdAtDifference ||
        providerSortOrder.indexOf(left.provider) - providerSortOrder.indexOf(right.provider)
      );
    })[0].provider;
  }

  private getSocialLoginMessage(provider: 'google' | 'microsoft'): string {
    const providerName = provider === 'google' ? 'Google' : 'Microsoft';
    return `Esta cuenta fue creada con ${providerName}. Continúa con ${providerName} para acceder.`;
  }

  private getExistingAccountLoginMessage(user: User): string {
    const socialProvider = this.getSocialOnlyProvider(user);

    return socialProvider
      ? this.getSocialLoginMessage(socialProvider)
      : 'Ya existe una cuenta con ese correo. Inicia sesión con tu correo y contraseña.';
  }

  private userHasPasswordHash(user: Pick<User, 'passwordHash'>): boolean {
    return typeof user.passwordHash === 'string' && user.passwordHash.length > 0;
  }

  private async ensureIdentity(params: {
    userId: string;
    provider: AuthProvider;
    providerUserId: string;
    providerEmail?: string | null;
  }): Promise<void> {
    const providerUserId = this.normalizeProviderUserId(params.provider, params.providerUserId);
    const providerEmail = params.providerEmail ?? null;
    const existingIdentity = await this.authIdentityRepository.findOne({
      where: {
        userId: params.userId,
        provider: params.provider,
      },
    });

    if (existingIdentity) {
      if (
        existingIdentity.providerUserId === providerUserId &&
        existingIdentity.providerEmail === providerEmail
      ) {
        return;
      }

      await this.authIdentityRepository.update(
        {
          id: existingIdentity.id,
        },
        {
          providerUserId,
          providerEmail,
        },
      );

      return;
    }

    const authIdentity = this.authIdentityRepository.create({
      userId: params.userId,
      provider: params.provider,
      providerUserId,
      providerEmail,
    });

    await this.authIdentityRepository.save(authIdentity);
  }

  private normalizeProviderUserId(provider: AuthProvider, providerUserId: string): string {
    const normalizedValue = providerUserId.trim();

    if (provider === 'email') {
      return normalizedValue.toLowerCase();
    }

    return normalizedValue;
  }

  private resolveFutureDate(duration: string): Date {
    const match = duration.match(/^(\d+)([mhd])$/);

    if (!match) {
      throw new Error(
        'JWT_REFRESH_EXPIRES_IN debe usar un formato simple como 15m, 12h o 7d.',
      );
    }

    const [, rawValue, unit] = match;
    const value = Number(rawValue);
    const millisecondsByUnit = {
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    } as const;

    return new Date(Date.now() + value * millisecondsByUnit[unit as keyof typeof millisecondsByUnit]);
  }

  private resolveMinutesFromNow(minutes: number): Date {
    return new Date(Date.now() + minutes * 60_000);
  }

  buildGoogleAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.googleClientId,
      redirect_uri: env.googleAuthRedirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  buildMicrosoftAuthUrl(state: string): string {
    const tenant = env.microsoftTenantId || 'common';
    const params = new URLSearchParams({
      client_id: env.microsoftClientId,
      redirect_uri: env.microsoftAuthRedirectUri,
      response_type: 'code',
      scope: 'openid email profile User.Read',
      state,
      prompt: 'select_account',
      response_mode: 'query',
    });

    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeGoogleCode(code: string): Promise<string> {
    const body = new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      redirect_uri: env.googleAuthRedirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible intercambiar el código de Google.');
    }

    const data = (await response.json()) as { access_token?: string };

    if (!data.access_token) {
      throw new AuthError(401, 'Google no devolvió un access token válido.');
    }

    return data.access_token;
  }

  async exchangeMicrosoftCode(code: string): Promise<string> {
    const tenant = env.microsoftTenantId || 'common';
    const body = new URLSearchParams({
      client_id: env.microsoftClientId,
      client_secret: env.microsoftClientSecret,
      code,
      redirect_uri: env.microsoftAuthRedirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      },
    );

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible intercambiar el código de Microsoft.');
    }

    const data = (await response.json()) as { access_token?: string };

    if (!data.access_token) {
      throw new AuthError(401, 'Microsoft no devolvió un access token válido.');
    }

    return data.access_token;
  }

  async getMicrosoftUserProfile(accessToken: string): Promise<MicrosoftUserProfile> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new AuthError(401, 'No fue posible obtener el perfil de Microsoft.');
    }

    const data = (await response.json()) as {
      id?: string;
      mail?: string;
      userPrincipalName?: string;
      displayName?: string;
    };

    if (!data.id || !data.displayName) {
      throw new AuthError(401, 'Microsoft no devolvió un perfil válido.');
    }

    const email = (data.mail || data.userPrincipalName || '').toLowerCase();

    if (!email) {
      throw new AuthError(401, 'Microsoft no devolvió una dirección de correo.');
    }

    return {
      sub: data.id,
      email,
      fullName: data.displayName,
    };
  }

  async loginWithMicrosoft(
    profile: MicrosoftUserProfile,
    reply: FastifyReply,
    request?: FastifyRequest,
  ): Promise<AuthSessionResponse> {
    if (!env.microsoftClientId) {
      throw new AuthError(500, 'Microsoft no está configurado en el backend.');
    }

    const existingByMicrosoftSub = await this.findByIdentity('microsoft', profile.sub);

    if (existingByMicrosoftSub) {
      if (this.getPrimaryProvider(existingByMicrosoftSub) !== 'microsoft') {
        throw new AuthError(409, this.getExistingAccountLoginMessage(existingByMicrosoftSub));
      }

      await this.usersRepository.update(
        { id: existingByMicrosoftSub.id },
        {
          emailVerified: true,
          emailVerificationCodeHash: null,
          emailVerificationCodeExpiresAt: null,
          avatarUrl: existingByMicrosoftSub.avatarUrl ?? profile.avatarUrl ?? null,
        },
      );

      await this.ensureIdentity({
        userId: existingByMicrosoftSub.id,
        provider: 'microsoft',
        providerUserId: profile.sub,
        providerEmail: profile.email,
      });

      const savedUser = await this.findById(existingByMicrosoftSub.id);

      if (!savedUser) {
        throw new Error('No fue posible recuperar la cuenta vinculada con Microsoft.');
      }

      return this.createSession(savedUser, reply, request);
    }

    const existingByEmail = await this.findByEmail(profile.email);

    if (existingByEmail) {
      throw new AuthError(409, this.getExistingAccountLoginMessage(existingByEmail));
    }

    const user = this.usersRepository.create({
      fullName: profile.fullName,
      email: profile.email,
      emailVerified: true,
      avatarUrl: profile.avatarUrl ?? null,
      initialDataNoticeShown: false,
      passwordHash: null,
      emailVerificationCodeHash: null,
      emailVerificationCodeExpiresAt: null,
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      lastLoginAt: null,
    });

    const savedUser = await this.usersRepository.save(user);

    await this.ensureIdentity({
      userId: savedUser.id,
      provider: 'microsoft',
      providerUserId: profile.sub,
      providerEmail: profile.email,
    });

    await this.authEmailService.sendWelcomeEmail({
      to: savedUser.email,
      fullName: savedUser.fullName,
    });

    return this.createSession(savedUser, reply, request);
  }
}
