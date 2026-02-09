import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata = { title: 'Admin | Sim2Me' };

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  // Allow login page without auth
  return (
    <div className="flex min-h-screen bg-gray-50">
      {session?.user && <AdminSidebar user={session.user as { name: string; email: string; role: string }} />}
      <main className={`flex-1 ${session?.user ? 'ml-0 lg:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
}
