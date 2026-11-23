import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Clock3,
  ArrowUpRight,
  Map,
} from 'lucide-react';

import { fetchParkingLotsThunk } from '../../store/slices/parkingSlice.js';

import {
  Button,
  EmptyState,
  Input,
  Panel,
  SafeImage,
  Select,
  Skeleton,
} from '../../components/ui/primitives.jsx';

import { formatCurrency } from '../../lib/utils.js';

export function FindParkingPage({ publicMode = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { lots, loading } = useSelector((state) => state.parking);
  const { user } = useSelector((state) => state.auth);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [slotType, setSlotType] = useState('ALL');
  const [maxRate, setMaxRate] = useState('');

  const runSearch = (overrides = {}) => {
    const qVal = overrides.q !== undefined ? overrides.q : query;
    const typeVal =
      overrides.slotType !== undefined ? overrides.slotType : slotType;
    const rateVal =
      overrides.maxRate !== undefined ? overrides.maxRate : maxRate;

    const params = {};

    if (qVal.trim()) params.q = qVal.trim();
    if (typeVal && typeVal !== 'ALL') params.slotType = typeVal;
    if (rateVal) params.maxRate = rateVal;

    dispatch(fetchParkingLotsThunk(params));
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    } else {
      setSearchParams({});
    }

    runSearch();
  };

  const detailPrefix =
    !publicMode && user?.role === 'DRIVER'
      ? '/driver/parking'
      : '/parking';

  return (
    <div
      className={
        publicMode
          ? 'mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8'
          : 'space-y-8'
      }
    >
      {/* Page Heading */}
      <div className="flex flex-col gap-4 border-b border-[#deded8] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#24734c]">
            <span className="h-2 w-2 rounded-full bg-[#24734c]" />
            Parking discovery
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#202923] sm:text-4xl">
            Find Nearby Parking
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737a74]">
            Compare parking facilities, check available bays, and find a
            convenient place to park your vehicle.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#737a74]">
          <Button className='bg-[#24734c]'>
            <MapPin/>
            Get lots near me
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Panel className="overflow-hidden border border-[#deded8] bg-white shadow-none">
        <div className="flex items-center justify-between border-b border-[#e9e9e3] px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#24734c]" />
            <h2 className="text-sm font-semibold text-[#202923]">
              Search & Filters
            </h2>
          </div>

          <span className="text-xs text-[#858b85]">
            Refine your search
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 p-5 md:grid-cols-12 md:items-end"
        >
          {/* Search */}
          <div className="md:col-span-5">
            <label className="mb-2 block text-xs font-semibold text-[#4b554d]">
              Location or facility
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#929a92]" />

              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search garage name, road, or city..."
                className="h-11 border-[#deded8] bg-[#fbfaf7] pl-10 text-sm shadow-none placeholder:text-[#a1a69f] focus:border-[#24734c] focus:ring-[#24734c]/10"
              />
            </div>
          </div>

          {/* Slot Type */}
          <div className="md:col-span-3">
            <label className="mb-2 block text-xs font-semibold text-[#4b554d]">
              Bay type
            </label>

            <Select
              value={slotType}
              onChange={(e) => {
                setSlotType(e.target.value);
                runSearch({ slotType: e.target.value });
              }}
              className="h-11 border-[#deded8] bg-[#fbfaf7] text-sm shadow-none focus:border-[#24734c]"
            >
              <option value="ALL">All Bay Types</option>
              <option value="CAR">Car Bays</option>
              <option value="EV">EV Charging Bays</option>
              <option value="BIKE">Bike Bays</option>
            </Select>
          </div>

          {/* Maximum Rate */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold text-[#4b554d]">
              Maximum rate
            </label>

            <Input
              type="number"
              min="10"
              placeholder="Max ₹/hr"
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              className="h-11 border-[#deded8] bg-[#fbfaf7] text-sm shadow-none placeholder:text-[#a1a69f] focus:border-[#24734c] focus:ring-[#24734c]/10"
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <Button
              type="submit"
              variant="emerald"
              className="h-11 w-full bg-[#24734c] font-semibold text-white shadow-none transition-colors hover:bg-[#1c5c3c]"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </form>
      </Panel>

      {/* Results Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#202923]">
            Available Facilities
          </h2>

          <p className="mt-1 text-xs text-[#858b85]">
            Select a facility to view its parking bays and details.
          </p>
        </div>

        {!loading && lots.length > 0 && (
          <span className="inline-flex w-fit items-center gap-2 border border-[#dce7df] bg-[#edf4ef] px-3 py-2 text-xs font-semibold text-[#24734c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#24734c]" />
            {lots.length} facilities found
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-80" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        /* Empty State */
        <Panel className="border border-[#deded8] bg-white py-12 shadow-none">
          <EmptyState
            icon={SlidersHorizontal}
            title="No matching parking facilities"
            description="Try clearing your price limit or searching a broader neighborhood."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setSlotType('ALL');
                  setMaxRate('');
                  setSearchParams({});
                  dispatch(fetchParkingLotsThunk());
                }}
                className="border-[#24734c] text-[#24734c] hover:bg-[#edf4ef]"
              >
                Reset Filters
              </Button>
            }
          />
        </Panel>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <Link
              key={lot._id}
              to={`${detailPrefix}/${lot._id}`}
              className="group block"
            >
              <Panel className="flex h-full flex-col justify-between overflow-hidden border border-[#deded8] bg-white shadow-none transition-all duration-200 hover:-translate-y-1 hover:border-[#24734c]/50 hover:shadow-[0_8px_24px_rgba(32,41,35,0.07)]">
                <div>
                  {/* Facility Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#e9e9e3] bg-[#f0f0eb]">
                    <SafeImage
                      src={lot.images?.[0]}
                      alt={lot.name}
                      fallbackTitle={lot.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />

                    <div className="absolute left-3 top-3 border border-white/60 bg-[#202923]/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Parking facility
                    </div>
                  </div>

                  {/* Facility Information */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold leading-snug text-[#202923] transition-colors group-hover:text-[#24734c]">
                        {lot.name}
                      </h3>

                      <div className="shrink-0 text-right">
                        <p className="font-mono text-base font-semibold tabular-nums text-[#202923]">
                          {formatCurrency(lot.hourlyRate)}
                        </p>
                        <p className="text-[10px] text-[#858b85]">
                          per hour
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs text-[#737a74]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#24734c]" />

                      <span className="truncate">
                        {lot.address}, {lot.city}
                      </span>
                    </p>

                    <p className="mt-4 line-clamp-2 min-h-9 text-xs leading-5 text-[#737a74]">
                      {lot.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(lot.amenities || []).slice(0, 3).map((amenity, index) => (
                        <span
                          key={`${amenity}-${index}`}
                          className="border border-[#e5e7e1] bg-[#f8f8f4] px-2.5 py-1 text-[10px] font-medium text-[#626c64]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Facility Footer */}
                <div className="border-t border-[#e9e9e3] bg-[#fbfaf7] px-5 py-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p
                        className={`font-mono text-sm font-semibold tabular-nums ${
                          lot.availableSlots > 0
                            ? 'text-[#24734c]'
                            : 'text-red-700'
                        }`}
                      >
                        {lot.availableSlots}/{lot.totalSlots} available
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#858b85]">
                        Parking bays
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#737a74]">
                      <Clock3 className="h-3.5 w-3.5 text-[#929a92]" />

                      {lot.operatingHours?.is24x7
                        ? '24/7'
                        : `${lot.operatingHours?.open}–${lot.operatingHours?.close}`}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`${detailPrefix}/${lot._id}`)}
                    className="h-10 w-full justify-between bg-[#24734c] px-4 text-xs font-semibold text-white shadow-none transition-colors hover:bg-[#1c5c3c]"
                  >
                    Select Bay
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}