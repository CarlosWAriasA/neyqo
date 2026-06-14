import { X } from 'lucide-react';
import type { RefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { categoryIconOptions } from '../../../config/categoryIcons';
import type { Category } from '../../../types/financial';
import type { CategoryFormSubmitValues, CategoryFormValues } from '../categories.schema';
import { IconPicker } from './IconPicker';

interface CategoryPanelProps {
  form: UseFormReturn<CategoryFormValues, unknown, CategoryFormSubmitValues>;
  selectedCategory: Category | null;
  saving: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: (values: CategoryFormSubmitValues) => void;
}

export function CategoryPanel({
  form,
  selectedCategory,
  saving,
  nameInputRef,
  onClose,
  onSubmit,
}: CategoryPanelProps) {
  const nameField = form.register('name');

  return (
    <div
      className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="ml-auto grid h-full w-full max-w-xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">
              {selectedCategory ? 'Editar categoría' : 'Nueva categoría'}
            </h2>
            <p className="mt-1 text-sm text-subtle">
              Define cómo quieres clasificar movimientos, presupuestos y reportes.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Nombre" error={form.formState.errors.name?.message}>
            <Input
              placeholder="Restaurantes"
              {...nameField}
              ref={(node) => {
                nameField.ref(node);
                nameInputRef.current = node;
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select {...form.register('type')}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </Select>
            </Field>
            <Field label="Icono" error={form.formState.errors.icon?.message}>
              <Select {...form.register('icon')}>
                {categoryIconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Prioridad" error={form.formState.errors.priority?.message}>
            <Input type="number" min={1} max={999} step={1} {...form.register('priority')} />
          </Field>
          <Field label="Descripción">
            <Input placeholder="Uso opcional de esta categoría" {...form.register('description')} />
          </Field>
          <IconPicker
            selectedIcon={form.watch('icon')}
            onSelect={(icon) => form.setValue('icon', icon, { shouldDirty: true })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
