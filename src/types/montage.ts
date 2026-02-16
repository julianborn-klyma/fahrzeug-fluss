export type TradeType = 'SHK' | 'Elektro' | 'Fundament' | 'Dach' | 'GaLa';
export type JobStatus = 'erstellt' | 'vorbereitet' | 'verplant' | 'durchgefuehrt' | 'abgerechnet';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
}

export interface Client {
  id: string;
  client_type: string;
  company_name: string;
  contact_id: string | null;
  billing_street: string;
  billing_city: string;
  billing_postal_code: string;
  notes: string;
  created_at: string;
  contact?: Contact;
}

export interface Property {
  id: string;
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  property_type: string;
  old_heating: string;
  client_id: string | null;
  notes: string;
  created_at: string;
  client?: Client;
}

export interface OrderType {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface AppointmentType {
  id: string;
  order_type_id: string;
  name: string;
  trade: TradeType | null;
  is_internal: boolean;
  requires_documents: boolean;
  display_order: number;
  created_at: string;
}

export interface Job {
  id: string;
  job_number: string;
  title: string;
  property_id: string | null;
  client_id: string | null;
  order_type_id: string | null;
  status: JobStatus;
  trades: TradeType[];
  active_trades: TradeType[];
  description: string;
  estimated_hours: number;
  assigned_to: string[];
  created_at: string;
  updated_at: string;
  property?: Property;
  client?: Client;
  order_type?: OrderType;
}

export interface JobTradeDetail {
  id: string;
  job_id: string;
  trade: TradeType;
  appointment_start: string | null;
  appointment_end: string | null;
  assigned_team_members: string[];
  technical_info: string;
  created_at: string;
}

export interface TradeAppointment {
  id: string;
  job_id: string;
  trade: TradeType;
  start_date: string;
  end_date: string;
  notes: string;
  created_at: string;
  job?: Job;
}

export interface AppointmentAssignment {
  id: string;
  appointment_id: string;
  person_id: string;
  person_name: string;
  team_id: string | null;
  trade: TradeType | null;
  created_at: string;
}

export interface DocumentType {
  id: string;
  name: string;
  category: string;
  applicable_trades: TradeType[];
  is_required: boolean;
  created_at: string;
}

export interface JobDocument {
  id: string;
  job_id: string;
  file_name: string;
  file_path: string;
  document_type_id: string | null;
  trade: TradeType | null;
  uploaded_by: string | null;
  created_at: string;
  document_type?: DocumentType;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  trade: TradeType | null;
  is_standard: boolean;
  created_at: string;
  steps?: ChecklistTemplateStep[];
}

export interface ChecklistTemplateStep {
  id: string;
  template_id: string;
  title: string;
  step_type: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface JobChecklist {
  id: string;
  job_id: string;
  template_id: string | null;
  name: string;
  trade: TradeType | null;
  status: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  steps?: JobChecklistStep[];
}

export interface JobChecklistStep {
  id: string;
  checklist_id: string;
  template_step_id: string | null;
  title: string;
  step_type: string;
  order_index: number;
  is_required: boolean;
  is_completed: boolean;
  text_value: string;
  photo_url: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export const TRADE_LABELS: Record<TradeType, string> = {
  SHK: 'SHK',
  Elektro: 'Elektro',
  Fundament: 'Fundament',
  Dach: 'Dach',
  GaLa: 'GaLa',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  erstellt: 'Erstellt',
  vorbereitet: 'Vorbereitet',
  verplant: 'Verplant',
  durchgefuehrt: 'Durchgeführt',
  abgerechnet: 'Abgerechnet',
};
