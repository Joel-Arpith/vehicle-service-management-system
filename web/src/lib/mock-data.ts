/**
 * Mock data standing in for the FastAPI + MongoDB backend.
 *
 * Shapes mirror the 11 collections in
 * docs/vehicle_service_centre_mongodb_plan.md Section 3, so swapping these
 * fixtures for real `fetch("/api/...")` calls is a one-file change per screen.
 *
 * ponytail: plain exported consts, no store/provider. Add state management
 * only when two distant screens need to mutate the same record.
 */

export type JobStatus = "pending" | "in-progress" | "awaiting-parts" | "completed";
export type BookingStatus = "confirmed" | "in-service" | "ready" | "collected";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  since: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  regNo: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
}

export interface Mechanic {
  id: string;
  name: string;
  specialisation: string;
  shift: string;
  activeJobs: number;
  capacity: number;
}

export interface SparePart {
  id: string;
  sku: string;
  name: string;
  inStock: number;
  reorderLevel: number;
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
  vehicleId: string;
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
  slot: string;
  advisor: string;
  status: BookingStatus;
}

export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Ananya Rao", phone: "+91 98450 11234", email: "ananya.rao@example.com", since: "2023-04-11" },
  { id: "c2", name: "Vikram Shetty", phone: "+91 99001 44821", email: "v.shetty@example.com", since: "2022-11-02" },
  { id: "c3", name: "Meera Iyer", phone: "+91 98867 30117", email: "meera.iyer@example.com", since: "2024-01-19" },
  { id: "c4", name: "Rohan D'Souza", phone: "+91 97414 88220", email: "rohan.ds@example.com", since: "2021-08-30" },
  { id: "c5", name: "Farida Khan", phone: "+91 90080 26643", email: "farida.k@example.com", since: "2025-02-14" },
];

export const VEHICLES: Vehicle[] = [
  { id: "v1", customerId: "c1", regNo: "KA 01 MJ 4471", make: "Maruti Suzuki", model: "Baleno Zeta", year: 2021, odometer: 48210 },
  { id: "v2", customerId: "c2", regNo: "KA 05 HL 9902", make: "Hyundai", model: "Creta SX", year: 2019, odometer: 91455 },
  { id: "v3", customerId: "c3", regNo: "KA 03 NB 1188", make: "Tata", model: "Nexon EV", year: 2023, odometer: 22730 },
  { id: "v4", customerId: "c4", regNo: "KA 51 AK 7340", make: "Honda", model: "City VX", year: 2018, odometer: 118920 },
  { id: "v5", customerId: "c5", regNo: "KA 09 QP 5566", make: "Mahindra", model: "XUV700 AX7", year: 2024, odometer: 14380 },
];

export const MECHANICS: Mechanic[] = [
  { id: "m1", name: "Suresh Kumar", specialisation: "Engine & transmission", shift: "07:00 – 15:00", activeJobs: 3, capacity: 4 },
  { id: "m2", name: "Imran Pasha", specialisation: "Brakes & suspension", shift: "07:00 – 15:00", activeJobs: 4, capacity: 4 },
  { id: "m3", name: "Lakshmi Devi", specialisation: "Auto electrical & EV", shift: "11:00 – 19:00", activeJobs: 2, capacity: 4 },
  { id: "m4", name: "Joseph Mathew", specialisation: "Diagnostics", shift: "11:00 – 19:00", activeJobs: 1, capacity: 3 },
];

export const SPARE_PARTS: SparePart[] = [
  { id: "p1", sku: "OF-1042", name: "Oil filter — petrol 1.2L", inStock: 34, reorderLevel: 10, unitPrice: 420 },
  { id: "p2", sku: "BP-2280", name: "Front brake pad set", inStock: 6, reorderLevel: 8, unitPrice: 2650 },
  { id: "p3", sku: "AF-3311", name: "Cabin air filter", inStock: 21, reorderLevel: 12, unitPrice: 890 },
  { id: "p4", sku: "BT-7700", name: "Battery 12V 65Ah", inStock: 2, reorderLevel: 4, unitPrice: 7400 },
  { id: "p5", sku: "CL-5150", name: "Clutch plate assembly", inStock: 0, reorderLevel: 3, unitPrice: 11250 },
  { id: "p6", sku: "WP-9021", name: "Wiper blade pair", inStock: 48, reorderLevel: 15, unitPrice: 640 },
];

export const JOB_CARDS: JobCard[] = [
  {
    id: "JC-2418",
    vehicleId: "v2",
    regNo: "KA 05 HL 9902",
    opened: "2026-08-23 09:15",
    status: "in-progress",
    tasks: [
      { id: "t1", label: "Multi-point inspection", status: "completed", mechanicId: "m4" },
      { id: "t2", label: "Engine oil & filter change", status: "completed", mechanicId: "m1" },
      { id: "t3", label: "Front brake pad replacement", status: "awaiting-parts", mechanicId: "m2" },
      { id: "t4", label: "Wheel alignment & balancing", status: "in-progress", mechanicId: "m2" },
      { id: "t5", label: "Final road test", status: "pending" },
    ],
  },
  {
    id: "JC-2419",
    vehicleId: "v3",
    regNo: "KA 03 NB 1188",
    opened: "2026-08-23 10:40",
    status: "in-progress",
    tasks: [
      { id: "t1", label: "HV battery health scan", status: "completed", mechanicId: "m3" },
      { id: "t2", label: "Coolant top-up", status: "completed", mechanicId: "m3" },
      { id: "t3", label: "Charging port diagnostics", status: "in-progress", mechanicId: "m3" },
      { id: "t4", label: "Software update", status: "pending" },
    ],
  },
  {
    id: "JC-2420",
    vehicleId: "v4",
    regNo: "KA 51 AK 7340",
    opened: "2026-08-23 11:05",
    status: "awaiting-parts",
    tasks: [
      { id: "t1", label: "Clutch judder diagnosis", status: "completed", mechanicId: "m4" },
      { id: "t2", label: "Clutch plate replacement", status: "awaiting-parts", mechanicId: "m1" },
      { id: "t3", label: "Gearbox oil change", status: "pending" },
    ],
  },
];

