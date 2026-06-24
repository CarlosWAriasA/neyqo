import type { FastifyRequest } from 'fastify';
import type { DataSource, EntityManager } from 'typeorm';
import { env } from '../../config/env';
import { AuthThrottleBucket } from '../../entities/auth-throttle-bucket.entity';
import { AuthError } from './auth.service';

type BucketAction = 'assert' | 'failure' | 'success' | 'attempt';

export class AuthAbuseProtection {
  constructor(private readonly dataSource: DataSource) {}

  async consumeRateLimit(request: FastifyRequest, scope: string, maxRequests: number) {
    await this.dataSource.transaction(async (manager) => {
      const bucket = await this.findOrCreateBucket(manager, `rate:${scope}`, request.ip, this.rateLimitWindowMs());

      if (bucket.attempts >= maxRequests) {
        bucket.lockedUntil = bucket.expiresAt;
        await manager.save(AuthThrottleBucket, bucket);
        throw this.lockedError(bucket, 'Demasiadas solicitudes.');
      }

      bucket.attempts += 1;
      bucket.expiresAt = this.resolveExpiry(bucket, this.rateLimitWindowMs());
      await manager.save(AuthThrottleBucket, bucket);
    });
  }

  async assertLoginAllowed(request: FastifyRequest, email: string) {
    await this.updateBucket({
      scope: 'login',
      key: this.getClientKey(request, email),
      action: 'assert',
      message: 'Demasiados intentos de inicio de sesión.',
    });
  }

  async recordLoginFailure(request: FastifyRequest, email: string) {
    await this.updateBucket({
      scope: 'login',
      key: this.getClientKey(request, email),
      action: 'failure',
      message: 'Demasiados intentos de inicio de sesión.',
    });
  }

  async recordLoginSuccess(request: FastifyRequest, email: string) {
    await this.updateBucket({
      scope: 'login',
      key: this.getClientKey(request, email),
      action: 'success',
      message: 'Demasiados intentos de inicio de sesión.',
    });
  }

  async assertCodeActionAllowed(request: FastifyRequest, email: string, action: string) {
    await this.updateBucket({
      scope: `code:${action}`,
      key: this.getClientKey(request, email),
      action: 'assert',
      message: 'Demasiados intentos con códigos de seguridad.',
    });
  }

  async recordCodeActionFailure(request: FastifyRequest, email: string, action: string) {
    await this.updateBucket({
      scope: `code:${action}`,
      key: this.getClientKey(request, email),
      action: 'failure',
      message: 'Demasiados intentos con códigos de seguridad.',
    });
  }

  async recordCodeActionAttempt(request: FastifyRequest, email: string, action: string) {
    await this.updateBucket({
      scope: `code:${action}`,
      key: this.getClientKey(request, email),
      action: 'attempt',
      message: 'Demasiados intentos con códigos de seguridad.',
    });
  }

  async recordCodeActionSuccess(request: FastifyRequest, email: string, action: string) {
    await this.updateBucket({
      scope: `code:${action}`,
      key: this.getClientKey(request, email),
      action: 'success',
      message: 'Demasiados intentos con códigos de seguridad.',
    });
  }

  hasRegistrationHoneypotValue(body: unknown): boolean {
    if (!body || typeof body !== 'object') {
      return false;
    }

    const payload = body as Record<string, unknown>;
    const value = payload.companyName ?? payload.website ?? payload.middleName;
    return typeof value === 'string' && value.trim().length > 0;
  }

  async cleanupExpiredBuckets(): Promise<void> {
    await this.dataSource
      .getRepository(AuthThrottleBucket)
      .createQueryBuilder()
      .delete()
      .where('expiresAt < now()')
      .execute();
  }

  private async updateBucket(params: {
    scope: string;
    key: string;
    action: BucketAction;
    message: string;
  }): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const bucket = await this.findOrCreateBucket(manager, params.scope, params.key, this.lockoutWindowMs());

      if (this.isLocked(bucket)) {
        throw this.lockedError(bucket, params.message);
      }

