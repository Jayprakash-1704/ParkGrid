import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  clearAuthError,
  loginUserThunk,
  registerUserThunk,
} from '../../store/slices/authSlice.js';
import { Button, Input, Label, Panel, Select } from '../../components/ui/primitives.jsx';
import { getRoleHomePath } from '../../lib/utils.js';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  vehicleNumber: z.string().optional(),
  role: z.enum(['DRIVER', 'LOT_ADMIN']),
});

const DEMO_ACCOUNTS = [
  {
    role: 'Driver',
    email: 'driver@parkgrid.app',
    password: 'Password123!',
    note: 'Book bays, Cashfree pay, view QR pass',
  },
  {
    role: 'Gate Attendant',
    email: 'attendant@parkgrid.app',
    password: 'Password123!',
    note: 'Scan QR passes, log entry & exit',
  },
  {
    role: 'Lot Admin',
    email: 'lotadmin@parkgrid.app',
    password: 'Password123!',
    note: 'Manage lots, bays, staff & revenue',
  },
  {
    role: 'Super Admin',
    email: 'superadmin@parkgrid.app',
    password: 'Password123!',
    note: 'Users, platform analytics & settings',
  },
];

const logo = '/assets/images/logo.png';

// import parkGridGif from './public/assets/images/parkgrid-login.gif';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (values) => {
    const res = await dispatch(loginUserThunk(values));
    if (loginUserThunk.fulfilled.match(res)) {
      toast.success(`Welcome back, ${res.payload.name}.`);
      navigate(getRoleHomePath(res.payload.role), { replace: true });
    } else if (res.payload) {
      toast.error(res.payload);
    }
  };

  // const handleQuickDemoLogin = async (acct) => {
  //   setValue('email', acct.email);
  //   setValue('password', acct.password);
  //   await onSubmit({ email: acct.email, password: acct.password });
  // };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      {/* <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start"> */}
      <Panel className="p-6 sm:p-8 lg:col-span-6">
        <div className="mb-7 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2  border-[#24734c]/30 bg-[#24734c]/5">
            
            <img src={logo} alt="ParkGrid Logo" className="h-14 w-14 object-contain" />
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Sign in to ParkGrid
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Access your Driver, Attendant, Lot Admin, or Super Admin dashboard.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email Address</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="driver@parkgrid.app"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" variant="emerald" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to ParkGrid?{' '}
          <Link to="/register" className="font-medium text-emerald-700 hover:underline">
            Create an account
          </Link>
        </p>
      </Panel>

      {/* <Panel className="p-6 sm:p-8 lg:col-span-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Quick Demo Role Access
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select any pre-seeded role below to immediately sign in and inspect its dashboard.
          </p>

          <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
            {DEMO_ACCOUNTS.map((acct) => (
              <div
                key={acct.email}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{acct.role}</p>
                  <p className="font-mono text-xs text-slate-500 truncate">{acct.email}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{acct.note}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleQuickDemoLogin(acct)}
                >
                  Use Role
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            All seeded accounts use password <code className="font-mono text-slate-700">Password123!</code>
          </p>
        </Panel> */}
      {/* </div> */}
    </div>
  );
}

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      vehicleNumber: '',
      role: 'DRIVER',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (values) => {
    const res = await dispatch(registerUserThunk(values));
    if (registerUserThunk.fulfilled.match(res)) {
      toast.success('Account created successfully.');
      navigate(getRoleHomePath(res.payload.role), { replace: true });
    } else if (res.payload) {
      toast.error(res.payload);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Panel className="p-6 sm:p-8">
        <div className="mb-7 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2  border-[#24734c]/30 bg-[#24734c]/5">
            
            <img src={logo} alt="ParkGrid Logo" className="h-14 w-14 object-contain" />
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Create your ParkGrid account
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Register as a Driver to reserve bays or as a Lot Admin to onboard facilities.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-role">Account Type</Label>
            <Select id="reg-role" {...register('role')}>
              <option value="DRIVER">Driver (Search & Reserve Parking)</option>
              <option value="LOT_ADMIN">Lot Admin (Operate Parking Facilities)</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Full Name</Label>
            <Input id="reg-name" placeholder="Ananya Verma" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email Address</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="ananya@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Phone Number</Label>
              <Input id="reg-phone" placeholder="+91 98450 00000" {...register('phone')} />
            </div>
            {selectedRole === 'DRIVER' && (
              <div className="space-y-1.5">
                <Label htmlFor="reg-vehicle">Vehicle Plate</Label>
                <Input
                  id="reg-vehicle"
                  placeholder="KA-01-AB-1234"
                  {...register('vehicleNumber')}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="Minimum 6 characters"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" variant="emerald" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Panel>
    </div>
  );
}
