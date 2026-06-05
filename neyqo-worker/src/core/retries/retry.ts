export interface RetryOptions {
  maxRetries: number;
  retryDelayMs: number;
  isRetryable(error: unknown): boolean;
  onRetry?(error: unknown, attempt: number): Promise<void> | void;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function withRetries<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (attempt > options.maxRetries || !options.isRetryable(error)) {
        throw error;
      }

      await options.onRetry?.(error, attempt);

      if (options.retryDelayMs > 0) {
        await sleep(options.retryDelayMs);
      }
    }
  }
}
