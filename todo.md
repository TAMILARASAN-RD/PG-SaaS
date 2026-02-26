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

## [ ] PHASE 2 — DATABASE SCHEMA (CRITICAL FOUNDATION)
- [ ] Create Prisma schema with required models:
  - `Owner`
  - `User` (roles: SUPER_ADMIN, OWNER, MANAGER, TENANT)
  - `Building`
  - `Room`
  - `Bed`
  - `TenantAssignment`
  - `Payment`
  - `Complaint`
- [ ] Implement Multi-tenant isolation by `ownerId`.
- [ ] Add unique constraint on monthly rent period: `@@unique([tenantAssignmentId, periodYear, periodMonth])`.
- [ ] Run `npx prisma migrate dev --name init`.

## [ ] PHASE 3 — CORE BACKEND STRUCTURE
- [ ] Create standard directory structure under `backend/src/`:
  - `server.ts`, `app.ts`
  - `lib/prisma.ts`
  - `middlewares/auth.ts`
  - `modules/` (auth, buildings, rooms, beds, tenants, rent, complaints)

## [ ] PHASE 4 — AUTH SYSTEM
- [ ] Implement Register OWNER.
- [ ] Implement Login.
- [ ] Create JWT middleware.
- [ ] Implement Role-based access control.
- [ ] Inject `ownerId` from token.
- [ ] Protect all appropriate routes.

## [ ] PHASE 5 — PROPERTY MANAGEMENT
- [ ] Create/List building APIs.
- [ ] Create/List room APIs.
- [ ] Create/List bed APIs.
- [ ] Implement auto-set bed status (AVAILABLE / OCCUPIED).

## [ ] PHASE 6 — TENANT MANAGEMENT
- [ ] Create tenant (by Owner).
- [ ] Assign tenant to bed and update bed status to OCCUPIED.
- [ ] Occupancy dashboard endpoint.
- [ ] Vacate endpoint (set assignment INACTIVE, bed AVAILABLE, save `endedAt` + `endedNote`).

## [ ] PHASE 7 — RENT MODULE (Monthly System)
- [ ] Implement logic for automatic current period.
- [ ] GET rent summary & assignments.
- [ ] Mark paid (method, reference, note).
- [ ] Mark unpaid.
- [ ] Payment history & overdue detection logic.

## [ ] PHASE 8 — RECEIPT SYSTEM
- [ ] PDFKit receipt generation.
- [ ] Format Receipt No: `SW-YYYYMM-XXXXXXXX`.
- [ ] Download endpoint & WhatsApp message endpoint.
- [ ] Ensure multi-tenant security verification.

## [ ] PHASE 9 — COMPLAINT SYSTEM
- [ ] Tenant create complaint.
- [ ] Owner fetch/resolve complaints.
- [ ] Tenant fetch own complaints.

## [ ] PHASE 10 — FRONTEND (Next.js App Router)
- [ ] Setup Next.js inside `/frontend/`: `npx create-next-app@latest . --typescript`.
- [ ] Set `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## [ ] PHASE 11 — FRONTEND STRUCTURE
- [ ] Create folders:
  - `app/login/`, `app/owner/`, `app/tenant/`
  - `components/` (AuthProvider, Protected, TopNav, ToastProvider)
  - `lib/api.ts`, `lib/download.ts`

## [ ] PHASE 12 — OWNER DASHBOARD
- [ ] Display Buildings, Rooms, Beds counts.
- [ ] Display Occupied / Available counts.
- [ ] Display Rent and Complaint summaries.
- [ ] Setup Quick links.

## [ ] PHASE 13 — TENANT PANEL
- [ ] Display assigned property details.
- [ ] Display current month's rent status.
- [ ] Options to Raise & View complaint history.

## [ ] PHASE 14 — UX POLISH
- [ ] Implement Toast system (no alert).
- [ ] Ensure proper button disabled states & refresh buttons.
- [ ] Clean up error handling consistency.

## [ ] PHASE 15 — PRE-LAUNCH HARDENING
- [ ] Strict CORS based on `NODE_ENV`.
- [ ] Strong JWT secret enforcement.
- [ ] Verify `prisma migrate deploy` for prod.
- [ ] Ensure absolute route protections & tenant data isolation.

## [ ] PHASE 16 — DEPLOYMENT ORDER
- [ ] Push Backend to GitHub & Deploy to Render/Railway.
- [ ] Run migrations logic.
- [ ] Deploy Frontend to Vercel & configure environments.
