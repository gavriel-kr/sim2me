'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link2, Unlink2, ImageIcon, Upload, Youtube, Table,
  Heading1, Heading2, Heading3, Heading4,
  Undo2, Redo2, Quote,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  isRTL?: boolean;
  minHeight?: number;
}

const FONT_FAMILIES = [
  { value: '', label: 'Default font' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
  { value: '"David Libre", David, serif', label: 'David (Hebrew)' },
  { value: '"Noto Sans Arabic", "Arial Unicode MS", sans-serif', label: 'Noto Arabic' },
];

const FONT_SIZES = [
  { value: '1', label: '10px' },
  { value: '2', label: '13px' },
  { value: '3', label: '16px' },
  { value: '4', label: '18px' },
  { value: '5', label: '24px' },
  { value: '6', label: '32px' },
  { value: '7', label: '48px' },
];

const TEXT_COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#FFFFFF',
  '#DC2626', '#EA580C', '#D97706', '#16A34A',
  '#059669', '#0891B2', '#2563EB', '#7C3AED', '#DB2777',
];

const HL_COLORS = [
  'transparent', '#FEF9C3', '#DCFCE7', '#DBEAFE',
  '#FCE7F3', '#FEE2E2', '#FFF7ED', '#EFF6FF', '#FDF4FF',
];

