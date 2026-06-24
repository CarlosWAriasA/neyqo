import { CardGridSkeleton, StatGridSkeleton, TransactionListSkeleton } from '../components/common/LoadingSkeletons';
import { Skeleton } from '../components/common/Skeleton';
import { Card } from '../components/ui/card';

interface AppRouteSkeletonProps {
  initializing?: boolean;
  pathname: string;
}

export function AppRouteSkeleton({ initializing = false, pathname }: AppRouteSkeletonProps) {
  return (
    <div className="grid gap-6 lg:h-full lg:min-h-0">
      {initializing ? (
        <div className="rounded-panel border border-border bg-surface p-4 text-sm text-subtle shadow-soft">
          Preparando tus cuentas, categorías y programados iniciales...
        </div>
      ) : null}
      {renderRouteSkeleton(pathname)}
    </div>
  );
}

function renderRouteSkeleton(pathname: string) {
  if (pathname.startsWith('/app/settings')) {
    return <SettingsSkeleton />;
  }

  if (pathname.startsWith('/app/scheduled')) {
    return <ScheduledSkeleton />;
  }

  if (pathname.startsWith('/app/transactions')) {
    return <TransactionsSkeleton />;
  }

  if (pathname.startsWith('/app/sync')) {
    return <SyncSkeleton />;
  }

  if (pathname.startsWith('/app/accounts')) {
    return <EntityPageSkeleton variant="standard" />;
  }

  if (pathname.startsWith('/app/categories')) {
    return <EntityPageSkeleton variant="compact" />;
  }

  if (pathname.startsWith('/app/budgets')) {
    return <EntityPageSkeleton statCount={4} variant="detailed" />;
  }

  if (pathname.startsWith('/app/reports')) {
    return <ReportsSkeleton />;
  }

  return <DashboardSkeleton />;
}

function PageHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="w-full max-w-3xl">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-2 h-4 w-4/5 max-w-lg" />
      </div>
      {action ? <Skeleton className="h-10 w-full sm:w-40" /> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={3} />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={3} />
      </section>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <ProfileSettingsCardSkeleton />
        <PreferencesSettingsCardSkeleton />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <CompactInfoCardSkeleton />
        <SessionSettingsCardSkeleton />
        <LegalSettingsCardSkeleton />
      </section>
    </>
  );
}

function ScheduledSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <FilterBarSkeleton />
      <div className="rounded-panel border border-border bg-surface/40 p-3">
        <CardGridSkeleton variant="detailed" />
      </div>
    </>
  );
}

function TransactionsSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <FilterBarSkeleton columns="sm:grid-cols-[1fr_160px_160px_160px]" />
      <TransactionListSkeleton rows={7} />
    </>
  );
}

function SyncSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <section className="grid gap-4 md:grid-cols-2">
        <ProviderConnectionSkeleton />
        <ProviderConnectionSkeleton />
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={4} />
      </section>
    </>
  );
}

function EntityPageSkeleton({
  statCount = 3,
  variant,
}: {
  statCount?: number;
  variant: 'compact' | 'standard' | 'detailed';
}) {
  return (
    <>
      <PageHeaderSkeleton />
      <StatGridSkeleton count={statCount} />
      <FilterBarSkeleton />
      <CardGridSkeleton variant={variant} />
    </>
  );
}

function ReportsSkeleton() {
  return (
    <>
      <PageHeaderSkeleton action={false} />
      <StatGridSkeleton count={4} />
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="grid gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        </Card>
        <PanelSkeleton rows={5} />
      </section>
    </>
  );
}

function FilterBarSkeleton({ columns = 'sm:grid-cols-[1fr_180px]' }: { columns?: string }) {
  return (
    <Card className="grid gap-4">
      <div className={`grid gap-3 ${columns}`}>
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        {columns.includes('160px_160px') ? (
          <>
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </>
        ) : null}
      </div>
    </Card>
  );
}

function ProfileSettingsCardSkeleton() {
  return (
    <Card className="content-start">
      <CardTitleSkeleton />
      <div className="mt-5 grid gap-4">
        <FieldSkeleton />
        <FieldSkeleton />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

function PreferencesSettingsCardSkeleton() {
  return (
    <Card className="grid gap-5">
      <CardTitleSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </Card>
  );
}

function CompactInfoCardSkeleton() {
  return (
    <Card>
      <CardTitleSkeleton />
      <Skeleton className="mt-4 h-4 w-full max-w-md" />
      <Skeleton className="mt-2 h-4 w-4/5 max-w-sm" />
    </Card>
  );
}

function SessionSettingsCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <CardTitleSkeleton />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-full max-w-md" />
      <Skeleton className="mt-2 h-4 w-4/5 max-w-sm" />
      <div className="mt-5 flex justify-end">
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>
    </Card>
  );
}

function LegalSettingsCardSkeleton() {
  return (
    <Card>
      <CardTitleSkeleton />
      <Skeleton className="mt-4 h-4 w-full max-w-lg" />
      <Skeleton className="mt-2 h-4 w-3/4 max-w-sm" />
      <div className="mt-5 grid gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </Card>
  );
}

function ProviderConnectionSkeleton() {
  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <CardTitleSkeleton />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-4/5 max-w-sm" />
      <Skeleton className="h-10 w-full sm:w-36" />
    </Card>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="grid gap-4">
      <CardTitleSkeleton />
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>
    </Card>
  );
}

function CardTitleSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-5 shrink-0" />
      <Skeleton className="h-5 w-36" />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10" />
    </div>
  );
}
