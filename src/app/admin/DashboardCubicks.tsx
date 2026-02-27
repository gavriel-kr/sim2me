'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  GripVertical,
  Eye,
  EyeOff,
  Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  ShoppingCart,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Receipt,
  Wallet,
  BarChart3,
};

const STORAGE_ORDER = 'admin-dashboard-cubick-order';
const STORAGE_VISIBLE = 'admin-dashboard-cubick-visible';

export interface CubickStat {
  label: string;
  value: string | number;
  iconName: keyof typeof ICONS;
  color: string;
}

function loadOrder(labels: string[]): string[] {
  if (typeof window === 'undefined') return labels;
  try {
    const raw = localStorage.getItem(STORAGE_ORDER);
    if (!raw) return labels;
    const parsed = JSON.parse(raw) as string[];
    const set = new Set(labels);
    return parsed.filter((l) => set.has(l)).concat(labels.filter((l) => !parsed.includes(l)));
  } catch {
    return labels;
  }
}

function loadVisible(labels: string[]): Record<string, boolean> {
  if (typeof window === 'undefined') return Object.fromEntries(labels.map((l) => [l, true]));
  try {
    const raw = localStorage.getItem(STORAGE_VISIBLE);
    const out: Record<string, boolean> = {};
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      for (const l of labels) out[l] = parsed[l] !== false;
    }
    for (const l of labels) if (out[l] === undefined) out[l] = true;
    return out;
  } catch {
    return Object.fromEntries(labels.map((l) => [l, true]));
  }
}

export function DashboardCubicks({ stats }: { stats: CubickStat[] }) {
  const labels = stats.map((s) => s.label);
  const [order, setOrder] = useState<string[]>(() => labels);
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(labels.map((l) => [l, true]))
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);

  useEffect(() => {
    setOrder((prev) => loadOrder(labels));
    setVisible((prev) => loadVisible(labels));
  }, [labels.join(',')]);

  const saveOrder = useCallback((next: string[]) => {
    setOrder(next);
    try {
      localStorage.setItem(STORAGE_ORDER, JSON.stringify(next));
    } catch {}
  }, []);

  const saveVisible = useCallback((next: Record<string, boolean>) => {
    setVisible(next);
    try {
      localStorage.setItem(STORAGE_VISIBLE, JSON.stringify(next));
    } catch {}
  }, []);

  const toggleVisible = useCallback(
    (label: string) => {
      setVisible((prev) => {
        const next = { ...prev, [label]: !prev[label] };
        try {
          localStorage.setItem(STORAGE_VISIBLE, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const reorder = useCallback(
    (fromLabel: string, toLabel: string) => {
      const idx = order.indexOf(fromLabel);
      const toIdx = order.indexOf(toLabel);
      if (idx === -1 || toIdx === -1 || idx === toIdx) return;
      const next = [...order];
      next.splice(idx, 1);
      next.splice(toIdx, 0, fromLabel);
      saveOrder(next);
    },
    [order, saveOrder]
  );

  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, label: string) => {
    setDragged(label);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', label);
  };
  const handleDragOver = (e: React.DragEvent, toLabel: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragged && dragged !== toLabel) setDropTarget(toLabel);
  };
  const handleDragLeave = () => setDropTarget(null);
  const handleDrop = (e: React.DragEvent, toLabel: string) => {
    e.preventDefault();
    setDropTarget(null);
    const fromLabel = e.dataTransfer.getData('text/plain');
    if (fromLabel && fromLabel !== toLabel) reorder(fromLabel, toLabel);
  };
  const handleDragEnd = () => {
    setDragged(null);
    setDropTarget(null);
  };

  const statByLabel = Object.fromEntries(stats.map((s) => [s.label, s]));
  const orderedVisible = order.filter((label) => visible[label] !== false);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setCustomizeOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Customize cubicks
        </button>
      </div>

      {customizeOpen && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-medium text-gray-600">Show or hide, then drag cards to reorder on the dashboard.</p>
          <div className="flex flex-wrap gap-3">
            {order.map((label) => {
              const stat = statByLabel[label];
              const isVisible = visible[label] !== false;
              if (!stat) return null;
              const Icon = ICONS[stat.iconName];
              return (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleVisible(label)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 overflow-x-hidden sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {orderedVisible.map((label) => {
          const stat = statByLabel[label];
          if (!stat) return null;
          const Icon = ICONS[stat.iconName] ?? BarChart3;
          const isDragging = dragged === label;
          const isDropTarget = dropTarget === label;
          return (
            <div
              key={label}
              draggable
              onDragStart={(e) => handleDragStart(e, label)}
              onDragOver={(e) => handleDragOver(e, label)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, label)}
              onDragEnd={handleDragEnd}
              className={`flex min-w-0 cursor-grab items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:cursor-grabbing sm:p-5 ${isDragging ? 'opacity-60' : ''} ${isDropTarget ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
            >
              <div className="flex shrink-0 cursor-grab touch-none text-gray-400 hover:text-gray-600">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{stat.value}</p>
                <p className="truncate text-xs text-gray-500">{stat.label}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisible(label);
                }}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title={visible[label] !== false ? 'Hide' : 'Show'}
              >
                {visible[label] !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
