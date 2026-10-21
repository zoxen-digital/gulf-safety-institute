# GISTRA – Full Project Specification (Build Brief)

> This document is the complete build brief for the GISTRA website, certificate verification portal, and admin panel. Build everything described here. Where something is not specified, choose a clean, modern, production-ready default.

---

## 0. Project Summary

**GISTRA – Gulf Industrial Safety & Training Regional Academy** is a third-party industrial safety and technical training institute serving Saudi Arabia, UAE, Qatar, Kuwait, Oman and Bahrain.

They train and certify industrial workers (crane operators, riggers, fire watch, confined space, offshore safety, first aid, etc.). After training, each worker receives a **certificate / operator ID card** with a unique certificate number.

Employers and main contractors (Aramco, SABIC, ADNOC contractors, etc.) must be able to **verify online, 24/7**, that a worker's certificate is genuine. This verification portal is the **most important feature** of the system.

The system has 3 parts:

1. **Public Website** – premium corporate marketing site.
2. **Certificate Verification Portal** – public, no login, verify by certificate number or QR code.
3. **Admin Panel** – login-protected, manage certificates, trainees, courses, locations, inquiries and users.

---

## 1. Brand & Design Direction

### Brand
- **Full name:** GISTRA – Gulf Industrial Safety & Training Regional Academy
- **Short name:** GISTRA
- **Tagline:** Empowering Gulf Industries with Certified Safety & Technical Competence
- **Logo:** Circular emblem – navy safety helmet, gold upward arrow / road, navy gear. Wordmark "GISTRA" in bold navy, subtitle below with gold lines. (Logo file will be provided as `/public/logo.png`; use a placeholder until then.)

### Colors (from logo)
| Token | Hex | Usage |
|---|---|---|
| `--navy` | `#14294F` | Primary, headers, nav, footer |
| `--navy-dark` | `#0B1A33` | Hero overlays, dark sections |
| `--gold` | `#C9A54C` | Accent, CTA buttons, highlights, dividers |
| `--gold-light` | `#E3C77E` | Hover states |
| `--cream` | `#F6F3EC` | Light section backgrounds |
| `--white` | `#FFFFFF` | Cards |
| `--text` | `#1C2433` | Body text |
| `--muted` | `#6B7280` | Secondary text |
| `--success` | `#16A34A` | Valid status |
| `--warning` | `#D97706` | Expired status |
| `--danger` | `#DC2626` | Revoked / not found |

### Typography
- Headings: **Montserrat** (700/800) – matches the logo wordmark.
- Body: **Inter** (400/500/600).
- Arabic (future): **Cairo** or **IBM Plex Sans Arabic**.

### Look & Feel
- Premium, corporate, trustworthy, industrial. **Must NOT look cheap or template-like** (the reference sites uvgulf.com and hatc-ksa.com are functional references only – do not copy their design).
- Large hero with real industrial imagery (oil & gas plant, crane, offshore rig, workers in PPE) and a dark navy overlay.
- Generous whitespace, clean grid, subtle shadows, rounded corners (8–12px), thin gold accent lines.
- Subtle scroll animations (fade/slide-up). No flashy effects.
- Fully responsive (mobile first). Phones are the main device for contractors verifying on site.
- Accessible: proper contrast, alt text, keyboard navigation.

---

## 2. Recommended Tech Stack

- **Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** PostgreSQL (Supabase or Neon) with **Prisma** ORM
- **Auth:** NextAuth (Auth.js) with credentials (email + password, bcrypt hashed)
- **File storage:** Supabase Storage / Cloudinary / S3 for trainee photos and logos
- **PDF generation:** `@react-pdf/renderer` or Puppeteer
- **QR codes:** `qrcode` npm package
- **Excel import/export:** `xlsx` (SheetJS)
- **Email (contact form):** Resend or SMTP via Nodemailer
- **Hosting:** Vercel
- **i18n ready:** structure with `next-intl` so Arabic (RTL) can be added later. Launch in English.

