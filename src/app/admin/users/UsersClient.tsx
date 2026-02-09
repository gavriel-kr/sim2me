'use client';

import { useState } from 'react';
import { UserPlus, Shield, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

interface Props {
  users: User[];
}

export function UsersClient({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EDITOR' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setUsers([data.user, ...users]);
      setForm({ name: '', email: '', password: '', role: 'EDITOR' });
      setShowAdd(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Remove this admin user?')) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      setUsers(users.filter((u) => u.id !== id));
    } catch {
      alert('Failed to delete user');
    }
  }

  async function updateRole(id: string, role: string) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        setUsers(users.map((u) => u.id === id ? { ...u, role } : u));
      }
    } catch {
      alert('Failed to update role');
    }
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    EDITOR: 'bg-emerald-100 text-emerald-700',
    VIEWER: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <UserPlus className="h-4 w-4" />
        Add User
      </button>

      {showAdd && (
        <form onSubmit={addUser} className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {/* Users list */}
      <div className="mt-6 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={user.role}
                onChange={(e) => updateRole(user.id, e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium focus:outline-none"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[user.role] || 'bg-gray-100'}`}>
                {user.role.replace('_', ' ')}
              </span>
              <button
                onClick={() => deleteUser(user.id)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
