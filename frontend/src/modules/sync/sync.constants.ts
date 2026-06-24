import { Mail, RefreshCw } from 'lucide-react';
import type { DominicanBankCode, ImportedTransaction } from '../../types/financial';

export const syncProviders = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Detecta avisos bancarios desde tu correo y prepara movimientos para revisar.',
    icon: Mail,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Conecta una cuenta Microsoft para centralizar avisos financieros.',
    icon: RefreshCw,
  },
] as const;

export const dominicanBankOptions: Array<{ value: DominicanBankCode; label: string }> = [
  { value: 'popular', label: 'Popular' },
  { value: 'qik', label: 'Qik' },
  { value: 'santa_cruz', label: 'Santa Cruz' },
  { value: 'banesco', label: 'Banesco' },
  { value: 'asociacion_popular', label: 'Asociación Popular' },
  { value: 'lafise', label: 'Lafise' },
  { value: 'bhd', label: 'BHD' },
  { value: 'banreservas', label: 'Banreservas' },
  { value: 'bdi', label: 'BDI' },
  { value: 'unknown', label: 'Otro banco' },
];

export const bankLabels = Object.fromEntries(
  dominicanBankOptions.map((option) => [option.value, option.label]),
) as Record<DominicanBankCode, string>;

export const importedTransactionStatusLabels: Record<ImportedTransaction['status'], string> = {
  ready_for_review: 'Lista',
  needs_review: 'Revisar',
  ignored: 'Ignorada',
  imported: 'Importada',
  failed: 'Falló',
};

export const importedTransactionEventLabels: Record<ImportedTransaction['eventType'], string> = {
  purchase: 'Consumo',
  reversal: 'Reverso',
  payment: 'Pago',
  withdrawal: 'Retiro',
  deposit: 'Depósito',
  transfer: 'Transferencia',
  unknown: 'Otro',
};
