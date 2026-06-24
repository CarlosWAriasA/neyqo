import { DatabaseBackup, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import type { ImportBackupSummary } from '../../../api/dataBackup';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useDownloadFullBackup, useDownloadTransactionsCsv, useImportFullBackup } from '../../../features/finance/hooks';

export function DataBackupCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvMutation = useDownloadTransactionsCsv();
  const backupMutation = useDownloadFullBackup();
  const importMutation = useImportFullBackup();

  function handleDownloadCsv() {
    csvMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Movimientos exportados.');
      },
      onError: () => {
        toast.error('No pudimos exportar tus movimientos.');
      },
    });
  }

  function handleDownloadBackup() {
    backupMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Backup descargado.');
      },
      onError: () => {
        toast.error('No pudimos preparar el backup.');
      },
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('Selecciona un archivo JSON de backup.');
      return;
    }

    try {
      const backup = JSON.parse(await file.text()) as unknown;
      importMutation.mutate(backup, {
        onSuccess: (summary) => {
          toast.success(formatImportSummary(summary));
        },
        onError: () => {
          toast.error('No pudimos importar ese backup.');
        },
      });
    } catch {
      toast.error('No pudimos leer ese archivo de backup.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const backupActions = [
    {
      title: 'Exportar movimientos CSV',
      description: 'Transacciones listas para hoja de cálculo.',
      icon: FileSpreadsheet,
      action: handleDownloadCsv,
      disabled: csvMutation.isPending,
      label: csvMutation.isPending ? 'Exportando...' : 'Exportar',
    },
    {
      title: 'Backup completo JSON',
      description: 'Copia completa de tu información financiera.',
      icon: Download,
      action: handleDownloadBackup,
      disabled: backupMutation.isPending,
      label: backupMutation.isPending ? 'Preparando...' : 'Descargar',
    },
    {
      title: 'Importar backup',
      description: 'Agrega datos de una copia guardada.',
      icon: Upload,
      action: handleImportClick,
      disabled: importMutation.isPending,
      label: importMutation.isPending ? 'Importando...' : 'Importar',
    },
  ];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <DatabaseBackup className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Datos y backup</h2>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void handleImportFile(event.target.files?.[0])}
      />
      <div className="mt-5 grid gap-3">
        {backupActions.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
              <span className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-text">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-subtle">{item.description}</span>
                </span>
              </span>
              <Button variant="secondary" onClick={item.action} disabled={item.disabled}>
                {item.label}
              </Button>
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        <Badge tone="neutral">Backup seguro</Badge>
      </div>
    </Card>
  );
}

function formatImportSummary(summary: ImportBackupSummary) {
  const sections = [
    summary.accounts,
    summary.categories,
    summary.transactions,
    summary.budgets,
    summary.scheduledTransactions,
  ];
  const created = sections.reduce((total, section) => total + section.created, 0);
  const skipped = sections.reduce((total, section) => total + section.skipped, 0);
  const failed = sections.reduce((total, section) => total + section.failed, 0);

  return `Backup importado: ${created} creados, ${skipped} omitidos, ${failed} con error.`;
}
