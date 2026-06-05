import { afterEach, describe, expect, it, vi } from 'vitest';
import { JobScheduler } from '../src/core/scheduler/scheduler';
import type { WorkerJob } from '../src/core/scheduler/types';

function job(name: string, intervalMs: number, enabled = true, execute = vi.fn(async () => ({
  processedCount: 1,
  successCount: 1,
  failedCount: 0,
  status: 'success' as const,
}))): WorkerJob {
  return {
    name,
    enabled,
    intervalMs,
    execute,
  };
}

describe('JobScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('registra dos jobs con intervalos distintos y ejecuta cada uno según su configuración', async () => {
    vi.useFakeTimers();
    const firstExecute = vi.fn(async () => ({ processedCount: 1, successCount: 1, failedCount: 0, status: 'success' as const }));
    const secondExecute = vi.fn(async () => ({ processedCount: 1, successCount: 1, failedCount: 0, status: 'success' as const }));
    const scheduler = new JobScheduler([job('first', 1000, true, firstExecute), job('second', 2000, true, secondExecute)]);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(firstExecute).toHaveBeenCalledTimes(1);
    expect(secondExecute).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(firstExecute).toHaveBeenCalledTimes(2);
    expect(secondExecute).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(firstExecute).toHaveBeenCalledTimes(3);
    expect(secondExecute).toHaveBeenCalledTimes(2);

    await scheduler.stop();
  });

  it('desactiva un job mediante configuración', async () => {
    const execute = vi.fn();
    const scheduler = new JobScheduler([job('disabled', 1000, false, execute)]);

    scheduler.start();
    await scheduler.runJob('disabled', { triggeredBy: 'manual' });
    await scheduler.stop();

    expect(execute).not.toHaveBeenCalled();
  });

  it('un error en un job no detiene los demás', async () => {
    const failing = vi.fn(async () => {
      throw new Error('boom');
    });
    const healthy = vi.fn(async () => ({ processedCount: 1, successCount: 1, failedCount: 0, status: 'success' as const }));
    const scheduler = new JobScheduler([job('failing', 1000, true, failing), job('healthy', 1000, true, healthy)]);

    const failedResult = await scheduler.runJob('failing', { triggeredBy: 'manual' });
    const healthyResult = await scheduler.runJob('healthy', { triggeredBy: 'manual' });

    expect(failedResult.status).toBe('failed');
    expect(healthyResult.status).toBe('success');
    expect(healthy).toHaveBeenCalledTimes(1);
  });

  it('evita solapar ejecuciones del mismo job', async () => {
    let resolveExecution: (() => void) | undefined;
    const execute = vi.fn(
      () =>
        new Promise<{ processedCount: number; successCount: number; failedCount: number; status: 'success' }>((resolve) => {
          resolveExecution = () => resolve({ processedCount: 1, successCount: 1, failedCount: 0, status: 'success' });
        }),
    );
    const scheduler = new JobScheduler([job('single-flight', 1000, true, execute)]);

    const firstRun = scheduler.runJob('single-flight', { triggeredBy: 'manual' });
    const secondRun = await scheduler.runJob('single-flight', { triggeredBy: 'manual' });
    resolveExecution?.();
    await firstRun;

    expect(secondRun.processedCount).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
