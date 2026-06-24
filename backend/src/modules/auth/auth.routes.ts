import { randomBytes } from 'crypto';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env';
import {
  forgotPasswordSchema,
  deleteAccountSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resendVerificationCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas';
import { AuthError, type AuthService, type AuthSessionResponse } from './auth.service';
import type { AuthAbuseProtection } from './auth-abuse-protection';
import { validationError } from '../shared/route-helpers';
import { hashLogValue, logSecurityEvent } from '../../utils/file-logger';

interface OAuthState {
  nonce: string;
  returnTo?: string;
}

function isAllowedFrontendOrigin(origin: string) {
  if (env.allowedOrigins.includes(origin) || env.frontendUrl === origin) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return false;
  }
}

function sanitizeOAuthReturnTo(returnTo: string | undefined) {
  if (!returnTo) {
    return undefined;
  }

  if (returnTo === 'neyqo://auth/oauth/callback') {
    return returnTo;
  }

  try {
    const origin = new URL(returnTo).origin;
    return isAllowedFrontendOrigin(origin) ? origin : undefined;
  } catch {
    return undefined;
  }
}

function encodeOAuthState(returnTo: string | undefined) {
  const state: OAuthState = {
    nonce: randomBytes(16).toString('hex'),
    returnTo: sanitizeOAuthReturnTo(returnTo),
  };

  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

function decodeOAuthState(state: string | undefined): OAuthState | undefined {
  if (!state) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as Partial<OAuthState>;
    return {
      nonce: typeof parsed.nonce === 'string' ? parsed.nonce : '',
      returnTo: sanitizeOAuthReturnTo(parsed.returnTo),
    };
  } catch {
    return undefined;
  }
}

function resolveFrontendUrl(state: string | undefined) {
  return decodeOAuthState(state)?.returnTo || env.frontendUrl || 'http://localhost:5173';
}

