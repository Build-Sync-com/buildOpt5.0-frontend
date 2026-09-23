import type { ReactNode } from 'react';

/**
 * RoleGroup
 *
 * A labelled band on the role picker: group name and a count, joined by a
 * dashed leader line, with its cards laid out underneath.
 */
type RoleGroupProps = {
  label: string;
  /** Right-hand tag, e.g. "8 roles". */
  meta?: string;
  /** Grid classes for the cards, e.g. "sm:grid-cols-2 lg:grid-cols-4". */
  gridClassName?: string;
  className?: string;
  children: ReactNode;
};

function RoleGroup({
  label,
  meta,
  gridClassName = '',
  className = '',
  children,
}: RoleGroupProps) {
  return (
    <section className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold whitespace-nowrap text-gray-900">
          {label}
        </h2>
        <span
          className="h-px flex-1 border-t border-dashed border-gray-300"
          aria-hidden="true"
        />
        {meta && (
          <span className="text-xs whitespace-nowrap text-gray-400">
            {meta}
          </span>
        )}
      </div>
      {/* flex-1 lets cards match height with groups sharing the same row */}
      <div className={`mt-4 grid flex-1 gap-4 ${gridClassName}`}>{children}</div>
    </section>
  );
}

export default RoleGroup;
