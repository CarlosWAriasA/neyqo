const sensitiveKeys = ['authorization', 'internal_service_secret', 'x-internal-service-secret', 'token', 'secret'];

function redactValue(key: string, value: unknown): unknown {
  const normalizedKey = key.toLowerCase();

  if (sensitiveKeys.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
    return '[REDACTED]';
  }

  return value;
}

function redact(input: unknown): unknown {
  if (!input || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(redact);
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, redactValue(key, redact(value))]),
  );
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.info(JSON.stringify({ level: 'info', message, context: redact(context), timestamp: new Date().toISOString() }));
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(JSON.stringify({ level: 'warn', message, context: redact(context), timestamp: new Date().toISOString() }));
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorContext =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { error };

    console.error(
      JSON.stringify({
        level: 'error',
        message,
        context: redact({ ...context, ...errorContext }),
        timestamp: new Date().toISOString(),
      }),
    );
  },
  redact,
};
