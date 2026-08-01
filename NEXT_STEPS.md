# PawLink next steps

## 4.3 — Production data layer

1. Replace the single-file database with PostgreSQL or Supabase.
2. Add row-level ownership policies and database migrations.
3. Move imported images and fonts to private object storage with signed uploads.
4. Add email verification, password reset, session management, and account deletion.

## 4.4 — Publishing and growth

1. Add custom domains with ownership verification.
2. Add Open Graph metadata, profile thumbnails, and sitemap generation.
3. Add scheduled links, expiration dates, UTM helpers, and QR codes.
4. Add analytics bot filtering, consent controls, CSV export, and date ranges.

## 4.5 — Quality and operations

1. Add Playwright browser tests for signup, editing, publishing, and mobile layouts.
2. Add GitHub Actions for install, build, tests, and dependency auditing.
3. Add structured logs, error monitoring, health checks, backups, and restore drills.
4. Add accessibility testing and localization, including polished Khmer translations.

## Priority recommendation

Complete the PostgreSQL/Supabase migration before adding more high-volume features. The current JSON storage is reliable for one running server, but it is not designed for horizontal scaling.
