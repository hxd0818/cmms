import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="flex items-center gap-1 text-xs text-stone-400 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.href ? (
            <Link href={item.href} className="hover:text-stone-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-stone-600 font-medium">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight size={12} className="text-stone-300" />}
        </span>
      ))}
    </div>
  );
}
