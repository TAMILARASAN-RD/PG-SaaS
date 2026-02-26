# StayWise V1 (Full SaaS MVP) Execution Plan

## 🔵 GLOBAL RULES
1. Never skip steps.
2. Complete each phase fully before moving forward.
3. Do not refactor previously working modules unless breaking.
4. Maintain multi-tenant isolation using `ownerId`.
5. Use Prisma migrations only.
6. Do not introduce external libraries unless specified.
7. Keep code production-structured.
8. Use environment variables strictly.

---

## [x] PHASE 1 — PROJECT INITIALIZATION
- [x] Create Folder Structure:
  - `staywise/`
    - `backend/`
    - `frontend/`
- [x] Backend Setup (`/backend`):
  - `npm init -y`
  - `npm install express cors dotenv jsonwebtoken bcrypt zod`
  - `npm install prisma @prisma/client`
  - `npm install pdfkit`
  - `npm install -D typescript ts-node-dev @types/node @types/express @types/jsonwebtoken @types/bcrypt @types/pdfkit`
- [x] Initialize TypeScript (`npx tsc --init`)
- [x] Initialize Prisma (`npx prisma init`)
- [x] Setup PostgreSQL (Local) and `.env` variables.

## [x] PHASE 2 — DATABASE SCHEMA (CRITICAL FOUNDATION)
- [x] Create Prisma schema with required models:
  - `Owner`
  - `User` (roles: SUPER_ADMIN, OWNER, MANAGER, TENANT)
  - `Building`
  - `Room`
  - `Bed`
  - `TenantAssignment`
  - `Payment`
  - `Complaint`
- [x] Implement Multi-tenant isolation by `ownerId`.
- [x] Add unique constraint on monthly rent period: `@@unique([tenantAssignmentId, periodYear, periodMonth])`.
- [x] Run `npx prisma migrate dev --name init`.

## [x] PHASE 3 — CORE BACKEND STRUCTURE
- [x] Create standard directory structure under `backend/src/`:
  - `server.ts`, `app.ts`
  - `lib/prisma.ts`
  - `middlewares/auth.ts`
  - `modules/` (auth, buildings, rooms, beds, tenants, rent, complaints)

## [x] PHASE 4 — AUTH SYSTEM
- [x] Implement Register OWNER.
- [x] Implement Login.
- [x] Create JWT middleware.
- [x] Implement Role-based access control.
- [x] Inject `ownerId` from token.
- [x] Protect all appropriate routes.

## [x] PHASE 5 — PROPERTY MANAGEMENT
- [x] Create/List building APIs.
- [x] Create/List room APIs.
- [x] Create/List bed APIs.
- [x] Auto-set bed status (AVAILABLE / OCCUPIED).

## [x] PHASE 6 — TENANT MANAGEMENT
- [x] Create tenant (by Owner).
- [x] Assign tenant to bed.
- [x] Set bed status OCCUPIED.
- [x] Occupancy dashboard endpoint.
- [x] Vacate endpoint:
  - [x] Set assignment INACTIVE.
  - [x] Set bed AVAILABLE.
  - [x] Save `endedAt` + `endedNote`).

## [x] PHASE 7 — RENT MODULE (Monthly System)
- [x] Implement logic for automatic current period.
- [x] GET rent summary.
- [x] GET rent assignments.
- [x] Mark paid (method, reference, note).
- [x] Mark unpaid.
- [x] Payment history & overdue detection logic.

## [x] PHASE 8 — RECEIPT SYSTEM
- [x] PDFKit receipt generation.
- [x] Receipt No format (`SW-YYYYMM-XXXXXXXX`).
- [x] Download endpoint (`/receipts/:paymentId/download`).
- [x] WhatsApp message skeleton endpoint.
- [x] Multi-tenant security check.rification.

## [x] PHASE 9 — COMPLAINT SYSTEM
- [x] Tenant create complaint.
- [x] GET complaints (Owner).
- [x] Update complaint status (Owner).
- [x] Tenant fetch own complaints.

