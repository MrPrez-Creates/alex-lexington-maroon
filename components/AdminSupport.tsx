
import React, { useEffect, useState } from 'react';
import { SupportTicket, TicketStatus } from '../types';
import { subscribeToSupportTickets, updateTicketStatus } from '../services/firestoreService';

const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    const unsubscribe = subscribeToSupportTickets((data) => {
      setTickets(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: TicketStatus) => {
    try {
      await updateTicketStatus(id, newStatus);
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Failed to update ticket status.");
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status === 'open' || t.status === 'in-progress';
    return t.status === 'closed';
  });

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'closed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Support Tickets</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>
        
        <div className="flex bg-white dark:bg-navy-800 p-1 rounded-lg border border-gray-200 dark:border-navy-700">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'all' ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('open')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'open' ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
          >
            Open
          </button>
          <button 
            onClick={() => setFilter('closed')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${filter === 'closed' ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
          >
            Closed
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden flex-1">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-navy-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-navy-700">
                <tr>
                  <th className="px-6 py-4 w-24">Status</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 w-32 text-right">Date</th>
                  <th className="px-6 py-4 w-40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-700 text-sm">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold tracking-wider whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-navy-900 dark:text-white">{ticket.userName}</div>
                      <div className="text-xs text-gray-500">{ticket.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-navy-900 dark:text-white mb-1">{ticket.subject}</div>
                      <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-3 group-hover:line-clamp-none">
                        {ticket.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-right text-xs text-gray-500 whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      {ticket.status !== 'closed' ? (
                        <button 
                          onClick={() => handleStatusChange(ticket.id, 'closed')}
                          className="bg-navy-50 dark:bg-navy-700 hover:bg-green-500 hover:text-white text-gray-500 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-gray-200 dark:border-navy-600 hover:border-green-500"
                        >
                          Resolve
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStatusChange(ticket.id, 'open')}
                          className="text-gray-400 hover:text-navy-900 dark:hover:text-white text-xs underline"
                        >
                          Re-open
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
