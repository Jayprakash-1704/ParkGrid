import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'INR') {
  const value = Number(amount || 0);
  if (currency === 'INR') {
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRoleHomePath(role) {
  switch (role) {
    case 'DRIVER':
      return '/driver';
    case 'ATTENDANT':
      return '/attendant';
    case 'LOT_ADMIN':
      return '/lot-admin';
    case 'SUPER_ADMIN':
      return '/super-admin';
    default:
      return '/';
  }
}

export function getRoleLabel(role) {
  switch (role) {
    case 'DRIVER':
      return 'Driver';
    case 'ATTENDANT':
      return 'Gate Attendant';
    case 'LOT_ADMIN':
      return 'Lot Admin';
    case 'SUPER_ADMIN':
      return 'Super Admin';
    default:
      return role || 'Guest';
  }
}

export function exportRowsToCsv(filename, headers, rows) {
  const escapeCell = (cell) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
