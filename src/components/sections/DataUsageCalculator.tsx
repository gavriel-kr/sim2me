'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';
import {
  Smartphone, MessageCircle, Video, Music, Map, Globe, Info,
  Youtube, Instagram, Facebook, Plus, Trash2,
} from 'lucide-react';

const { useRouter } = createSharedPathnamesNavigation(routing);

/**
 * MB per minute values — calibrated against official app documentation
 * and Opensignal / network operator averages (March 2026).
 *
 * Sources:
 *  TikTok:   TikTok Support ~70–140 MB/30 min at standard-high quality → ~5–7 MB/min
 *  Instagram: ~150 MB/30 min for reels/stories → ~5 MB/min
 *  YouTube:   YouTube Help ~1.2 GB/hr (1080p) / ~0.6 GB/hr (720p) → 20 / 10 MB/min
 *  WhatsApp:  WhatsApp docs ~4 MB/min video call
 *  Maps:      ~30 MB/hr turn-by-turn → 0.5 MB/min
 *  Spotify:   160 kbps standard = 72 MB/hr → 1.2 MB/min
 */
const APP_CONFIG: Record<string, { name: string; mbPerMin: number; icon: React.ReactNode }> = {
  tiktok:         { name: 'TikTok',                 mbPerMin: 7,   icon: <Video         className="w-4 h-4" /> },
  instagram:      { name: 'Instagram',              mbPerMin: 5,   icon: <Instagram     className="w-4 h-4" /> },
  youtube_1080:   { name: 'YouTube (1080p)',         mbPerMin: 20,  icon: <Youtube       className="w-4 h-4" /> },
  youtube_720:    { name: 'YouTube (720p)',          mbPerMin: 10,  icon: <Youtube       className="w-4 h-4" /> },
  facebook:       { name: 'Facebook',               mbPerMin: 3,   icon: <Facebook      className="w-4 h-4" /> },
  whatsapp_video: { name: 'WhatsApp Video Call',    mbPerMin: 4,   icon: <Video         className="w-4 h-4" /> },
  whatsapp_text:  { name: 'WhatsApp Text/Voice',    mbPerMin: 0.2, icon: <MessageCircle className="w-4 h-4" /> },
  navigation:     { name: 'Google Maps / Waze',     mbPerMin: 0.5, icon: <Map           className="w-4 h-4" /> },
  music:          { name: 'Spotify / Apple Music',  mbPerMin: 1.2, icon: <Music         className="w-4 h-4" /> },
  browsing:       { name: 'Web Browsing / Mail',    mbPerMin: 1,   icon: <Globe         className="w-4 h-4" /> },
};

type Row = { app: string; time: string; unit: 'minutes' | 'hours' };
const emptyRow = (): Row => ({ app: '', time: '', unit: 'minutes' });

interface DataUsageCalculatorProps {
  compact?: boolean;
  /** Called when the user clicks "Find plan". Receives weekly GB estimate.
   *  If omitted, the button navigates to /destinations instead. */
  onFindPlan?: (weeklyGB: number) => void;
}

export const DataUsageCalculator = ({ compact = false, onFindPlan }: DataUsageCalculatorProps) => {
  const t = useTranslations('calculator');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he' || locale === 'ar';

  const initialRows = compact ? 3 : 5;
  const maxRows = compact ? 5 : 10;

  const [rows, setRows] = useState<Row[]>(Array(initialRows).fill(null).map(emptyRow));

  const results = useMemo(() => {
    let dailyMB = 0;
    rows.forEach((row) => {
      const time = parseFloat(row.time);
      if (row.app && time > 0) {
        const rate = APP_CONFIG[row.app].mbPerMin;
        const minutes = row.unit === 'hours' ? time * 60 : time;
        dailyMB += rate * minutes;
      }
    });
    const dailyGB = dailyMB / 1024;
    return {
      daily: dailyGB.toFixed(2),
      weekly: (dailyGB * 7).toFixed(2),
      tenDays: (dailyGB * 10).toFixed(2),
      weeklyRaw: dailyGB * 7,
    };
  }, [rows]);

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    if (rows.length < maxRows) setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFindPlan = () => {
    if (onFindPlan) {
      onFindPlan(results.weeklyRaw);
    } else {
      router.push('/destinations');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {!compact && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('title')}</h1>
          <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">{t('subtitle')}</p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-3 gap-8'}`}>
        {/* Calculator rows */}
        <div className={compact ? '' : 'lg:col-span-2 space-y-4'}>
          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100">
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-emerald-200"
                >
                  {/* App selector */}
                  <div className="relative flex-grow min-w-[180px]">
                    <div className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                      {row.app ? APP_CONFIG[row.app].icon : <Smartphone className="w-4 h-4" />}
                    </div>
                    <select
                      value={row.app}
                      onChange={(e) => updateRow(index, 'app', e.target.value)}
                      className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 bg-transparent border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none text-sm`}
                    >
                      <option value="">{t('chooseApp')}</option>
                      {Object.entries(APP_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time + unit */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <input
                      type="number"
                      min="0"
                      placeholder={t('howLong')}
                      value={row.time}
                      onChange={(e) => updateRow(index, 'time', e.target.value)}
                      className="w-full md:w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(index, 'unit', e.target.value)}
                      className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-gray-50"
                    >
                      <option value="minutes">{t('minutes')}</option>
                      <option value="hours">{t('hours')}</option>
                    </select>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeRow(index)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    aria-label={t('removeRow')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {rows.length < maxRows && (
              <button
                onClick={addRow}
                className="mt-6 flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors py-2 px-4 rounded-lg border border-dashed border-emerald-200 hover:bg-emerald-50 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addPlatform')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Results sidebar */}
        <div className={compact ? 'mt-4' : 'lg:col-span-1'}>
          <div className="bg-emerald-600 rounded-2xl p-6 text-white sticky top-6 shadow-xl shadow-emerald-100">
            <h3 className="text-xl font-bold mb-6 border-b border-emerald-500 pb-4">
              {t('summaryTitle')}
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-emerald-100 text-sm mb-1">{t('dailyLabel')}</p>
                <div className="text-4xl font-black">
                  {results.daily} <span className="text-lg font-normal">GB</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500">
                <div>
                  <p className="text-emerald-100 text-xs mb-1">{t('weeklyLabel')}</p>
                  <div className="text-xl font-bold">{results.weekly} GB</div>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs mb-1">{t('tenDaysLabel')}</p>
                  <div className="text-xl font-bold">{results.tenDays} GB</div>
                </div>
              </div>

              {!compact && (
                <button
                  onClick={handleFindPlan}
                  className="w-full bg-white text-emerald-600 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  {t('findPlan')}
                </button>
              )}
            </div>
          </div>

          {!compact && (
            <div className="mt-6 flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-relaxed">{t('disclaimer')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
