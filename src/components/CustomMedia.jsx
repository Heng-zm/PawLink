import React, { useEffect, useId, useState } from 'react';
import { ImageIcon, UploadIcon } from './MediaIcons.jsx';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,/i;

export function isSafeImageSource(value) {
  const source = String(value || '').trim();
  if (!source || DATA_IMAGE_RE.test(source)) return true;
  try {
    const url = new URL(source);
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    return url.protocol === 'https:' || localHttp;
  } catch {
    return false;
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this image file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = source;
  });
}


async function isAnimatedFile(file) {
  if (file.type === 'image/gif') return true;
  if (file.type !== 'image/webp') return false;
  try {
    const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 256_000)).arrayBuffer());
    const text = new TextDecoder('latin1').decode(bytes);
    return text.includes('ANIM') || text.includes('ANMF');
  } catch {
    return false;
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function resizeStaticImage(file, { maxDimension, maxBytes }) {
  const original = await readAsDataUrl(file);
  const image = await loadImage(original);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = 0.86;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Your browser cannot process this image.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/webp', quality);
    if (!blob) throw new Error('Could not optimize this image.');
    if (blob.size <= maxBytes) return readAsDataUrl(blob);

    quality = Math.max(0.52, quality - 0.08);
    width = Math.max(32, Math.round(width * 0.86));
    height = Math.max(32, Math.round(height * 0.86));
  }

  throw new Error('The optimized image is still too large. Use a smaller file or paste an image URL.');
}

export async function importSafeImage(file, kind = 'icon') {
  if (!file) return '';
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Use a PNG, JPG, WebP, or GIF image. SVG files are blocked for safety.');
  if (file.size > (kind === 'background' ? 8_000_000 : 4_000_000)) throw new Error(`The selected file is larger than ${kind === 'background' ? '8 MB' : '4 MB'}.`);
  const maxBytes = kind === 'background' ? 850_000 : kind === 'avatar' ? 260_000 : 70_000;
  const maxDimension = kind === 'background' ? 1920 : kind === 'avatar' ? 560 : 128;
  const animated = await isAnimatedFile(file);
  if (animated) {
    if (file.size > maxBytes) throw new Error('This animated image is too large to store safely. Compress it or paste a direct HTTPS image URL.');
    return readAsDataUrl(file);
  }
  if (file.size <= maxBytes && file.type !== 'image/jpeg') return readAsDataUrl(file);
  return resizeStaticImage(file, { maxDimension, maxBytes });
}

export function SafeImage({ src, alt = '', className = '', fallback = null, loading = 'lazy', onError, ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed || !isSafeImageSource(src)) return fallback;
  return (
    <img
      {...props}
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      draggable="false"
      onError={(event) => { setFailed(true); onError?.(event); }}
    />
  );
}

export default function ImageSourceInput({
  label,
  hint = 'PNG, JPG, WebP, or GIF',
  value = '',
  onChange,
  kind = 'icon',
  fallback = <ImageIcon />,
  placeholder = 'https://example.com/image.png',
}) {
  const inputId = useId();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const source = await importSafeImage(file, kind);
      onChange(source);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setProcessing(false);
    }
  };

  const updateUrl = (event) => {
    const next = event.target.value;
    setError(next && !isSafeImageSource(next) ? 'Use an HTTPS image URL. HTTP is allowed only for localhost.' : '');
    onChange(next);
  };

  return (
    <div className="custom-media-field">
      <span className="custom-media-label">{label}<small>{hint}</small></span>
      <div className="custom-media-control">
        <span className={`custom-media-preview ${kind === 'avatar' ? 'avatar-preview' : ''} ${kind === 'background' ? 'background-preview' : ''}`}>
          <SafeImage src={value} alt="Custom media preview" className={kind === 'background' ? 'background-media-thumb' : ''} fallback={<b>{fallback}</b>} />
        </span>
        <div className="custom-media-inputs">
          <input value={value} onChange={updateUrl} placeholder={placeholder} inputMode="url" />
          <div className="custom-media-actions">
            <label htmlFor={inputId} className="secondary-button media-upload-button">
              <UploadIcon /> {processing ? 'Processing…' : 'Upload image'}
            </label>
            <input id={inputId} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={importFile} disabled={processing} />
            {value && <button type="button" className="text-button danger-text" onClick={() => { setError(''); onChange(''); }}>Remove</button>}
          </div>
        </div>
      </div>
      <small className="media-safety-note">Images are optimized before saving. SVG and unsafe URL protocols are blocked.</small>
      {error && <small className="media-field-error">{error}</small>}
    </div>
  );
}
