import Link from 'next/link';
import { ImportForm } from './ImportForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingGuestImportPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">批量导入会议嘉宾</h1>
      <p className="text-sm text-slate-500">
        Excel 字段：姓名、手机、分组标签、随行角色、主嘉宾手机。
        <br />
        系统按手机号匹配嘉宾库；若手机为空则按姓名精确匹配（必须唯一）。
        <br />
        随行角色：主嘉宾 / 秘书 / 安保 / 翻译 / 家属 / 助理 / 司机。
        <br />
        主嘉宾手机为空 → 该行为主嘉宾；填了 → 该行为对应主嘉宾的随行。
      </p>
      <p className="text-sm">
        <Link href="/api/meetings/guests/template.xlsx" className="text-blue-600 underline" download>
          下载模板
        </Link>
      </p>
      <ImportForm meetingId={id} />
    </div>
  );
}