## [x] PHASE 10 — FRONTEND (Next.js App Router)
- [x] Setup Next.js inside `/frontend/`: `npx create-next-app@latest . --typescript`.
- [x] Set `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## [x] PHASE 11 — FRONTEND STRUCTURE
- [x] Create folders:
  - `app/login/`, `app/register/`, `app/(dashboards)/owner/`, `app/(dashboards)/tenant/`
  - `components/` (TopNav, ToastProvider)
  - `contexts/` (AuthContext)
  - `lib/api.ts`

## [x] PHASE 12 — OWNER DASHBOARD
- [x] Display Buildings, Rooms, Beds counts.
- [x] Display Occupied / Available counts.
- [x] Display Rent and Complaint summaries.
- [x] Setup Quick links.

## [x] PHASE 13 — TENANT PANEL
- [x] Display assigned property details.
- [x] Display current month's rent status.
- [x] Options to Raise & View complaint history.

## [x] PHASE 14 — UX POLISH
- [x] Implement Toast system (no alert).
- [x] Ensure proper button disabled states & refresh buttons.
- [x] Clean up error handling consistency.

## [x] PHASE 15 — PRE-LAUNCH HARDENING
- [x] Strict CORS based on `NODE_ENV`.
- [x] Strong JWT secret enforcement.
- [x] Verify `prisma migrate deploy` for prod.
- [x] Ensure absolute route protections & tenant data isolation.

## [x] PHASE 16 — DEPLOYMENT ORDER
- [x] Push Backend to GitHub & Deploy to Render/Railway.
- [x] Run migrations logic.
- [x] Deploy Frontend to Vercel & configure environments.

---

## [x] PHASE 17 — DETAILED FRONTEND PAGES & UX
- [x] Implement global ripple effect on all buttons.
- [x] Build functional Add Building modal/logic in `/owner/properties`.
- [x] Build `/owner/tenants` list view.

## [x] PHASE 18 — LANDING PAGE & TENANT REGISTRATION
- [x] Build public Landing Page at `/`.
- [x] Implement Tenant Registration API and UI flow.

## [x] PHASE 19 — LANDING PAGE VIDEO BACKGROUND
- [x] Create React Canvas image sequence player.
- [x] Update Landing Page styling to overlay the video.

## [x] PHASE 20 — END-TO-END TESTING & FIXES
- [x] Implement missing "Manage Structure" functionality (adding rooms/beds) on the `/owner/properties` page.
- [x] Test Owner Registration -> Login -> Add Building -> Manage Structure -> Add Room -> Add Bed.
- [x] Test Tenant Registration -> Login -> View Dashboard.
- [x] Ensure all Dashboard Links and visual components function without errors or 404s.

## [x] PHASE 21 — MULTI-PROPERTY TYPE SUPPORT
- [x] Create implementation plan for Prop Types & DB Changes
- [x] Prisma Migration for `type` enum and flexible assignments
- [x] Update Add Building UI with Property Type dropdown
- [x] Update Manage Structure UI to hide Beds for Office/Shops
- [x] User testing and verification

## [x] PHASE 22 — UI POLISH
- [x] Dashboard metric cards are now clickable links

## [x] PHASE 23 & 24 — AUTH & TENANT REGISTRATION
- [x] Convert 'Sign In' to 'Log In' terminology.
- [x] Combine Owner & Tenant Registration flows into a single unified page with a role toggle.
- [x] Detach Tenant registration from strictly requiring an `ownerEmail` so they can register unbound.
- [x] Modify Tenant Assignment backend to allow strictly unbound accounts to be linked to owners post-registration.
- [x] Ensure `AuthContext` continues automatically routing users to their proper Dashboard based on their role upon login.

## [x] PHASE 25 — NAVIGATION FIXES
- [x] Fix the "Manage Structure" button on Property Cards to route correctly to the builder.

## [x] PHASE 26 — ADD TENANT & WHATSAPP INTEGRATION
- [x] Update database schema for serial fields (`serialNumber`) and `customTenantId`.
- [x] Create `/tenants/add-assign` backend endpoint to generate `0000xxxxzzzyyyyyy` ID.
- [x] Implement backend `Notification` creation.
- [x] Build `AddTenantModal` in the frontend `/owner/tenants/page.tsx` that captures Email, WhatsApp, and Name.