export const BOOKINGS: Booking[] = [
  { id: "BK-8801", regNo: "KA 01 MJ 4471", customer: "Ananya Rao", serviceType: "Periodic service — 50k", date: "2026-08-24", slot: "09:00 – 11:00", advisor: "Priya Nair", status: "confirmed" },
  { id: "BK-8802", regNo: "KA 05 HL 9902", customer: "Vikram Shetty", serviceType: "Brake job + alignment", date: "2026-08-23", slot: "09:00 – 13:00", advisor: "Priya Nair", status: "in-service" },
  { id: "BK-8803", regNo: "KA 03 NB 1188", customer: "Meera Iyer", serviceType: "EV health check", date: "2026-08-23", slot: "10:30 – 12:30", advisor: "Arun Bhat", status: "in-service" },
  { id: "BK-8804", regNo: "KA 51 AK 7340", customer: "Rohan D'Souza", serviceType: "Clutch replacement", date: "2026-08-23", slot: "11:00 – 17:00", advisor: "Arun Bhat", status: "in-service" },
  { id: "BK-8805", regNo: "KA 09 QP 5566", customer: "Farida Khan", serviceType: "First free service", date: "2026-08-26", slot: "14:00 – 16:00", advisor: "Priya Nair", status: "confirmed" },
  { id: "BK-8799", regNo: "KA 01 MJ 4471", customer: "Ananya Rao", serviceType: "AC service", date: "2026-08-19", slot: "09:00 – 11:00", advisor: "Priya Nair", status: "collected" },
];

export const SERVICE_TYPES = [
  { id: "s1", name: "Periodic service", duration: "3 – 4 hrs", from: 3499, blurb: "Oil, filters, fluids, 40-point inspection." },
  { id: "s2", name: "Brakes & suspension", duration: "2 – 5 hrs", from: 2899, blurb: "Pads, discs, struts, alignment and balancing." },
  { id: "s3", name: "Engine diagnostics", duration: "1 – 2 hrs", from: 1499, blurb: "OBD scan, live data, fault tracing with a written report." },
  { id: "s4", name: "AC service", duration: "2 – 3 hrs", from: 2199, blurb: "Gas top-up, cabin filter, leak and cooling test." },
  { id: "s5", name: "EV & hybrid care", duration: "2 – 4 hrs", from: 2999, blurb: "HV battery scan, charging diagnostics, software updates." },
  { id: "s6", name: "Accident repair", duration: "3 – 10 days", from: 8999, blurb: "Denting, painting and full insurance claim paperwork." },
];

/* ── Reports — the 6 required aggregations, pre-computed ── */

export const REVENUE_BY_MONTH = [
  { label: "MAR", value: 412000 },
  { label: "APR", value: 468500 },
  { label: "MAY", value: 391200 },
  { label: "JUN", value: 524800 },
  { label: "JUL", value: 559300 },
  { label: "AUG", value: 487100 },
];

export const MECHANIC_WORKLOAD = MECHANICS.map((m) => ({
  label: m.name.split(" ")[0].toUpperCase(),
  value: Math.round((m.activeJobs / m.capacity) * 100),
  full: m.name,
}));

export const TURNAROUND_HOURS = [
  { label: "MON", value: 26 },
  { label: "TUE", value: 41 },
  { label: "WED", value: 18 },
  { label: "THU", value: 55 },
  { label: "FRI", value: 44 },
  { label: "SAT", value: 62 },
];

export const PART_USAGE_SPLIT = [
  { label: "Filters", value: 34 },
  { label: "Brakes", value: 26 },
  { label: "Electrical", value: 24 },
  { label: "Fluids", value: 16 },
];

export const CENTRE_HEALTH = [
  { label: "BAY USE", value: 82 },
  { label: "ON TIME", value: 91 },
  { label: "STOCK", value: 64 },
  { label: "CSAT", value: 88 },
  { label: "REVISITS", value: 73 },
];

/**
 * Invoice for JC-2418. Total is DERIVED, never a literal — mirrors the
 * server-side computation rule in plan Section 5. If a line item changes,
 * the total follows; a hardcoded total would silently stop reconciling.
 */
export const GST_RATE = 0.18;

export const INVOICE_5521 = (() => {
  const parts = 9180;
  const labour = 3010;
  const subtotal = parts + labour;
  const gst = Math.round(subtotal * GST_RATE);
  return { no: "INV-5521", regNo: "KA 05 HL 9902", jobId: "JC-2418", parts, labour, subtotal, gst, total: subtotal + gst };
})();

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
