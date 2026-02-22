import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata = { title: 'Admin | Sim2Me' };

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userType = (session?.user as { type?: string })?.type;

  // Customer logged in: send to account, not admin
  if (session?.user && userType === 'customer') {
    redirect('/account');
  }
  // No session: allow login page to render (no sidebar)
  const isAdmin = userType === 'admin';
  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdmin && <AdminSidebar user={session!.user as { name: string; email: string; role: string }} />}
      <main className={`flex-1 ${isAdmin ? 'ml-0 lg:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
}
