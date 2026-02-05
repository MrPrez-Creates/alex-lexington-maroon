
import React, { useState, useEffect } from 'react';
import { CustomerProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Mock State for Front Office features not yet fully backend-connected
  const [pendingWires, setPendingWires] = useState(3);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/customers?limit=100`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        const customerList = (data.data || data || []).map((c: any) => ({
          id: c.customer_id?.toString() || c.id,
          firstName: c.first_name || '',
          lastName: c.last_name || '',
          email: c.email || '',
          totalSpent: parseFloat(c.lifetime_buy_total || c.lifetime_value || '0'),
          lastActive: c.updated_at || c.created_at || '',
          billingAddress: { city: '', state: '' },
          contact_info: { emails: [c.email], phones: [c.phone || ''], known_names: [] },
          purchase_history: [],
        })) as CustomerProfile[];
        setCustomers(customerList);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setStatusMsg('Failed to load customers from API.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleVerifyKYC = (email: string) => {
      // In a real app, this would call a cloud function
      alert(`KYC Verification triggered for ${email}`);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 space-y-6">
      
      {/* Front Office Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex items-center justify-between">
              <div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pending Wires</div>
                  <div className="text-2xl font-bold text-navy-900 dark:text-white">{pendingWires}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex items-center justify-between">
              <div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Unverified KYC</div>
                  <div className="text-2xl font-bold text-navy-900 dark:text-white">12</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
          </div>
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex items-center justify-between">
              <div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Traders</div>
                  <div className="text-2xl font-bold text-navy-900 dark:text-white">843</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Front Office (CRM)</h1>
            <p className="text-xs text-gray-500">Manage Verification & Trade Ops</p>
        </div>
        
        <div className="text-xs text-gray-500">
            {isLoading ? 'Loading...' : `${customers.length} customers`}
        </div>
      </div>

      {statusMsg && (
          <div className="bg-navy-800 border border-gold-500/30 text-gold-500 p-3 rounded-lg text-sm text-center animate-fade-in">
              {statusMsg}
          </div>
      )}

      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden flex-1">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-navy-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-navy-700">
                      <tr>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">KYC Status</th>
                          <th className="px-6 py-4">Total Spent</th>
                          <th className="px-6 py-4 hidden md:table-cell">Location</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-navy-700 text-sm">
                      {customers.length > 0 ? customers.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="font-bold text-navy-900 dark:text-white">{c.firstName} {c.lastName}</div>
                                  <div className="text-xs text-gray-500">{c.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                  {/* Mock KYC logic for demo */}
                                  {idx % 3 === 0 ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                          VERIFIED
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                          UNVERIFIED
                                      </span>
                                  )}
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-mono font-bold text-navy-900 dark:text-white">${(c.totalSpent || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                              </td>
                              <td className="px-6 py-4 hidden md:table-cell text-gray-600 dark:text-gray-300">
                                  {c.billingAddress?.city || 'Unknown'}, {c.billingAddress?.state}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  {idx % 3 !== 0 && (
                                      <button 
                                        onClick={() => handleVerifyKYC(c.email || '')}
                                        className="text-[10px] font-bold text-gold-500 hover:text-white border border-gold-500/30 hover:bg-gold-500/10 px-3 py-1.5 rounded transition-colors"
                                      >
                                          Verify
                                      </button>
                                  )}
                              </td>
                          </tr>
                      )) : (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                  No customer data found. Import a WooCommerce CSV to get started.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default AdminCustomers;
