import { describe, expect, it } from 'vitest';
import { logger } from '../src/core/logging/logger';

describe('logger redaction', () => {
  it('no expone secretos en logs serializables', () => {
    const redacted = logger.redact({
      INTERNAL_SERVICE_SECRET: 'super-secret',
      nested: {
        token: 'oauth-token',
        safe: 'visible',
      },
    });

    expect(redacted).toEqual({
      INTERNAL_SERVICE_SECRET: '[REDACTED]',
      nested: {
        token: '[REDACTED]',
        safe: 'visible',
      },
    });
  });
});
