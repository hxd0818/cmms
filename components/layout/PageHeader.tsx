/**
 * Consistent page header for all staff pages.
 * Usage:
 * <PageHeader title="嘉宾库" description="共 27 位嘉宾">
 *   <Button>新增</Button>
 * </PageHeader>
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
