import React, { useEffect, useState } from 'react';
import ImageSourceInput from './CustomMedia.jsx';
import FontSourceInput from './FontSourceInput.jsx';
import {
  CheckIcon,
  LayersIcon,
  PaletteIcon,
  SaveIcon,
  SparkleIcon,
  TypeIcon,
} from './Icons.jsx';

const themes = [
  { id: 'berry', label: 'Berry', background: '#f5f1ff', accent: '#6d5dfc', text: '#241f33', surface: '#ffffff', border: '#ded8f1' },
  { id: 'mint', label: 'Mint', background: '#eafaf4', accent: '#159477', text: '#153c33', surface: '#ffffff', border: '#cde9df' },
  { id: 'sky', label: 'Sky', background: '#edf7ff', accent: '#2b78e8', text: '#163456', surface: '#ffffff', border: '#cfe2f7' },
  { id: 'sunset', label: 'Sunset', background: '#fff0e8', accent: '#ec714c', text: '#542a20', surface: '#fffaf7', border: '#f1d1c4' },
  { id: 'sand', label: 'Sand', background: '#f7f3e9', accent: '#8c6239', text: '#362a20', surface: '#fffdf8', border: '#e3d8c6' },
  { id: 'mono', label: 'Mono', background: '#f2f2f0', accent: '#222222', text: '#181818', surface: '#ffffff', border: '#d7d7d2' },
  { id: 'night', label: 'Night', background: '#111827', accent: '#a78bfa', text: '#f8fafc', surface: '#1f2937', border: '#475569' },
  { id: 'ocean', label: 'Ocean', background: '#062e3f', accent: '#22d3ee', text: '#ecfeff', surface: '#0b4054', border: '#176078' },
];


const appearanceDefaults = {
  theme: 'berry',
  background: '#f5f1ff',
  accent: '#6d5dfc',
  textColor: '#241f33',
  surfaceColor: '#ffffff',
  borderColor: '#ded8f1',
  backgroundImageUrl: '',
  backgroundImageOpacity: 100,
  backgroundImageBlur: 0,
  backgroundImageFit: 'cover',
  backgroundImagePosition: 'center',
  backgroundStyle: 'glow',
  fontFamily: 'google',
  customFontName: '',
  customFontUrl: '',
  cardRadius: 18,
  cardBorderWidth: 1,
  cardOpacity: 94,
  cardShadow: 'soft',
  linkLayout: 'stacked',
  buttonStyle: 'soft',
};