---

## 3. Public Website – Pages & Content

### Global Header
- Logo (left)
- Menu: Home · About Us · Services (mega-menu dropdown with 5 categories) · Locations · Verify Certificate · Contact Us
- Right side: **"Verify Certificate"** gold button (always visible) + "Admin Login" small link (optional, or hidden at `/admin`).
- Sticky header, becomes solid navy on scroll.
- Mobile: hamburger menu with full-screen drawer.

### Global Footer
- Logo + short About text
- Quick links
- Service categories
- Contact info (phone, email, WhatsApp, address – from admin settings)
- Social icons (from admin settings)
- Copyright © {year} GISTRA. All rights reserved.

---

### 3.1 Home Page (`/`)

1. **Hero section**
   - Headline: "Certified Safety & Technical Competence for Gulf Industries"
   - Sub-text: tagline
   - Buttons: "Explore Courses" (gold) · "Verify a Certificate" (outline)
   - Background: industrial image/video with navy overlay
2. **Quick Verify bar** (overlapping the hero bottom) – input "Enter Certificate Number" + Verify button. Submits to `/verify?q=XXXX`.
3. **Stats counters** – e.g. "10,000+ Workers Certified", "45+ Courses", "6 GCC Countries", "24/7 Online Verification" (editable from admin settings).
4. **Service categories** – 5 cards (A–E) with icon, title, short description, "View Courses" link.
5. **Why Choose GISTRA** – 5 feature blocks:
   - Third-Party Credibility
   - Gulf-Wide Compliance
   - Comprehensive Training Infrastructure
   - Fast Verification Portal
   - On-Site Corporate Training
6. **Industries We Serve** – Oil & Gas, Petrochemical, Construction, Marine & Offshore, Energy & Utilities.
7. **How Verification Works** – 3 steps: Get the certificate number or scan QR → Enter it on our portal → See instant verified details.
8. **Locations preview** – cards from admin-managed locations.
9. **Client / Industry alignment strip** – text: "Aligned with Aramco, SABIC, ADNOC, KOC & QatarEnergy contractor requirements" (logo strip optional, managed in admin).
10. **CTA banner** – "Need On-Site Corporate Training?" → Request a Quote button.
11. Footer.

---

### 3.2 About Us (`/about`)

**About GISTRA**
Gulf Industrial Safety & Training Regional Academy (GISTRA) is a premier third-party technical training and certification institute operating across Saudi Arabia and the Gulf region. Established to bridge the gap between regulatory industrial standards and workforce execution, GISTRA delivers high-impact, compliance-driven training solutions designed for the oil & gas, petrochemical, construction, marine, and energy sectors.

Our programs strictly align with international safety frameworks and regional client specifications (including Aramco, SABIC, ADNOC, KOC, and QatarEnergy contractors). Through rigorous theoretical instruction and hands-on practical assessments, we ensure that every technician, operator, and safety supervisor evaluated by GISTRA meets the highest standards of site safety, operational efficiency, and risk prevention.

**Our Mission**
To safeguard lives and industrial assets across the Gulf region by delivering world-class third-party training, objective competency assessments, and industry-recognized certifications.

**Our Vision**
To be the most trusted and sought-after third-party industrial safety and technical training academy in the Middle East, recognized for unwavering integrity, practical excellence, and regulatory alignment.

**Why Choose GISTRA?**
- **Third-Party Credibility:** Rigorous assessment and verifiable certifications trusted by top-tier contractors and plant operators.
- **Gulf-Wide Compliance:** Courses designed around exact regulatory specifications across GCC industrial zones.
- **Comprehensive Training Infrastructure:** Fully equipped practical evaluation grounds for heavy machinery, confined spaces, H₂S scenarios, and offshore escape simulations.
- **Fast Verification Portal:** Online certificate verification system allowing employers and main contractors to instantly validate worker credentials 24/7.
- **On-Site Corporate Training:** Customizable mobile training modules brought directly to project sites, refineries, and shutdown turnarounds.

