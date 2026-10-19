export type UserRole = "admin" | "member";
export type SupportKind = "money" | "material" | "both";
export type Recurrence = "yearly" | "once";
export type ApplicationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "skipped";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Scheme {
  id: number;
  name: string;
  provider: string;
  kind: SupportKind;
  description: string;
  website_url: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface Deadline {
  id: number;
  scheme_id: number;
  title: string;
  recurrence: Recurrence;
  month: number | null;
  day: number | null;
  absolute_deadline: string | null;
  opens_days_before: number | null;
  reminder_days: string;
  checklist: string;
  is_active: boolean;
  created_at: string;
  scheme?: Scheme | null;
}

export interface Application {
  id: number;
  deadline_id: number;
  year: number;
  status: ApplicationStatus;
  assignee_id: number | null;
  amount_requested: number | null;
  amount_granted: number | null;
  submitted_at: string | null;
  notes: string;
  created_at: string;
  updated_at?: string | null;
  deadline?: Deadline | null;
  assignee?: User | null;
}

export interface WheelItem {
  deadline_id: number;
  scheme_id: number;
  scheme_name: string;
  provider: string;
  kind: SupportKind;
  title: string;
  year: number;
  deadline_date: string;
  opens_date: string | null;
  days_until: number;
  reminder_days: number[];
  checklist: string;
  application: Application | null;
}

export interface WheelResponse {
  year: number;
  items: WheelItem[];
}
