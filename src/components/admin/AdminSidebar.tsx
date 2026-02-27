'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, FileText, Settings, Users, UserCircle, ShoppingCart,
  Globe, Search, LogOut, Package, BarChart3, Menu, X, DollarSign,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  user: { name: string; email: string; role: string };
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/accounts', label: 'Accounts', icon: UserCircle },
  { href: '/admin/packages', label: 'eSIM Packages', icon: Package },
  { href: '/admin/packages/fees', label: 'Fees / Charges', icon: DollarSign },
  { href: '/admin/pages', label: 'Pages (CMS)', icon: FileText },
  { href: '/admin/articles', label: 'Articles (SEO)', icon: Globe },
  { href: '/admin/seo', label: 'SEO Settings', icon: Search },
  { href: '/admin/users', label: 'Admin Users', icon: Users },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/packages') return pathname === '/admin/packages';
    return pathname?.startsWith(href) ?? false;
  };

  const navContent = (
    <>
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
          S2M
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">Sim2Me Admin</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(href)
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-3 py-4">
        <div className="mb-2 px-3">
          <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {navContent}
      </aside>
    </>
  );
}
