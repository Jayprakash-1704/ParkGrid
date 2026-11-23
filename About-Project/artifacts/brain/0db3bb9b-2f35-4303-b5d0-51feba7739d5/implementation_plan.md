# ParkGrid — Smart Parking Reservation & QR Access System

ParkGrid is a full-stack MERN parking reservation and facility access platform enabling drivers to discover nearby lots, book live-tracked slots with verified Cashfree payments, and enter or exit garages seamlessly via cryptographically signed QR passes. Separate workspaces empower gate attendants, lot administrators, and platform super admins with real-time occupancy, revenue analytics, and access control.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All four architectural and aesthetic preferences from our kickoff questions are locked into this blueprint. Review the summary below and approve to start building the complete runnable application.

- **Confirmed — Payment Gateway**: Cashfree integration featuring full server-side order creation, payment verification, and refund processing, backed by a built-in Cashfree Checkout Sandbox simulation when live Cashfree API credentials are not supplied.
- **Confirmed — MongoDB Runtime**: Mongoose ODM connecting to an external `MONGODB_URI` when provided, with  (`mongodb-altas`) and realistic pre-seeded demo data for all four roles so every workflow runs immediately out of the box.
- **Confirmed — Visual Aesthetic**: Clean light mobility UI built around crisp slate neutrals and focused emerald accents, adhering to strict typographic hierarchy, zero-pill metadata restraint, and high-density operational tables.
- **Confirmed — Delivery & Code Structure**: Complete, end-to-end runnable application delivered in one pass, organized cleanly into separate frontend and backend directories written in JavaScript (`.jsx` / `.js`) with unified Express + Socket.IO + Vite serving on port 3000.
- **Default — Brand & Media Uploads**: Branded as **ParkGrid**, with Cloudinary upload support for parking lot imagery when Cloudinary credentials are configured and safe local asset fallback otherwise.

---

## 1. Overview & Core Concept

- **What It Does**: Connects urban drivers with managed parking facilities through real-time slot inventory, atomic conflict-free booking, verified online payment, and automated QR-based gate entry and exit.
- **Target Audience & Personas**:
  - **Drivers**: Commuters and travelers searching nearby parking, comparing hourly rates and amenities (EV charging, covered bays, accessible slots), reserving ahead, and scanning a digital QR pass at the gate.
  - **Gate Attendants**: On-site staff using camera-based QR scanning (or manual token lookup) to verify active passes, log vehicle entry and exit, and immediately release vacated slots.
  - **Lot Administrators**: Facility managers configuring parking lots, slot layouts, dynamic hourly rates, assigned attendants, live occupancy monitoring, and revenue reports.
  - **Super Administrators**: Platform operators overseeing all users, lot admins, facility approvals, platform-wide analytics, account suspensions, and global rules (cancellation windows, grace periods, service fees).
- **Key Value**: Eliminates double-booking and manual gate friction by coupling atomic MongoDB slot locks, server-side payment verification, auto-generated single-use QR entry/exit tokens, and sub-second Socket.IO slot state broadcasts across all connected clients.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Public Discovery & Onboarding (`Home`, `About`, `Contact`, `Login`, `Register`)**
   - Visitors land on a clear mobility storefront showing an architectural parking hero visual, quick destination/radius search, numbered operational capabilities (`01. Real-Time Slot Grid`, `02. Verified Cashfree Checkout`, `03. Instant QR Gate Access`), concrete facility metrics, and direct entry into Driver registration or role-based sign-in (with one-click demo role presets on Login for immediate testing).
2. **Driver Reservation & QR Pass Flow**
   - Driver searches nearby lots by city, query, vehicle/slot type, or distance radius → opens Parking Details to inspect amenities, hourly rates, and live slot counts → selects a green available bay from the live interactive lot map and picks start/end times → backend computes exact fee and creates a Cashfree payment order → Driver completes payment in the Cashfree modal (supporting both Success and Simulate Failure paths in sandbox) → backend verifies payment, atomically locks the booking, and auto-generates a cryptographically random QR code encoding `{origin}/scan/{qrToken}` → Driver views or downloads the PNG pass, tracks live status, reviews payment history, or cancels within policy for automatic refund calculation.