function buildOAuthCallbackUrl(
  frontendUrl: string,
  params: Record<string, string | undefined>,
) {
  const url = frontendUrl === 'neyqo://auth/oauth/callback'
    ? new URL(frontendUrl)
    : new URL('/auth/oauth/callback', frontendUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function encodeSession(session: AuthSessionResponse) {
  return Buffer.from(
    JSON.stringify({
      accessToken: session.accessToken,
      user: session.user,
    }),
    'utf8',
  ).toString('base64url');
}

const oauthStateCookieName = 'neyqo.oauth-state';

function setOAuthStateCookie(reply: FastifyReply, state: string) {
  reply.setCookie(oauthStateCookieName, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/api/auth/oauth',
    domain: env.cookieDomain,
    maxAge: 600,
  });
}

function clearOAuthStateCookie(reply: FastifyReply) {
  reply.clearCookie(oauthStateCookieName, {
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/api/auth/oauth',
    domain: env.cookieDomain,
  });
}

function hasValidOAuthState(request: FastifyRequest, state: string | undefined) {
  return Boolean(state && request.cookies[oauthStateCookieName] === state);
}

function getBearerAccessToken(request: FastifyRequest) {
  const authorizationHeader = request.headers.authorization;
  return authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : undefined;
}

export const buildAuthRoutes =
  (authService: AuthService, authAbuseProtection: AuthAbuseProtection): FastifyPluginAsync =>
  async (app) => {
    app.post('/register', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'register', env.authWriteRateLimitMax);

      if (authAbuseProtection.hasRegistrationHoneypotValue(request.body)) {
        logSecurityEvent('auth.register.honeypot_triggered', request);
        return reply.code(202).send({
          message: 'Te enviamos un codigo para confirmar tu correo.',
        });
      }

      const parsed = registerSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de registro inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await authService.register(parsed.data);
      logSecurityEvent(
        'auth.register.accepted',
        request,
        { emailHash: hashLogValue(parsed.data.email) },
        'info',
      );
      return reply.code(201).send(result);
    });

    app.post('/verify-email', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'verify-email', env.authCodeRateLimitMax);

      const parsed = verifyEmailSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de verificación inválidos.', parsed.error.flatten().fieldErrors));
      }

      await authAbuseProtection.assertCodeActionAllowed(request, parsed.data.email, 'verify-email');

      try {
        const session = await authService.verifyEmail(parsed.data, reply, request);
        await authAbuseProtection.recordCodeActionSuccess(request, parsed.data.email, 'verify-email');
        logSecurityEvent(
          'auth.verify_email.success',
          request,
          { emailHash: hashLogValue(parsed.data.email), userId: session.user.id },
          'info',
        );
        return reply.code(200).send(session);
      } catch (error) {
        await authAbuseProtection.recordCodeActionFailure(request, parsed.data.email, 'verify-email');
        logSecurityEvent('auth.verify_email.failure', request, { emailHash: hashLogValue(parsed.data.email) });
        throw error;
      }
    });

    app.post('/verify-email/resend', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'verify-email-resend', env.authCodeRateLimitMax);

      const parsed = resendVerificationCodeSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de correo inválidos.', parsed.error.flatten().fieldErrors));
      }

      await authAbuseProtection.assertCodeActionAllowed(request, parsed.data.email, 'resend-verification');
      await authAbuseProtection.recordCodeActionAttempt(request, parsed.data.email, 'resend-verification');
      const result = await authService.resendEmailVerificationCode(parsed.data);
      logSecurityEvent(
        'auth.verify_email.resend_requested',
        request,
        { emailHash: hashLogValue(parsed.data.email) },
        'info',
      );
      return reply.code(200).send(result);
    });

    app.post('/login', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'login', env.authLoginRateLimitMax);

      const parsed = loginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de login inválidos.', parsed.error.flatten().fieldErrors));
      }

      await authAbuseProtection.assertLoginAllowed(request, parsed.data.email);

      try {
        const session = await authService.login(parsed.data, reply, request);
        await authAbuseProtection.recordLoginSuccess(request, parsed.data.email);
        logSecurityEvent(
          'auth.login.success',
          request,
          { emailHash: hashLogValue(parsed.data.email), userId: session.user.id },
          'info',
        );
        return reply.code(200).send(session);
      } catch (error) {
        await authAbuseProtection.recordLoginFailure(request, parsed.data.email);
        logSecurityEvent('auth.login.failure', request, { emailHash: hashLogValue(parsed.data.email) });
        throw error;
      }
    });

    app.post('/google', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'google-token-login', env.authWriteRateLimitMax);

      const parsed = googleLoginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de Google inválidos.', parsed.error.flatten().fieldErrors));
      }

      const session = await authService.loginWithGoogle(parsed.data, reply, request);
      logSecurityEvent('auth.google_token_login.success', request, { userId: session.user.id }, 'info');
      return reply.code(200).send(session);
    });

    app.get('/oauth/google/start', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'google-oauth-start', env.authWriteRateLimitMax);

      if (!env.googleClientId || !env.googleClientSecret || !env.googleAuthRedirectUri) {
        return reply.code(501).send({ message: 'Google OAuth no está configurado.' });
      }

      const query = request.query as { returnTo?: string };
      const state = encodeOAuthState(query.returnTo);
      const authUrl = authService.buildGoogleAuthUrl(state);
      setOAuthStateCookie(reply, state);
      return reply.redirect(authUrl);
    });

    app.get('/oauth/google/callback', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'google-oauth-callback', env.authWriteRateLimitMax);

      const query = request.query as { code?: string; state?: string; error?: string };
      const frontendUrl = resolveFrontendUrl(query.state);
      const validState = hasValidOAuthState(request, query.state);
      clearOAuthStateCookie(reply);

      if (!validState) {
        logSecurityEvent('auth.google_oauth.invalid_state', request);
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            error: 'auth_failed',
            provider: 'google',
          }),
        );
      }

      if (query.error || !query.code) {
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            error: 'access_denied',
            provider: 'google',
          }),
        );
      }

      try {
        const accessToken = await authService.exchangeGoogleCode(query.code);
        const session = await authService.loginWithGoogle({ accessToken }, reply, request);
        logSecurityEvent('auth.google_oauth.success', request, { userId: session.user.id }, 'info');
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            provider: 'google',
            session: encodeSession(session),
          }),
        );
      } catch (error) {
        request.log.warn({ error }, 'Google OAuth callback failed.');
        logSecurityEvent('auth.google_oauth.failure', request);
        const callbackError = error instanceof AuthError && error.statusCode === 409
          ? 'account_exists'
          : 'auth_failed';
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            error: callbackError,
            provider: 'google',
          }),
        );
      }
    });

    app.get('/oauth/microsoft/start', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'microsoft-oauth-start', env.authWriteRateLimitMax);

      if (!env.microsoftClientId || !env.microsoftClientSecret || !env.microsoftAuthRedirectUri) {
        return reply.code(501).send({ message: 'Microsoft OAuth no está configurado.' });
      }

      const query = request.query as { returnTo?: string };
      const state = encodeOAuthState(query.returnTo);
      const authUrl = authService.buildMicrosoftAuthUrl(state);
      setOAuthStateCookie(reply, state);
      return reply.redirect(authUrl);
    });

    app.get('/oauth/microsoft/callback', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'microsoft-oauth-callback', env.authWriteRateLimitMax);

      const query = request.query as { code?: string; state?: string; error?: string };
      const frontendUrl = resolveFrontendUrl(query.state);
      const validState = hasValidOAuthState(request, query.state);
      clearOAuthStateCookie(reply);

      if (!validState) {
        logSecurityEvent('auth.microsoft_oauth.invalid_state', request);
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            error: 'auth_failed',
            provider: 'microsoft',
          }),
        );
      }

      if (query.error || !query.code) {
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            error: 'access_denied',
            provider: 'microsoft',
          }),
        );
      }

      try {
        const accessToken = await authService.exchangeMicrosoftCode(query.code);
        const profile = await authService.getMicrosoftUserProfile(accessToken);
        const session = await authService.loginWithMicrosoft(profile, reply, request);
        logSecurityEvent('auth.microsoft_oauth.success', request, { userId: session.user.id }, 'info');
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            provider: 'microsoft',
            session: encodeSession(session),
          }),
        );
      } catch (error) {
        request.log.warn({ error }, 'Microsoft OAuth callback failed.');
        logSecurityEvent('auth.microsoft_oauth.failure', request);
        const callbackError = error instanceof AuthError && error.statusCode === 409
          ? 'account_exists'
          : 'auth_failed';
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            error: callbackError,
            provider: 'microsoft',
          }),
        );
      }
    });

    app.post('/password/forgot', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'password-forgot', env.authCodeRateLimitMax);

      const parsed = forgotPasswordSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de recuperación inválidos.', parsed.error.flatten().fieldErrors));
      }

      await authAbuseProtection.assertCodeActionAllowed(request, parsed.data.email, 'forgot-password');
      await authAbuseProtection.recordCodeActionAttempt(request, parsed.data.email, 'forgot-password');
      const result = await authService.requestPasswordReset(parsed.data);
      logSecurityEvent(
        'auth.password_reset.requested',
        request,
        { emailHash: hashLogValue(parsed.data.email) },
        'info',
      );
      return reply.code(200).send(result);
    });

    app.post('/password/reset', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'password-reset', env.authCodeRateLimitMax);

      const parsed = resetPasswordSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(
            validationError(
              'Datos para restablecer la contraseña inválidos.',
              parsed.error.flatten().fieldErrors,
            ),
          );
      }

      await authAbuseProtection.assertCodeActionAllowed(request, parsed.data.email, 'reset-password');

      try {
        const result = await authService.resetPassword(parsed.data);
        await authAbuseProtection.recordCodeActionSuccess(request, parsed.data.email, 'reset-password');
        logSecurityEvent(
          'auth.password_reset.completed',
          request,
          { emailHash: hashLogValue(parsed.data.email) },
          'info',
        );
        return reply.code(200).send(result);
      } catch (error) {
        await authAbuseProtection.recordCodeActionFailure(request, parsed.data.email, 'reset-password');
        logSecurityEvent('auth.password_reset.failure', request, { emailHash: hashLogValue(parsed.data.email) });
        throw error;
      }
    });

    app.post('/refresh', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'refresh', env.authRefreshRateLimitMax);

      const refreshToken = request.cookies[env.jwtRefreshCookieName];
      const session = await authService.refreshSession(refreshToken, reply, request);
      return reply.code(200).send(session);
    });

    app.post('/logout', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'logout', env.authRefreshRateLimitMax);

      const refreshToken = request.cookies[env.jwtRefreshCookieName];
      await authService.logout(refreshToken, reply);
      return reply.code(204).send();
    });

    app.get('/sessions', async (request, reply) => {
      const sessions = await authService.listSessions(getBearerAccessToken(request));
      return reply.code(200).send(sessions);
    });

    app.delete('/sessions/:sessionId', async (request, reply) => {
      const params = request.params as { sessionId?: string };

      if (!params.sessionId) {
        return reply.code(400).send({ message: 'Falta el identificador de la sesión.' });
      }

      const result = await authService.revokeSession(
        getBearerAccessToken(request),
        request.cookies[env.jwtRefreshCookieName],
        params.sessionId,
        reply,
      );
      return reply.code(200).send(result);
    });

    app.post('/sessions/revoke-others', async (request, reply) => {
      const result = await authService.revokeOtherSessions(getBearerAccessToken(request), reply);
      return reply.code(200).send(result);
    });

    app.post('/sessions/revoke-all', async (request, reply) => {
      const result = await authService.revokeAllSessions(getBearerAccessToken(request), reply);
      return reply.code(200).send(result);
    });

    app.delete('/account', async (request, reply) => {
      await authAbuseProtection.consumeRateLimit(request, 'delete-account', env.authWriteRateLimitMax);

      const parsed = deleteAccountSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Confirmación de eliminación inválida.', parsed.error.flatten().fieldErrors));
      }

      const accessToken = getBearerAccessToken(request);
      const deletedUser = await authService.deleteOwnAccount(accessToken, parsed.data, reply);
      logSecurityEvent('auth.account_deleted', request, { userId: deletedUser.userId }, 'info');
      return reply.code(204).send();
    });

    app.get('/me', async (request, reply) => {
      const accessToken = getBearerAccessToken(request);

      const user = await authService.getCurrentUser(accessToken);
      return reply.code(200).send({ user });
    });

    app.post('/initialize-data', async (request, reply) => {
      const accessToken = getBearerAccessToken(request);

      const user = await authService.initializeUserData(accessToken);
      return reply.code(200).send({ user });
    });
  };
