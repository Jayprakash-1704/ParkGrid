import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '../../services/api.js';
import { Button, Input, Label, Panel, Textarea } from '../../components/ui/primitives.jsx';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-emerald-700">About ParkGrid</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Predictable parking infrastructure built on real-time state and cryptographic access.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Urban drivers waste thousands of hours circling garages without reliable occupancy
          data, while facility operators lose revenue to unverified paper tickets and gate
          bottlenecks. ParkGrid unifies slot discovery, verified Cashfree payments, and
          instant QR verification into one MERN platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel className="p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Zero-Trust Gate Verification
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Every QR pass encodes a unique 256-bit random token issued strictly by the server
            after payment verification. Gate attendants scan directly from browser cameras and
            rely on server-side atomic checks to prevent duplicate entry, duplicate exit, or
            expired ticket reuse.
          </p>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Four Dedicated Role Workspaces
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Drivers search, reserve, and download QR passes. Attendants verify gates in real
            time. Lot Admins configure bays, rates, attendants, and export revenue reports.
            Super Admins oversee platform compliance, user access, and global policy rules.
          </p>
        </Panel>
      </div>
    </div>
  );
}

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Please enter a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/contact', values);
      setSubmitted(true);
      reset();
      toast.success('Inquiry submitted successfully.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-sm font-medium text-emerald-700">Contact Operations</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Connect your parking facilities to ParkGrid.
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Reach out for commercial garage onboarding, EV bay pricing integration, or driver
            booking support.
          </p>
          <div className="border-t border-slate-200 pt-5 space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Operations Desk</p>
              <p className="font-medium text-slate-900">enquiry@parkgrid.com</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Support Line</p>
              <p className="font-mono text-slate-900">+91 9548626182</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Headquarters</p>
              <p className="text-slate-700">Near Bhawarkua Square, Indore</p>
            </div>
          </div>
        </div>

        <Panel className="p-6 sm:p-8 lg:col-span-7">
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Message Received
              </h2>
              <p className="text-sm text-slate-600">
                Thank you for contacting ParkGrid. Our operations team will reply shortly.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Full Name</Label>
                  <Input id="c-name" placeholder="Your name" {...register('name')} />
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    placeholder="you@company.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-subject">Subject</Label>
                <Input
                  id="c-subject"
                  placeholder="Facility onboarding or reservation inquiry"
                  {...register('subject')}
                />
                {errors.subject && (
                  <p className="text-xs text-red-600">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-msg">Message</Label>
                <Textarea
                  id="c-msg"
                  placeholder="Tell us about your parking lot capacity or question..."
                  {...register('message')}
                />
                {errors.message && (
                  <p className="text-xs text-red-600">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" variant="emerald" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
}