3. **Attendant QR Gate Verification Flow**
   - Attendant opens the QR Scanner workspace → scans a driver's QR code via live webcam (`html5-qrcode`) or pastes a QR URL/token directly → frontend extracts `qrToken` and sends it to the backend → backend validates authenticity, booking window, payment confirmation, and prior scan state → Attendant views driver, vehicle plate, slot code, and booking validity → confirms **Vehicle Entry** (slot flips to `OCCUPIED`, booking to `ACTIVE`, entry timestamp recorded) → upon departure, scans again to confirm **Vehicle Exit** (exit timestamp recorded, booking marked `COMPLETED`, slot freed to `AVAILABLE`), broadcasting live updates to every dashboard.
4. **Lot Admin & Super Admin Operations Flows**
   - **Lot Admin** creates/edits parking lots (with photo uploads), bulk-generates or updates individual bays (Standard, EV, Compact, Accessible), creates and assigns attendants to lots, monitors live occupancy and booking queues, and inspects revenue analytics and exportable CSV reports.
   - **Super Admin** audits platform KPIs across all facilities, manages users and Lot Admins (activate/suspend accounts), monitors all parking locations, and updates global system settings (cancellation cutoff hours, entry grace period, platform fee rate).

### Visual Identity & Theme

- **Aesthetic Direction**: Clean light Swiss mobility architecture — calm, precise, and utilitarian, avoiding dark neon clichés, decorative gradients, or pill clutter.
- **Color Palette & Mood (60-30-10 Distribution)**:
  - *60% Dominant Neutral Canvas*: `--background` (`#F8FAFC` soft slate canvas) and `--card` (`#FFFFFF` crisp elevated surfaces).
  - *30% Structural Surfaces & Typography*: `--foreground` (`#0F172A` deep slate ink), `--muted-foreground` (`#475569`), `--border` (`#E2E8F0` subtle 1px hairlines), `--secondary` (`#F1F5F9`).
  - *10% Focused Accent & Semantic States*: `--primary` (`#0F172A` authoritative slate action buttons), `--accent` (`#059669` crisp emerald for primary CTAs, active navigation indicators, and available bays), Amber (`#D97706`) for reserved/pending states, and Crimson (`#DC2626`) for occupied, cancelled, or error states. Every status pairs color with explicit text labels (never color alone).
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Display & Navigation*: `Plus Jakarta Sans` (weights 600–700, tight tracking, `text-wrap: balance` on headlines, hero `clamp(2.25rem, 4vw, 3.75rem)`).
  - *Body & UI Controls*: `DM Sans` (weights 400–500, 15px–16px prose, 13px–14px high-density tables).
  - *Data, Slot Codes & Telemetry*: `JetBrains Mono` with `tabular-nums` strictly for bay identifiers (`A-04`), hourly rates, booking durations, payment amounts, and timestamps.
- **Component Styling & Layout**:
  - **Public Top Bar Contract**: Strict single-row 3-zone header — single-line `ParkGrid` wordmark on the left, 4 concise single-line nav links (`Find Parking`, `How It Works`, `About`, `Contact`) in the center, and 1 primary action (`Sign In` / `Dashboard`) on the right.
  - **Dashboard Shell**: Fixed 256px desktop sidebar navigation (collapsible drawer on mobile) + contextual breadcrumb top bar with role/account controls + full-width 1440px-ready operational canvas using single-elevation 1px bordered panels (never nested cards-within-cards or thick left accent borders).
  - **Zero-Pill Discipline**: Metadata (rates, distances, timestamps, lot specs) rendered as clean unboxed inline text separated by `·`; interactive filters use segmented `<button>` bars with crisp active states.
  - **Visual Assets**: Custom architectural parking facility photography generated upfront in parallel for the public hero and seeded parking lots, paired with styled CSS/SVG fallbacks for zero broken images.

