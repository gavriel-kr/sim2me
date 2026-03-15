'use client';

import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  MessageCircle,
  Video,
  Music,
  Map,
  Globe,
  Info,
  Youtube,
  Instagram,
  Facebook,
  Plus,
  Trash2,
} from 'lucide-react';

const APP_CONFIG: Record<
  string,
  { name: string; mbPerMin: number; icon: React.ReactNode }
> = {
  tiktok: { name: 'TikTok', mbPerMin: 14, icon: <Video className="w-4 h-4" /> },
  instagram: { name: 'Instagram', mbPerMin: 10, icon: <Instagram className="w-4 h-4" /> },
  youtube_1080: { name: 'YouTube (1080p)', mbPerMin: 25, icon: <Youtube className="w-4 h-4" /> },
  youtube_720: { name: 'YouTube (720p)', mbPerMin: 15, icon: <Youtube className="w-4 h-4" /> },
  facebook: { name: 'Facebook', mbPerMin: 3, icon: <Facebook className="w-4 h-4" /> },
  whatsapp_video: { name: 'WhatsApp Video Call', mbPerMin: 5, icon: <Video className="w-4 h-4" /> },
  whatsapp_text: { name: 'WhatsApp Text/Voice', mbPerMin: 0.2, icon: <MessageCircle className="w-4 h-4" /> },
  navigation: { name: 'Google Maps / Waze', mbPerMin: 0.6, icon: <Map className="w-4 h-4" /> },
  music: { name: 'Spotify / Apple Music', mbPerMin: 1.2, icon: <Music className="w-4 h-4" /> },
  browsing: { name: 'Web Browsing / Mail', mbPerMin: 1, icon: <Globe className="w-4 h-4" /> },
};

type Row = { app: string; time: string; unit: 'minutes' | 'hours' };

const emptyRow = (): Row => ({ app: '', time: '', unit: 'minutes' });

export const DataUsageCalculator = () => {
  const [rows, setRows] = useState<Row[]>(Array(5).fill(null).map(emptyRow));

  const results = useMemo(() => {
    let dailyMB = 0;
    rows.forEach((row) => {
      const t = parseFloat(row.time);
      if (row.app && t > 0) {
        const rate = APP_CONFIG[row.app].mbPerMin;
        const minutes = row.unit === 'hours' ? t * 60 : t;
        dailyMB += rate * minutes;
      }
    });
    const dailyGB = dailyMB / 1024;
    return {
      daily: dailyGB.toFixed(2),
      weekly: (dailyGB * 7).toFixed(2),
      tenDays: (dailyGB * 10).toFixed(2),
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
    if (rows.length < 10) setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white" dir="rtl">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">מחשבון צריכת דאטה</h1>
        <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
          תכננו את החופשה שלכם בצורה חכמה. הכניסו את הרגלי הגלישה שלכם וקבלו הערכה מדויקת
          לנפח הגלישה שתצטרכו.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calculator */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100">
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all hover:border-emerald-200"
                >
                  {/* App selector */}
                  <div className="relative flex-grow min-w-[180px]">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      {row.app ? APP_CONFIG[row.app].icon : <Smartphone className="w-4 h-4" />}
                    </div>
                    <select
                      value={row.app}
                      onChange={(e) => updateRow(index, 'app', e.target.value)}
                      className="w-full pr-10 pl-3 py-2.5 bg-transparent border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none text-sm"
                    >
                      <option value="">בחר אפליקציה...</option>
                      {Object.entries(APP_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>
                          {cfg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time + unit */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <input
                      type="number"
                      min="0"
                      placeholder="כמה זמן?"
                      value={row.time}
                      onChange={(e) => updateRow(index, 'time', e.target.value)}
                      className="w-full md:w-24 px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    />
                    <select
                      value={row.unit}
                      onChange={(e) => updateRow(index, 'unit', e.target.value)}
                      className="px-2 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-gray-50"
                    >
                      <option value="minutes">דקות</option>
                      <option value="hours">שעות</option>
                    </select>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeRow(index)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    aria-label="הסר שורה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {rows.length < 10 && (
              <button
                onClick={addRow}
                className="mt-6 flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors py-2 px-4 rounded-lg border border-dashed border-emerald-200 hover:bg-emerald-50 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף פלטפורמה נוספת</span>
              </button>
            )}
          </div>
        </div>

        {/* Results sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-emerald-600 rounded-2xl p-6 text-white sticky top-6 shadow-xl shadow-emerald-100">
            <h3 className="text-xl font-bold mb-6 border-b border-emerald-500 pb-4">
              סיכום צריכה משוער
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-emerald-100 text-sm mb-1">צריכה יומית</p>
                <div className="text-4xl font-black">
                  {results.daily} <span className="text-lg font-normal">GB</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500">
                <div>
                  <p className="text-emerald-100 text-xs mb-1">לשבוע (7 ימים)</p>
                  <div className="text-xl font-bold">{results.weekly} GB</div>
                </div>
                <div>
                  <p className="text-emerald-100 text-xs mb-1">ל-10 ימים</p>
                  <div className="text-xl font-bold">{results.tenDays} GB</div>
                </div>
              </div>

              <button className="w-full bg-white text-emerald-600 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg">
                מצאו לי חבילה מתאימה
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 leading-relaxed">
              התוצאות המוצגות במחשבון זה הן הערכה משוערת בלבד ומבוססות על ממוצעי צריכת נתונים
              גלובליים. צריכת הנתונים בפועל עשויה להשתנות משמעותית בהתאם למכשיר, להגדרות הרשת
              ולאיכות התוכן. חברת Sim2Me אינה מתחייבת לדיוק הנתונים או לכך שהחבילה המומלצת
              תספיק לכלל השימושים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
