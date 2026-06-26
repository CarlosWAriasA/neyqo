import Fastify from 'fastify';
import { env } from './config/env';
import { appDataSource } from './database/data-source';
import { AuthIdentity } from './entities/auth-identity.entity';
import { Budget } from './entities/budget.entity';
import { Category } from './entities/category.entity';
import { Transaction } from './entities/transaction.entity';
import { UserPreference } from './entities/user-preference.entity';
import { User } from './entities/user.entity';
import { buildAccountsRoutes } from './modules/accounts/accounts.routes';
import { AccountsService } from './modules/accounts/accounts.service';
import { AuthAbuseProtection } from './modules/auth/auth-abuse-protection';
import { AuthEmailService } from './modules/auth/auth-email.service';
import { buildAuthRoutes } from './modules/auth/auth.routes';
import { AuthError, AuthService } from './modules/auth/auth.service';
import { buildBudgetsRoutes } from './modules/budgets/budgets.routes';
import { BudgetsService } from './modules/budgets/budgets.service';
import { buildCategoriesRoutes } from './modules/categories/categories.routes';
import { CategoriesService } from './modules/categories/categories.service';
import { buildDataBackupRoutes } from './modules/data-backup/data-backup.routes';
import { DataBackupService } from './modules/data-backup/data-backup.service';
import { buildPreferencesRoutes } from './modules/preferences/preferences.routes';
import { PreferencesService } from './modules/preferences/preferences.service';
import { buildReportsRoutes } from './modules/reports/reports.routes';
import { ReportsService } from './modules/reports/reports.service';
import { buildExchangeRatesRoutes } from './modules/exchange-rates/exchange-rates.routes';
import { ExchangeRatesService } from './modules/exchange-rates/exchange-rates.service';
import { buildInternalRoutes } from './modules/internal/internal.routes';
import { buildScheduledTransactionsRoutes } from './modules/scheduled-transactions/scheduled-transactions.routes';
import { ScheduledTransactionsService } from './modules/scheduled-transactions/scheduled-transactions.service';
import { buildInternalSyncRoutes } from './modules/sync/internal-sync.routes';
import { buildSyncRoutes } from './modules/sync/sync.routes';
import { SyncService } from './modules/sync/sync.service';
import { buildTransactionsRoutes } from './modules/transactions/transactions.routes';
import { TransactionsService } from './modules/transactions/transactions.service';
import { registerSecurity } from './plugins/security';
import { logBackendError } from './utils/file-logger';

export async function buildApp() {
  const app = Fastify({
    logger: env.nodeEnv !== 'test',
    bodyLimit: env.apiBodyLimitBytes,
    trustProxy: env.trustProxy,
  });

  await registerSecurity(app);

  const authEmailService = new AuthEmailService();
  const authAbuseProtection = new AuthAbuseProtection(appDataSource);
  const accountsService = new AccountsService(appDataSource);
  const categoriesService = new CategoriesService(appDataSource.getRepository(Category));
  const budgetsService = new BudgetsService(appDataSource);
  const preferencesService = new PreferencesService(appDataSource.getRepository(UserPreference));
  const reportsService = new ReportsService(appDataSource);
  const exchangeRatesService = new ExchangeRatesService();
  const scheduledTransactionsService = new ScheduledTransactionsService(appDataSource);
  const transactionsService = new TransactionsService(appDataSource);
  const syncService = new SyncService(appDataSource, transactionsService);
  const dataBackupService = new DataBackupService(
    appDataSource,
    transactionsService,
    accountsService,
    categoriesService,
    budgetsService,
    scheduledTransactionsService,
    preferencesService,
  );
  const authService = new AuthService(
    appDataSource,
    appDataSource.getRepository(User),
    authEmailService,
    appDataSource.getRepository(AuthIdentity),
    accountsService,
    categoriesService,
    budgetsService,
    preferencesService,
    scheduledTransactionsService,
  );

  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(buildAuthRoutes(authService, authAbuseProtection), {
    prefix: '/api/auth',
  });

  await app.register(buildAccountsRoutes(accountsService, authService), {
    prefix: '/api/accounts',
  });

  await app.register(buildCategoriesRoutes(categoriesService, authService), {
    prefix: '/api/categories',
  });

  await app.register(buildTransactionsRoutes(transactionsService, authService), {
    prefix: '/api/transactions',
  });

  await app.register(buildBudgetsRoutes(budgetsService, authService), {
    prefix: '/api/budgets',
  });

  await app.register(buildPreferencesRoutes(preferencesService, authService), {
    prefix: '/api/preferences',
  });

  await app.register(buildScheduledTransactionsRoutes(scheduledTransactionsService, authService), {
    prefix: '/api/scheduled-transactions',
  });

  await app.register(buildReportsRoutes(reportsService, authService), {
    prefix: '/api/reports',
  });

  await app.register(buildExchangeRatesRoutes(exchangeRatesService, authService), {
    prefix: '/api/exchange-rates',
  });

  await app.register(buildSyncRoutes(syncService, authService), {
    prefix: '/api/sync',
  });

  await app.register(buildDataBackupRoutes(dataBackupService, authService), {
    prefix: '/api/data',
  });

  await app.register(buildInternalRoutes(transactionsService), {
    prefix: '/internal',
  });

  await app.register(buildInternalSyncRoutes(syncService), {
    prefix: '/internal',
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      if (error.statusCode >= 500) {
        logBackendError('Auth error handled by API.', error, request, {
          statusCode: error.statusCode,
        });
      }

      reply.code(error.statusCode).send({
        message: error.message,
      });
      return;
    }

    request.log.error(error);
    logBackendError('Unhandled API error.', error, request, {
      statusCode: 500,
    });
    reply.code(500).send({
      message: 'Ocurrió un error interno en el servidor.',
    });
  });

  return app;
}
