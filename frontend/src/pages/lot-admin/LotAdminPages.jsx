import React, { useEffect, useState } from 'react';
import {
  Building2,
  Download,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '../../services/api.js';
import {
  Button,
  Dialog,
  EmptyState,
  Input,
  Label,
  Panel,
  SafeImage,
  Select,
  Skeleton,
  StatusText,
  Textarea,
} from '../../components/ui/primitives.jsx';
import {
  LotOccupancyList,
  RevenueBarChart,
} from '../../components/charts/AnalyticsCharts.jsx';
import {
  exportRowsToCsv,
  formatCurrency,
  formatDateTime,
} from '../../lib/utils.js';

export function LotAdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/analytics')
      .then((res) => setAnalytics(res.data.data))
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

  const s = analytics?.summary || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Lot Operations Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Live bay occupancy, daily revenue performance, and facility reservation throughput.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Total Verified Revenue</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {formatCurrency(s.totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{s.totalBookings} total reservations</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Live Occupancy Rate</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-700">
            {s.occupancyRate || 0}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {s.availableSlots} of {s.totalSlots} bays open
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Active Reservations</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {s.activeReservations || 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Confirmed + currently parked</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-medium text-slate-500">Managed Facilities</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {s.totalLots || 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active connected garages</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel className="p-6 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-slate-900">
            7-Day Revenue Trend
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Hover bars to inspect daily settled earnings and booking volume.
          </p>
          <div className="mt-4">
            <RevenueBarChart data={analytics?.dailyTrend || []} />
          </div>
        </Panel>

        <Panel className="p-6 lg:col-span-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Facility Occupancy & Revenue
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Per-location bay utilization and verified totals.
          </p>
          <div className="mt-5">
            <LotOccupancyList items={analytics?.revenueByLot || []} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ManageLotsPage() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Floor configuration state
  const [floors, setFloors] = useState([
    {
      floorNumber: 0,
      floorName: 'Ground Floor',
      capacity: {
        car: 0,
        ev: 0,
        bike: 0,
      },
    },
  ]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: 'Indore',
    latitude: '',
    longitude: '',
    description: '',
    hourlyRate: '80',
    amenities: '24/7 CCTV, Covered Bays, EV Fast Charging',
    autoGenerateSlots: '8',
    status: 'ACTIVE',
    imageFile: null,
  });

  // Calculate total vehicle capacity
  const totalCapacity = floors.reduce(
    (total, floor) => ({
      car: total.car + floor.capacity.car,
      ev: total.ev + floor.capacity.ev,
      bike: total.bike + floor.capacity.bike,
    }),
    {
      car: 0,
      ev: 0,
      bike: 0,
    }
  );

  const grandTotal =
    totalCapacity.car +
    totalCapacity.ev +
    totalCapacity.bike;

  // Fetch parking lots
  const loadLots = async () => {
    setLoading(true);

    try {
      const res = await api.get('/parking-lots', {
        params: { mine: 'true' },
      });

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

  // Reset floor configuration
  const resetFloors = () => {
    setFloors([
      {
        floorNumber: 0,
        floorName: 'Ground Floor',
        capacity: {
          car: 0,
          ev: 0,
          bike: 0,
        },
      },
    ]);
  };

  // Open create modal
  const openCreate = () => {
    setEditingLot(null);

    setForm({
      name: '',
      address: '',
      city: 'Indore',
      latitude: '',
      longitude: '',
      description: '',
      hourlyRate: '80',
      amenities: '24/7 CCTV, Covered Bays, QR Express Gate',
      autoGenerateSlots: '8',
      status: 'ACTIVE',
      imageFile: null,
    });

    resetFloors();

    setModalOpen(true);
  };

  // Open edit modal
  const openEdit = (lot) => {
    setEditingLot(lot);

    setForm({
      name: lot.name || '',
      address: lot.address || '',
      city: lot.city || 'Indore',

      latitude:
        lot.location?.coordinates?.[1]?.toString() || '',

      longitude:
        lot.location?.coordinates?.[0]?.toString() || '',

      description: lot.description || '',
      hourlyRate: String(lot.hourlyRate),
      amenities: (lot.amenities || []).join(', '),
      autoGenerateSlots: '0',
      status: lot.status,
      imageFile: null,
    });

    setModalOpen(true);
  };

  // Add new floor
  const addFloor = () => {
    setFloors((prev) => [
      ...prev,
      {
        floorNumber: prev.length,
        floorName:
          prev.length === 1
            ? 'First Floor'
            : `${prev.length} Floor`,
        capacity: {
          car: 0,
          ev: 0,
          bike: 0,
        },
      },
    ]);
  };

  // Remove floor
  const removeFloor = (index) => {
    setFloors((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((floor, i) => ({
          ...floor,
          floorNumber: i,
        }))
    );
  };

  // Update floor name or capacity
  const updateFloor = (index, field, value) => {
    setFloors((prev) =>
      prev.map((floor, i) => {
        if (i !== index) return floor;

        if (field === 'floorName') {
          return {
            ...floor,
            floorName: value,
          };
        }

        return {
          ...floor,
          capacity: {
            ...floor.capacity,
            [field]: value === '' ? 0 : Number(value),
          },
        };
      })
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate coordinates
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      form.latitude.trim() === '' ||
      form.longitude.trim() === '' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      toast.error('Please enter valid latitude and longitude.');
      return;
    }

    // Validate floor configuration during creation
    if (!editingLot) {
      for (const floor of floors) {
        if (!floor.floorName.trim()) {
          toast.error('Please enter a name for every floor.');
          return;
        }

        const capacities = [
          floor.capacity.car,
          floor.capacity.ev,
          floor.capacity.bike,
        ];

        if (
          capacities.some(
            (value) =>
              !Number.isInteger(value) || value < 0
          )
        ) {
          toast.error('Floor capacities must be valid non-negative integers.');
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const fd = new FormData();

      fd.append('name', form.name);
      fd.append('address', form.address);
      fd.append('city', form.city);

      fd.append('description', form.description);
      fd.append('hourlyRate', form.hourlyRate);
      fd.append('amenities', form.amenities);
      fd.append('status', form.status);

      // GeoJSON location
      fd.append(
        'location',
        JSON.stringify({
          type: 'Point',
          coordinates: [
            longitude,
            latitude,
          ],
        })
      );

      // Floor-wise capacity configuration
      // Send only when at least one floor has configured capacity.
      // This preserves the old autoGenerateSlots-only workflow.

      if (
        !editingLot &&
        grandTotal > 0
      ) {
        fd.append(
          'floors',
          JSON.stringify(floors)
        );
      }

      // Keep existing Auto-Generate Initial Bays feature
      if (
        !editingLot &&
        Number(form.autoGenerateSlots) > 0
      ) {
        fd.append(
          'autoGenerateSlots',
          form.autoGenerateSlots
        );
      }

      // Upload image if selected
      if (form.imageFile) {
        fd.append('image', form.imageFile);
      }

      if (editingLot) {
        await api.patch(
          `/parking-lots/${editingLot._id}`,
          fd,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        toast.success('Parking facility updated.');
      } else {
        await api.post(
          '/parking-lots',
          fd,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        toast.success('Parking facility created.');
      }

      setModalOpen(false);

      await loadLots();

    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete parking lot
  const handleDelete = async (lotId) => {
    try {
      await api.delete(`/parking-lots/${lotId}`);

      toast.success('Parking facility deleted.');

      setLots((prev) =>
        prev.filter((l) => l._id !== lotId)
      );

    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Manage Parking Lots
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Configure facility details, hourly pricing,
            floor capacities and operating status.
          </p>
        </div>

        <Button variant="emerald" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Parking Facility
        </Button>

      </div>

      {/* Parking Lots */}
      {loading ? (

        <Skeleton className="h-64" />

      ) : lots.length === 0 ? (

        <EmptyState
          icon={Building2}
          title="No parking facilities yet"
          description="Add your first parking lot and auto-generate bays to begin accepting reservations."
          action={
            <Button variant="emerald" onClick={openCreate}>
              Add Parking Facility
            </Button>
          }
        />

      ) : (

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          {lots.map((lot) => (

            <Panel
              key={lot._id}
              className="overflow-hidden flex flex-col justify-between"
            >

              <div>

                <div className="aspect-[16/10] bg-slate-100 border-b border-slate-100">

                  <SafeImage
                    src={lot.images?.[0]}
                    alt={lot.name}
                    fallbackTitle={lot.name}
                    className="h-full w-full object-cover"
                  />

                </div>

                <div className="p-5 space-y-3">

                  <div className="flex items-start justify-between gap-2">

                    <h2 className="font-display text-base font-semibold text-slate-900">
                      {lot.name}
                    </h2>

                    <StatusText status={lot.status} />

                  </div>

                  <p className="text-xs text-slate-500">
                    {lot.address}, {lot.city}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs font-mono tabular-nums">

                    <span className="text-emerald-700 font-semibold">
                      {lot.availableSlots}/{lot.totalSlots} open
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatCurrency(lot.hourlyRate)}/hr
                    </span>

                  </div>

                  {/* Floor Summary */}
                  {lot.floors?.length > 0 && (

                    <div className="border-t border-slate-100 pt-3 space-y-2">

                      <div className="flex justify-between text-xs">

                        <span className="text-slate-500">
                          Total Floors
                        </span>

                        <span className="font-semibold text-slate-800">
                          {lot.floors.length}
                        </span>

                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">

                        {['car', 'ev', 'bike'].map((type) => {

                          const count = lot.floors.reduce(
                            (total, floor) =>
                              total + (floor.capacity?.[type] || 0),
                            0
                          );

                          return (
                            <div
                              key={type}
                              className="rounded-lg bg-slate-50 p-2 text-center"
                            >
                              <p className="font-semibold text-slate-800">
                                {count}
                              </p>

                              <p className="text-slate-500 capitalize">
                                {type}
                              </p>
                            </div>
                          );
                        })}

                      </div>

                    </div>

                  )}

                </div>

              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2">

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(lot)}
                >
                  Edit Facility
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDelete(lot._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>

              </div>

            </Panel>

          ))}

        </div>

      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingLot
            ? 'Edit Parking Facility'
            : 'Create Parking Facility'
        }
        description="Configure facility details, location, floor capacities and parking slots."
      >

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Facility Name */}
          <div className="space-y-1.5">

            <Label>Facility Name</Label>

            <Input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />

          </div>

          {/* City and Hourly Rate */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-1.5">

              <Label>City</Label>

              <Input
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
                required
              />

            </div>

            <div className="space-y-1.5">

              <Label>Base Hourly Rate (₹)</Label>

              <Input
                type="number"
                min="1"
                value={form.hourlyRate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hourlyRate: e.target.value,
                  })
                }
                required
              />

            </div>

          </div>

          {/* Street Address */}
          <div className="space-y-1.5">

            <Label>Street Address</Label>

            <Input
              placeholder="Enter complete street address"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
              required
            />

          </div>

          {/* Latitude and Longitude */}
          <div className="space-y-2">

            <div>
              <Label>Parking Location Coordinates</Label>

              <p className="text-xs text-slate-500 mt-1">
                Enter the exact geographical coordinates
                of your parking facility.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Latitude */}
              <div className="space-y-1.5">

                <Label>Latitude</Label>

                <Input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g. 22.7196"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      latitude: e.target.value,
                    })
                  }
                  required
                />

                <p className="text-xs text-slate-400">
                  Range: -90 to 90
                </p>

              </div>

              {/* Longitude */}
              <div className="space-y-1.5">

                <Label>Longitude</Label>

                <Input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g. 75.8577"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      longitude: e.target.value,
                    })
                  }
                  required
                />

                <p className="text-xs text-slate-400">
                  Range: -180 to 180
                </p>

              </div>

            </div>

          </div>

          {/* Description */}
          <div className="space-y-1.5">

            <Label>Description</Label>

            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

          </div>

          {/* Amenities */}
          <div className="space-y-1.5">

            <Label>Amenities (comma-separated)</Label>

            <Input
              value={form.amenities}
              onChange={(e) =>
                setForm({
                  ...form,
                  amenities: e.target.value,
                })
              }
            />

          </div>

          {/* Floor Configuration */}
          {!editingLot && (

            <div className="space-y-4 rounded-xl border border-slate-200 p-4">

              {/* Header */}
              <div className="flex items-center justify-between gap-3">

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Floor Configuration
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Configure vehicle capacity for each floor.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="emerald"
                  size="sm"
                  onClick={addFloor}
                >
                  <Plus className="h-4 w-4" />
                  Add Floor
                </Button>

              </div>

              {/* Floor Cards */}
              <div className="space-y-4">

                {floors.map((floor, index) => (

                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4"
                  >

                    {/* Floor Header */}
                    <div className="flex items-center justify-between gap-3">

                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
                          {index + 1}
                        </div>

                        <span className="font-semibold text-sm text-slate-800">
                          Floor {index + 1}
                        </span>

                      </div>

                      {floors.length > 1 && (

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => removeFloor(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>

                      )}

                    </div>

                    {/* Floor Name */}
                    <div className="space-y-1.5">

                      <Label>Floor Name</Label>

                      <Input
                        placeholder="e.g. Ground Floor"
                        value={floor.floorName}
                        onChange={(e) =>
                          updateFloor(
                            index,
                            'floorName',
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                    {/* Vehicle Capacity */}
                    <div className="space-y-2">

                      <Label>Vehicle Parking Capacity</Label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                        {/* Car */}
                        <div className="rounded-lg border bg-white p-3 space-y-2">

                          <div className="flex items-center justify-between">

                            <span className="text-sm font-medium text-slate-800">
                              Car
                            </span>

                            <span className="text-xs text-slate-400">
                              CAR
                            </span>

                          </div>

                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={floor.capacity.car}
                            onChange={(e) =>
                              updateFloor(
                                index,
                                'car',
                                e.target.value
                              )
                            }
                            required
                          />

                          <p className="text-xs text-slate-400">
                            Number of car slots
                          </p>

                        </div>

                        {/* EV */}
                        <div className="rounded-lg border bg-white p-3 space-y-2">

                          <div className="flex items-center justify-between">

                            <span className="text-sm font-medium text-slate-800">
                              EV
                            </span>

                            <span className="text-xs text-slate-400">
                              ELECTRIC
                            </span>

                          </div>

                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={floor.capacity.ev}
                            onChange={(e) =>
                              updateFloor(
                                index,
                                'ev',
                                e.target.value
                              )
                            }
                            required
                          />

                          <p className="text-xs text-slate-400">
                            Number of EV slots
                          </p>

                        </div>

                        {/* Bike */}
                        <div className="rounded-lg border bg-white p-3 space-y-2">

                          <div className="flex items-center justify-between">

                            <span className="text-sm font-medium text-slate-800">
                              Bike
                            </span>

                            <span className="text-xs text-slate-400">
                              BIKE
                            </span>

                          </div>

                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={floor.capacity.bike}
                            onChange={(e) =>
                              updateFloor(
                                index,
                                'bike',
                                e.target.value
                              )
                            }
                            required
                          />

                          <p className="text-xs text-slate-400">
                            Number of bike slots
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* Individual Floor Total */}
                    <div className="flex justify-between border-t border-slate-200 pt-3 text-sm">

                      <span className="text-slate-500">
                        Floor Capacity
                      </span>

                      <span className="font-semibold text-emerald-700">
                        {floor.capacity.car +
                          floor.capacity.ev +
                          floor.capacity.bike}{' '}
                        Slots
                      </span>

                    </div>

                  </div>

                ))}

              </div>

              {/* Overall Capacity Summary */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-3">

                <div className="flex items-center justify-between">

                  <h4 className="font-semibold text-emerald-900 text-sm">
                    Total Parking Capacity
                  </h4>

                  <span className="text-lg font-bold text-emerald-700">
                    {grandTotal} Slots
                  </span>

                </div>

                <div className="grid grid-cols-3 gap-3">

                  <div className="bg-white rounded-lg p-3 text-center">

                    <p className="text-lg font-bold text-slate-900">
                      {totalCapacity.car}
                    </p>

                    <p className="text-xs text-slate-500">
                      Cars
                    </p>

                  </div>

                  <div className="bg-white rounded-lg p-3 text-center">

                    <p className="text-lg font-bold text-slate-900">
                      {totalCapacity.ev}
                    </p>

                    <p className="text-xs text-slate-500">
                      EVs
                    </p>

                  </div>

                  <div className="bg-white rounded-lg p-3 text-center">

                    <p className="text-lg font-bold text-slate-900">
                      {totalCapacity.bike}
                    </p>

                    <p className="text-xs text-slate-500">
                      Bikes
                    </p>

                  </div>

                </div>

                <p className="text-xs text-emerald-700">
                  {floors.length} floor(s) configured.
                  Capacity is calculated automatically.
                </p>

              </div>

            </div>

          )}

          {/* Slots and Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {!editingLot && (

              <div className="space-y-1.5">

                <Label>Auto-Generate Initial Bays</Label>

                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={form.autoGenerateSlots}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      autoGenerateSlots: e.target.value,
                    })
                  }
                />

                <p className="text-xs text-slate-400">
                  Legacy automatic slot generation.
                </p>

              </div>

            )}

            <div className="space-y-1.5">

              <Label>Status</Label>

              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
              >

                <option value="ACTIVE">Active</option>

                <option value="MAINTENANCE">
                  Maintenance
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

              </Select>

            </div>

          </div>

          {/* Facility Image */}
          <div className="space-y-1.5">

            <Label>Facility Photo (Cloudinary / Upload)</Label>

            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({
                  ...form,
                  imageFile: e.target.files?.[0] || null,
                })
              }
            />

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">

            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="emerald"
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : editingLot
                  ? 'Save Changes'
                  : 'Create Facility'}
            </Button>

          </div>

        </form>

      </Dialog>

    </div>
  );
}

export function ManageSlotsPage() {
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    slotNumber: '',
    floor: 'Level 1',
    zone: 'Zone A',
    slotType: 'STANDARD',
    hourlyRateOverride: '',
  });

  useEffect(() => {
    api
      .get('/parking-lots', { params: { mine: 'true' } })
      .then((res) => {
        const list = res.data.data.lots || [];
        setLots(list);
        if (list[0]) setSelectedLotId(list[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadSlots = async (lotId) => {
    if (!lotId) return;
    try {
      const res = await api.get('/parking-slots', { params: { parkingLotId: lotId } });
      setSlots(res.data.data.slots || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    if (selectedLotId) loadSlots(selectedLotId);
  }, [selectedLotId]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parking-slots', {
        parkingLot: selectedLotId,
        ...newSlot,
        hourlyRateOverride: newSlot.hourlyRateOverride || null,
      });
      toast.success(`Slot ${newSlot.slotNumber} added.`);
      setModalOpen(false);
      setNewSlot({
        slotNumber: '',
        floor: 'Level 1',
        zone: 'Zone A',
        slotType: 'STANDARD',
        hourlyRateOverride: '',
      });
      await loadSlots(selectedLotId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleStatusChange = async (slotId, status) => {
    try {
      await api.patch(`/parking-slots/${slotId}`, { status });
      toast.success('Slot status updated.');
      await loadSlots(selectedLotId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await api.delete(`/parking-slots/${slotId}`);
      toast.success('Slot deleted.');
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Manage Parking Slots
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add bays, configure EV/Accessible pricing overrides, and manage maintenance state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            className="w-60"
          >
            {lots.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Button
            variant="emerald"
            disabled={!selectedLotId}
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Slot
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Bay Code</th>
                  <th className="px-4 py-3">Level / Zone</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Rate Override</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {slots.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-slate-900">
                      {s.slotNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {s.floor} · {s.zone}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {s.slotType}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {s.hourlyRateOverride
                        ? `${formatCurrency(s.hourlyRateOverride)}/hr`
                        : 'Base Rate'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {['AVAILABLE', 'MAINTENANCE'].includes(s.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusChange(
                                s._id,
                                s.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
                              )
                            }
                          >
                            {s.status === 'MAINTENANCE' ? 'Set Available' : 'Maintenance'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteSlot(s._id)}
                        >
                          Delete
                        </Button>
                      </div>
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
        title="Add Parking Bay"
        description="Define slot identifier, floor level, bay category, and optional hourly rate override."
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bay Number</Label>
              <Input
                placeholder="D-01"
                value={newSlot.slotNumber}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, slotNumber: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bay Type</Label>
              <Select
                value={newSlot.slotType}
                onChange={(e) => setNewSlot({ ...newSlot, slotType: e.target.value })}
              >
                <option value="STANDARD">Standard</option>
                <option value="EV">EV Charging</option>
                <option value="COMPACT">Compact</option>
                <option value="ACCESSIBLE">Accessible</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Floor / Level</Label>
              <Input
                value={newSlot.floor}
                onChange={(e) => setNewSlot({ ...newSlot, floor: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <Input
                value={newSlot.zone}
                onChange={(e) => setNewSlot({ ...newSlot, zone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hourly Rate Override (₹ — leave blank for lot base rate)</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 120"
              value={newSlot.hourlyRateOverride}
              onChange={(e) =>
                setNewSlot({ ...newSlot, hourlyRateOverride: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald">
              Create Bay
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function ManageAttendantsPage() {
  const [attendants, setAttendants] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Password123!',
    assignedLot: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, lotRes] = await Promise.all([
        api.get('/attendants'),
        api.get('/parking-lots', { params: { mine: 'true' } }),
      ]);
      setAttendants(attRes.data.data.attendants || []);
      setLots(lotRes.data.data.lots || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendants', form);
      toast.success('Attendant account created.');
      setModalOpen(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        password: 'Password123!',
        assignedLot: '',
      });
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleAssign = async (attendantId, lotId) => {
    try {
      await api.patch(`/attendants/${attendantId}/assign`, {
        assignedLot: lotId || null,
      });
      toast.success('Facility assignment updated.');
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Manage Gate Attendants
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Onboard gate attendants and assign them to specific parking locations.
          </p>
        </div>
        <Button variant="emerald" onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Attendant
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Attendant</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Facility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendants.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{a.name}</p>
                      <p className="font-mono text-xs text-slate-500">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {a.phone || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={a.assignedLot?._id || ''}
                        onChange={(e) => handleAssign(a._id, e.target.value)}
                        className="max-w-xs"
                      >
                        <option value="">Unassigned</option>
                        {lots.map((l) => (
                          <option key={l._id} value={l._id}>
                            {l.name}
                          </option>
                        ))}
                      </Select>
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
        title="Add Gate Attendant"
        description="Creates an ATTENDANT account with gate QR scanner permissions."
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Password</Label>
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to Parking Lot</Label>
            <Select
              value={form.assignedLot}
              onChange={(e) => setForm({ ...form, assignedLot: e.target.value })}
            >
              <option value="">Assign Later</option>
              {lots.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald">
              Create Attendant
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function LotReservationsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setBookings(res.data.data.bookings || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = bookings.filter((b) => (filter === 'ALL' ? true : b.status === filter));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Facility Reservations
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Real-time reservation stream across all managed parking locations.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        {['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
              filter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Facility & Bay</th>
                  <th className="px-4 py-3">Entry / Exit</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                      {b.bookingCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{b.driver?.name}</p>
                      <p className="font-mono text-xs text-slate-500">{b.vehicleNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{b.parkingLot?.name}</p>
                      <p className="font-mono text-xs text-slate-500">
                        Bay {b.parkingSlot?.slotNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-600">
                      <p>In: {formatDateTime(b.entryTime)}</p>
                      <p>Out: {formatDateTime(b.exitTime)}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                      {formatCurrency(b.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={b.status} />
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

export function LotReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics'), api.get('/qr/history')])
      .then(([anRes, logRes]) => {
        setAnalytics(anRes.data.data);
        setLogs(logRes.data.data.logs || []);
      })
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = () => {
    const headers = [
      'Booking Code',
      'Facility',
      'Bay',
      'Driver',
      'Vehicle',
      'Status',
      'Payment Status',
      'Amount (INR)',
      'Entry Time',
      'Exit Time',
    ];
    const rows = (analytics?.recentBookings || []).map((b) => [
      b.bookingCode,
      b.parkingLot?.name,
      b.parkingSlot?.slotNumber,
      b.driver?.name,
      b.vehicleNumber,
      b.status,
      b.payment?.status,
      b.totalAmount,
      b.entryTime || '',
      b.exitTime || '',
    ]);
    exportRowsToCsv('parkgrid-lot-report.csv', headers, rows);
    toast.success('CSV report downloaded.');
  };

  if (loading) return <Skeleton className="h-80" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Revenue & Gate Audit Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Export financial settlements and audited entry/exit logs for accounting.
          </p>
        </div>
        <Button variant="default" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          Download CSV Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel className="p-6 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Daily Settled Revenue
          </h2>
          <div className="mt-4">
            <RevenueBarChart data={analytics?.dailyTrend || []} />
          </div>
        </Panel>
        <Panel className="p-6 lg:col-span-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Revenue Breakdown by Facility
          </h2>
          <div className="mt-4">
            <LotOccupancyList items={analytics?.revenueByLot || []} />
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent Verified Gate Movements
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Facility & Bay</th>
                <th className="px-4 py-3">Entry Time</th>
                <th className="px-4 py-3">Exit Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                    {l.bookingCode} · {l.vehicleNumber}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {l.parkingLot?.name} · Bay {l.parkingSlot?.slotNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-600">
                    {formatDateTime(l.entryTime)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-600">
                    {formatDateTime(l.exitTime)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusText status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
