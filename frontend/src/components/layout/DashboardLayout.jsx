import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  CreditCard,
  FileSpreadsheet,
  Grid2x2,
  History,
  HomeIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  QrCode,
  ScanLine,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { logoutUserThunk } from '../../store/slices/authSlice.js';
import {
  occupancyUpdatedRealtime,
  slotUpdatedRealtime,
} from '../../store/slices/parkingSlice.js';
import { upsertBookingRealtime } from '../../store/slices/bookingSlice.js';
import { getSocket, joinRoleChannel } from '../../services/socket.js';
import { getRoleLabel } from '../../lib/utils.js';

const ROLE_NAV = {
  DRIVER: [
    { label: 'Dashboard', to: '/driver', icon: LayoutDashboard, end: true },
    { label: 'Find Parking', to: '/driver/find', icon: MapPin },
    { label: 'My Reservations', to: '/driver/reservations', icon: CalendarCheck2 },
    { label: 'QR Passes', to: '/driver/qr-codes', icon: QrCode },
    { label: 'Payment History', to: '/driver/payments', icon: CreditCard },
    { label: 'Profile', to: '/driver/profile', icon: UserCircle2 },
  ],
  ATTENDANT: [
    { label: 'Dashboard', to: '/attendant', icon: LayoutDashboard, end: true },
    { label: 'QR Scanner', to: '/attendant/scanner', icon: ScanLine },
    { label: 'Active Gate Queue', to: '/attendant/reservations', icon: CalendarCheck2 },
    { label: 'Entry & Exit History', to: '/attendant/history', icon: History },
  ],
  LOT_ADMIN: [
    { label: 'Dashboard', to: '/lot-admin', icon: LayoutDashboard, end: true },
    { label: 'Manage Parking Lots', to: '/lot-admin/lots', icon: Building2 },
    { label: 'Manage Slots', to: '/lot-admin/slots', icon: Grid2x2 },
    { label: 'Manage Attendants', to: '/lot-admin/attendants', icon: Users },
    { label: 'Reservations', to: '/lot-admin/reservations', icon: CalendarCheck2 },
    { label: 'Revenue Analytics', to: '/lot-admin/analytics', icon: BarChart3 },
    { label: 'Reports', to: '/lot-admin/reports', icon: FileSpreadsheet },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard', to: '/super-admin', icon: LayoutDashboard, end: true },
    { label: 'Manage Users', to: '/super-admin/users', icon: Users },
    { label: 'Manage Lot Admins', to: '/super-admin/lot-admins', icon: ShieldCheck },
    { label: 'Parking Locations', to: '/super-admin/locations', icon: Building2 },
    { label: 'System Analytics', to: '/super-admin/analytics', icon: BarChart3 },
    { label: 'Settings', to: '/super-admin/settings', icon: Settings },
  ],
};

export function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = ROLE_NAV[user?.role] || [];

  // Bind Socket.IO real-time updates to Redux store
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    joinRoleChannel(user);

    const onSlotUpdated = (payload) => {
      dispatch(slotUpdatedRealtime(payload));
    };

    const onOccupancyUpdated = (payload) => {
      dispatch(occupancyUpdatedRealtime(payload));
    };

    const onBookingEvent = (payload) => {
      if (payload?.booking) {
        dispatch(upsertBookingRealtime(payload.booking));
      }

      if (payload?.slot) {
        dispatch(slotUpdatedRealtime(payload));
      }
    };

    socket.on('slot:updated', onSlotUpdated);
    socket.on('occupancy:updated', onOccupancyUpdated);
    socket.on('reservation:created', onBookingEvent);
    socket.on('reservation:updated', onBookingEvent);
    socket.on('vehicle:entered', onBookingEvent);
    socket.on('vehicle:exited', onBookingEvent);

    return () => {
      socket.off('slot:updated', onSlotUpdated);
      socket.off('occupancy:updated', onOccupancyUpdated);
      socket.off('reservation:created', onBookingEvent);
      socket.off('reservation:updated', onBookingEvent);
      socket.off('vehicle:entered', onBookingEvent);
      socket.off('vehicle:exited', onBookingEvent);
    };
  }, [user, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUserThunk());
    toast.success('Signed out of ParkGrid.');
    navigate('/login');
  };

  const currentNav =
    navItems.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    ) || navItems[0];

  const SidebarContent = (
    <div className="flex h-full flex-col bg-[#202923] text-white">
      {/* Brand */}
      <div className="flex h-[76px] py-10 items-center justify-between border-b border-white/10 px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center bg-[#24734c]">
            <MapPin className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="font-display text-xl font-bold tracking-tight text-white">
              ParkGrid
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Smart Parking
            </p>
          </div>
        </Link>

        <button
          type="button"
          className="rounded-md p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Information */}
      <div className="border-b border-white/10 px-5 py-6">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Workspace
        </p>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/10">
            <UserCircle2 className="h-5 w-5 text-[#9ed5b4]" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-white/45">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center border border-[#24734c]/40 bg-[#24734c]/20 px-2.5 py-1">
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#72c394]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a8dfbd]">
            {getRoleLabel(user?.role)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Navigation
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-[#24734c] text-white'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-[3px] bg-[#a8dfbd]" />
                    )}

                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${isActive
                          ? 'text-white'
                          : 'text-white/45 group-hover:text-white'
                        }`}
                    />

                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-2 px-2">
          <span className="h-2 w-2 rounded-full bg-[#72c394]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
            System workspace
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-3 text-sm font-medium text-white/55 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f5f1] text-[#202923]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-[#111a14]/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="relative flex h-full w-72 max-w-[85vw] flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-[#dedfd8] bg-[#fbfbf8] px-4 sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#dedfd8] text-[#47534a] transition-colors hover:bg-[#eeefe9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#8a9189]">
                <span className="hidden sm:inline">
                  {getRoleLabel(user?.role)}
                </span>
                <span className="hidden sm:inline text-[#c5c9c1]">/</span>
                <span className="truncate font-semibold text-[#24734c]">
                  {currentNav?.label || 'Overview'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            {user?.assignedLot?.name && (
              <div className="hidden items-center gap-2 border-l border-[#dedfd8] pl-5 md:flex">
                <Building2 className="h-4 w-4 text-[#24734c]" />

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#929990]">
                    Assigned Facility
                  </p>
                  <p className="max-w-[180px] truncate text-xs font-semibold text-[#303c33]">
                    {user.assignedLot.name}
                  </p>
                </div>
              </div>
            )}

            <Link
              to="/"
              className="inline-flex items-center gap-2 border border-[#d9ddd5] px-3 py-2 text-xs font-semibold text-[#47534a] transition-colors hover:border-[#24734c] hover:text-[#24734c] sm:px-4"
            >
              <span className="inline-flex items-center justify-center p-1 bg-[#24734c] text-white rounded-xl shadow-sm hover:bg-zinc-800 transition-colors">
                <HomeIcon className="w-5 h-5" />
              </span>


            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-9">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-[#dedfd8] bg-[#fbfbf8] px-4 py-4 sm:px-6 lg:px-9">
          <div className="flex flex-col justify-between gap-2 text-[11px] text-[#929990] sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} ParkGrid. Smart parking management.
            </p>
            <p className="font-medium uppercase tracking-wider">
              {getRoleLabel(user?.role)} Workspace
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}