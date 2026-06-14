import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-normal text-text md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-subtle md:max-w-2xl">{description}</p>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end [&>button]:flex-1 sm:[&>button]:flex-none">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
