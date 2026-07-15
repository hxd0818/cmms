import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('嘉宾导入模板');

  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '性别', key: 'gender', width: 8 },
    { header: '手机', key: 'phone', width: 15 },
    { header: '邮箱', key: 'email', width: 25 },
    { header: '单位', key: 'company', width: 30 },
    { header: '职务', key: 'title', width: 15 },
    { header: '等级', key: 'level', width: 10 },
    { header: '身份证号', key: 'idNumber', width: 22 },
    { header: '饮食标签', key: 'dietaryTags', width: 20 },
    { header: '备注', key: 'notes', width: 30 },
  ];

  sheet.addRow({
    name: '张三',
    gender: '男',
    phone: '13812345678',
    email: 'zhangsan@example.com',
    company: '示例公司',
    title: '总经理',
    level: 'VIP-A',
    idNumber: '110101199001011234',
    dietaryTags: '清真,无辣',
    notes: '示例数据',
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' },
  };

  const buf = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="guest-import-template.xlsx"',
    },
  });
}