Target region section: Saudi Arabia, UAE, Qatar, Kuwait, Oman, Bahrain (map graphic of GCC).

---

### 3.3 Services (`/services` and `/services/[category]` and `/services/[category]/[course]`)

- `/services` – all 5 categories with their courses as cards.
- `/services/[category]` – category hero + course list.
- `/services/[category]/[course]` – course detail page: title, overview, who should attend, duration, delivery (classroom / practical / on-site), certificate validity, "Request this Course" button (opens inquiry form pre-filled with course name).

Course detail fields (overview, duration, validity, etc.) are editable in admin. Seed with the names below and placeholder descriptions.

#### Category A: Permit to Work & Site Safety Supervision
- Work Permit Receiver (WPR) Certification Preparation
- Fire Watch / Standby Fire Watcher
- Hole Watch / Confined Space Attendant
- Standby Man (Confined Space & Excavation)
- Authorized Gas Tester (AGT)
- Job Safety Analysis (JSA) & Hazard Identification
- Lockout / Tagout (LOTO) Authorized Person
- Scaffolding Erector, Inspector & Supervisor

#### Category B: Confined Space, Gas & Respiratory Protection
- Confined Space Entrant & Attendant
- Confined Space Entry Supervisor
- Confined Space Rescue Specialist
- SCBA (Self-Contained Breathing Apparatus) User & Technician
- SCUBAMAN (Surface-Supplied Marine/Diver Support Safety)
- H₂S (Hydrogen Sulfide) Awareness & Breathing Apparatus
- Quantitative Respiratory Fit Testing

#### Category C: Offshore, Marine & Water Safety
- HUET (Helicopter Underwater Escape Training)
- BOSIET & T-BOSIET (Basic Offshore Safety Induction & Emergency Training)
- FOET (Further Offshore Emergency Training / Refresher)
- Offshore Survival & Sea Survival Specialist
- Offshore Lifeboatman / Capsule Operator (TEMPSC)
- Helideck Landing Officer (HLO) & Helideck Assistant (HDA)

#### Category D: Heavy Machinery & Equipment Operators
- Compactor & Road Roller Operators
- Excavator, Backhoe & Trenching Machine Operators
- Wheel Loader, Skid Steer & Bulldozer Operators
- Motor Grader Operators
- Mobile Crane & Tower Crane Operators
- Overhead / Gantry Crane Operators
- Forklift Truck & Telehandler Operators
- Manlift / Aerial Work Platform (AWP / MEWP) Operators
- Rigger Level 1, Level 2, and Level 3 Certifications
- Rigging & Heavy Lifting Supervisor

#### Category E: Emergency Response, First Aid & Specialized Industrial Training
- Basic & Advanced First Aid, CPR & AED
- Basic & Advanced Industrial Fire Fighting
- High-Angle & Rope Rescue Specialist
- Trenching, Shoring & Excavation Safety
- Defensive Driving (Oil & Gas Field Matrix)
- Working at Height & Fall Protection
- HAZMAT & Chemical Safety (HAZCOM)
- Sandblasting, Industrial Painting & Hydro-jetting Safety

---

### 3.4 Locations (`/locations`)
- All **active** locations added by admin, shown as cards: city, country, full address, phone, email, Google Map embed/link, optional photo.
- Filter by country.

### 3.5 Contact Us (`/contact`)
- Inquiry form: Full Name*, Company Name, Email*, Phone/WhatsApp*, Country (GCC dropdown), Inquiry Type (Course Inquiry / Corporate On-Site Training / Certificate Verification Help / Other), Course of Interest (dropdown from courses), Number of Trainees, Message*.
- Spam protection (honeypot + rate limit; optional Cloudflare Turnstile).
- On submit: save to database + send email notification to admin email from settings + success message.
- Contact info block + WhatsApp button + map of head office.

