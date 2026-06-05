import bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import type { FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Repository } from 'typeorm';
import { env } from '../../config/env';
import { AuthIdentity } from '../../entities/auth-identity.entity';
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
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.schemas';

interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
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
const socialAccountEmailConflictMessage =
  'Ya existe una cuenta con ese correo. Inicia sesión con tu contraseña.';

export class AuthService {
  constructor(
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
      throw new AuthError(409, 'Ya existe una cuenta con ese correo.');
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

    return this.createSession(verifiedUser, reply);
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

  async login(payload: LoginInput, reply: FastifyReply): Promise<AuthSessionResponse> {
    const user = await this.findByEmailWithPassword(payload.email);

    if (!user || !this.userCanLoginWithPassword(user)) {
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

    return this.createSession(user, reply);
  }

  async loginWithGoogle(
    payload: GoogleLoginInput,
    reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    if (!env.googleClientId) {
      throw new AuthError(500, 'Google no está configurado en el backend.');
    }

    const googleProfile = await this.getGoogleUserProfile(payload.accessToken);
    const existingByGoogleSub = await this.findByIdentity('google', googleProfile.sub);

    if (existingByGoogleSub) {
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

      return this.createSession(savedUser, reply);
    }

    const existingByEmail = await this.findByEmail(googleProfile.email);

    if (existingByEmail) {
      throw new AuthError(409, socialAccountEmailConflictMessage);
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

    return this.createSession(savedUser, reply);
  }

  async requestPasswordReset(payload: ForgotPasswordInput): Promise<AuthActionResponse> {
    const user = await this.findByEmail(payload.email);

    if (user && user.emailVerified && this.getLinkedProviders(user).length > 0) {
      await this.issuePasswordResetCode(user);
    }

    return {
      message: 'Si la cuenta existe, te enviamos un codigo para continuar.',
      email: payload.email,
    };
  }

  async resetPassword(payload: ResetPasswordInput): Promise<AuthActionResponse> {
    const user = await this.findByEmailWithPasswordResetCode(payload.email);

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

    const hadPasswordAccess = this.userCanLoginWithPassword(user);
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
      message: hadPasswordAccess
        ? 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.'
        : 'Tu contraseña fue creada. Ya puedes iniciar sesión con Google o con tu correo.',
      email: user.email,
    };
  }

  async refreshSession(
    refreshToken: string | undefined,
    reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    if (!refreshToken) {
      throw new AuthError(401, 'No hay refresh token disponible.');
    }

    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.findByIdWithRefreshToken(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new AuthError(401, 'La sesión ya no es válida.');
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      await this.clearPersistedRefreshToken(user.id);
      throw new AuthError(401, 'El refresh token expiró.');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!refreshTokenMatches) {
      throw new AuthError(401, 'La sesión ya no es válida.');
    }

    return this.createSession(user, reply);
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
        await this.clearPersistedRefreshToken(payload.sub);
      } catch {
        // Si el token ya no es válido, igualmente limpiamos la cookie.
      }
    }

    this.clearRefreshCookie(reply);
  }

  private async createSession(user: User, reply: FastifyReply): Promise<AuthSessionResponse> {
    const accessTokenExpiresIn = env.jwtAccessExpiresIn as SignOptions['expiresIn'];
    const refreshTokenExpiresIn = env.jwtRefreshExpiresIn as SignOptions['expiresIn'];

    const accessToken = jwt.sign(
      {
        sub: user.id,
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
        type: 'refresh',
      } satisfies RefreshTokenPayload,
      env.jwtRefreshSecret,
      {
        expiresIn: refreshTokenExpiresIn,
      },
    );

    const refreshTokenExpiresAt = this.resolveFutureDate(env.jwtRefreshExpiresIn);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.usersRepository.update(
      {
        id: user.id,
      },
      {
        refreshTokenHash,
        refreshTokenExpiresAt,
        lastLoginAt: new Date(),
      },
    );

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
    return this.userHasPasswordHash(user) && this.getLinkedProviders(user).includes('email');
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
  ): Promise<AuthSessionResponse> {
    if (!env.microsoftClientId) {
      throw new AuthError(500, 'Microsoft no está configurado en el backend.');
    }

    const existingByMicrosoftSub = await this.findByIdentity('microsoft', profile.sub);

    if (existingByMicrosoftSub) {
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

      return this.createSession(savedUser, reply);
    }

    const existingByEmail = await this.findByEmail(profile.email);

    if (existingByEmail) {
      throw new AuthError(409, socialAccountEmailConflictMessage);
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

    return this.createSession(savedUser, reply);
  }
}
