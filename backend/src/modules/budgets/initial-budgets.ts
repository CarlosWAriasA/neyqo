import type { BudgetPeriod } from '../../entities/budget.entity';

export interface InitialBudgetTemplate {
  name: string;
  categoryName: string;
  period: BudgetPeriod;
  maxAmount: number;
}

export const initialBudgetTemplates: InitialBudgetTemplate[] = [
  {
    name: 'Comida mensual',
    categoryName: 'Comida',
    period: 'monthly',
    maxAmount: 12000,
  },
  {
    name: 'Transporte mensual',
    categoryName: 'Transporte',
    period: 'monthly',
    maxAmount: 4000,
  },
  {
    name: 'Entretenimiento mensual',
    categoryName: 'Entretenimiento',
    period: 'monthly',
    maxAmount: 3000,
  },
];