### 3.6 Request a Quote (`/request-quote`) – optional, can reuse contact form with Inquiry Type preset to "Corporate On-Site Training".

### 3.7 Legal
- `/privacy-policy`, `/terms` – placeholder content, editable later.

---

## 4. Certificate Verification Portal (MOST IMPORTANT)

### URL
- `/verify` – search page
- `/verify?q=GIS-2026-000123` – result
- `/verify/[certificateNumber]` – direct link (used by QR code)

### Search page
- Clean centered card: title "Certificate Verification", input "Enter Certificate Number", "Verify" button.
- Helper text: "Enter the certificate number printed on the card, or scan the QR code."
- Search is **case-insensitive** and trims spaces.
- Rate limit: max ~30 requests/min per IP to prevent scraping.
- No login required.

### Result – VALID (green badge "VERIFIED – VALID")
Show a professional result card:
- Trainee photo
- Full name
- ID / Iqama / Passport number – **partially masked** (e.g. `23******72`)
- Nationality
- Company / Employer
- Course / Certification title + category
- Level / Category / Equipment class (if any)
- Certificate number
- Issue date
- Expiry date
- Training location
- Trainer name
- Approved by
- Status badge
- Verified on: {current date/time}
- Buttons: **Download Certificate (PDF)** · **Download ID Card (PDF)** · Print

### Result – EXPIRED (orange badge "EXPIRED")
Same card, with clear message: "This certificate expired on {date}."

### Result – REVOKED / SUSPENDED (red badge)
Show only: certificate number, name, status, and message "This certificate has been revoked and is no longer valid. Contact GISTRA for details." No download buttons.

### Result – NOT FOUND
Red message: "No certificate found with this number. Please check the number and try again, or contact GISTRA." + contact link.

### Logging
Every verification attempt is logged (certificate number searched, result, IP, user agent, timestamp) for admin reporting.

---

## 5. Certificate / ID Card Design (PDF)

### A. Operator ID Card (credit card size, front + back)
**Front:**
- GISTRA logo + "CERTIFIED"
- Course title (e.g. "MOBILE CRANE OPERATOR")
- Trainee photo
- Name, ID No., Issued date, Expiry date, Company, Project (optional)
- Certificate number (red/highlight)
- QR code → links to `https://{domain}/verify/{certificateNumber}`

**Back:**
- Trained by, Approved by
- Enrollment number (ENR NO)
- Level / Categories / Others
- GISTRA stamp/seal image (uploaded in settings)
- Address, phone, email, website
- Disclaimer: "This card is only valid for the equipment/competency stated. Use of this card by any person other than its owner is considered forgery and punishable by law. If found, please return to GISTRA office. This is not a government-issued license."

### B. Full Certificate (A4 landscape)
- Premium border in navy/gold, logo, "Certificate of Competence" title
- "This is to certify that {Name} ({ID}) has successfully completed {Course}"
- Training dates, location, issue & expiry date, certificate number
- Signatures (Trainer, Approved by – uploaded images), stamp
- QR code for verification

Both generated dynamically from database data. Downloadable from admin and from the public verify page (only if status is Valid or Expired).

---

## 6. Admin Panel (`/admin`)

### 6.1 Authentication
- `/admin/login` – email + password.
- Forgot password via email reset link.
- Session timeout, secure cookies, bcrypt hashed passwords.
- Login attempt rate-limiting.
- All `/admin/*` routes protected by middleware.

### 6.2 Roles & Permissions
| Feature | Super Admin | Manager | Data Entry / Staff |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ (limited) |
| Certificates – view | All | Own location(s) | Own location(s) |
| Certificates – create/edit | ✅ | ✅ | ✅ |
| Certificates – revoke/delete | ✅ | ✅ | ❌ |
| Bulk import | ✅ | ✅ | ❌ |
| Trainees | ✅ | ✅ | ✅ |
| Courses & Categories | ✅ | ❌ | ❌ |
| Locations | ✅ | ❌ | ❌ |
| Trainers / Approvers | ✅ | ✅ | ❌ |
| Inquiries | ✅ | ✅ | ❌ |
| Users & Roles | ✅ | ❌ | ❌ |
| Site Settings | ✅ | ❌ | ❌ |
| Activity Logs | ✅ | ❌ | ❌ |

