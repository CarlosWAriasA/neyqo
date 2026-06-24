import { useQuery } from '@tanstack/react-query';
import {
  getReportsBudgetPerformance,
  getReportsCashflow,
  getReportsSpendingByAccount,
  getReportsSpendingByCategory,
  getReportsSummary,
  type ReportFilters,
} from '../../api/reports';
import { financeQueryFreshness } from './queryFreshness';
import { financeQueryKeys } from './queryKeys';

export function useReportsSummary(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: financeQueryKeys.reportsSummary(filters),
    queryFn: () => getReportsSummary(filters),
    enabled,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useReportsCashflow(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: financeQueryKeys.reportsCashflow(filters),
    queryFn: () => getReportsCashflow(filters),
    enabled,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useReportsSpendingByCategory(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: financeQueryKeys.reportsSpendingByCategory(filters),
    queryFn: () => getReportsSpendingByCategory(filters),
    enabled,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useReportsSpendingByAccount(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: financeQueryKeys.reportsSpendingByAccount(filters),
    queryFn: () => getReportsSpendingByAccount(filters),
    enabled,
    staleTime: financeQueryFreshness.highActivity,
  });
}

export function useReportsBudgetPerformance(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: financeQueryKeys.reportsBudgetPerformance(filters),
    queryFn: () => getReportsBudgetPerformance(filters),
    enabled,
    staleTime: financeQueryFreshness.highActivity,
  });
}
