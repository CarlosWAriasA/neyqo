import type { ReportPreset } from '../../api/reports';

export type { ReportPreset };

export interface ReportFilterState {
  preset: ReportPreset;
  dateFrom: string;
  dateTo: string;
  accountId: string;
  categoryId: string;
}

export const defaultReportFilters: ReportFilterState = {
  preset: 'current-month',
  dateFrom: '',
  dateTo: '',
  accountId: '',
  categoryId: '',
};