Managers and staff can be assigned to one or more locations; they only see data for those locations.

### 6.3 Admin Layout
- Left sidebar (navy) with icons, top bar with user name, role, logout.
- Clean data tables: search, filters, sorting, pagination, export to Excel/CSV.
- Responsive (usable on tablet/mobile).

### 6.4 Dashboard
- Cards: Total Certificates, Valid, Expiring in next 30 days, Expired, Revoked, Total Trainees, New Inquiries, Verifications this month.
- Chart: certificates issued per month.
- Chart: verification searches per month.
- Table: recently issued certificates.
- Table: certificates expiring soon.
- Table: latest inquiries.

### 6.5 Certificates Module
**List:** columns – Cert No., Photo, Name, ID No., Course, Company, Location, Issue Date, Expiry Date, Status, Actions.
Filters: status, course, category, location, company, date range.

**Create / Edit form:**
- Trainee (select existing or create new inline)
- Course (dropdown)
- Level / Category / Equipment Class (text)
- Location (dropdown – admin-managed locations)
- Company / Employer
- Project (optional)
- Training Start Date, Training End Date
- Issue Date*, Expiry Date* (auto-suggest from course default validity, e.g. +2 years)
- Trainer (dropdown)
- Approved By (dropdown)
- Enrollment Number (ENR NO)
- Certificate Number – **auto-generated** (format `GIS-YYYY-000001`, configurable prefix in settings) with option to edit manually; must be unique
- Status: Valid / Suspended / Revoked (Expired is calculated automatically from expiry date)
- Revoke reason (required when revoked)
- Internal notes (not public)

**Actions:** View, Edit, Download Certificate PDF, Download ID Card PDF, Copy verification link, Show QR, Revoke, Delete (soft delete).

### 6.6 Bulk Import
- Download Excel template.
- Upload `.xlsx` / `.csv` → preview table with validation errors highlighted (duplicate cert number, missing fields, invalid dates, unknown course) → confirm import.
- Photos can be uploaded later per trainee, or as a ZIP with filenames matching ID numbers.

### 6.7 Trainees Module
Fields: Full Name*, ID / Iqama / Passport No.*, Nationality, Date of Birth, Phone, Email, Company, Photo.
Trainee profile page shows all their certificates.

### 6.8 Courses & Categories Module
- Categories: Name, Code (A–E), Description, Icon, Image, Sort Order, Active.
- Courses: Name, Slug, Category, Short Description, Full Description, Who Should Attend, Duration, Default Validity (months), Delivery Mode, Image, Show on Website (toggle), Sort Order.

### 6.9 Locations Module (required by client)
Admin can **add, edit, deactivate, delete** locations.
Fields: Location Name, City, Country (GCC dropdown), Full Address, Phone, Email, Google Maps Link / Coordinates, Photo, Is Head Office, Active, Sort Order.
Active locations appear on the public Locations page, footer, and as options in certificate forms.

### 6.10 Trainers & Approvers
Fields: Name, Designation, Signature image, Active.

### 6.11 Inquiries
List of contact/quote form submissions. Status: New / In Progress / Closed. Notes field. Export.

### 6.12 Users Module (Super Admin)
Create users, assign role, assign locations, activate/deactivate, reset password.

### 6.13 Site Settings (Super Admin)
- Institute name, logo, favicon, stamp/seal image
- Contact phone, WhatsApp, email, head office address
- Social links
- Home page stats numbers
- Certificate number prefix
- Notification email for inquiries
- ID card disclaimer text

### 6.14 Activity Log
Who did what and when (created/edited/revoked certificates, logins, settings changes).

