import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { fetchParkingLotsThunk } from '../../store/slices/parkingSlice.js';
import { Button, Input, Panel, SafeImage } from '../../components/ui/primitives.jsx';
import { formatCurrency } from '../../lib/utils.js';

const HERO_IMAGE = '/assets/images/hero_parking_architecture_1795103228242.jpg';

export function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { lots, loading } = useSelector((state) => state.parking);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchParkingLotsThunk());
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const targetBase = user?.role === 'DRIVER' ? '/driver/find' : '/parking';
    navigate(`${targetBase}${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''}`);
  };

  const totalSlots = lots.reduce((sum, l) => sum + (l.totalSlots || 0), 0);
  const availableSlots = lots.reduce((sum, l) => sum + (l.availableSlots || 0), 0);

  return (
    <main className="bg-[#f5f5f1] text-[#202923]">
      {/* Hero */}
      <section className="border-b border-[#d9ded7] bg-[#f5f5f1]">
        <div className="mx-auto max-w-350 px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pb-16 lg:pt-8">
          <div className="mb-8 flex items-center justify-between border-b border-[#193a0c] pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#53645a]">
              ParkGrid <span className="mx-2 text-[#9aa59b]">/</span> Urban mobility network
            </p>
            <p className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#758078] sm:block">
              Find a space. Arrive with certainty.
            </p>
          </div>

          <div className="grid gap-9 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
            <div className="flex flex-col items-start">
              <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#24734c]">
                <span className="h-2 w-2 rounded-full bg-[#24734c]" />
                Parking, made predictable
              </p>
              <h1 className="max-w-155 font-display text-[clamp(2.65rem,5.2vw,4.8rem)] font-semibold leading-[0.99] tracking-[-0.055em] text-[#202923]">
                Your space is waiting. <span className="text-[#718078]">Not the other way around.</span>
              </h1>
              <p className="mt-6 max-w-122.5 text-[15px] leading-7 text-[#657168]">
                Find a verified parking bay, reserve it before you travel, and enter with a secure QR pass. One clear journey from search to barrier.
              </p>

              <form
                onSubmit={handleSearch}
                className="mt-8 flex w-full max-w-140 flex-col gap-2 border border-[#cbd3ca] bg-white p-2 shadow-[0_8px_24px_rgba(32,41,35,0.05)] sm:flex-row"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.25 w-4.25 -translate-y-1/2 text-[#758078]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search garage, street or city"
                    aria-label="Search garage, street or city"
                    className="h-12 border-0 bg-transparent pl-10 text-sm text-[#202923] shadow-none placeholder:text-[#98a199] focus-visible:ring-1 focus-visible:ring-[#24734c]"
                  />
                </div>
                <Button type="submit" variant="emerald" size="lg" className="h-12 shrink-0 rounded-none px-7 font-semibold">
                  Find parking <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#778279]">
                <span>Verified payment</span>
                <span className="text-[#b1b9b1]">/</span>
                <span>Live bay status</span>
                <span className="text-[#b1b9b1]">/</span>
                <span>Single-use QR access</span>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="absolute -left-3 -top-3 z-10 hidden h-16 w-16 border-l border-t border-[#24734c] lg:block" />
              <div className="relative h-75 overflow-hidden bg-[#dce2da] sm:h-105 lg:h-125">
                <SafeImage
                  src={HERO_IMAGE}
                  alt="Modern architectural multi-level smart parking garage with green availability indicators"
                  fallbackTitle="ParkGrid Smart Facility"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-linear-to-t from-[#111a15]/75 to-transparent px-5 pb-5 pt-16 text-white sm:px-7 sm:pb-7">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">The ParkGrid network</p>
                    <p className="mt-1 text-lg font-medium tracking-tight">A better way to arrive.</p>
                  </div>
                  <span className="border border-white/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">01 / 03</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-[#7b867d]">
                <span>Designed around your journey</span>
                <span>Urban parking infrastructure</span>
              </div>
            </div>
          </div>

          {/* Network facts */}
          <div className="mt-12 grid grid-cols-2 border-y border-[#cfd6ce] md:grid-cols-4">
            <div className="border-b border-r border-[#cfd6ce] py-5 pr-4 md:border-b-0 md:px-5 md:first:pl-0">
              <p className="font-mono text-[30px] font-medium leading-none tracking-tight text-[#202923]">{lots.length || 3}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#78837a]">Connected facilities</p>
            </div>
            <div className="border-b border-[#cfd6ce] py-5 pl-4 md:border-b-0 md:border-r md:px-5">
              <p className="font-mono text-[30px] font-medium leading-none tracking-tight text-[#24734c]">{availableSlots}/{totalSlots || 40}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#78837a]">Bays available now</p>
            </div>
            <div className="border-r border-[#cfd6ce] py-5 pr-4 md:px-5">
              <p className="font-mono text-[30px] font-medium leading-none tracking-tight text-[#202923]">&lt; 2s</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#78837a]">Gate verification</p>
            </div>
            <div className="py-5 pl-4 md:px-5 md:pr-0">
              <p className="font-mono text-[30px] font-medium leading-none tracking-tight text-[#202923]">04</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#78837a]">Connected user roles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured locations */}
      <section className="mx-auto max-w-350 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-col justify-between gap-5 border-b border-[#cfd6ce] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#24734c]">The network / Locations</p>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[#202923] sm:text-[2.6rem]">Find your next parking spot.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#748077]">Live availability across connected facilities. Choose a location to inspect its bays and reserve.</p>
          </div>
          <Link
            to={user?.role === 'DRIVER' ? '/driver/find' : '/parking'}
            className="group inline-flex items-center gap-2 self-start border-b border-[#24734c] pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#24734c] transition-colors hover:text-[#174c32] sm:self-auto"
          >
            Browse all locations
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-9 md:grid-cols-2 xl:grid-cols-3">
          {(loading ? [1, 2, 3] : lots.slice(0, 3)).map((lot, idx) =>
            loading ? (
              <div key={idx} className="animate-pulse">
                <div className="h-55 bg-[#e1e5df]" />
                <div className="mt-4 h-4 w-2/3 bg-[#e1e5df]" />
                <div className="mt-3 h-3 w-1/2 bg-[#e1e5df]" />
                <div className="mt-6 h-10 border-y border-[#d7ddd5] bg-[#ecefe9]" />
              </div>
            ) : (
              <article key={lot._id} className="group min-w-0">
                <div className="relative h-55 overflow-hidden bg-[#e1e5df]">
                  <SafeImage
                    src={lot.images?.[0]}
                    alt={lot.name}
                    fallbackTitle={lot.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                  <span className="absolute left-3 top-3 bg-[#f5f5f1] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#34443a]">
                    Facility {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="border-b border-[#cfd6ce] pb-4 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-semibold tracking-tight text-[#202923]">{lot.name}</h3>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#7a857c]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#24734c]" />
                        <span className="truncate">{lot.address}, {lot.city}</span>
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-[#202923]">{formatCurrency(lot.hourlyRate)}<span className="font-sans text-[10px] font-normal text-[#879188]"> / hr</span></p>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#24734c]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#24734c]" />
                      {lot.availableSlots} of {lot.totalSlots} bays available
                    </span>
                    <Button
                      variant="outline"
                      className="h-9 rounded-none border-[#bfc9bf] px-3 text-[10px] font-semibold uppercase tracking-widest text-[#34443a] hover:border-[#24734c] hover:bg-[#edf2eb] hover:text-[#174c32]"
                      onClick={() =>
                        navigate(
                          user?.role === 'DRIVER'
                            ? `/driver/parking/${lot._id}`
                            : `/parking/${lot._id}`
                        )
                      }
                    >
                      View facility <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      {/* How the service works */}
      <section className="border-y border-[#d7ddd5] bg-[#e9ede6]">
        <div className="mx-auto max-w-350 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#24734c]">Built into every reservation</p>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#202923] sm:text-[2.7rem]">From an open bay to a verified arrival.</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#6d796f]">The details are handled in the background, so drivers and facility teams can focus on a smooth arrival.</p>
            </div>

            <div className="border-t border-[#c5cec4]">
              <div className="grid gap-3 border-b border-[#c5cec4] py-6 sm:grid-cols-[64px_1fr] sm:gap-5">
                <span className="font-mono text-sm text-[#24734c]">01 /</span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[#202923]">Live bays, protected reservations</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d796f]">Drivers select exact bays across levels and EV zones. MongoDB overlap guards prevent concurrent reservations on the same slot, while Socket.IO broadcasts live bay states.</p>
                </div>
              </div>
              <div className="grid gap-3 border-b border-[#c5cec4] py-6 sm:grid-cols-[64px_1fr] sm:gap-5">
                <span className="font-mono text-sm text-[#24734c]">02 /</span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[#202923]">Payment verified before confirmation</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d796f]">Fees are calculated on the backend. A reservation is confirmed and its cryptographic QR token is created only after the server verifies settlement with Cashfree.</p>
                </div>
              </div>
              <div className="grid gap-3 py-6 sm:grid-cols-[64px_1fr] sm:gap-5">
                <span className="font-mono text-sm text-[#24734c]">03 /</span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-[#202923]">One pass for controlled gate access</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d796f]">Attendants scan the driver's QR pass to verify entry and exit. Expired, cancelled, or duplicate scans are blocked by the API.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-[#c5cec4] pt-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#24734c]">Access the platform</p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-[#202923]">One network. Four connected workspaces.</h3>
              <p className="mt-1 text-sm text-[#6d796f]">Driver, Gate Attendant, Lot Admin, and Super Admin.</p>
            </div>
            <Button variant="default" onClick={() => navigate('/login')} className="h-11 rounded-none bg-[#24734c] px-6 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#195b39]">
              Sign in to ParkGrid <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
