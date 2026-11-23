import { addDays, subDays } from "date-fns";
import { vi } from "vitest";
import type {
  Activity,
  Contact,
  Dashboard,
  Deal,
  Organization,
} from "../api/types";
import { isoDate } from "../lib/format";

const stamps = {
  created_at: "2026-01-05T09:00:00",
  updated_at: "2026-01-05T09:00:00",
  created_by: "Sam Lee",
  updated_by: "Sam Lee",
};
const inDays = (days: number) => isoDate(addDays(new Date(), days));

export const acme: Organization = {
  id: 1,
  name: "Acme Foods",
  website: "acme.example",
  industry: "Food",
  notes: "Budget cycle starts in October.",
  contact_count: 1,
  open_deal_value: 12000,
  ...stamps,
};

export const priya: Contact = {
  id: 1,
  name: "Priya Raman",
  email: "priya@acme.example",
  phone: "+1 201 555 1234",
  job_title: "Buyer",
  organization_id: 1,
  organization_name: "Acme Foods",
  status: "Lead",
  ...stamps,
};

export const sam: Contact = {
  ...priya,
  id: 2,
  name: "Sam Okafor",
  email: null,
  phone: null,
  job_title: null,
  organization_id: null,
  organization_name: null,
  status: "Customer",
};

export const ovens: Deal = {
  id: 1,
  name: "Oven monitoring",
  organization_id: 1,
  organization_name: "Acme Foods",
  contact_id: 1,
  contact_name: "Priya Raman",
  stage: "Proposal",
  value: 12000,
  probability: 50,
  close_date: inDays(-3),
  position: 0,
  ...stamps,
};

export const pilot: Deal = {
  ...ovens,
  id: 2,
  name: "Freezer pilot",
  organization_id: null,
  organization_name: null,
  contact_id: null,
  contact_name: null,
  stage: "New",
  value: 4000,
  probability: 10,
  close_date: inDays(40),
};

export const call: Activity = {
  id: 1,
  type: "call",
  contact_id: 1,
  deal_id: null,
  contact_name: "Priya Raman",
  deal_name: null,
  description: "Talked pricing",
  happened_at: "2026-11-10T10:00:00",
  follow_up_date: inDays(2),
  done: false,
  ...stamps,
};

const months = Array.from({ length: 12 }, (_, i) =>
  isoDate(new Date(2026, i, 1)).slice(0, 7),
);

export const dashboard: Dashboard = {
  months,
  revenue_won: months.map((_, i) => (i + 1) * 1000),
  won: months.map(() => 2),
  lost: months.map(() => 1),
  win_rate: 67,
  open: {
    value: 16000,
    expected: 6400,
    count: 2,
    late: 1,
    stages: [
      { stage: "New", count: 1, value: 4000, expected: 400 },
      { stage: "Qualified", count: 0, value: 0, expected: 0 },
      { stage: "Proposal", count: 1, value: 12000, expected: 6000 },
      { stage: "Negotiation", count: 0, value: 0, expected: 0 },
    ],
  },
  funnel: [
    { stage: "New", value: 40000 },
    { stage: "Qualified", value: 30000 },
    { stage: "Proposal", value: 20000 },
    { stage: "Negotiation", value: 15000 },
    { stage: "Won", value: 10000 },
  ],
  follow_ups: [
    {
      activity_id: 1,
      description: "Send the quote",
      follow_up_date: isoDate(subDays(new Date(), 1)),
      overdue: true,
      record: { kind: "contact", id: 1, name: "Priya Raman" },
    },
  ],
  recent: [
    {
      ...call,
      happened_at: new Date().toISOString().slice(0, 19),
      record: { kind: "contact", id: 1, name: "Priya Raman" },
    },
    {
      ...call,
      id: 2,
      type: "auto",
      description: "Moved from New to Proposal",
      happened_at: subDays(new Date(), 1).toISOString().slice(0, 19),
      record: { kind: "deal", id: 1, name: "Oven monitoring" },
    },
    {
      ...call,
      id: 3,
      type: "auto",
      description: "Status changed from Qualified to Customer",
      happened_at: "2026-01-12T10:00:00",
      record: { kind: "contact", id: 1, name: "Priya Raman" },
    },
  ],
};

const records: Record<string, unknown> = {
  "/organizations": [acme],
  "/organizations/1": { ...acme, contacts: [priya], deals: [ovens] },
  "/organizations/1/impact": { contacts: 1, deals: 1 },
  "/contacts": [priya, sam],
  "/contacts/1": { ...priya, deals: [ovens], timeline: [call] },
  "/contacts/1/impact": { deals: 1, activities: 1 },
  "/deals": [ovens, pilot],
  "/deals/1": { ...ovens, timeline: [] },
  "/deals/1/impact": { activities: 0 },
  "/dashboard": dashboard,
  "/config": { mode: "local" },
  "/me": { name: "Test User", email: "test@example.com" },
};

export type Request = { method: string; path: string; body?: unknown };

/** Answer the local sign-in as the backend would. */
function signIn(body: unknown) {
  const { email, password } = body as { email: string; password: string };
  if (email === "test@example.com" && password === "test")
    return Response.json({ token: "local-test-user" });
  return Response.json({ detail: "Wrong email or password" }, { status: 401 });
}

/** Answer a request as the backend would, from the records above. */
function respond({ method, path, body }: Request) {
  if (path === "/local-sign-in") return signIn(body);
  if (method === "DELETE") return new Response(null, { status: 204 });
  if (method !== "GET") return Response.json({ id: 99, ...(body as object) });
  if (path in records) return Response.json(records[path]);
  return Response.json({ detail: "Not found" }, { status: 404 });
}

/** Stub fetch with a stand-in backend; returns the log of requests it gets. */
export function fakeApi() {
  const requests: Request[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const request = {
      method: init.method ?? "GET",
      path: url.replace(/^\/api/, ""),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    requests.push(request);
    return respond(request);
  });
  return requests;
}

/** The requests that changed something. */
export const changes = (requests: Request[]) =>
  requests.filter((r) => r.method !== "GET");
