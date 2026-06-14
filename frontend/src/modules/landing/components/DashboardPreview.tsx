import { motion } from 'motion/react';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { formatCurrency } from '../../../utils/format';
import { previewCategories } from '../landing.constants';

export function DashboardPreview() {
  return (
    <Card className="relative p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-subtle">Balance disponible</p>
          <p className="text-3xl font-semibold text-text">{formatCurrency(184250)}</p>
        </div>
        <Badge tone="income">+12.4%</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="bg-muted shadow-none">
          <p className="text-sm text-subtle">Ingresos</p>
          <p className="mt-2 text-xl font-semibold text-positive">{formatCurrency(96500)}</p>
        </Card>
        <Card className="bg-muted shadow-none">
          <p className="text-sm text-subtle">Gastos</p>
          <p className="mt-2 text-xl font-semibold text-danger">{formatCurrency(58400)}</p>
        </Card>
      </div>
      <div className="mt-5 grid gap-3">
        {previewCategories.map(([item, percent], index) => (
          <div key={item}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-text">{item}</span>
              <span className="text-subtle">{percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-border">
              <motion.div
                className="h-2 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ delay: 0.3 + index * 0.08, duration: 0.45 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
