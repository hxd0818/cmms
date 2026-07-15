export function InvalidTokenScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-red-600">链接无效或已过期</h1>
        <p className="text-slate-500">请联系会务工作人员获取新的链接。</p>
      </div>
    </main>
  );
}
