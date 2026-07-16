'use client';

import Link from 'next/link';
import type { Meeting } from '@/lib/generated/prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getBadgeStyle } from '@/lib/shared/badge-colors';

interface Props {
  items: Meeting[];
  page: number;
  pageSize: number;
  total: number;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PLANNING: '筹备中',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELED: '已取消',
};

export function MeetingList({ items, page, pageSize, total }: Props) {
  return (
    <div className="space-y-4">
      <div className="cmms-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>编号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>结束时间</TableHead>
              <TableHead>场地</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/meetings/${m.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {m.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{m.code}</TableCell>
                  <TableCell>
                    <Badge className={getBadgeStyle(m.status)} variant="secondary">
                      {STATUS_LABEL[m.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(m.startAt).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(m.endAt).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-sm">{m.venue ?? '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            第 {page} 页, 共 {Math.ceil(total / pageSize)} 页
          </p>
          <div className="space-x-2">
            {page > 1 && (
              <Link
                href={`/meetings?page=${page - 1}`}
                className="px-3 py-1 border rounded text-sm"
              >
                上一页
              </Link>
            )}
            {page * pageSize < total && (
              <Link
                href={`/meetings?page=${page + 1}`}
                className="px-3 py-1 border rounded text-sm"
              >
                下一页
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
