# GSI – Website, Certificate Verification & Admin Panel

Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · MongoDB Atlas + Mongoose · deployable on Vercel.

- **Public website** – Home, About, Services (5 categories, 39 courses), Locations, Contact, Request Quote, Privacy, Terms.
- **Certificate verification** – `/verify`, `/verify?q=NUMBER`, `/verify/NUMBER` (QR target). Valid / Expired / Suspended / Revoked / Not found.
- **PDFs** – A4 certificate and credit-card ID card (front + back) generated from database records with a real QR code.
- **Admin panel** – `/admin`: dashboard, certificates, bulk import, trainees, courses, categories, locations, trainers/approvers, inquiries, users, settings, activity and verification logs.

All content (text, images, stats, locations, courses, legal pages) is stored in MongoDB and editable in the admin panel.

---

## 1. Local setup

Requirements: Node.js 20+ and a MongoDB database (Atlas or local).

```bash
npm install
cp .env.example .env.local      # then fill in the values (see section 3)
npm run seed                    # creates indexes, catalog, settings and the first Super Admin
npm run dev                     # http://localhost:3000
```

No MongoDB yet? For a throwaway local database run `npx tsx scripts/memory-db.ts` in a separate terminal and use `MONGODB_URI=mongodb://127.0.0.1:27018/`. Data is lost when it stops.

Other commands:

| Command | Purpose |
|---|---|
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (verification rules, ID masking, download rules, roles, upload validation) |
| `npx tsx scripts/smoke-test.ts` | End-to-end test against a running server with demo data (`SMOKE_URL=http://localhost:3000`). Local/staging only. |

## 2. MongoDB Atlas setup

1. Create a cluster (M10+ recommended for production; M0 is fine for testing).
2. **Database Access** → add a database user with *readWrite* on the `gistra` database only.
3. **Network Access** → allow Vercel. Vercel uses dynamic IPs, so either allow `0.0.0.0/0` (protected by the strong DB password) or use Atlas private networking on paid plans.
4. **Connect → Drivers** → copy the `mongodb+srv://...` string into `MONGODB_URI`.
5. Run `npm run seed` once against the new database. It creates all indexes (including TTL indexes for rate limits, upload chunks and reset tokens).

### Backups

- Atlas M10+: enable **Cloud Backup** (Cluster → Backup) with daily snapshots and point-in-time restore. Recommended retention: 7 daily, 4 weekly, 12 monthly.
- Atlas M0/M2/M5 have no automated backups. Schedule `mongodump --uri "$MONGODB_URI" --gzip --archive=gistra-$(date +%F).gz` daily from a secure machine and store the archives off-site.
- Uploaded images live in the `storeduploads` collection, so they are included in the same backups.
- Test a restore into a separate cluster at least once.

## 3. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Atlas connection string |
| `MONGODB_DB_NAME` | no | default `gistra` |
| `AUTH_SECRET` | yes | 32+ random characters. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Changing it signs everyone out. |
| `APP_URL` | yes | Public URL, e.g. `https://www.gistra.com`. Used in QR codes, reset links, sitemap, origin checks. **QR codes printed on cards point here; do not change it after issuing cards.** |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | for first seed | The first Super Admin. Password 10+ chars. Remove from the environment after seeding. |
| `SEED_DEMO_DATA` | no | `true` adds 5 clearly-labelled `DEMO-` certificates for testing. **Never on production.** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | optional | Enables inquiry notifications and password-reset emails. |
| `NOTIFICATION_EMAIL` | optional | Fallback inquiry recipient; the admin setting takes priority. |

No secret uses a `NEXT_PUBLIC_` prefix.

## 4. Email (SMTP)

Any SMTP provider works (Google Workspace, Microsoft 365, Zoho, SendGrid, Amazon SES). Example for Microsoft 365: `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`, `SMTP_USER=noreply@domain`, `EMAIL_FROM="GSI <noreply@domain>"`.

Without SMTP, inquiries are still saved and visible in **Admin → Inquiries**, and the settings page shows a warning. Password reset emails cannot be sent. A Super Admin can instead set a new password for a user in **Admin → Users**.

