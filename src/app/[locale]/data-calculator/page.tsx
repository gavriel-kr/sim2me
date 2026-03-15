import { MainLayout } from '@/components/layout/MainLayout';
import { DataUsageCalculator } from '@/components/sections/DataUsageCalculator';

export const metadata = {
  title: 'מחשבון צריכת דאטה | Sim2Me',
  description: 'חשבו כמה גיגה-בייט תצרכו בחופשה — TikTok, YouTube, Instagram, ניווט ועוד.',
};

export default function DataCalculatorPage() {
  return (
    <MainLayout>
      <div className="py-10 md:py-16">
        <DataUsageCalculator />
      </div>
    </MainLayout>
  );
}