### 6.15 Verification Logs
Table of all public verification searches with result and date. Filter by result (found / not found).

---

## 7. Database Schema (Prisma-style outline)

```
User            id, name, email (unique), passwordHash, role (SUPER_ADMIN|MANAGER|STAFF), isActive, createdAt, updatedAt
UserLocation    userId, locationId
Location        id, name, city, country, address, phone, email, mapUrl, lat, lng, photoUrl, isHeadOffice, isActive, sortOrder
Category        id, code, name, slug, description, icon, imageUrl, isActive, sortOrder
Course          id, categoryId, name, slug, shortDescription, description, whoShouldAttend, duration, defaultValidityMonths, deliveryMode, imageUrl, showOnWebsite, sortOrder
Trainee         id, fullName, idNumber (unique), nationality, dob, phone, email, company, photoUrl, createdAt
Trainer         id, name, designation, signatureUrl, type (TRAINER|APPROVER), isActive
Certificate     id, certificateNumber (unique, indexed), traineeId, courseId, locationId, trainerId, approverId,
                level, company, project, enrollmentNumber, trainingStartDate, trainingEndDate,
                issueDate, expiryDate, status (VALID|SUSPENDED|REVOKED), revokeReason, notes,
                createdById, createdAt, updatedAt, deletedAt
Inquiry         id, name, company, email, phone, country, type, courseId, traineesCount, message, status, notes, createdAt
VerificationLog id, searchedNumber, certificateId (nullable), result (VALID|EXPIRED|REVOKED|NOT_FOUND), ip, userAgent, createdAt
ActivityLog     id, userId, action, entity, entityId, details (json), createdAt
Setting         key, value (json)
```

Computed: `displayStatus = status === VALID && expiryDate < today ? EXPIRED : status`.

---

## 8. Security Requirements
- Passwords hashed with bcrypt.
- Role-based access checked on **server side** for every admin API/action.
- Public verify page never exposes full ID number, phone, email, DOB or internal notes.
- Rate limiting on verify, login and contact form.
- Input validation with Zod.
- Uploaded files: type and size validation (images max 2MB).
- HTTPS only; secure, httpOnly cookies.
- `.env` for all secrets; provide `.env.example`.
- Daily database backups (hosting provider).

---

## 9. SEO & Performance
- Meta title/description per page, Open Graph image.
- `sitemap.xml`, `robots.txt` (block `/admin` and `/verify/*` results from indexing).
- Schema.org `EducationalOrganization` markup.
- Optimized images (next/image), Lighthouse score 90+.
- Google Analytics / Tag Manager placeholder in settings.

---

## 10. Seed Data
- 1 Super Admin (credentials from `.env`).
- 5 categories + all courses listed in section 3.3.
- 2 sample locations (e.g. Al Khobar – Head Office, Jubail).
- 2 trainers, 1 approver.
- 5 sample trainees and certificates covering: Valid, Expired, Revoked (for testing verification).

---

## 11. Deliverables
1. Complete Next.js project source code.
2. Prisma schema + migrations + seed script.
3. `.env.example` and `README.md` with setup, run and deploy steps.
4. Deployed on Vercel with a working database.
5. Admin credentials handed over securely (not in code).

---

## 12. Future Phase (do not build now, but keep structure ready)
- Arabic language + RTL layout.
- Online course booking and payment.
- Trainee self-service login (view/download own certificates).
- SMS/WhatsApp notification before certificate expiry.
- Corporate client portal (company sees all its workers' certificates).
- Public API for contractors to verify certificates in bulk.

---

## 13. Items to Confirm with Client Later (use defaults above for now)
1. Final certificate number format.
2. Exact fields shown on the public verify result (photo / masked ID).
3. Final ID card and certificate layout approval.
4. Existing old certificate data to import.
5. Arabic version timeline.
6. Domain, hosting and official email.
7. Stamp, signature images and real photos.