## 5. Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel (framework: Next.js, defaults).
2. Add the environment variables from section 3 for **Production** (and Preview if used, with a separate database).
3. Deploy, then run the seed once from your machine with production variables: `MONGODB_URI=... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed`.
4. Add the custom domain, set `APP_URL` to it, and redeploy.
5. Sign in at `/admin/login`, then go to **Settings**: upload the logo, stamp and real photos, enter contact details, and replace the placeholder trainer names in **Trainers & Approvers**.

## 6. Image upload architecture

- Images are stored **in MongoDB** (`StoredUpload` collection, binary `data` field). Nothing is written to disk or `public/uploads`, so files survive redeploys and serverless scaling.
- `POST /api/upload` (FormData `file`, `folder`): requires an admin session, a same-origin request, and the right permission (content folders need content rights; `misc`, used for trainee photos and signatures, is open to all admin roles). The type is detected from magic bytes (PNG, JPEG, WebP, GIF). SVG and other types are rejected. MIME and extension must match. The limit is 8MB. Uploads are rate limited.
- Vercel limits request bodies to about 4.5MB. Files up to 4MB use one request. Larger files (up to 8MB) are sent by the `AdminImageField` component in 3MB chunks to `POST /api/upload/chunk`. Chunks are stored in MongoDB with an owner and a 1-hour TTL, then assembled and validated like a normal upload. The returned URL is the same in both cases.
- `GET /api/uploads/{folder}/{filename}` serves the file with `Content-Type`, `Content-Length`, `nosniff`, a sandbox CSP and a one-year immutable cache. Filenames are `timestamp-randomhex.ext`, so a replacement always gets a new URL.
- Content documents store only the URL string. After a document is saved with a new or empty image, the old file is deleted, but only if no other course, category, location, trainee, trainer, setting or page still references it. **Settings → Clean up unused images** removes images uploaded more than 24h ago that were never saved to any record.
- There is no public listing endpoint. An individual image is reachable only by its unguessable URL.
- Legacy `/uploads/...` paths and broken images show a bundled placeholder via `SafeImage`.

## 7. Security summary

- Sessions: HS256-signed JWT in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production), with an 8-hour expiry. The user is re-loaded on every request, so deactivation, role changes and password changes (via `sessionVersion`) take effect immediately.
- bcrypt (cost 12). Login is rate limited per IP and per email, with uniform error messages.
- Password reset uses a random token stored as a SHA-256 hash. It expires after 1 hour, can be used once, and the response is the same whether or not the email exists.
- CSRF: server actions use Next.js origin checks; route-handler mutations check `Origin` against the host and `APP_URL`.
- Every admin page, action, export, download, import and upload checks role and location scope on the server. Managers and Staff only see certificates and trainees for their assigned locations.
- Public verification returns an explicit allow-listed DTO with a masked ID number. Revoked and suspended certificates show only number, name and status, and their PDF endpoints return 404. Result pages send `noindex` and `no-store`.
- Rate limits (verification 30/min, PDFs, inquiries, login, uploads) are stored in MongoDB with TTL, so they work across serverless instances.
- Certificates are soft-deleted. All admin mutations are written to the activity log; passwords, tokens and binaries never are.
- Exports neutralise spreadsheet formula injection.

## 8. Roles

| | Super Admin | Manager | Staff |
|---|---|---|---|
| Locations in scope | all | assigned | assigned |
| Certificates view / create / edit | ✓ | ✓ | ✓ |
| Suspend / revoke / delete certificates | ✓ | ✓ | – |
| Bulk import | ✓ | ✓ | – |
| Trainees | ✓ | ✓ | ✓ |
| Trainers & approvers | ✓ | own locations | – |
| Inquiries, verification logs | ✓ | ✓ | – |
| Courses, categories, locations, users, settings, activity logs | ✓ | – | – |

The last active Super Admin cannot be demoted or deactivated.

## 9. Before go-live checklist

- [ ] Real logo, stamp, signatures and site photos uploaded (Unsplash photos are placeholders)
- [ ] Placeholder trainers/approvers renamed
- [ ] Contact details, address and social links entered; real location addresses and map links added
- [ ] Course durations, descriptions and validity reviewed by GSI
- [ ] Privacy Policy and Terms reviewed by GSI
- [ ] `SEED_DEMO_DATA` unset and no `DEMO-` certificates in the production database
- [ ] SMTP configured and a test inquiry received
- [ ] Atlas backups enabled
- [ ] `APP_URL` set to the final domain before printing any QR codes
