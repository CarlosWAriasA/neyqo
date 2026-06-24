import { Link2, Plus, RefreshCw, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '../../components/common/EmptyState';
import { DetailListSkeleton, StatGridSkeleton } from '../../components/common/LoadingSkeletons';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  useAccounts,
  useCategories,
  useCreateEmailImportRule,
  useEmailImportRules,
  useExternalConnections,
  useInfiniteImportedTransactions,
  useStartEmailSyncOAuth,
  useUpdateEmailImportRule,
  useUpdateImportedTransaction,
} from '../../features/finance/hooks';
import { ImportRuleCard } from './components/ImportRuleCard';
import { ImportRulePanel } from './components/ImportRulePanel';
import { ImportedTransactionCard } from './components/ImportedTransactionCard';
import { SyncProviderCard } from './components/SyncProviderCard';
import { syncProviders } from './sync.constants';

export function SyncPage() {
  const [rulePanelOpen, setRulePanelOpen] = useState(false);
  const [changingRuleId, setChangingRuleId] = useState<string | null>(null);
  const [changingImportedId, setChangingImportedId] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const externalConnectionsQuery = useExternalConnections();
  const rulesQuery = useEmailImportRules({ status: 'all' });
  const importedQuery = useInfiniteImportedTransactions({ status: 'all', limit: 20 });
  const createRuleMutation = useCreateEmailImportRule();
  const startOAuthMutation = useStartEmailSyncOAuth();
  const updateRuleMutation = useUpdateEmailImportRule();
  const updateImportedMutation = useUpdateImportedTransaction();
  const importedTransactions = useMemo(
    () => importedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [importedQuery.data],
  );
  const importRules = rulesQuery.data ?? [];
  const externalConnections = externalConnectionsQuery.data ?? [];
  const activeRules = importRules.filter((rule) => rule.status === 'active').length;
  const needsReview = importedTransactions.filter((transaction) => transaction.status === 'needs_review').length;
  const readyForReview = importedTransactions.filter((transaction) => transaction.status === 'ready_for_review').length;
  const dataIsLoading = accountsQuery.isLoading || categoriesQuery.isLoading || rulesQuery.isLoading;
  const dataHasError = accountsQuery.isError || categoriesQuery.isError || rulesQuery.isError || externalConnectionsQuery.isError;

  useEffect(() => {
    const syncStatus = searchParams.get('sync');
    const provider = searchParams.get('provider');

    if (!syncStatus) {
      return;
    }

    if (syncStatus === 'connected') {
      toast.success(provider === 'outlook' ? 'Outlook conectado.' : 'Gmail conectado.');
      void externalConnectionsQuery.refetch();
    } else if (syncStatus === 'error') {
      toast.error('No pudimos completar la conexión del correo.');
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('sync');
    nextParams.delete('provider');
    nextParams.delete('reason');
    setSearchParams(nextParams, { replace: true });
  }, [externalConnectionsQuery, searchParams, setSearchParams]);

  function retryBaseData() {
    void accountsQuery.refetch();
    void categoriesQuery.refetch();
    void rulesQuery.refetch();
    void externalConnectionsQuery.refetch();
  }

  function startEmailConnection(provider: 'gmail' | 'outlook') {
    setConnectingProvider(provider);
    startOAuthMutation.mutate(
      { provider, returnTo: window.location.href },
      {
        onError: () => {
          toast.error('No pudimos iniciar la conexión. Revisa los datos del proveedor.');
          setConnectingProvider(null);
        },
      },
    );
  }

  function toggleRuleStatus(ruleId: string, nextStatus: 'active' | 'inactive') {
    setChangingRuleId(ruleId);
    updateRuleMutation.mutate(
      { importRuleId: ruleId, payload: { status: nextStatus } },
      {
        onSuccess: () => toast.success(nextStatus === 'active' ? 'Regla activada.' : 'Regla pausada.'),
        onError: () => toast.error('No pudimos actualizar la regla.'),
        onSettled: () => setChangingRuleId(null),
      },
    );
  }

  function updateImportedStatus(importedTransactionId: string, status: 'ignored' | 'needs_review') {
    setChangingImportedId(importedTransactionId);
    updateImportedMutation.mutate(
      { importedTransactionId, payload: { status } },
      {
        onSuccess: () => toast.success(status === 'ignored' ? 'Transacción ignorada.' : 'Transacción enviada a revisión.'),
        onError: () => toast.error('No pudimos actualizar la transacción detectada.'),
        onSettled: () => setChangingImportedId(null),
      },
    );
  }

  return (
    <div className="grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <PageHeader
        title="Sincronización"
        description="Conecta tu correo, revisa movimientos detectados y decide cómo asociarlos."
        actions={
          <Button onClick={() => setRulePanelOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva regla
          </Button>
        }
      />

      {dataIsLoading ? (
        <StatGridSkeleton />
      ) : (
        <section className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Reglas activas</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{activeRules}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Listas</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{readyForReview}</p>
          </Card>
          <Card className="p-3 sm:p-5">
            <p className="text-xs leading-5 text-subtle sm:text-sm">Pendientes</p>
            <p className="mt-1 text-xl font-semibold text-text sm:mt-2 sm:text-2xl">{needsReview}</p>
          </Card>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {syncProviders.map((provider) => (
          <SyncProviderCard
            key={provider.id}
            provider={provider}
            connection={externalConnections.find((connection) => connection.provider === provider.id)}
            connecting={connectingProvider === provider.id}
            onConnect={() => startEmailConnection(provider.id)}
          />
        ))}
      </section>

      {dataHasError ? (
        <ErrorState
          title="No pudimos cargar sincronización"
          description="Reintenta para volver a consultar conexiones, reglas y movimientos."
          onRetry={retryBaseData}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-text">Reglas de asociación</h2>
              <p className="mt-1 text-sm text-subtle">Banco, tarjeta y destino contable.</p>
            </div>
            <Link2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </div>

          <div className="mt-4 grid gap-3">
            {rulesQuery.isLoading ? <DetailListSkeleton rows={2} /> : null}

            {!rulesQuery.isLoading && !rulesQuery.isError && importRules.length === 0 ? (
              <EmptyState
                icon={Link2}
                title="Aún no hay reglas"
                description="Crea tu primera regla para clasificar movimientos automáticamente."
                actionLabel="Nueva regla"
                onAction={() => setRulePanelOpen(true)}
              />
            ) : null}

            {importRules.map((rule) => (
              <ImportRuleCard
                key={rule.id}
                rule={rule}
                changing={changingRuleId === rule.id}
                onToggleStatus={() => toggleRuleStatus(rule.id, rule.status === 'active' ? 'inactive' : 'active')}
              />
            ))}
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-text">Transacciones detectadas</h2>
              <p className="mt-1 text-sm text-subtle">Movimientos listos para revisar.</p>
            </div>
            <WalletCards className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </div>

          <div className="mt-4 grid gap-3">
            {importedQuery.isLoading ? <DetailListSkeleton rows={3} /> : null}

            {importedQuery.isError ? (
              <ErrorState
                title="No pudimos cargar las transacciones detectadas"
                description="Reintenta para revisar los movimientos encontrados."
                onRetry={() => void importedQuery.refetch()}
              />
            ) : null}

            {!importedQuery.isLoading && !importedQuery.isError && importedTransactions.length === 0 ? (
              <EmptyState
                icon={RefreshCw}
                title="Sin movimientos detectados"
                description="Los avisos bancarios aparecerán aquí cuando conectes una cuenta y haya coincidencias."
              />
            ) : null}

            {importedTransactions.map((transaction) => (
              <ImportedTransactionCard
                key={transaction.id}
                transaction={transaction}
                changing={changingImportedId === transaction.id}
                onIgnore={() => updateImportedStatus(transaction.id, 'ignored')}
                onReopen={() => updateImportedStatus(transaction.id, 'needs_review')}
              />
            ))}

            {importedQuery.hasNextPage ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void importedQuery.fetchNextPage()}
                disabled={importedQuery.isFetchingNextPage}
              >
                {importedQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
              </Button>
            ) : null}
          </div>
        </Card>
      </section>

      {rulePanelOpen ? (
        <ImportRulePanel
          accounts={accountsQuery.data ?? []}
          categories={categoriesQuery.data ?? []}
          saving={createRuleMutation.isPending}
          onClose={() => setRulePanelOpen(false)}
          onSubmit={(payload) => {
            createRuleMutation.mutate(payload, {
              onSuccess: () => {
                toast.success('Regla creada.');
                setRulePanelOpen(false);
              },
              onError: () => toast.error('No pudimos crear la regla.'),
            });
          }}
        />
      ) : null}
    </div>
  );
}
