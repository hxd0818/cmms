import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { auditService } from '@/lib/audit/logger';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const result = await auditService.list({
    entityType: params.entityType,
    page: params.page ? Number(params.page) : 1,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">审计日志</h1>
        <p className="text-sm text-slate-500">共 {result.total} 条记录</p>
      </div>

      <div className="cmms-card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-2">时间</th>
              <th className="text-left p-2">操作者</th>
              <th className="text-left p-2">动作</th>
              <th className="text-left p-2">实体</th>
              <th className="text-left p-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-8">
                  暂无审计记录
                </td>
              </tr>
            ) : (
              result.items.map((log) => (
                <tr key={log.id} className="border-b hover:bg-slate-50">
                  <td className="p-2 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="p-2">
                    <span className="text-xs">
                      {log.actorType} {log.actorRole ? `(${log.actorRole})` : ''}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className="font-mono text-xs">{log.action}</span>
                  </td>
                  <td className="p-2">
                    <span className="font-mono text-xs">{log.entityType}</span>
                  </td>
                  <td className="p-2">
                    <span className="font-mono text-xs text-slate-500">
                      {log.entityId.slice(0, 12)}...
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
