import { X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Field } from '../../../components/forms/Field';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { EmailImportRulePayload } from '../../../api/financial';
import type { Account, Category, DominicanBankCode } from '../../../types/financial';
import { dominicanBankOptions } from '../sync.constants';

interface ImportRulePanelProps {
  accounts: Account[];
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: EmailImportRulePayload) => void;
}

export function ImportRulePanel({ accounts, categories, saving, onClose, onSubmit }: ImportRulePanelProps) {
  const activeAccounts = useMemo(() => accounts.filter((account) => account.status === 'active'), [accounts]);
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.status === 'active' && category.type === 'expense'),
    [categories],
  );
  const [bankCode, setBankCode] = useState<DominicanBankCode>('qik');
  const [accountId, setAccountId] = useState(activeAccounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? '');
  const [productKind, setProductKind] = useState<EmailImportRulePayload['productKind']>('card');
  const [cardLastDigits, setCardLastDigits] = useState('');
  const [merchantPattern, setMerchantPattern] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAccountId((current) => current || activeAccounts[0]?.id || '');
  }, [activeAccounts]);

  useEffect(() => {
    setCategoryId((current) => current || expenseCategories[0]?.id || '');
  }, [expenseCategories]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const digits = cardLastDigits.trim();
    const merchant = merchantPattern.trim();

    if (!accountId || !categoryId) {
      setError('Selecciona una cuenta y una categoría de gasto.');
      return;
    }

    if (digits && !/^\d{4}$/.test(digits)) {
      setError('Los últimos dígitos deben ser exactamente 4 números.');
      return;
    }

    setError(null);
    onSubmit({
      bankCode,
      accountId,
      categoryId,
      productKind,
      ...(digits ? { cardLastDigits: digits } : {}),
      ...(merchant ? { merchantPattern: merchant } : {}),
    });
  }

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
            <h2 className="text-xl font-semibold text-text">Nueva regla</h2>
            <p className="mt-1 text-sm text-subtle">Asocia los avisos de un banco con una cuenta y categoría.</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Banco">
            <Select value={bankCode} onChange={(event) => setBankCode(event.target.value as DominicanBankCode)}>
              {dominicanBankOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cuenta">
              <Select value={accountId} onChange={(event) => setAccountId(event.target.value)} disabled={activeAccounts.length === 0}>
                {activeAccounts.length === 0 ? <option value="">Sin cuentas activas</option> : null}
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoría">
              <Select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={expenseCategories.length === 0}
              >
                {expenseCategories.length === 0 ? <option value="">Sin categorías de gasto</option> : null}
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Producto">
              <Select value={productKind} onChange={(event) => setProductKind(event.target.value as EmailImportRulePayload['productKind'])}>
                <option value="card">Tarjeta</option>
                <option value="account">Cuenta</option>
                <option value="unknown">Otro</option>
              </Select>
            </Field>
            <Field label="Últimos 4 dígitos">
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder="4737"
                value={cardLastDigits}
                onChange={(event) => setCardLastDigits(event.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </Field>
          </div>

          <Field label="Comercio opcional">
            <Input
              placeholder="CLARO, BRAVO, UBER..."
              value={merchantPattern}
              onChange={(event) => setMerchantPattern(event.target.value)}
            />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || activeAccounts.length === 0 || expenseCategories.length === 0}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
