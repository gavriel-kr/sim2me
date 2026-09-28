import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PhonePlansAdminClient } from './PhonePlansAdminClient';

export default async function PhonePlansAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  // Internal sales spend from the PikaSim wallet — the same bar as eSIM Packages.
  const role = (session.user as { role?: string })?.role;
  const canSell = role === 'SUPER_ADMIN' || role === 'ADMIN';

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Phone plans (PikaSim)</h1>
      <p className="mt-1 text-sm text-gray-500">
        eSIMs with a phone number, calls and SMS. Shown on destination pages under &quot;With a phone number&quot; and on /phone-plans.
      </p>
      <PhonePlansAdminClient canSell={canSell} />
    </div>
  );
}
