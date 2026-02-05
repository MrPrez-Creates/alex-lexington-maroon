/**
 * Support Ticket Service for Maroon Customer App
 * Uses Supabase directly for support_tickets table
 */

import { supabase } from '../lib/supabase';
import { SupportTicket, TicketStatus } from '../types';

/**
 * Create a new support ticket
 */
export const createSupportTicket = async (subject: string, message: string): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error('User not authenticated');

  const ticketId = `ticket-${Date.now()}`;

  const { error } = await supabase
    .from('support_tickets')
    .insert({
      ticket_id: ticketId,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || 'Unknown User',
      subject,
      message,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to create ticket:', error);
    throw error;
  }

  return ticketId;
};

/**
 * Fetch all support tickets (admin)
 */
export const fetchSupportTickets = async (): Promise<SupportTicket[]> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch tickets:', error);
    return [];
  }

  return (data || []).map(mapRowToTicket);
};

/**
 * Subscribe to support tickets (real-time updates)
 */
export const subscribeToSupportTickets = (
  callback: (tickets: SupportTicket[]) => void
): (() => void) => {
  // Initial fetch
  fetchSupportTickets().then(callback);

  // Real-time subscription
  const channel = supabase
    .channel('support_tickets_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'support_tickets' },
      () => {
        // Re-fetch all tickets on any change
        fetchSupportTickets().then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Update ticket status (admin)
 */
export const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<void> => {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('ticket_id', ticketId);

  if (error) {
    console.error('Failed to update ticket:', error);
    throw error;
  }
};

// --- Mapper ---

const mapRowToTicket = (row: any): SupportTicket => ({
  id: row.ticket_id || row.id,
  userId: row.user_id,
  userEmail: row.user_email,
  userName: row.user_name,
  subject: row.subject,
  message: row.message,
  status: row.status as TicketStatus,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
