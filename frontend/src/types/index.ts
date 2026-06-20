export interface Entity {
  id: string;
  name: string;
  code: string;
  gstin: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'analyst' | 'approver' | 'manager' | 'viewer';
}

export interface Batch {
  id: string;
  entity: string;
  recon_type: 'bank' | 'ap' | 'ar' | 'gst';
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  source_name: string;
  total_rows: number;
  matched_rows: number;
  exception_rows: number;
  error_rows: number;
  created_at: string;
}

export interface ExceptionComment {
  id: string;
  exception: string;
  user: User | null;
  message: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  exception: string;
  user: User | null;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ExceptionRecord {
  id: string;
  entity: string;
  reconciliation_type: string;
  exception_code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'routed' | 'investigating' | 'pending_approval' | 'resolved' | 'approved' | 'closed';
  source_record_ids: string[];
  amount_difference: string;
  date_difference: number;
  confidence_score: string;
  context: {
    bank_line_id?: string | null;
    ledger_entry_id?: string | null;
    reference?: string;
    counterparty?: string;
    narration?: string;
    [key: string]: any;
  };
  assigned_to: User | null;
  sla_deadline: string | null;
  resolution_code: string;
  root_cause_code: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  comments?: ExceptionComment[];
  audit_logs?: AuditLog[];
}

export interface RoutingRule {
  id: string;
  entity: string;
  reconciliation_type: string;
  exception_code: string;
  min_amount: string;
  max_amount: string | null;
  assign_to_role: string;
  sla_hours: number;
  priority: string;
  active: boolean;
}
