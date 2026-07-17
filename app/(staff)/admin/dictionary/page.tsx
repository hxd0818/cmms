import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { dictionaryService } from '@/lib/domain/dictionary/service';
import { DictionaryEditor } from './DictionaryEditor';

export default async function DictionaryPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const categories = await dictionaryService.listAll();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">字典管理</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          修改枚举值的显示标签，无需改代码。隐藏的标签不会出现在下拉选项中。
        </p>
      </div>
      <DictionaryEditor categories={categories} />
    </div>
  );
}