      if (params.action === 'success') {
        await manager.delete(AuthThrottleBucket, { id: bucket.id });
        return;
      }

      if (params.action === 'assert') {
        return;
      }

      bucket.attempts += 1;
      bucket.expiresAt = this.resolveExpiry(bucket, this.lockoutWindowMs());

      if (bucket.attempts >= env.authLockoutMaxAttempts) {
        bucket.lockedUntil = this.resolveLockedUntil(bucket.attempts);
        bucket.expiresAt = new Date(Math.max(bucket.expiresAt.getTime(), bucket.lockedUntil.getTime()));
      }

      await manager.save(AuthThrottleBucket, bucket);
    });
  }

  private async findOrCreateBucket(
    manager: EntityManager,
    scope: string,
    key: string,
    bucketWindowMs: number,
  ): Promise<AuthThrottleBucket> {
    const repository = manager.getRepository(AuthThrottleBucket);
    const existing = await repository
      .createQueryBuilder('bucket')
      .setLock('pessimistic_write')
      .where('bucket.scope = :scope', { scope })
      .andWhere('bucket.bucketKey = :key', { key })
      .getOne();

    if (existing && existing.expiresAt.getTime() > Date.now()) {
      return existing;
    }

    if (existing) {
      existing.attempts = 0;
      existing.windowStartedAt = new Date();
      existing.lockedUntil = null;
      existing.expiresAt = this.resolveExpiry(existing, bucketWindowMs);
      return existing;
    }

    try {
      const bucket = repository.create({
        scope,
        bucketKey: key,
        attempts: 0,
        windowStartedAt: new Date(),
        lockedUntil: null,
        expiresAt: new Date(Date.now() + bucketWindowMs),
      });

      return await repository.save(bucket);
    } catch {
      const createdByParallelRequest = await repository
        .createQueryBuilder('bucket')
        .setLock('pessimistic_write')
        .where('bucket.scope = :scope', { scope })
        .andWhere('bucket.bucketKey = :key', { key })
        .getOne();

      if (createdByParallelRequest) {
        return createdByParallelRequest;
      }

      throw new Error('No fue posible crear el throttle bucket de autenticación.');
    }
  }

  private getClientKey(request: FastifyRequest, email: string) {
    return `${request.ip}:${email.trim().toLowerCase()}`;
  }

  private isLocked(bucket: AuthThrottleBucket) {
    return Boolean(bucket.lockedUntil && bucket.lockedUntil.getTime() > Date.now());
  }

  private lockedError(bucket: AuthThrottleBucket, message: string) {
    const retryAfterSeconds = bucket.lockedUntil
      ? Math.ceil((bucket.lockedUntil.getTime() - Date.now()) / 1000)
      : env.authLockoutBaseSeconds;

    return new AuthError(429, `${message} Espera ${retryAfterSeconds} segundos e inténtalo nuevamente.`);
  }

  private resolveLockedUntil(attempts: number) {
    const overage = attempts - env.authLockoutMaxAttempts;
    const penaltySeconds = env.authLockoutBaseSeconds * 2 ** Math.min(Math.max(overage, 0), 4);
    return new Date(Date.now() + penaltySeconds * 1000);
  }

  private resolveExpiry(bucket: Pick<AuthThrottleBucket, 'windowStartedAt'>, bucketWindowMs: number) {
    return new Date(bucket.windowStartedAt.getTime() + bucketWindowMs);
  }

  private lockoutWindowMs() {
    return env.authLockoutWindowMinutes * 60_000;
  }

  private rateLimitWindowMs() {
    const match = env.authRateLimitWindow.trim().match(/^(\d+)\s*(millisecond|milliseconds|second|seconds|minute|minutes|hour|hours)$/i);

    if (!match) {
      return 60_000;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('millisecond')) {
      return value;
    }

    if (unit.startsWith('second')) {
      return value * 1000;
    }

    if (unit.startsWith('hour')) {
      return value * 60 * 60 * 1000;
    }

    return value * 60_000;
  }
}
