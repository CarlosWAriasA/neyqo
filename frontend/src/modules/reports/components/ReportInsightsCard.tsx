import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface Insight {
  title: string;
  description: string;
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
}

interface ReportInsightsCardProps {
  insights: Insight[];
}

const toneClass = {
  neutral: 'bg-info/10 text-info',
  positive: 'bg-positive/10 text-positive',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export function ReportInsightsCard({ insights }: ReportInsightsCardProps) {
  return (
    <Card className="grid content-start gap-4">
      <div>
        <h2 className="text-base font-semibold text-text">Lecturas rápidas</h2>
        <p className="mt-1 text-sm text-subtle">Señales accionables del rango seleccionado.</p>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border p-6 text-sm text-subtle">
          Aún no hay suficiente actividad para generar lecturas.
        </div>
      ) : (
        <div className="grid gap-3">
          {insights.map((insight) => {
            const Icon = insight.tone === 'positive' ? CheckCircle2 : insight.tone === 'neutral' ? Info : AlertTriangle;

            return (
              <article key={`${insight.title}-${insight.description}`} className="flex gap-3 rounded-panel border border-border p-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-panel ${toneClass[insight.tone]}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-text">{insight.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-subtle">{insight.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
