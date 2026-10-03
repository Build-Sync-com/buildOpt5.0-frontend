import type { ReactNode } from 'react';

/**
 * PageHeader
 *
 * Title block for a web app page, matching the dashboard header. Optional
 * description underneath and page actions on the right.
 */
type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-600">Workspace</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
