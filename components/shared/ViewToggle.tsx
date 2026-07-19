import Link from 'next/link';
import { cn } from '@/lib/utils';
import { List, LayoutGrid } from 'lucide-react';

export function ViewToggle({
  basePath,
  boardMode,
}: {
  basePath: string;
  boardMode: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 border border-stone-200 rounded-lg p-0.5 bg-white">
      <Link
        href={basePath}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
          !boardMode ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-600',
        )}
      >
        <List size={13} /> 列表
      </Link>
      <Link
        href={basePath + '?view=board'}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
          boardMode ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-600',
        )}
      >
        <LayoutGrid size={13} /> 看板
      </Link>
    </div>
  );
}
