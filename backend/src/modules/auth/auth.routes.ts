import { randomBytes } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env';
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resendVerificationCodeSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas';
import { AuthError, type AuthService, type AuthSessionResponse } from './auth.service';

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

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

export const buildAuthRoutes =
  (authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.post('/register', async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de registro inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await authService.register(parsed.data);
      return reply.code(201).send(result);
    });

    app.post('/verify-email', async (request, reply) => {
      const parsed = verifyEmailSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de verificación inválidos.', parsed.error.flatten().fieldErrors));
      }

      const session = await authService.verifyEmail(parsed.data, reply);
      return reply.code(200).send(session);
    });

    app.post('/verify-email/resend', async (request, reply) => {
      const parsed = resendVerificationCodeSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de correo inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await authService.resendEmailVerificationCode(parsed.data);
      return reply.code(200).send(result);
    });

    app.post('/login', async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de login inválidos.', parsed.error.flatten().fieldErrors));
      }

      const session = await authService.login(parsed.data, reply);
      return reply.code(200).send(session);
    });

    app.post('/google', async (request, reply) => {
      const parsed = googleLoginSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de Google inválidos.', parsed.error.flatten().fieldErrors));
      }

      const session = await authService.loginWithGoogle(parsed.data, reply);
      return reply.code(200).send(session);
    });

    app.get('/oauth/google/start', async (request, reply) => {
      if (!env.googleClientId || !env.googleClientSecret || !env.googleAuthRedirectUri) {
        return reply.code(501).send({ message: 'Google OAuth no está configurado.' });
      }

      const query = request.query as { returnTo?: string };
      const state = encodeOAuthState(query.returnTo);
      const authUrl = authService.buildGoogleAuthUrl(state);
      return reply.redirect(authUrl);
    });

    app.get('/oauth/google/callback', async (request, reply) => {
      const query = request.query as { code?: string; state?: string; error?: string };
      const frontendUrl = resolveFrontendUrl(query.state);

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
        const session = await authService.loginWithGoogle({ accessToken }, reply);
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            provider: 'google',
            session: encodeSession(session),
          }),
        );
      } catch (error) {
        request.log.warn({ error }, 'Google OAuth callback failed.');
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
      if (!env.microsoftClientId || !env.microsoftClientSecret || !env.microsoftAuthRedirectUri) {
        return reply.code(501).send({ message: 'Microsoft OAuth no está configurado.' });
      }

      const query = request.query as { returnTo?: string };
      const state = encodeOAuthState(query.returnTo);
      const authUrl = authService.buildMicrosoftAuthUrl(state);
      return reply.redirect(authUrl);
    });

    app.get('/oauth/microsoft/callback', async (request, reply) => {
      const query = request.query as { code?: string; state?: string; error?: string };
      const frontendUrl = resolveFrontendUrl(query.state);

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
        const session = await authService.loginWithMicrosoft(profile, reply);
        return reply.redirect(
          buildOAuthCallbackUrl(frontendUrl, {
            provider: 'microsoft',
            session: encodeSession(session),
          }),
        );
      } catch (error) {
        request.log.warn({ error }, 'Microsoft OAuth callback failed.');
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
      const parsed = forgotPasswordSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de recuperación inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await authService.requestPasswordReset(parsed.data);
      return reply.code(200).send(result);
    });

    app.post('/password/reset', async (request, reply) => {
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

      const result = await authService.resetPassword(parsed.data);
      return reply.code(200).send(result);
    });

    app.post('/refresh', async (request, reply) => {
      const refreshToken = request.cookies[env.jwtRefreshCookieName];
      const session = await authService.refreshSession(refreshToken, reply);
      return reply.code(200).send(session);
    });

    app.post('/logout', async (request, reply) => {
      const refreshToken = request.cookies[env.jwtRefreshCookieName];
      await authService.logout(refreshToken, reply);
      return reply.code(204).send();
    });

    app.get('/me', async (request, reply) => {
      const authorizationHeader = request.headers.authorization;
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : undefined;

      const user = await authService.getCurrentUser(accessToken);
      return reply.code(200).send({ user });
    });

    app.post('/initialize-data', async (request, reply) => {
      const authorizationHeader = request.headers.authorization;
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : undefined;

      const user = await authService.initializeUserData(accessToken);
      return reply.code(200).send({ user });
    });
  };
