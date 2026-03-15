'use client';

import { BarChart2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataUsageCalculator } from '@/components/sections/DataUsageCalculator';

export function DataUsageModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors group mt-3 w-full justify-center">
          <BarChart2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="underline underline-offset-2 decoration-dashed">מחשבון צריכת נתונים</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl"
        showClose
      >
        <DataUsageCalculator />
      </DialogContent>
    </Dialog>
  );
}
