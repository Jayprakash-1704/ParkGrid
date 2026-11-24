import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '../../services/api.js';
import { Button, Input, Label, Panel, Textarea } from '../../components/ui/primitives.jsx';

{/* <img src="/assets/images/jay.jpeg" */}




export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">

      {/* Project Introduction */}
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-emerald-700">
          About Our Project
        </p>

        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 text-balance">
          ParkGrid – A Smart Parking Reservation and Management System.
        </h1>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          ParkGrid is a full-stack web application designed to simplify
          parking reservations and management. The platform allows drivers
          to discover parking locations, check real-time slot availability,
          reserve parking spaces, and make secure online payments.
          It also provides dedicated dashboards for parking attendants
          and administrators to efficiently manage parking operations.
        </p>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          This project was developed as part of the MERN Stack Development
          course at Universal Informatics, Bhawarkua, Indore, under the
          guidance and supervision of our mentor, Mr. Arpit Gaveshinde Sir.
        </p>
      </div>

      {/* Project Information Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* Objective */}
        <Panel className="p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Project Objective
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The primary objective of ParkGrid is to reduce the time and
            effort involved in finding parking spaces. It provides a
            centralized platform for parking discovery, online reservations,
            digital payments, and QR-based entry and exit verification,
            making parking operations more convenient and organized.
          </p>
        </Panel>

{/* Key Features */}
<Panel className="p-6">
  <h2 className="font-display text-lg font-semibold text-slate-900">
    Key Features
  </h2>

  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 list-disc pl-5">
    <li>Four role-based dashboards (Driver, Attendant, Lot Admin, Super Admin).</li>
    <li>Parking lot discovery with location-based search.</li>
    <li>Real-time parking slot availability.</li>
    <li>Online parking reservations and Cashfree payment integration.</li>
    <li>QR-based entry and exit verification.</li>
    <li>Real-time updates using Socket.IO.</li>
    <li>Parking lot, floor, and slot management.</li>
    <li>Booking history and parking management reports.</li>
    <li>Secure authentication and role-based access control.</li>
  </ul>
</Panel>

{/* Technology Stack */}
<Panel className="p-6">
  <h2 className="font-display text-lg font-semibold text-slate-900">
    Technology Stack
  </h2>

  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 list-disc pl-5">
    <li><strong>Frontend:</strong> React.js, Redux Toolkit, Tailwind CSS</li>
    <li><strong>Backend:</strong> Node.js, Express.js</li>
    <li><strong>Database:</strong> MongoDB, Mongoose</li>
    <li><strong>Authentication:</strong> JWT, Role-Based Access Control</li>
    <li><strong>Real-Time Communication:</strong> Socket.IO</li>
    <li><strong>Payment Gateway:</strong> Cashfree</li>
    <li><strong>QR Code:</strong> QR Code Generation and Verification</li>
    <li><strong>API Communication:</strong> REST APIs, Axios</li>
    <li><strong>Deployment:</strong> Render</li>
  </ul>
</Panel>


        
       

        {/* Development */}
        <Panel className="p-6 ">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Development & Learning
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            ParkGrid was developed as a practical project during the
            MERN Stack Development training program at Universal
            Informatics, Bhawarkua, Indore. The development process
            provided practical experience in full-stack development,
            API integration, database management, authentication,
            payment integration, and real-time communication.
          </p>
        </Panel>
      </div>

      {/* Developer & Mentor Section */}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8 sm:p-10">

        <div className="text-center">
          <p className="text-sm font-medium text-emerald-700">
            Project Credits
          </p>

          <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">
            Meet the People Behind ParkGrid
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Designed and developed as part of the MERN Stack Development course.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-12 sm:grid-cols-2">

          {/* Project Developer */}
          <div className="flex flex-col items-center text-center">

            <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src="/assets/images/jay.jpeg"
                alt="Jayprakash - Project Developer"
                className="h-full w-full object-cover"
              />
            </div>

            <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
              Jayprakash
            </h3>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Project Developer
            </p>

            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              Responsible for designing and developing ParkGrid,
              implementing frontend and backend functionality,
              database integration, and application features.
            </p>

          </div>

          {/* Project Mentor */}
          <div className="flex flex-col items-center text-center">

            <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src="/assets/images/sir.jpg"
                alt="Mr. Arpit Gaveshinde - Project Mentor"
                className="h-full w-full object-cover"
              />
            </div>

            <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
              Mr. Arpit Gaveshinde
            </h3>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Project Guide & Mentor
            </p>

            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              Provided technical guidance, mentorship, and supervision
              throughout the project development process.
            </p>

          </div>

        </div>

        {/* Institute Details */}
        <div className="mt-12 border-t border-emerald-200 pt-7 text-center">

          <h3 className="font-display text-lg font-bold text-slate-900">
            Universal Informatics
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Bhawarkua, Indore, Madhya Pradesh
          </p>

          <p className="mt-3 text-sm font-medium text-emerald-700">
            MERN Stack Development Course
          </p>

          <p className="mt-5 text-xs text-slate-500">
            © {new Date().getFullYear()} ParkGrid. Developed as an academic
            and practical learning project.
          </p>

        </div>

      </section>

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
