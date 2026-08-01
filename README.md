# PawLink Pro 4.2

A complete React link-in-bio web app with a Tailwind CSS design system, real accounts, persistent data, public profile pages, link management, custom media, and analytics.

## What is included

- React 19 + Vite frontend
- Tailwind CSS 4 through the official Vite plugin
- Node.js API using only built-in Node modules
- Email/password signup and login with `scrypt` password hashing
- Expiring bearer sessions and atomic JSON persistence
- Public pages at `/p/:username`
- Link create, edit, duplicate, delete, visibility, reorder, search, and filtering
- Custom social links and safe custom icons
- Simplified task-based dashboard navigation with quick actions and mobile bottom tabs
- Live phone preview and unsaved-change protection
- Unique daily profile views, clicks, CTR, sources, devices, and seven-day analytics
- Responsive Windows-friendly development launcher

## Google Sans and appearance editor

Users can customize and persist:

- Eight coordinated color themes
- Page, accent, text, card, and border colors
- Card corner radius, border width, opacity, and shadow
- Solid, gradient, or glow backgrounds
- Uploaded or HTTPS background images, including animated GIF/WebP URLs
- Background image visibility, blur, fit, and position
- Google Sans Flex as the website default
- Google Sans, system UI, rounded, serif, monospace, or Khmer device fonts
- Imported WOFF2, WOFF, TTF, or OTF font files
- Direct HTTPS font-file URLs
- Comfortable or compact link density
- Soft, solid, outline, or pill buttons

## Media safety

Custom media is validated in the browser and server:

- Remote images and fonts must use HTTPS. HTTP is accepted only for localhost development.
- Images support PNG, JPG, WebP, and GIF.
- Fonts support WOFF2, WOFF, TTF, and OTF; WOFF2 is recommended.
- SVG, CSS font imports, `javascript:`, `file:`, and unsafe protocols are blocked.
- Uploaded images are resized and optimized before saving.
- Background uploads are limited to 8 MB before optimization and 900 KB when embedded.
- Font uploads are limited to 700 KB.
- Remote images use `referrerPolicy="no-referrer"` on public pages.

## Development

Node.js 20 or newer is required. Node.js 22 LTS is recommended.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend proxies API requests to `http://localhost:4174`.

You can start each process separately:

```bash
npm run dev:api
npm run dev:web
```

## Production

```bash
npm install
npm run build
npm start
```

Open `http://localhost:4174` or the port provided through `PORT`.

## Environment variables

```env
PORT=4174
SESSION_DAYS=30
DATA_FILE=/absolute/path/to/pawlink-data.json
```

For production, point `DATA_FILE` to a persistent disk. The default is `server/data.json`.

## Persistence note

The included JSON layer is functional for one server or an early launch. For horizontal scaling or serverless deployment, replace it with PostgreSQL/Supabase and object storage while keeping the same API contract.
# PawLink
