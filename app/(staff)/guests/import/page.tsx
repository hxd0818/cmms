import { ImportForm } from './ImportForm';
import Link from 'next/link';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">批量导入嘉宾</h1>
      <p className="text-sm text-slate-500">
        请使用模板上传，字段：姓名、性别、手机、邮箱、单位、职务、等级、身份证号、饮食标签、备注。
      </p>
      <p>
        <Link href="/api/guests/template.xlsx" className="text-blue-600 underline" download>
          下载模板
        </Link>
      </p>
      <ImportForm />
    </div>
  );
}
