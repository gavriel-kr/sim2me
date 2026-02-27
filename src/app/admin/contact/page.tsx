import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContactSubmissionsClient } from './ContactSubmissionsClient';

export const dynamic = 'force-dynamic';

export default async function ContactSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      notes: { orderBy: { createdAt: 'asc' } },
    },
  });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
      <p className="mt-1 text-sm text-gray-500">All contact form submissions from visitors</p>
      <ContactSubmissionsClient
        submissions={submissions.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone ?? null,
          subject: s.subject,
          message: s.message,
          marketingConsent: s.marketingConsent,
          read: s.read,
          status: s.status as string,
          createdAt: s.createdAt.toLocaleDateString(),
          notes: s.notes.map((n) => ({
            id: n.id,
            content: n.content,
            createdAt: n.createdAt.toLocaleString(),
          })),
        }))}
      />
    </div>
  );
}
