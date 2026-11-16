import type { Stage, Status } from "../lib/stages";

export type Kind = "organizations" | "contacts" | "deals";

interface Stored {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationIn {
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
}

export interface Organization extends Stored, OrganizationIn {
  contact_count: number;
  open_deal_value: number;
}

export interface ContactIn {
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
  status: Status;
}

export interface Contact extends Stored, ContactIn {
  organization_name: string | null;
}

export interface DealIn {
  name: string;
  organization_id: number | null;
  contact_id: number | null;
  stage: Stage;
  value: number;
  probability: number;
  close_date: string;
}

export interface Deal extends Stored, DealIn {
  position: number;
  organization_name: string | null;
  contact_name: string | null;
}

export type ActivityType = "note" | "call" | "email";

export interface ActivityIn {
  type: ActivityType;
  contact_id: number | null;
  deal_id: number | null;
  description: string;
  happened_at: string;
  follow_up_date: string | null;
  done: boolean;
}

export interface Activity extends Stored, Omit<ActivityIn, "type"> {
  type: ActivityType | "auto";
  contact_name: string | null;
  deal_name: string | null;
}

export interface OrganizationDetail extends Organization {
  contacts: Contact[];
  deals: Deal[];
}

export interface ContactDetail extends Contact {
  deals: Deal[];
  timeline: Activity[];
}

export interface DealDetail extends Deal {
  timeline: Activity[];
}

export interface RecordLink {
  kind: "contact" | "deal";
  id: number;
  name: string;
}

export interface StageFigures {
  stage: Stage;
  count: number;
  value: number;
  expected: number;
}

export interface Dashboard {
  months: string[];
  revenue_won: number[];
  won: number[];
  lost: number[];
  win_rate: number | null;
  open: {
    value: number;
    expected: number;
    count: number;
    late: number;
    stages: StageFigures[];
  };
  funnel: { stage: Stage; value: number }[];
  follow_ups: {
    activity_id: number;
    description: string;
    follow_up_date: string;
    overdue: boolean;
    record: RecordLink;
  }[];
  recent: (Activity & { record: RecordLink })[];
}

export type Impact = Record<string, number>;