### Interactive Feedback & Motion

- Sub-200ms transitions on compositor properties (`transform`, `opacity`) for route reveals, slot hover feedback, and checkout/scanner drawers (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Complete state coverage across every view: matching-height loading skeletons, actionable empty states (e.g., *"No reservations yet — Find nearby parking"*), Zod-powered inline form validation, and clear toast notifications (`sonner`) for bookings, scans, and real-time slot changes.

---

## 3. Key Product Decisions & Trade-Offs

- **Unified Full-Stack Serving with Separate `frontend/` & `backend/` Folders**
  - *Chosen Approach*: Keep `frontend/` (pure `.jsx`/`.js` React + Vite + Tailwind + Shadcn UI + Redux Toolkit) and `backend/` (pure `.js` Express + Mongoose + Socket.IO) strictly separated in their own top-level folders, while mounting Vite's dev middleware / static production bundle inside the Express HTTP server on port 3000.
  - *Why*: Preserves clean MERN separation of concerns and standard independent deployment readiness while guaranteeing same-origin HTTP-only JWT cookies, zero CORS friction in iframes, and seamless Socket.IO WebSocket upgrades on port 3000.
  - *Alternatives Considered*: Running two separate ports (3000 + 5000) via proxy breaks single-port container hosting and complicates cross-origin secure cookies.

- **Atomic MongoDB Booking Locks & Strict Server-Side Verification**
  - *Chosen Approach*: Reservations check overlapping active time ranges (`PENDING_PAYMENT`, `CONFIRMED`, `ACTIVE`) inside an atomic service transaction/conditional slot guard before confirming, and QR tokens are minted strictly on the server only after backend payment verification succeeds.
  - *Why*: Prevents double-booking race conditions, blocks client-side payment spoofing, and eliminates manual or forged QR passes.
  - *Alternatives Considered*: Optimistic client-side slot locking without server re-validation, which is vulnerable to concurrent checkout conflicts.

- **Cashfree Dual-Mode Payment Service (Live API + Verified Sandbox)**
  - *Chosen Approach*: Implement Cashfree PG v3 order creation, signature/status verification, and refund endpoints in a dedicated payment service that calls Cashfree's REST API when credentials exist, and runs a realistic cryptographically signed sandbox checkout flow when keys are absent.
  - *Why*: Keeps the exact production verification lifecycle (order creation → checkout → backend verification → confirmation & QR minting → refund) fully testable immediately without exposing or requiring secrets.

- **Camera QR Scanner with Direct Token Fallback**
  - *Chosen Approach*: Integrate `html5-qrcode` for live device camera scanning alongside a one-click paste/URL input and test pass selector inside the Attendant scanner view.
  - *Why*: Ensures smooth real-world gate scanning on mobile/laptop cameras while also letting reviewers test full entry/exit workflows instantly inside headless or camera-less desktop environments.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (frontend/ — React JSX + Vite)                  │
│                                                                              │
│  ┌────────────────────┐   ┌───────────────────────────────────────────────┐  │
│  │ Redux Toolkit Store│◄─►│ Axios API Client (withCredentials: true)      │  │
│  │ auth · lots · book │   │ Socket.IO Client (lot & role room listeners)  │  │
│  │ scanner · admin    │   └──────────────────────┬────────────────────────┘  │
│  └─────────┬──────────┘                          │                           │
│            ▼                                     │                           │
│  ┌───────────────────────────────────────────────┴────────────────────────┐  │
│  │ React Router DOM + Protected Role Guards + Shadcn UI + RHF & Zod       │  │
│  ├──────────────┬───────────────┬───────────────────┬─────────────────────┤  │
│  │ Public Site  │ Driver Portal │ Attendant Console │ Admin Consoles      │  │
│  │ Home · About │ Find · Details│ Live QR Scanner   │ Lot Admin: Lots,    │  │
│  │ Contact      │ Slot Grid     │ Entry / Exit Gate │ Slots, Attendants,  │  │
│  │ Login / Reg  │ Cashfree Pay  │ Verification Card │ Revenue & Reports   │  │
│  │              │ QR Pass · Hist│ Entry/Exit Logs   │ Super Admin: Users, │  │
│  │              │ Payments      │                   │ Analytics, Settings │  │
│  └──────────────┴───────────────┴───────────────────┴─────────────────────┘  │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │ HTTP REST (/api/*) + WebSocket (WS)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 BACKEND (backend/ — Node.js + Express + JS)                  │
│                                                                              │
│  Security Layer: Helmet · CORS · Rate Limiter · Cookie Parser · Error MW     │
│  Auth & RBAC MW: JWT HTTP-only Access/Refresh Verification · Role Guards     │
│                                                                              │
│  ┌──────────────────────┐   ┌─────────────────────┐   ┌───────────────────┐  │
│  │ REST Route Modules   │──►│ Service Layer       │──►│ Socket.IO Engine  │  │
│  │ /api/auth  /api/users│   │ AuthService         │   │ lot:{lotId} rooms │  │
│  │ /api/parking-lots    │   │ ParkingLotService   │   │ admin:live room   │  │
│  │ /api/parking-slots   │   │ ReservationService  │   │ Idempotent Events │  │
│  │ /api/reservations    │   │ QRVerificationSvc   │   └───────────────────┘  │
│  │ /api/qr /api/payments│   │ CashfreePaymentSvc  │                          │
│  │ /api/attendants      │   │ AnalyticsService    │   ┌───────────────────┐  │
│  │ /api/admin /analytics│   │ CloudinaryMediaSvc  │   │ External Gateways │  │
│  └──────────────────────┘   └──────────┬──────────┘   │ Cashfree PG v3    │  │
│                                        │              │ Cloudinary CDN    │  │
│                                        ▼              └───────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Mongoose ODM & Database Connector                                      │  │
│  │ External MONGODB_URI ──(fallback)──► mongodb-memory-server + Seeder    │  │
│  │ Models: User · ParkingLot · ParkingSlot · Booking · SystemSetting      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Relationships

- **User**: Stores `name`, `email` (unique indexed), `password` (bcrypt hashed), `phone`, `vehicleNumber`, `role` (`DRIVER`, `ATTENDANT`, `LOT_ADMIN`, `SUPER_ADMIN`), `status` (`ACTIVE`, `SUSPENDED`), `assignedLot` (ObjectId ref → `ParkingLot` for attendants), `refreshTokenHash`, and timestamps.
- **ParkingLot**: Stores `name`, `address`, `city`, `description`, GeoJSON `location` (`2dsphere` geospatial index for nearby radius search), `images` (Cloudinary/local URLs), `amenities`, `hourlyRate`, `operatingHours`, `owner` (ObjectId ref → `User` Lot Admin), `attendants` (ObjectId[] ref → `User`), `status` (`ACTIVE`, `INACTIVE`, `MAINTENANCE`), and cached `totalSlots` / `availableSlots`.
- **ParkingSlot**: Stores `parkingLot` (ObjectId ref → `ParkingLot`), `slotNumber` (compound unique index with `parkingLot`), `floor`, `zone`, `slotType` (`STANDARD`, `EV`, `COMPACT`, `ACCESSIBLE`), `hourlyRateOverride`, `status` (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`), and `currentBooking` (ObjectId ref → `Booking`).
- **Booking**: Stores `bookingCode` (unique human-readable reference), `driver` (ObjectId ref → `User`), `parkingLot` (ObjectId ref → `ParkingLot`), `parkingSlot` (ObjectId ref → `ParkingSlot`), `vehicleNumber`, `startTime`, `endTime`, `durationHours`, `totalAmount`, `status` (`PENDING_PAYMENT`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `EXPIRED`), `payment` subdocument (`gateway`, `orderId`, `paymentSessionId`, `transactionId`, `status`: `PENDING`/`PAID`/`FAILED`/`REFUNDED`, `paidAt`, `refundedAt`, `refundAmount`), `qrToken` (sparse unique crypto token), `qrDataUrl`, `entryTime`, `exitTime`, `entryVerifiedBy`, `exitVerifiedBy`, `cancelledAt`, and `cancellationReason`. Compound indexes on `(parkingSlot, startTime, endTime, status)` accelerate conflict detection.
- **SystemSetting**: Singleton configuration document controlled by Super Admin (`cancellationCutoffHours`, `entryGraceMinutes`, `platformFeePercent`, `allowNewRegistrations`, `maintenanceMode`).

### Interactive Component & State Mapping

- **Auth & Role Routing**: Redux `authSlice` hydrates current user via `GET /api/auth/me` on mount using HTTP-only cookies, automatically refreshes tokens on `401`, and routes users to their role-specific workspace (`/driver`, `/attendant`, `/lot-admin`, `/super-admin`).
- **Live Slot Grid & Reservation Checkout**: Selecting a lot joins Socket.IO room `lot:{lotId}`. Incoming `slot:updated`, `vehicle:entered`, and `vehicle:exited` events idempotently patch Redux `lotsSlice` and `bookingsSlice` without duplicating records. Picking an available bay and time window invokes Zod validation, calculates pricing via backend, opens the Cashfree Checkout dialog, verifies payment server-side, and transitions directly to the Confirmation & QR Pass view.
- **Attendant Gate Scanner**: `QRScannerPage` renders live camera capture (`html5-qrcode`) plus manual URL/token input. Submitting a token calls `POST /api/qr/verify` and populates the verification panel with actionable **Confirm Vehicle Entry** (`POST /api/qr/entry`) or **Confirm Vehicle Exit** (`POST /api/qr/exit`) buttons, strictly disabled when invalid, expired, cancelled, or already processed.
- **Lot Admin & Super Admin Tables**: Every management view (Lots, Slots, Attendants, Users, Bookings, Reports) supports live search, segmented status filters, create/edit dialogs validated by React Hook Form + Zod, optimistic feedback with error rollback, Recharts/SVG revenue & occupancy charts, and CSV export.

### Key Sequences & Real-Time Events

1. **Reservation & Payment Verification**:
   `Driver selects slot & times` → `POST /api/reservations/initiate` (atomic overlap check + Cashfree order creation) → `Cashfree Checkout modal` → `POST /api/payments/verify` (server verifies gateway status, sets Booking `CONFIRMED`, mints `qrToken` + QR PNG data URL, marks slot `RESERVED`) → `Socket.IO emits slot:updated & reservation:created`.
2. **QR Entry & Exit Lifecycle**:
   `Attendant scans {origin}/scan/{qrToken}` → `POST /api/qr/verify` (checks existence, payment `PAID`, time window + grace period, single-entry/exit rules) → `POST /api/qr/entry` (sets `ACTIVE`, records `entryTime`, marks slot `OCCUPIED`, emits `vehicle:entered`) → later scan → `POST /api/qr/exit` (verifies `ACTIVE`, records `exitTime`, sets `COMPLETED`, frees slot `AVAILABLE`, emits `vehicle:exited`).
3. **Cancellation & Refund**:
   `Driver clicks Cancel` → `POST /api/reservations/:id/cancel` → backend enforces `cancellationCutoffHours` from `SystemSetting`, triggers Cashfree refund, updates payment to `REFUNDED`, releases slot to `AVAILABLE`, and emits `slot:updated`.
