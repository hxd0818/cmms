import { verifyDriverToken } from '@/lib/auth/tokens';
import { InvalidTokenScreen } from './InvalidTokenScreen';

export default async function DriverLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = await verifyDriverToken(token);

  if (!verified) {
    return <InvalidTokenScreen />;
  }

  return <>{children}</>;
}
