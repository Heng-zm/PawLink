import React, { useId, useState } from 'react';
import { UploadIcon } from './MediaIcons.jsx';

const FONT_TYPES = new Set([
  'font/woff2',
  'font/woff',
  'font/ttf',
  'font/otf',
  'application/font-woff',
  'application/x-font-ttf',
  'application/vnd.ms-opentype',
]);

const DATA_FONT_RE = /^data:(?:font\/(?:woff2?|ttf|otf)|application\/(?:font-woff|x-font-ttf|vnd\.ms-opentype));base64,/i;

export function sanitizeFontName(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

export function isSafeFontSource(value) {
  const source = String(value || '').trim();
  if (!source) return true;
  if (DATA_FONT_RE.test(source)) return true;
  try {
    const url = new URL(source);
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHttp) return false;
    if (url.username || url.password) return false;
    return /\.(woff2?|ttf|otf)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this font file.'));
    reader.onload = () => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const mime = extension === 'woff2' ? 'font/woff2' : extension === 'woff' ? 'font/woff' : extension === 'otf' ? 'font/otf' : 'font/ttf';
      const result = String(reader.result || '').replace(/^data:[^;]+;/i, `data:${mime};`);
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

export default function FontSourceInput({ name = '', url = '', onChange }) {
  const inputId = useId();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!FONT_TYPES.has(file.type) && !/\.(woff2?|ttf|otf)$/i.test(file.name)) {
      setError('Use a WOFF2, WOFF, TTF, or OTF font file.');
      return;
    }
    if (file.size > 700_000) {
      setError('Font files must be 700 KB or smaller. WOFF2 is recommended.');
      return;
    }
    setProcessing(true);
    try {
      const source = await readAsDataUrl(file);
      const inferredName = sanitizeFontName(file.name.replace(/\.(woff2?|ttf|otf)$/i, '').replace(/[-_]+/g, ' '));
      onChange({ name: name || inferredName || 'Custom Font', url: source });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setProcessing(false);
    }
  };

  const updateName = (event) => onChange({ name: sanitizeFontName(event.target.value), url });
  const updateUrl = (event) => {
    const next = event.target.value;
    setError(next && !isSafeFontSource(next) ? 'Use a direct HTTPS URL ending in .woff2, .woff, .ttf, or .otf.' : '');
    onChange({ name, url: next });
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Font family name
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            value={name}
            onChange={updateName}
            placeholder="My Brand Font"
            maxLength="40"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Direct font URL
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            value={url.startsWith('data:') ? '' : url}
            onChange={updateUrl}
            placeholder="https://example.com/font.woff2"
            inputMode="url"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
          <UploadIcon /> {processing ? 'Importing…' : 'Import font file'}
        </label>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
          onChange={importFile}
          disabled={processing}
        />
        {url && (
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            onClick={() => {
              setError('');
              onChange({ name: '', url: '' });
            }}
          >
            Remove custom font
          </button>
        )}
        {url.startsWith('data:') && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Font imported</span>}
      </div>

      <p className="text-sm leading-6 text-slate-500">
        WOFF2 gives the best performance. Uploaded files are stored with the profile; SVG and CSS files are not accepted.
      </p>
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}
