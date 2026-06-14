import type { AxiosError } from 'axios';
import type { CategoryPayload } from '../../api/financial';
import type { Category } from '../../types/financial';
import type { CategoryFormSubmitValues, CategoryFormValues } from './categories.schema';

export function toCategoryPayload(values: CategoryFormSubmitValues): CategoryPayload {
  return {
    ...values,
    description: values.description?.trim() || undefined,
  };
}

export function toCategoryFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    type: category.type,
    icon: category.icon,
    priority: category.priority,
    description: category.description ?? '',
  };
}

export function sortCategories(categories: Category[]) {
  return [...categories].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'expense' ? -1 : 1;
    }

    if (left.status !== right.status) {
      return left.status === 'active' ? -1 : 1;
    }

    return left.priority - right.priority || left.name.localeCompare(right.name);
  });
}

export function getCategoryErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
