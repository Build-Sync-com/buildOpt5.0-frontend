import type { ReactNode } from 'react';
import { inputClass } from '../formStyles';

/**
 * FormField
 *
 * Label, control, and an error or hint underneath. The control is passed as
 * children and should use `id={htmlFor}`.
 */
type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

/**
 * QuantityInput
 *
 * Number input with the material's unit shown inside on the right, so the
 * store keeper always sees whether they're typing bags, cubes or kg.
 */
type QuantityInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  /** Step matching the unit's decimals, e.g. 1 for bags, 0.01 for cubes. */
  step?: number;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function QuantityInput({
  id,
  value,
  onChange,
  unit,
  step = 1,
  error,
  disabled,
  placeholder = '0',
}: QuantityInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${unit ? 'pr-16' : ''}`}
      />
      {unit && (
        <span className="pointer-events-none absolute top-1/2 right-3 max-w-14 -translate-y-1/2 truncate text-sm text-gray-400">
          {unit}
        </span>
      )}
    </div>
  );
}
