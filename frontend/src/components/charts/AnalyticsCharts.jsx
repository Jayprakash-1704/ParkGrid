import React, { useState } from 'react';
import { formatCurrency } from '../../lib/utils.js';

export function RevenueBarChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);
  const maxRevenue = Math.max(...data.map((d) => d.revenue || 0), 100);

  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        No daily revenue data available yet.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-2 sm:gap-4 h-56 pt-6">
        {data.map((item, idx) => {
          const heightPct = Math.max(4, Math.round(((item.revenue || 0) / maxRevenue) * 100));
          const isHovered = hovered === idx;
          return (
            <div
              key={item.date}
              className="relative flex flex-1 flex-col items-center h-full justify-end group"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <div className="absolute -top-2 z-10 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-md">
                  <p className="font-mono tabular-nums font-semibold">
                    {formatCurrency(item.revenue)}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {item.bookings} reservation{item.bookings === 1 ? '' : 's'}
                  </p>
                </div>
              )}
              <div className="w-full max-w-[44px] flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-md transition-colors duration-150 ${
                    isHovered ? 'bg-emerald-600' : 'bg-slate-900/85'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="mt-2.5 text-[11px] font-medium text-slate-500 whitespace-nowrap">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LotOccupancyList({ items = [] }) {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No parking locations configured yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((lot) => (
        <div key={lot.lotId || lot._id} className="space-y-1.5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{lot.name}</p>
              <p className="text-xs text-slate-500">
                {lot.city} · {lot.occupiedOrReserved}/{lot.totalSlots} active bays
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                {formatCurrency(lot.revenue)}
              </p>
              <p className="font-mono text-xs tabular-nums text-slate-500">
                {lot.occupancyPercent}% occupied
              </p>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${Math.min(100, lot.occupancyPercent || 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
