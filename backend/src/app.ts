import Fastify from 'fastify';
import { env } from './config/env';
import { appDataSource } from './database/data-source';
import { Account } from './entities/account.entity';
import { AuthIdentity } from './entities/auth-identity.entity';
import { Budget } from './entities/budget.entity';
import { Category } from './entities/category.entity';
import { Transaction } from './entities/transaction.entity';
import { UserPreference } from './entities/user-preference.entity';
import { User } from './entities/user.entity';
import { buildAccountsRoutes } from './modules/accounts/accounts.routes';
import { AccountsService } from './modules/accounts/accounts.service';
import { AuthEmailService } from './modules/auth/auth-email.service';
import { buildAuthRoutes } from './modules/auth/auth.routes';
import { AuthError, AuthService } from './modules/auth/auth.service';
import { buildBudgetsRoutes } from './modules/budgets/budgets.routes';
import { BudgetsService } from './modules/budgets/budgets.service';
import { buildCategoriesRoutes } from './modules/categories/categories.routes';
import { CategoriesService } from './modules/categories/categories.service';
import { buildPreferencesRoutes } from './modules/preferences/preferences.routes';
import { PreferencesService } from './modules/preferences/preferences.service';
import { buildInternalRoutes } from './modules/internal/internal.routes';
import { buildScheduledTransactionsRoutes } from './modules/scheduled-transactions/scheduled-transactions.routes';
import { ScheduledTransactionsService } from './modules/scheduled-transactions/scheduled-transactions.service';
import { buildTransactionsRoutes } from './modules/transactions/transactions.routes';
import { TransactionsService } from './modules/transactions/transactions.service';
import { registerSecurity } from './plugins/security';
import { logBackendError } from './utils/file-logger';

export async function buildApp() {
  const app = Fastify({
    logger: env.nodeEnv !== 'test',
  });

  await registerSecurity(app);

  const authEmailService = new AuthEmailService();
  const accountsService = new AccountsService(appDataSource.getRepository(Account));
  const categoriesService = new CategoriesService(appDataSource.getRepository(Category));
  const budgetsService = new BudgetsService(appDataSource);
  const authService = new AuthService(
    appDataSource.getRepository(User),
    authEmailService,
    appDataSource.getRepository(AuthIdentity),
    accountsService,
    categoriesService,
    budgetsService,
  );
  const preferencesService = new PreferencesService(appDataSource.getRepository(UserPreference));
  const transactionsService = new TransactionsService(appDataSource);
  const scheduledTransactionsService = new ScheduledTransactionsService(appDataSource);

  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(buildAuthRoutes(authService), {
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

  await app.register(buildInternalRoutes(transactionsService), {
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
