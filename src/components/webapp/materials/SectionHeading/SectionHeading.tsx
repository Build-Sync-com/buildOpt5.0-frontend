import type { ReactNode } from 'react';

/**
 * SectionHeading
 *
 * Blue label followed by a dashed rule, as on the dashboard. Anything passed
 * as `aside` sits at the end of the rule.
 */
type SectionHeadingProps = {
  title: string;
  aside?: ReactNode;
  className?: string;
};

function SectionHeading({ title, aside, className = '' }: SectionHeadingProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <h3 className="text-sm font-semibold text-blue-600">{title}</h3>
      <span className="h-px flex-1 border-t border-dashed border-gray-300" aria-hidden="true" />
      {aside && <span className="text-xs text-gray-400">{aside}</span>}
    </div>
  );
}

export default SectionHeading;
