export type ReportStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';
export type UserRole = 'Resident' | 'Admin' | 'Technician';

export interface FaultReport {
  id: string;
  created_at: string;
  title: string;
  description: string;
  location: string | null;
  photo_url: string | null;
  status: ReportStatus;
  reporter_name: string;
  assigned_technician: string | null;
  admin_response: string | null;
  broadcast_message: string | null;
  escalated: boolean;
  responded_at: string | null;
}
