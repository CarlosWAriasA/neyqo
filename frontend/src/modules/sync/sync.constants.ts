import { Mail, RefreshCw } from 'lucide-react';

export const syncProviders = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Preparado para detectar consumos enviados por bancos y tarjetas cuando la conexión esté disponible.',
    icon: Mail,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Pensado para revisar avisos financieros desde cuentas Microsoft conectadas por el usuario.',
    icon: RefreshCw,
  },
] as const;
