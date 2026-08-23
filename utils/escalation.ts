import { supabase } from '../lib/supabase';

// Escalation window — how long the admin has to respond before auto-forwarding
// to technicians. Set low (e.g. 0) for demoing/testing, raise for real use.
export const ESCALATION_MINUTES = 30;

export async function escalateStaleReports() {
  const thresholdDate = new Date(Date.now() - ESCALATION_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('fault_reports')
    .update({ status: 'Assigned', escalated: true })
    .eq('status', 'Pending')
    .is('responded_at', null)
    .lt('created_at', thresholdDate)
    .select();

  if (error) {
    console.error('Escalation check failed:', error.message);
  }
  return data;
}
