export type TradeType = 'SHK' | 'Elektro' | 'Fundament' | 'Dach' | 'GaLa';
export type JobStatus = 'neu' | 'ausfuehrung' | 'nacharbeiten' | 'abgeschlossen';
export type AppointmentStatus = 'neu' | 'in_planung' | 'vorbereitet' | 'in_umsetzung' | 'review' | 'abgenommen';

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
  name: string;
  description: string;
  is_internal: boolean;
  is_active: boolean;
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
  contact_person_id: string | null;
  planner_id: string | null;
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
  contact_person?: Contact;
  planner?: { id: string; name: string; email: string; user_id: string };
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
  description: string;
  trade: TradeType | null;
  appointment_type_id: string | null;
  is_standard: boolean;
  created_at: string;
  steps?: ChecklistTemplateStep[];
  appointment_type?: AppointmentType;
}

export interface ChecklistTemplateStep {
  id: string;
  template_id: string;
  title: string;
  description: string;
  step_type: string;
  order_index: number;
  is_required: boolean;
  parent_step_id: string | null;
  options: any[];
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
  neu: 'Neu',
  ausfuehrung: 'Ausführung',
  nacharbeiten: 'Nacharbeiten',
  abgeschlossen: 'Abgeschlossen',
};

export const JOB_STATUS_ORDER: JobStatus[] = ['neu', 'ausfuehrung', 'nacharbeiten', 'abgeschlossen'];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  neu: 'Neu',
  in_planung: 'In Planung',
  vorbereitet: 'Vorbereitet',
  in_umsetzung: 'In Umsetzung',
  review: 'Review',
  abgenommen: 'Abgenommen',
};

export const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = ['neu', 'in_planung', 'vorbereitet', 'in_umsetzung', 'review', 'abgenommen'];

export interface AppointmentTypeField {
  id: string;
  appointment_type_id: string;
  label: string;
  field_type: string;
  placeholder: string;
  options: any[];
  is_required: boolean;
  width: string;
  display_order: number;
  created_at: string;
}

export interface AppointmentTypeDocument {
  id: string;
  appointment_type_id: string;
  document_type_id: string;
  created_at: string;
  document_type?: DocumentType;
}

export interface JobAppointment {
  id: string;
  job_id: string;
  appointment_type_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string;
  field_values: Record<string, any>;
  created_at: string;
  appointment_type?: AppointmentType & { fields?: AppointmentTypeField[]; required_documents?: AppointmentTypeDocument[] };
}
