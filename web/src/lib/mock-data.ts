/**
 * Types shared by the live screens (mapped from the API in lib/data.ts), plus
 * the static marketing content the landing page still reads from here.
 */

export type JobStatus = "pending" | "in-progress" | "awaiting-parts" | "completed";
export type BookingStatus = "confirmed" | "in-service" | "ready" | "collected" | "cancelled";


export interface Vehicle {
  id: string;
  regNo: string;
  make: string;
  model: string;
  year: number;
}

export interface SparePart {
  id: string;
  sku: string;
  name: string;
  inStock: number;
  unitPrice: number;
}

export interface JobTask {
  id: string;
  label: string;
  status: JobStatus;
  mechanicId?: string;
}

export interface JobCard {
  id: string;
  label: string;
  regNo: string;
  opened: string;
  status: JobStatus;
  tasks: JobTask[];
}

export interface Booking {
  id: string;
  regNo: string;
  customer: string;
  serviceType: string;
  date: string;
  time: string;
  status: BookingStatus;
}


export const SERVICE_TYPES = [
  { id: "s1", name: "Periodic service", duration: "3 – 4 hrs", from: 3499, blurb: "Oil, filters, fluids, 40-point inspection." },
  { id: "s2", name: "Brakes & suspension", duration: "2 – 5 hrs", from: 2899, blurb: "Pads, discs, struts, alignment and balancing." },
  { id: "s3", name: "Engine diagnostics", duration: "1 – 2 hrs", from: 1499, blurb: "OBD scan, live data, fault tracing with a written report." },
  { id: "s4", name: "AC service", duration: "2 – 3 hrs", from: 2199, blurb: "Gas top-up, cabin filter, leak and cooling test." },
  { id: "s5", name: "EV & hybrid care", duration: "2 – 4 hrs", from: 2999, blurb: "HV battery scan, charging diagnostics, software updates." },
  { id: "s6", name: "Accident repair", duration: "3 – 10 days", from: 8999, blurb: "Denting, painting and full insurance claim paperwork." },
];

export const FAQS = [
  {
    q: "Do I need an appointment, or can I just walk in?",
    a: "Walk-ins are welcome for diagnostics and minor jobs, but bays fill up fast on weekends. Booking a slot guarantees a mechanic is free when you arrive and typically cuts your wait by two to three hours.",
  },
  {
    q: "How will I know what's happening to my car?",
    a: "Every vehicle gets a job card you can follow from your account. Each task — inspection, oil change, brake work, road test — updates as your mechanic completes it, and you get a message the moment anything needs your approval.",
  },
  {
    q: "Will you start work I haven't approved?",
    a: "No. If a mechanic finds something outside the agreed scope, the job pauses and the extra work appears in your account for approval. Nothing is billed that you haven't accepted.",
  },
  {
    q: "What if a part is out of stock?",
    a: "The system checks stock before a part is issued to your job, so you find out at booking rather than on collection day. If we have to order in, you'll see a revised completion date before work starts.",
  },
  {
    q: "How is the final bill calculated?",
    a: "Labour is charged per task at a published hourly rate, and parts at listed prices. Totals are computed by the system from the job card itself, so the invoice always matches the work recorded — no manual line items.",
  },
  {
    q: "Do you handle insurance claims?",
    a: "Yes, for accident repair. We document the damage, coordinate the surveyor visit and file the paperwork. You pay only your excess; the rest is settled directly with your insurer.",
  },
  {
    q: "Is there a warranty on the work?",
    a: "Six months or 10,000 km on labour, whichever comes first. Parts carry the manufacturer's own warranty, and your full service history stays on your account so claims never depend on you keeping the paperwork.",
  },
];

export const TESTIMONIALS = [
  { name: "Deepak Menon", vehicle: "Skoda Octavia", quote: "First garage where I didn't have to phone four times to ask if the car was ready. The job card just updated as they worked." },
  { name: "Sharanya Gowda", vehicle: "Maruti Swift", quote: "They found a cracked coolant hose during the inspection, sent me a photo, and waited for my nod before touching it. That's it. That's all I wanted." },
  { name: "Abdul Rahman", vehicle: "Toyota Innova", quote: "Fleet of six vehicles, all their histories in one place. Renewal reminders alone have saved me two missed services this year." },
];

export const STATS = [
  { value: "12,400+", label: "Services completed" },
  { value: "4.8 / 5", label: "Average rating" },
  { value: "18", label: "Certified mechanics" },
  { value: "6", label: "Service bays" },
];
