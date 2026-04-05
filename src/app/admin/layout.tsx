import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TwoFAWarningBanner } from '@/components/admin/TwoFAWarningBanner';
import { PasswordAgeWarningBanner } from '@/components/admin/PasswordAgeWarningBanner';

export const metadata = { title: 'Admin | Sim2Me' };

export const dynamic = 'force-dynamic';

const PASSWORD_MAX_AGE_DAYS = 90;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { type?: string })?.type;

  // Customer logged in: send to account, not admin
  if (session?.user && userType === 'customer') {
    redirect('/account');
  }

  const isAdmin = userType === 'admin';
  const needs2faWarning = isAdmin && !!(session?.user as { needs2faWarning?: boolean })?.needs2faWarning;

  // Check password age for admins
  let passwordIsOld = false;
  if (isAdmin && session?.user?.email) {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email },
      select: { passwordChangedAt: true, createdAt: true },
    });
    if (adminUser) {
      const referenceDate = adminUser.passwordChangedAt ?? adminUser.createdAt;
      const ageMs = Date.now() - referenceDate.getTime();
      passwordIsOld = ageMs > PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdmin && <AdminSidebar user={session!.user as { name: string; email: string; role: string }} />}
      <main className={`flex-1 ${isAdmin ? 'ml-0 lg:ml-64' : ''}`}>
        {needs2faWarning && <TwoFAWarningBanner />}
        {passwordIsOld && <PasswordAgeWarningBanner days={PASSWORD_MAX_AGE_DAYS} />}
        {children}
      </main>
    </div>
  );
}
