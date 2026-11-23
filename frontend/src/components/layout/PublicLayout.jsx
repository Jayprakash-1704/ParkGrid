import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '../ui/primitives.jsx';
import { getRoleHomePath } from '../../lib/utils.js';

const LOGO = '/assets/images/logo.png'

export function PublicLayout() {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Find Parking', to: user?.role === 'DRIVER' ? '/driver/find' : '/parking' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f1] text-[#202923]">
      <header className="sticky top-0 z-30 border-b border-[#d7ddd5] bg-[#f5f5f1]">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          {/* Brand */}
          <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="ParkGrid home">

            <a href="/" className="inline-flex items-center">
              <img
                src={LOGO}
                alt="Company Name"
                className="h-10 w-auto"
              />
            </a>

          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-2 text-[20px] font-semibold tracking-wide transition-colors duration-150 hover:text-[#24734c] ${active ? 'text-[#24734c]' : 'text-[#69756c]'
                    }`}
                >
                  {item.label}
                  {active && <span className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#24734c]" />}
                </Link>
              );
            })}
          </nav>

          {/* Primary action */}
          <div className="flex shrink-0 items-center">
            {user ? (
              <Button
                variant="emerald"
                size="sm"
                onClick={() => navigate(getRoleHomePath(user.role))}
                className="h-10 rounded-none px-4 text-[11px] font-semibold uppercase tracking-[0.09em]"
              >
                Open dashboard <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/login')}
                className="h-10 rounded-none bg-[#202923] px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#24734c]"
              >
                Sign in <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Compact navigation for small screens */}
        <nav aria-label="Mobile navigation" className="flex items-center gap-6 overflow-x-auto border-t border-[#e0e4dd] px-5 py-3 sm:px-8 md:hidden">
          {navLinks.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${active ? 'text-[#24734c]' : 'text-[#778279] hover:text-[#202923]'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[#d1d8d0] bg-[#202923] text-[#f5f5f1]">
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12">
          <div className="grid gap-9 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-md">
              <Link to="/" className="inline-flex items-center gap-3" aria-label="ParkGrid home">
                <span className="flex h-8 w-8 items-center justify-center bg-[#24734c] text-xs font-bold text-white">P</span>
                <span className="font-display text-lg font-semibold tracking-[-0.04em]">ParkGrid<span className="text-[#7db18f]">.</span></span>
              </Link>
              <p className="mt-4 text-[12px] leading-6 text-[#aeb9af]">
                Real-time urban parking reservations, verified payments, and secure QR gate access.
              </p>
            </div>

            <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-3 text-[11px] font-medium text-[#c3ccc4]">
              <Link to="/parking" className="transition-colors hover:text-white">Find parking</Link>
              <Link to="/about" className="transition-colors hover:text-white">About</Link>
              <Link to="/contact" className="transition-colors hover:text-white">Contact</Link>
              <Link to="/register" className="transition-colors hover:text-white">Create account</Link>
            </nav>
          </div>

          <div className="mt-9 flex flex-col gap-2 border-t border-white/15 pt-5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#849187] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} ParkGrid Mobility</span>
            <span>Find a space. Arrive with certainty.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
