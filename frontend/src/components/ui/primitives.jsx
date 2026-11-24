import React, { useState } from 'react';
import { cva } from 'class-variance-authority';
import { Building2, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800',
        emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
        outline:
          'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3.5 text-xs',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export const Input = React.forwardRef(function Input(
  { className, type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({ className, ...props }) {
  return (
    <label
      className={cn('text-sm font-medium text-slate-700 leading-none', className)}
      {...props}
    />
  );
}

export function Panel({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-green-700 bg-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Dialog({ open, onClose, title, description, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-slate-900">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Zero-Pill semantic status text (clean color-coded typography, never garish pill enclosures)
const STATUS_STYLES = {
  AVAILABLE: 'text-emerald-700',
  ACTIVE: 'text-emerald-700',
  CONFIRMED: 'text-emerald-700',
  PAID: 'text-emerald-700',
  COMPLETED: 'text-slate-700',
  RESERVED: 'text-amber-700',
  PENDING: 'text-amber-700',
  PENDING_PAYMENT: 'text-amber-700',
  MAINTENANCE: 'text-amber-700',
  OCCUPIED: 'text-red-700',
  CANCELLED: 'text-red-700',
  FAILED: 'text-red-700',
  SUSPENDED: 'text-red-700',
  EXPIRED: 'text-slate-500',
  REFUNDED: 'text-slate-600',
  INACTIVE: 'text-slate-500',
};

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  ACTIVE: 'Active',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  COMPLETED: 'Completed',
  RESERVED: 'Reserved',
  PENDING: 'Pending',
  PENDING_PAYMENT: 'Awaiting Payment',
  MAINTENANCE: 'Maintenance',
  OCCUPIED: 'Occupied',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  SUSPENDED: 'Suspended',
  EXPIRED: 'Expired',
  REFUNDED: 'Refunded',
  INACTIVE: 'Inactive',
};

export function StatusText({ status, className }) {
  const key = String(status || '').toUpperCase();
  return (
    <span
      className={cn(
        'text-xs font-semibold tracking-tight whitespace-nowrap',
        STATUS_STYLES[key] || 'text-slate-600',
        className
      )}
    >
      {STATUS_LABELS[key] || status}
    </span>
  );
}

export function SafeImage({ src, alt, className, fallbackTitle }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500',
          className
        )}
      >
        <Building2 className="h-8 w-8 text-slate-400" />
        {fallbackTitle && (
          <span className="mt-2 px-3 text-center text-xs font-medium text-slate-600">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
