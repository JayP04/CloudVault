# ☁️ CloudVault

**Your photos. Your files. Your privacy. 10x cheaper than iCloud.**

CloudVault is a personal cloud storage platform built for people who want the iCloud and Google Photos experience without the Big Tech price tag or privacy tradeoffs. Store photos, videos, and files securely — accessible from any device, any browser, anywhere.

---

## Why CloudVault Exists

iCloud charges $2.99/month for 200GB. Google One charges $2.99/month for 200GB. Both scan your photos, train AI models on your data, and lock you into their ecosystem.

CloudVault gives you **500GB for under $1/month** with:
- No AI training on your photos
- No vendor lock-in — your files are yours
- One-click import from Google Photos, iCloud, Dropbox, and more
- The same clean, intuitive UI you're used to from Apple

---

## What It Does

### 📸 Photo Library
A beautiful, iCloud-style photo timeline. Your photos are automatically organized by date using EXIF metadata — no manual sorting needed. Scroll through years of memories grouped by day, with location context when available.

- **Favorites** — heart the photos that matter most
- **Albums** — organize however you want
- **Recents** — quick access to your latest uploads
- **Smart thumbnails** — fast-loading WebP previews so your gallery feels instant, even with thousands of photos

### 📁 File Storage (Drive)
Not just photos. Store any file — PDFs, documents, spreadsheets, archives. An iCloud Drive-style list view with file type icons, sorting, and date grouping. Everything in one place.

### 🔒 Encrypted Vault
For your most sensitive files. A PIN-protected section that encrypts files directly in your browser before they ever leave your device. Not even the CloudVault server can see what's inside. Uses AES-256-GCM encryption via the Web Crypto API — the same standard used by banks and governments.

### ☁️ Import From Anywhere
The killer feature. Moving from Google Photos? One click to connect your account and import your entire library — all metadata, dates, and locations preserved. Your photos appear in CloudVault as if they were always there.

Currently supported:
- **Google Photos** — direct API import with full metadata
- **ZIP upload** — export from any service, upload the ZIP, and CloudVault extracts everything automatically
- **Folder upload** — select an entire folder from your computer

Coming soon: Apple iCloud, Dropbox, OneDrive.

### 📤 Upload Anywhere
- Drag and drop files anywhere on the screen
- Upload individual photos, entire folders, or ZIP archives
- Share directly from your phone to CloudVault (PWA Share Target)
- Upload progress indicator so you always know what's happening

### 🗑️ 30-Day Trash
Accidentally deleted something? It stays in "Recently Deleted" for 30 days before permanent removal. Restore with one tap.

---

## How It's Built

CloudVault is a modern web application built with:

- **Next.js** — React-based framework with server-side rendering for fast page loads
- **TypeScript** — type-safe code that catches bugs before they reach you
- **Supabase** — authentication and database with row-level security (every user can only see their own files)
- **Cloudflare R2** — object storage with zero egress fees (this is why it's so cheap)
- **Tailwind CSS** — clean, responsive design that works on every screen size

### Architecture Highlights

**Presigned URLs** — Files upload directly from your browser to cloud storage. They never pass through our server, which means faster uploads and lower server costs.

**Row-Level Security** — Every database query is automatically filtered by user. Even if there were a bug in the code, the database itself enforces that you can only access your own files.

**Incremental Stats** — Storage usage, file counts, and quota tracking update instantly via database triggers. No background jobs or delayed recalculations.

**Server-Side Thumbnails** — When you upload a photo, the server generates optimized WebP thumbnails and a blur hash placeholder. Your gallery loads tiny thumbnails first, then upgrades to full resolution when you open a photo.

---

## V1 vs V2 — What Changed

CloudVault V2 is a complete ground-up rebuild. Here's what improved:

| Area | V1 | V2 |
|------|----|----|
| Language | JavaScript | TypeScript |
| Auth | Email/password only | Google OAuth, Apple OAuth, email |
| Image loading | 1 API call per photo (N+1 problem) | Batch URL endpoint (50 photos per call) |
| Thumbnails | None — loaded full-res originals in grid | Server-side WebP thumbnails + blur hash placeholders |
| Pagination | All files loaded at once | Cursor-based infinite scroll |
| Upload logic | Duplicated in 2 components | Single shared `useUpload` hook |
| Admin client | Created inline in every route | Singleton pattern, one instance |
| API validation | None | Zod schemas on every input |
| Security headers | None | HSTS, CSP, X-Frame-Options, etc. |
| File types | Images and videos only | Any file type |
| Import | None | Google Photos, ZIP, folder upload |
| Encryption | None | AES-256-GCM encrypted vault |
| Database | 3 tables | 7 tables with proper indexes and triggers |
| Storage tracking | Full table scan on every change | O(1) incremental delta updates |

---

## Security

CloudVault takes security seriously at every layer:

- **OAuth authentication** — sign in with Google or Apple. No passwords stored on our servers.
- **Row-Level Security (RLS)** — enforced at the database level. Your files are invisible to everyone else, guaranteed by PostgreSQL, not just application code.
- **Presigned URLs** — files in storage are private. Every access requires a time-limited signed URL that expires in 15 minutes.
- **Encrypted Vault** — files encrypted with AES-256-GCM in your browser. The encryption key is derived from your PIN and never leaves your device.
- **HTTPS everywhere** — all traffic encrypted in transit.
- **Security headers** — HSTS, content type sniffing protection, frame protection, strict referrer policy.
- **Input validation** — every API input validated with Zod schemas. File types verified. Upload sizes enforced.
- **No public bucket access** — cloud storage is completely private. No public URLs, no directory listing.

---

## Roadmap

### Now (Shipped)
- ✅ Photo library with date-grouped timeline
- ✅ Favorites and albums
- ✅ File storage (Drive)
- ✅ Encrypted Vault with PIN
- ✅ Google Photos import
- ✅ ZIP and folder upload
- ✅ Drag-and-drop upload
- ✅ Upload progress tracking
- ✅ 30-day trash with restore
- ✅ Google OAuth
- ✅ Server-side thumbnail generation
- ✅ Responsive design (desktop + mobile)
- ✅ PWA support (install as app, share photos to vault)

### Next
- 🔄 Dropbox and OneDrive import
- 🔄 Shared albums and sharing links
- 🔄 Full-text search across files
- 🔄 Dashboard home with widgets (like iCloud.com)
- 🔄 Native iOS and Android apps via Capacitor
- 🔄 Auto-purge trash after 30 days (cron job)
- 🔄 Video thumbnail extraction
- 🔄 Storage usage breakdown by category (color-coded bar like iCloud)

### Future
- 🔮 Face recognition and people grouping
- 🔮 Location-based photo maps
- 🔮 "On This Day" memories
- 🔮 Background sync across devices
- 🔮 Offline support with service worker
- 🔮 End-to-end encryption for entire library (Apple Advanced Data Protection equivalent)
- 🔮 Family sharing with shared storage quotas
- 🔮 Client galleries for photographers

---


## Contributing

CloudVault is a personal project by Jay Patel. If you're interested in contributing, feel free to open an issue or PR.

---

## License

MIT

---

*Built with privacy in mind. Because your memories shouldn't be someone else's training data.*