export function RichTextEditor({ value, onChange, isRTL = false, minHeight = 450 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSource, setIsSource] = useState(false);
  const [showTextColors, setShowTextColors] = useState(false);
  const [showHlColors, setShowHlColors] = useState(false);

  // Sync value on mount and when editing a different article (via key prop on parent)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  }, [handleInput]);

  const insertHTML = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    handleInput();
  }, [handleInput]);

  // Apply direction to the nearest block ancestor
  const applyDir = useCallback((dir: 'ltr' | 'rtl') => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    let node: Node | null = sel.rangeCount > 0
      ? sel.getRangeAt(0).commonAncestorContainer
      : editorRef.current;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        (node as HTMLElement).setAttribute('dir', dir);
        (node as HTMLElement).style.textAlign = dir === 'rtl' ? 'right' : 'left';
        break;
      }
      node = node.parentNode;
    }
    handleInput();
  }, [handleInput]);

  const insertLink = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim() || '';
    const url = prompt('URL:', 'https://');
    if (!url) return;
    if (selectedText) {
      exec('createLink', url);
    } else {
      const label = prompt('Link text:', url) || url;
      insertHTML(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    }
  }, [exec, insertHTML]);

  const insertImageURL = useCallback(() => {
    const url = prompt('Image URL:', 'https://');
    if (!url) return;
    const alt = prompt('Alt text (describe the image):', '') || '';
    insertHTML(`<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" />`);
  }, [insertHTML]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      insertHTML(`<img src="${src}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;" />`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [insertHTML]);

  const insertYouTube = useCallback(() => {
    const input = prompt('YouTube URL or video ID:');
    if (!input) return;
    const match = input.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    const id = match ? match[1] : input.replace(/\s/g, '');
    if (!id || id.length < 11) { alert('Could not extract YouTube video ID.'); return; }
    insertHTML(
      `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:16px 0;">` +
      `<iframe src="https://www.youtube.com/embed/${id}" ` +
      `style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" ` +
      `allowfullscreen loading="lazy" title="YouTube video"></iframe></div><p><br></p>`
    );
  }, [insertHTML]);

  const insertTable = useCallback(() => {
    const rows = parseInt(prompt('Number of rows (including header):', '4') || '4');
    const cols = parseInt(prompt('Number of columns:', '3') || '3');
    if (!rows || !cols || rows < 1 || cols < 1) return;
    let html = `<table style="border-collapse:collapse;width:100%;margin:16px 0;"><tbody>`;
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        const style = r === 0
          ? 'border:1px solid #D1D5DB;padding:8px 12px;background:#F9FAFB;font-weight:600;text-align:center;'
          : 'border:1px solid #D1D5DB;padding:8px 12px;';
        html += `<${tag} style="${style}">${r === 0 ? `Header ${c + 1}` : 'Cell'}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    insertHTML(html);
  }, [insertHTML]);

  const applyColor = useCallback((color: string, isBg: boolean) => {
    editorRef.current?.focus();
    if (isBg && color === 'transparent') {
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      document.execCommand(isBg ? 'hiliteColor' : 'foreColor', false, color);
    }
    handleInput();
    setShowTextColors(false);
    setShowHlColors(false);
  }, [handleInput]);

  const toggleSource = useCallback(() => {
    if (!isSource) {
      setIsSource(true);
    } else {
      setIsSource(false);
      // Restore editor from raw HTML
      setTimeout(() => {
        if (editorRef.current) editorRef.current.innerHTML = value;
      }, 0);
    }
  }, [isSource, value]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => { setShowTextColors(false); setShowHlColors(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── Toolbar button helper ────────────────────────────────────────────────
  type BtnProps = {
    icon?: React.ElementType;
    label?: string;
    title: string;
    onAction: () => void;
    active?: boolean;
    className?: string;
  };
  const Btn = ({ icon: Icon, label, title, onAction, active, className = '' }: BtnProps) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => { e.preventDefault(); onAction(); }}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1 text-xs transition-colors ${
        active ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      } ${className}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="font-bold leading-none">{label}</span>}
    </button>
  );

  const Sep = () => <div className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" />;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">

        {/* History */}
        <Btn icon={Undo2} title="Undo (Ctrl+Z)" onAction={() => exec('undo')} />
        <Btn icon={Redo2} title="Redo (Ctrl+Y)" onAction={() => exec('redo')} />
        <Sep />

        {/* Text format */}
        <Btn icon={Bold} title="Bold (Ctrl+B)" onAction={() => exec('bold')} />
        <Btn icon={Italic} title="Italic (Ctrl+I)" onAction={() => exec('italic')} />
        <Btn icon={Underline} title="Underline (Ctrl+U)" onAction={() => exec('underline')} />
        <Btn icon={Strikethrough} title="Strikethrough" onAction={() => exec('strikeThrough')} />
        <Sep />

        {/* Block format */}
        <Btn icon={Heading1} title="Heading 1" onAction={() => exec('formatBlock', '<h1>')} />
        <Btn icon={Heading2} title="Heading 2" onAction={() => exec('formatBlock', '<h2>')} />
        <Btn icon={Heading3} title="Heading 3" onAction={() => exec('formatBlock', '<h3>')} />
        <Btn icon={Heading4} title="Heading 4" onAction={() => exec('formatBlock', '<h4>')} />
        <Btn label="¶" title="Paragraph" onAction={() => exec('formatBlock', '<p>')} />
        <Btn icon={Quote} title="Blockquote" onAction={() => exec('formatBlock', '<blockquote>')} />
        <Btn label="<>" title="Code block" onAction={() => insertHTML('<pre><code>your code here</code></pre><p><br></p>')} />
        <Sep />

        {/* Lists */}
        <Btn icon={List} title="Bullet list" onAction={() => exec('insertUnorderedList')} />
        <Btn icon={ListOrdered} title="Numbered list" onAction={() => exec('insertOrderedList')} />
        <Sep />

        {/* Alignment */}
        <Btn icon={AlignLeft} title="Align left" onAction={() => exec('justifyLeft')} />
        <Btn icon={AlignCenter} title="Align center" onAction={() => exec('justifyCenter')} />
        <Btn icon={AlignRight} title="Align right" onAction={() => exec('justifyRight')} />
        <Btn icon={AlignJustify} title="Justify" onAction={() => exec('justifyFull')} />
        <Sep />

        {/* Text direction */}
        <Btn label="LTR" title="Set paragraph direction: Left-to-right" onAction={() => applyDir('ltr')} />
        <Btn label="RTL" title="Set paragraph direction: Right-to-left" onAction={() => applyDir('rtl')} />
        <Sep />

        {/* Text color */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Text color"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowTextColors((v) => !v); setShowHlColors(false); }}
            className="flex h-7 w-8 flex-col items-center justify-center gap-0.5 rounded px-1 hover:bg-gray-200"
          >
            <span className="text-xs font-extrabold text-gray-800 leading-none">A</span>
            <span className="h-1.5 w-5 rounded-sm bg-red-500" />
          </button>
          {showTextColors && (
            <div className="absolute left-0 top-8 z-50 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xl" style={{ minWidth: 176 }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Text color</p>
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {TEXT_COLORS.map((c) => (
                  <button key={c} type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyColor(c, false); }}
                    className="h-5 w-5 rounded border border-gray-300 transition-transform hover:scale-125"
                    style={{ background: c }} title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                <input type="color" defaultValue="#000000"
                  onInput={(e) => { applyColor((e.target as HTMLInputElement).value, false); }}
                  className="h-6 w-6 cursor-pointer rounded border-0 p-0" title="Custom color" />
                <span className="text-xs text-gray-500">Custom color</span>
              </div>
            </div>
          )}
        </div>

        {/* Highlight color */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Highlight color"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowHlColors((v) => !v); setShowTextColors(false); }}
            className="flex h-7 w-8 flex-col items-center justify-center gap-0.5 rounded px-1 hover:bg-gray-200"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded" style={{ background: '#FEF9C3' }}>
              <span className="text-[10px] font-extrabold text-gray-700">A</span>
            </span>
          </button>
          {showHlColors && (
            <div className="absolute left-0 top-8 z-50 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xl" style={{ minWidth: 176 }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Highlight color</p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {HL_COLORS.map((c) => (
                  <button key={c} type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyColor(c, true); }}
                    className="h-5 w-5 rounded border border-gray-300 transition-transform hover:scale-125"
                    style={{
                      background: c === 'transparent'
                        ? 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 0 / 8px 8px'
                        : c,
                    }}
                    title={c === 'transparent' ? 'Remove highlight' : c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                <input type="color" defaultValue="#FFFF00"
                  onInput={(e) => { applyColor((e.target as HTMLInputElement).value, true); }}
                  className="h-6 w-6 cursor-pointer rounded border-0 p-0" title="Custom highlight" />
                <span className="text-xs text-gray-500">Custom</span>
              </div>
            </div>
          )}
        </div>
        <Sep />

        {/* Font family */}
        <select
          title="Font family"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { editorRef.current?.focus(); exec('fontName', e.target.value); }}
          className="h-7 max-w-[120px] truncate rounded border border-gray-200 bg-white px-1 text-xs text-gray-700 focus:outline-none focus:border-emerald-500"
        >
          {FONT_FAMILIES.map(({ value, label }) => (
            <option key={label} value={value}>{label}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          title="Font size"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { editorRef.current?.focus(); exec('fontSize', e.target.value); }}
          className="h-7 w-[60px] rounded border border-gray-200 bg-white px-1 text-xs text-gray-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Size</option>
          {FONT_SIZES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <Sep />

        {/* Media & links */}
        <Btn icon={ImageIcon} title="Insert image from URL" onAction={insertImageURL} />
        <button
          type="button"
          title="Upload image from computer"
          onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
          className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
        <Btn icon={Youtube} title="Embed YouTube video" onAction={insertYouTube} />
        <Btn icon={Link2} title="Insert link" onAction={insertLink} />
        <Btn icon={Unlink2} title="Remove link" onAction={() => exec('unlink')} />
        <Sep />

        {/* Table + HR */}
        <Btn icon={Table} title="Insert table" onAction={insertTable} />
        <Btn label="—" title="Horizontal rule" onAction={() => exec('insertHorizontalRule')} />

        {/* Source toggle — far right */}
        <div className="ml-auto pl-1">
          <button
            type="button"
            title="Toggle HTML source view"
            onMouseDown={(e) => { e.preventDefault(); toggleSource(); }}
            className={`rounded px-2 py-0.5 font-mono text-xs font-semibold transition-colors ${
              isSource ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {'</>'}
          </button>
        </div>
      </div>

      {/* ── Editor / Source area ─────────────────────────────────────────── */}
      {isSource ? (
        <textarea
          className="w-full resize-y p-4 font-mono text-xs text-gray-700 outline-none"
          style={{ minHeight }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          spellCheck={false}
          placeholder="<h2>Section</h2><p>Content…</p>"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir={isRTL ? 'rtl' : 'ltr'}
          className="prose prose-sm max-w-none overflow-auto p-4 text-sm text-gray-800 outline-none focus:ring-0 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:p-3 [&_table]:w-full [&_th]:bg-gray-50 [&_a]:text-emerald-700"
          style={{ minHeight }}
          onInput={handleInput}
          onBlur={handleInput}
        />
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
