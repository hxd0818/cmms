'use client';

import Link from 'next/link';
import type { Guest } from '@/lib/generated/prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
  items: Guest[];
  page: number;
  pageSize: number;
  total: number;
}

const LEVEL_COLORS: Record<string, string> = {
  VIP_A: 'bg-red-100 text-red-800',
  VIP_B: 'bg-orange-100 text-orange-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-slate-100 text-slate-800',
  C: 'bg-gray-100 text-gray-600',
};

export function GuestList({ items, page, pageSize, total }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>职务</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>标签</TableHead>
              <TableHead>更新时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Link
                      href={`/guests/${g.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell>{g.gender ?? '-'}</TableCell>
                  <TableCell>{g.company ?? '-'}</TableCell>
                  <TableCell>{g.title ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={LEVEL_COLORS[g.level]} variant="secondary">
                      {g.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(g.dietaryTags ?? []).map((t: string) => (
                      <Badge key={t} variant="outline" className="mr-1">
                        {t}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(g.updatedAt).toLocaleDateString('zh-CN')}
                  </TableCell>
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
              <Link href={`/guests?page=${page - 1}`} className="px-3 py-1 border rounded text-sm">
                上一页
              </Link>
            )}
            {page * pageSize < total && (
              <Link href={`/guests?page=${page + 1}`} className="px-3 py-1 border rounded text-sm">
                下一页
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
