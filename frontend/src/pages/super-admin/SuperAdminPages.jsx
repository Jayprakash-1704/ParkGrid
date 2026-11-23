import React, { useEffect, useState } from 'react';
import { Plus, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '../../services/api.js';
import {
  Button,
  Dialog,
  Input,
  Label,
  Panel,
  Select,
  Skeleton,
  StatusText,
} from '../../components/ui/primitives.jsx';
import {
  LotOccupancyList,
  RevenueBarChart,
} from '../../components/charts/AnalyticsCharts.jsx';
import { formatCurrency, getRoleLabel } from '../../lib/utils.js';

export function SuperAdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/analytics')
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const s = data?.summary || {};
  const u = data?.usersSummary || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Platform Command Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          System-wide metrics across all parking locations, user roles, and Cashfree settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Platform Gross Revenue</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(s.totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{s.totalBookings} total reservations</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Registered Users</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {u.totalUsers || 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {u.drivers} drivers · {u.attendants} attendants · {u.lotAdmins} lot admins
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Facilities</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {s.totalLots || 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {s.availableSlots}/{s.totalSlots} total bays open
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Global Occupancy</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {s.occupancyRate || 0}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {u.suspended || 0} suspended accounts
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel className="p-6 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-slate-900">
            7-Day Platform Revenue
          </h2>
          <div className="mt-4">
            <RevenueBarChart data={data?.dailyTrend || []} />
          </div>
        </Panel>
        <Panel className="p-6 lg:col-span-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            All Facilities Performance
          </h2>
          <div className="mt-4">
            <LotOccupancyList items={data?.revenueByLot || []} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ManageUsersPage({ onlyLotAdmins = false }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(onlyLotAdmins ? 'LOT_ADMIN' : 'ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Password123!',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (onlyLotAdmins) params.role = 'LOT_ADMIN';
      else if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search.trim()) params.q = search.trim();
      const res = await api.get('/users', { params });
      setUsers(res.data.data.users || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, onlyLotAdmins]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.patch(`/users/${user._id}`, { status: nextStatus });
      const updated = res.data.data.user;
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      toast.success(`Account ${updated.status.toLowerCase()}.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleCreateLotAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/lot-admins', newAdmin);
      toast.success('Lot Admin account created.');
      setModalOpen(false);
      setNewAdmin({ name: '', email: '', phone: '', password: 'Password123!' });
      await loadUsers();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {onlyLotAdmins ? 'Manage Parking Lot Admins' : 'Manage All Platform Users'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {onlyLotAdmins
              ? 'Onboard new facility operators or suspend/reactivate Lot Admin access.'
              : 'Audit user accounts across all four roles and control access state.'}
          </p>
        </div>
        {onlyLotAdmins && (
          <Button variant="emerald" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Lot Admin
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadUsers();
          }}
          className="flex gap-2 w-full sm:max-w-sm"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, plate..."
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {!onlyLotAdmins && (
          <div className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1">
            {['ALL', 'DRIVER', 'ATTENDANT', 'LOT_ADMIN', 'SUPER_ADMIN'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                  roleFilter === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : getRoleLabel(r)}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone / Plate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.name}</p>
                      <p className="font-mono text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {getRoleLabel(u.role)}
                      {u.assignedLot?.name && (
                        <p className="text-[11px] text-slate-500">{u.assignedLot.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {u.phone || '—'}
                      {u.vehicleNumber && (
                        <p className="text-[11px] text-slate-500">{u.vehicleNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={u.status === 'ACTIVE' ? 'outline' : 'emerald'}
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Parking Lot Admin"
        description="Creates a new LOT_ADMIN account capable of onboarding garages and staff."
      >
        <form onSubmit={handleCreateLotAdmin} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald">
              Create Lot Admin
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function ManageAllLocationsPage() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLots = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parking-lots', { params: { status: 'ALL' } });
      setLots(res.data.data.lots || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLots();
  }, []);

  const handleStatusChange = async (lotId, status) => {
    try {
      await api.patch(`/parking-lots/${lotId}`, { status });
      toast.success('Facility status updated.');
      await loadLots();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          All Platform Parking Locations
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor every onboarded facility, operator ownership, and live bay capacity.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Facility</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3 text-right">Hourly Rate</th>
                  <th className="px-4 py-3 text-right">Availability</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lots.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-500">
                        {l.address}, {l.city}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {l.owner?.name || '—'}
                      <p className="font-mono text-[11px] text-slate-400">
                        {l.owner?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {formatCurrency(l.hourlyRate)}/hr
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-emerald-700">
                      {l.availableSlots}/{l.totalSlots}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={l.status}
                        onChange={(e) => handleStatusChange(l._id, e.target.value)}
                        className="w-36 h-8 text-xs"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="INACTIVE">Inactive</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function SystemSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((res) => setSettings(res.data.data.settings))
      .catch((err) => toast.error(getApiErrorMessage(err)));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/admin/settings', {
        platformName: settings.platformName,
        cancellationCutoffHours: Number(settings.cancellationCutoffHours),
        entryGraceMinutes: Number(settings.entryGraceMinutes),
        platformFeePercent: Number(settings.platformFeePercent),
        allowNewRegistrations: Boolean(settings.allowNewRegistrations),
        maintenanceMode: Boolean(settings.maintenanceMode),
      });
      setSettings(res.data.data.settings);
      toast.success('System-wide settings saved.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <Skeleton className="h-80 max-w-2xl" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          System-Wide Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure global cancellation policy windows, gate QR grace periods, and service fees.
        </p>
      </div>

      <Panel className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Platform Brand Name</Label>
            <Input
              value={settings.platformName}
              onChange={(e) =>
                setSettings({ ...settings, platformName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Cancellation Cutoff (Hours)</Label>
              <Input
                type="number"
                min="0"
                max="48"
                value={settings.cancellationCutoffHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cancellationCutoffHours: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>QR Grace Window (Mins)</Label>
              <Input
                type="number"
                min="5"
                max="180"
                value={settings.entryGraceMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, entryGraceMinutes: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Platform Fee (%)</Label>
              <Input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={settings.platformFeePercent}
                onChange={(e) =>
                  setSettings({ ...settings, platformFeePercent: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4 text-sm">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Allow New Registrations</p>
                <p className="text-xs text-slate-500">
                  Enable public sign-ups for Drivers and Lot Admins.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.allowNewRegistrations)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowNewRegistrations: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Maintenance Mode</p>
                <p className="text-xs text-slate-500">
                  Flag platform maintenance window for operators.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.maintenanceMode)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenanceMode: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-emerald-600"
              />
            </label>
          </div>

          <Button type="submit" variant="emerald" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
