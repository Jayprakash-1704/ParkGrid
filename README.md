# ParkGrid — MERN Smart Parking Reservation System

ParkGrid is structured into two clean, standalone folders—`backend/` and `frontend/`—each with its own `package.json` and `package-lock.json`.

## Folder Structure

```text
ParkGrid/
├── backend/                  # Express, Mongoose, Socket.IO, JWT, Cashfree, QR API
│   ├── config/               # MongoDB connector, Socket.IO, Cloudinary
│   ├── controllers/          # Route controllers
│   ├── middleware/           # JWT auth, RBAC, Zod validation, error handler
│   ├── models/               # User, ParkingLot, ParkingSlot, Booking, SystemSetting
│   ├── routes/               # /api/* REST routes
│   ├── services/             # Reservation, Cashfree payment, QR gate, analytics, seeder
│   ├── utils/                # Constants, JWT cookies, ApiError
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── frontend/                 # React (JSX), Vite, Tailwind CSS, Shadcn UI, Redux Toolkit
    ├── public/assets/images/ # Architectural facility images
    ├── src/
    │   ├── components/       # Shadcn UI primitives, layouts, analytics charts
    │   ├── lib/              # Formatters & CSV export helpers
    │   ├── pages/            # Public, Driver, Attendant, Lot Admin, Super Admin pages
    │   ├── services/         # Axios client & Socket.IO client
    │   ├── store/            # Redux Toolkit store & slices
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── package-lock.json
    └── vite.config.js
```

## Running Locally on Your PC (Two Terminals)

### Terminal 1 — Start Backend (Port 5000)
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
> Leave `MONGODB_URI` blank in `backend/.env` to auto-start an in-memory MongoDB server with pre-seeded demo data, or paste your MongoDB Atlas URI.

### Terminal 2 — Start Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser. Vite automatically proxies `/api` and `/socket.io` requests to `http://localhost:5000`.

## Demo Accounts (Password: `Password123!`)
- **Driver**: `driver@parkgrid.app`
- **Gate Attendant**: `attendant@parkgrid.app`
- **Lot Admin**: `lotadmin@parkgrid.app`
- **Super Admin**: `superadmin@parkgrid.app`
