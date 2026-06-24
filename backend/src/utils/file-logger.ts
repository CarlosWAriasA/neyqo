import { appendFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, resolve } from 'path';
import type { FastifyRequest } from 'fastify';
import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error';

interface BaseLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface RequestLogContext {
  method: string;
  ip: string;
  reqId: string;
  userAgent?: string;
  url: string;
  userId?: string;
}

function getLogDirectory() {
  return resolve(process.cwd(), env.logDir);
}

function writeLog(fileName: string, entry: BaseLogEntry) {
  if (!env.fileLoggingEnabled) {
    return;
  }

  const logDirectory = getLogDirectory();
  mkdirSync(logDirectory, { recursive: true });

  appendFileSync(join(logDirectory, fileName), `${JSON.stringify(entry)}\n`, 'utf8');
}

function getRequestContext(request?: FastifyRequest): RequestLogContext | undefined {
  if (!request) {
    return undefined;
  }

  return {
    method: request.method,
    ip: request.ip,
    reqId: request.id,
    userAgent: request.headers['user-agent'],
    url: request.url,
    userId: request.authUser?.id,
  };
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function logAppEvent(message: string, context?: Record<string, unknown>) {
  writeLog('app.log', {
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    context,
  });
}

export function hashLogValue(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function logSecurityEvent(
  eventType: string,
  request?: FastifyRequest,
  context?: Record<string, unknown>,
  level: LogLevel = 'warn',
) {
  writeLog('security.log', {
    level,
    message: eventType,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      request: getRequestContext(request),
    },
  });
}

export function logBackendError(
  message: string,
  error: unknown,
  request?: FastifyRequest,
  context?: Record<string, unknown>,
) {
  writeLog('errors.log', {
    level: 'error',
    message,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      request: getRequestContext(request),
      error: serializeError(error),
    },
  });
}
