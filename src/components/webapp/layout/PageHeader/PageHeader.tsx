/**
 * PageHeader
 *
 * Title block for a web app page, matching the dashboard header.
 */
type PageHeaderProps = {
  title: string;
};

function PageHeader({ title }: PageHeaderProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-blue-600">Workspace</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h1>
    </div>
  );
}

export default PageHeader;
