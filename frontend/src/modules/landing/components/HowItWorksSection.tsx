import { Card } from '../../../components/ui/card';
import { howItWorksSteps } from '../landing.constants';

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="border-y border-border bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="text-3xl font-semibold text-text">Cómo funciona</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {howItWorksSteps.map(([title, text], index) => (
            <Card key={title}>
              <span className="flex h-10 w-10 items-center justify-center rounded-panel bg-primary-soft font-semibold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-text">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-subtle">{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