const fontOptions = [
  { id: 'google', label: 'Google Sans', description: 'Recommended — clean, friendly, and easy to read', stack: '"Google Sans Flex", "Google Sans", ui-sans-serif, system-ui, sans-serif', recommended: true },
  { id: 'system', label: 'System UI', description: 'Uses the native font on each device', stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: 'sans', label: 'Google Sans Modern', description: 'Compatibility option for older profiles', stack: '"Google Sans Flex", "Google Sans", ui-sans-serif, system-ui, sans-serif' },
  { id: 'rounded', label: 'Rounded', description: 'Friendly and approachable', stack: 'Nunito, "Arial Rounded MT Bold", ui-rounded, system-ui, sans-serif' },
  { id: 'serif', label: 'Editorial Serif', description: 'Elegant and expressive', stack: 'Georgia, Cambria, "Times New Roman", serif' },
  { id: 'mono', label: 'Monospace', description: 'Technical and structured', stack: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { id: 'khmer', label: 'Khmer System', description: 'Uses the device Khmer font', stack: '"Khmer OS Battambang", "Leelawadee UI", system-ui, sans-serif' },
  { id: 'custom', label: 'Imported Font', description: 'Use your own WOFF2, WOFF, TTF, or OTF file', stack: '' },
];

function Panel({ title, description, icon: Icon, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700"><Icon /></span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ColorControl({ label, value, onChange }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const commit = () => {
    const normalized = text.startsWith('#') ? text : `#${text}`;
    if (/^#[0-9a-f]{6}$/i.test(normalized)) onChange(normalized.toLowerCase());
    else setText(value);
  };

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <span className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5 transition focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10">
        <input
          type="color"
          className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          value={value}
          onChange={(event) => { setText(event.target.value); onChange(event.target.value); }}
        />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-medium uppercase text-slate-800 outline-none"
          value={text}
          maxLength="7"
          onChange={(event) => {
            const next = event.target.value;
            if (/^#?[0-9a-f]{0,6}$/i.test(next)) setText(next);
          }}
          onBlur={commit}
          onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
          aria-label={`${label} hex color`}
        />
      </span>
    </label>
  );
}

function RangeControl({ label, value, min, max, step = 1, suffix = '', onChange }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span className="flex items-center justify-between gap-3"><span>{label}</span><strong className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">{value}{suffix}</strong></span>
      <input
        type="range"
        className="w-full accent-violet-600"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Segmented({ label, value, options, onChange }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 sm:flex">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`min-h-10 flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${value === option.id ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const appearanceSections = [
  { id: 'colors', label: 'Colors', description: 'Theme and palette', icon: PaletteIcon },
  { id: 'background', label: 'Background', description: 'Image and effects', icon: LayersIcon },
  { id: 'typography', label: 'Typography', description: 'Google Sans or custom', icon: TypeIcon },
  { id: 'cards', label: 'Cards', description: 'Borders and buttons', icon: SparkleIcon },
];

export default function AppearanceEditor({ profile, setProfile, save, saving }) {
  const [section, setSection] = useState('colors');
  const update = (patch) => setProfile((current) => ({ ...current, ...patch }));
  const resetAppearance = () => {
    if (!window.confirm('Reset colors, font, background, and card styling to the default design?')) return;
    update(appearanceDefaults);
    setSection('colors');
  };
  const applyTheme = (theme) => update({
    theme: theme.id,
    background: theme.background,
    accent: theme.accent,
    textColor: theme.text,
    surfaceColor: theme.surface,
    borderColor: theme.border,
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Page design</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Appearance</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">Customize one section at a time. Your preview updates immediately while you work.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={resetAppearance}>
            Reset design
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={save}
            disabled={saving}
          >
            <SaveIcon /> {saving ? 'Saving…' : 'Save design'}
          </button>
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-4" aria-label="Appearance sections">
        {appearanceSections.map(({ id, label, description, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={`flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${section === id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
            onClick={() => setSection(id)}
            aria-current={section === id ? 'page' : undefined}
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${section === id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon /></span>
            <span className="min-w-0">
              <strong className="block text-sm font-semibold">{label}</strong>
              <small className={`mt-0.5 hidden text-xs sm:block ${section === id ? 'text-slate-300' : 'text-slate-400'}`}>{description}</small>
            </span>
          </button>
        ))}
      </nav>

      {section === 'colors' && (
        <Panel title="Color system" description="Start with a preset, then adjust only the colors you need." icon={PaletteIcon}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {themes.map((theme) => (
              <button
                type="button"
                key={theme.id}
                className={`relative overflow-hidden rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${profile.theme === theme.id ? 'border-violet-500 ring-4 ring-violet-500/10' : 'border-slate-200'}`}
                onClick={() => applyTheme(theme)}
              >
                <span className="mb-3 flex h-16 overflow-hidden rounded-xl border border-black/5" style={{ background: theme.background }}>
                  <i className="m-auto h-8 w-16 rounded-lg" style={{ background: theme.surface, border: `2px solid ${theme.border}` }} />
                  <b className="absolute right-5 top-8 size-4 rounded-full" style={{ background: theme.accent }} />
                </span>
                <strong className="text-sm font-semibold text-slate-900">{theme.label}</strong>
                {profile.theme === theme.id && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-violet-600 text-white"><CheckIcon /></span>}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-5">
            <ColorControl label="Page" value={profile.background || '#f5f1ff'} onChange={(background) => update({ background, theme: 'custom' })} />
            <ColorControl label="Accent" value={profile.accent || '#6d5dfc'} onChange={(accent) => update({ accent, theme: 'custom' })} />
            <ColorControl label="Text" value={profile.textColor || '#241f33'} onChange={(textColor) => update({ textColor, theme: 'custom' })} />
            <ColorControl label="Card" value={profile.surfaceColor || '#ffffff'} onChange={(surfaceColor) => update({ surfaceColor, theme: 'custom' })} />
            <ColorControl label="Border" value={profile.borderColor || '#ded8f1'} onChange={(borderColor) => update({ borderColor, theme: 'custom' })} />
          </div>
        </Panel>
      )}

      {section === 'background' && (
        <Panel title="Background" description="Use a color effect, upload an image, or paste a secure HTTPS image URL." icon={LayersIcon}>
          <div className="mb-6">
            <Segmented label="Background effect" value={profile.backgroundStyle || 'glow'} options={[{ id: 'solid', label: 'Solid' }, { id: 'gradient', label: 'Gradient' }, { id: 'glow', label: 'Glow' }]} onChange={(backgroundStyle) => update({ backgroundStyle })} />
          </div>
          <ImageSourceInput
            label="Background image"
            hint="PNG, JPG, WebP, or GIF — upload or paste URL"
            value={profile.backgroundImageUrl || ''}
            onChange={(backgroundImageUrl) => update({ backgroundImageUrl })}
            kind="background"
            placeholder="https://example.com/background.webp"
          />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <RangeControl label="Image visibility" value={profile.backgroundImageOpacity ?? 100} min={10} max={100} suffix="%" onChange={(backgroundImageOpacity) => update({ backgroundImageOpacity })} />
            <RangeControl label="Background blur" value={profile.backgroundImageBlur ?? 0} min={0} max={20} suffix="px" onChange={(backgroundImageBlur) => update({ backgroundImageBlur })} />
            <Segmented label="Image fit" value={profile.backgroundImageFit || 'cover'} options={[{ id: 'cover', label: 'Cover' }, { id: 'contain', label: 'Contain' }]} onChange={(backgroundImageFit) => update({ backgroundImageFit })} />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Image position
              <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" value={profile.backgroundImagePosition || 'center'} onChange={(event) => update({ backgroundImagePosition: event.target.value })}>
                <option value="center">Center</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        </Panel>
      )}

      {section === 'typography' && (
        <Panel title="Typography" description="Google Sans is the recommended default. You can still use a system or imported font." icon={TypeIcon}>
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><CheckIcon /></span>
            <div><strong className="block text-sm font-semibold">Google Sans is active across the PawLink interface</strong><p className="mt-1 text-sm leading-6 text-violet-800">Choose Google Sans below to use the same clean, friendly typeface on your public profile.</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fontOptions.map((font) => (
              <button
                type="button"
                key={font.id}
                className={`relative rounded-2xl border p-4 text-left transition hover:border-slate-400 ${profile.fontFamily === font.id ? 'border-violet-500 bg-violet-50/60 ring-4 ring-violet-500/10' : 'border-slate-200 bg-white'}`}
                onClick={() => update({ fontFamily: font.id })}
              >
                {font.recommended && <span className="absolute right-3 top-3 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">Recommended</span>}
                <span className="block pr-20 text-2xl text-slate-900" style={{ fontFamily: font.stack || 'inherit' }}>Aa</span>
                <strong className="mt-3 block text-sm font-semibold text-slate-900">{font.label}</strong>
                <small className="mt-1 block leading-5 text-slate-500">{font.description}</small>
                {profile.fontFamily === font.id && <span className="absolute bottom-3 right-3 text-violet-600"><CheckIcon /></span>}
              </button>
            ))}
          </div>
          {profile.fontFamily === 'custom' && (
            <div className="mt-5">
              <FontSourceInput
                name={profile.customFontName || ''}
                url={profile.customFontUrl || ''}
                onChange={({ name, url }) => update({ customFontName: name, customFontUrl: url })}
              />
            </div>
          )}
        </Panel>
      )}

      {section === 'cards' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Border and box" description="Control the shape, border, opacity, and elevation of every link card." icon={SparkleIcon}>
            <div className="grid gap-5">
              <RangeControl label="Corner radius" value={profile.cardRadius ?? 18} min={0} max={36} suffix="px" onChange={(cardRadius) => update({ cardRadius })} />
              <RangeControl label="Border width" value={profile.cardBorderWidth ?? 1} min={0} max={4} suffix="px" onChange={(cardBorderWidth) => update({ cardBorderWidth })} />
              <RangeControl label="Card opacity" value={profile.cardOpacity ?? 94} min={45} max={100} suffix="%" onChange={(cardOpacity) => update({ cardOpacity })} />
              <Segmented label="Card shadow" value={profile.cardShadow || 'soft'} options={[{ id: 'none', label: 'None' }, { id: 'soft', label: 'Soft' }, { id: 'strong', label: 'Strong' }]} onChange={(cardShadow) => update({ cardShadow })} />
            </div>
            <div className="mt-5 rounded-3xl bg-slate-100 p-5">
              <div
                className="flex items-center gap-3 p-4 text-slate-900 transition"
                style={{
                  borderRadius: `${profile.cardRadius ?? 18}px`,
                  border: `${profile.cardBorderWidth ?? 1}px solid ${profile.borderColor || '#ded8f1'}`,
                  background: profile.surfaceColor || '#ffffff',
                  opacity: (profile.cardOpacity ?? 94) / 100,
                  boxShadow: profile.cardShadow === 'none' ? 'none' : profile.cardShadow === 'strong' ? '0 18px 40px rgba(15,23,42,.18)' : '0 8px 22px rgba(15,23,42,.10)',
                }}
              >
                <span className="grid size-10 place-items-center rounded-xl" style={{ background: `${profile.accent || '#6d5dfc'}20`, color: profile.accent || '#6d5dfc' }}><LayersIcon /></span>
                <div><strong className="block text-sm">Preview link card</strong><small className="text-slate-500">Border, surface, radius, and shadow</small></div>
              </div>
            </div>
          </Panel>

          <Panel title="Layout and buttons" description="Choose link density and button treatment." icon={LayersIcon}>
            <div className="grid gap-5">
              <Segmented label="Link density" value={profile.linkLayout || 'stacked'} options={[{ id: 'stacked', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }]} onChange={(linkLayout) => update({ linkLayout })} />
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-slate-700">Button style</legend>
                <div className="grid grid-cols-2 gap-3">
                  {['soft', 'solid', 'outline', 'pill'].map((style) => (
                    <button
                      type="button"
                      key={style}
                      className={`rounded-2xl border p-3 text-left transition ${profile.buttonStyle === style ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-500/10' : 'border-slate-200 hover:border-slate-400'}`}
                      onClick={() => update({ buttonStyle: style })}
                    >
                      <i className={`mb-3 block h-9 w-full border ${style === 'pill' ? 'rounded-full' : style === 'soft' ? 'rounded-2xl' : 'rounded-lg'}`} style={{ background: style === 'solid' ? profile.accent : style === 'soft' ? `${profile.accent}18` : 'transparent', borderColor: style === 'outline' ? profile.accent : `${profile.accent}35` }} />
                      <strong className="capitalize text-sm text-slate-800">{style}</strong>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
