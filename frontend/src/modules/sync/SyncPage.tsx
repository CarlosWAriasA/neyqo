import { PageHeader } from '../../components/common/PageHeader';
import { SyncComingSoon } from './components/SyncComingSoon';
import { SyncProviderCard } from './components/SyncProviderCard';
import { SyncSecurityCard } from './components/SyncSecurityCard';
import { syncProviders } from './sync.constants';

export function SyncPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Sincronización"
        description="La conexión con Gmail y Outlook todavía no está disponible."
      />

      <SyncComingSoon />

      <section className="grid gap-4 md:grid-cols-2">
        {syncProviders.map((provider) => (
          <SyncProviderCard key={provider.id} provider={provider} />
        ))}
      </section>

      <SyncSecurityCard />
    </div>
  );
}
