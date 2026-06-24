import { apiClient } from './client';

export interface ImportSummaryItem {
  created: number;
  skipped: number;
  failed: number;
}

export interface ImportBackupSummary {
  accounts: ImportSummaryItem;
  categories: ImportSummaryItem;
  transactions: ImportSummaryItem;
  budgets: ImportSummaryItem;
  scheduledTransactions: ImportSummaryItem;
  preferences: { updated: boolean };
}

export async function downloadTransactionsCsv() {
  const response = await apiClient.get<Blob>('/data/transactions.csv', {
    responseType: 'blob',
  });

  downloadBlob(response.data, getFilename(response.headers['content-disposition'], 'neyqo-transacciones.csv'));
}

export async function downloadFullBackup() {
  const response = await apiClient.get<Blob>('/data/backup.json', {
    responseType: 'blob',
  });

  downloadBlob(response.data, getFilename(response.headers['content-disposition'], 'neyqo-backup.json'));
}

export async function importFullBackup(backup: unknown) {
  const response = await apiClient.post<{ summary: ImportBackupSummary }>('/data/import', backup);
  return response.data.summary;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getFilename(contentDisposition: unknown, fallback: string) {
  if (typeof contentDisposition !== 'string') {
    return fallback;
  }

  const match = contentDisposition.match(/filename="?(?<filename>[^"]+)"?/);
  return match?.groups?.filename ?? fallback;
}
