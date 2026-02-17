
import React, { useState, useCallback, useEffect } from 'react';
import { PaymentMethod, UserProfile } from '../types';
// Payment methods managed locally (mock - real Plaid integration handles bank accounts)
const addPaymentMethod = async (_method: PaymentMethod) => { /* no-op for now */ };
const deletePaymentMethod = async (_id: string) => { /* no-op for now */ };

interface PaymentMethodsProps {
  userProfile: UserProfile | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ userProfile }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkingStep, setLinkingStep] = useState<'select' | 'plaid-loading' | 'plaid-linking' | 'plaid-success' | 'plaid-error' | 'card-form'>('select');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidError, setPlaidError] = useState<string | null>(null);

  const methods = userProfile?.paymentMethods || [];
  const customerId = userProfile?.customerId;

  // Fetch Plaid link token when starting bank link
  const fetchLinkToken = useCallback(async () => {
    if (!customerId) {
      setPlaidError('Customer ID not found. Please complete your profile first.');
      setLinkingStep('plaid-error');
      return;
    }

    setLinkingStep('plaid-loading');
    setPlaidError(null);

    try {
      // redirect_uri required for OAuth banks (Chase, Wells Fargo, etc.)
      const redirectUri = `${window.location.origin}/maroon/wallet/fund`;

      const response = await fetch(`${API_BASE}/api/plaid/create-link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, redirect_uri: redirectUri }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create link token');
      }

      setLinkToken(data.link_token);
      // Now open Plaid Link
      openPlaidLink(data.link_token);
    } catch (err: any) {
      console.error('Error fetching link token:', err);
      setPlaidError(err.message || 'Failed to initialize bank connection');
      setLinkingStep('plaid-error');
    }
  }, [customerId]);

  // Handle Plaid success - exchange token
  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    setLinkingStep('plaid-linking');

    try {
      const response = await fetch(`${API_BASE}/api/plaid/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          public_token: publicToken,
          account_id: metadata.accounts[0]?.id,
          institution: metadata.institution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link bank account');
      }

      // Save to Firestore
      const newMethod: PaymentMethod = {
        id: `pm-bank-${data.account_id || Date.now()}`,
        type: 'bank',
        institution: metadata.institution?.name || 'Bank',
        name: metadata.accounts[0]?.name || 'Bank Account',
        mask: metadata.accounts[0]?.mask || '****',
        isDefault: methods.length === 0,
      };

      await addPaymentMethod(newMethod);
      setLinkingStep('plaid-success');

      setTimeout(() => {
        setIsLinking(false);
        setLinkToken(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error exchanging token:', err);
      setPlaidError(err.message || 'Failed to link bank account');
      setLinkingStep('plaid-error');
    }
  }, [customerId, methods.length]);

  // Open Plaid Link widget
  const openPlaidLink = useCallback((token: string) => {
    const initPlaid = () => {
      const handler = (window as any).Plaid.create({
        token: token,
        onSuccess: (public_token: string, metadata: any) => {
          handlePlaidSuccess(public_token, metadata);
        },
        onExit: (err: any) => {
          if (err) {
            setPlaidError(err.display_message || 'Connection was interrupted');
            setLinkingStep('plaid-error');
          } else {
            setLinkingStep('select');
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid event:', eventName, metadata);
        },
      });
      handler.open();
    };

    if ((window as any).Plaid) {
      initPlaid();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.onload = initPlaid;
      document.body.appendChild(script);
    }
  }, [handlePlaidSuccess]);

  const handleLinkBank = () => {
    fetchLinkToken();
  };

  const handleAddCard = async (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate Stripe Element Tokenization
      const newMethod: PaymentMethod = {
          id: `pm-card-${Date.now()}`,
          type: 'card',
          institution: 'Visa',
          name: 'Personal Card',
          mask: cardDetails.number.slice(-4) || '4242',
          isDefault: methods.length === 0
      };
      await addPaymentMethod(newMethod);
      setIsLinking(false);
  };

  const handleAddApplePay = async () => {
      // Simulate Apple Pay authorization
      const newMethod: PaymentMethod = {
          id: `pm-apple-${Date.now()}`,
          type: 'apple_pay',
          institution: 'Apple Pay',
          name: 'Wallet',
          mask: 'Device',
          isDefault: methods.length === 0
      };
      await addPaymentMethod(newMethod);
      setIsLinking(false);
  };

  const confirmDelete = async () => {
      if (methodToDelete) {
          await deletePaymentMethod(methodToDelete.id);
          setMethodToDelete(null);
      }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Payment Methods</h1>
        <button 
            onClick={() => { setIsLinking(true); setLinkingStep('select'); }}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-gold-500/20"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add Method
        </button>
      </div>

      {/* Linked Accounts List */}
      <div className="grid gap-4 pb-20">
          {methods.length > 0 ? methods.map(method => (
              <div key={method.id} className="bg-white dark:bg-navy-800 p-6 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm flex justify-between items-center group relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                          method.type === 'bank' ? 'bg-navy-700' : 
                          method.type === 'apple_pay' ? 'bg-black border border-gray-700' : 
                          'bg-gradient-to-br from-blue-600 to-blue-800'
                      }`}>
                          {method.type === 'bank' ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                          ) : method.type === 'apple_pay' ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.6 9.48l1.83 5.4h-1.74l-.65-2.07h-2.5l-.62 2.07h-1.69l1.83-5.4h1.54zm-2.03 2.15l-.83-2.67-.85 2.67h1.68zM12.87 11.23c0-.84.67-1.39 1.83-1.39.4 0 .75.05 1.04.14v-.23c0-.52-.42-.82-1.07-.82-.47 0-.91.13-1.25.32l-.4-.85c.48-.3 1.1-.48 1.83-.48 1.45 0 2.4.81 2.4 2.37v4.6h-1.48v-1.01c-.41.67-1.07 1.12-1.92 1.12-1.28 0-2.2-.84-2.2-2.06 0-1.26 1-2.07 2.72-2.07.29 0 .57.03.82.08v-.15c0-.39-.31-.57-.82-.57h-.5zm1.18 1.25c-.2-.04-.41-.06-.63-.06-.82 0-1.25.37-1.25.96 0 .53.4.88 1.01.88.52 0 .87-.27.87-.82v-.96zM8.5 13.91l.37-1.42c.15-.55.22-1.03.22-1.47 0-1.03-.68-1.54-1.9-1.54-.7 0-1.28.18-1.68.41l.35.91c.29-.15.65-.3 1.07-.3.42 0 .61.18.61.52 0 .17-.03.38-.08.62l-1.28 4.77h1.58l.32-1.18h.02c.3.5.9.82 1.58.82 1.33 0 2.22-.98 2.22-2.45 0-1.58-1-2.58-2.65-2.58-.68 0-1.25.17-1.57.43l-.32-1.47H5.25l-.18.88h1.23l-1.05 3.88h1.6l.48-1.85c.32-.23.75-.41 1.17-.41.7 0 1.08.38 1.08 1.15 0 .65-.35 1.1-.98 1.1-.38 0-.62-.12-.85-.32l.75.01zM4.18 14.88h1.6l2.08-7.92H6.28l-1.35 6.4h-.03L3.25 6.96H1.58l2.6 7.92z"/></svg>
                          ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          )}
                      </div>
                      <div>
                          <h3 className="font-bold text-navy-900 dark:text-white text-lg">{method.institution} •••• {method.mask}</h3>
                          <p className="text-sm text-gray-500">{method.name} {method.isDefault && <span className="bg-gray-200 dark:bg-navy-600 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded-full ml-2 uppercase font-bold">Default</span>}</p>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                      {method.type === 'bank' && (
                          <div className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                              Verified via Plaid
                          </div>
                      )}
                      {method.type === 'apple_pay' && (
                          <div className="text-[10px] text-white font-bold bg-black px-2 py-1 rounded border border-gray-600 flex items-center gap-1">
                              Apple Pay
                          </div>
                      )}
                      
                      <button 
                        onClick={() => setMethodToDelete(method)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                        title="Remove Payment Method"
                      >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
              </div>
          )) : (
              <div className="text-center py-16 bg-white/50 dark:bg-navy-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-navy-700">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <h3 className="text-navy-900 dark:text-white font-bold mb-1">No payment methods</h3>
                  <p className="text-sm text-gray-500 mb-6">Link a bank account or card to deposit funds.</p>
                  <button onClick={() => { setIsLinking(true); setLinkingStep('select'); }} className="text-gold-500 font-bold text-sm hover:underline">Link Method Now</button>
              </div>
          )}
      </div>

      {/* Linking Modal */}
      {isLinking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-navy-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-navy-700">
                  <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex justify-between items-center">
                      <h3 className="font-bold text-navy-900 dark:text-white">Add Payment Method</h3>
                      <button onClick={() => setIsLinking(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  
                  <div className="p-6">
                      {linkingStep === 'select' && (
                          <div className="space-y-3">
                              <button onClick={handleLinkBank} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-800 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl border border-gray-200 dark:border-navy-700 transition-colors group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-navy-900 rounded-full flex items-center justify-center">
                                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10h16v2H4v-2zm0 4h16v2H4v-2zm0-8h16V8H4v2zM12 2L2 7v2h20V7L12 2z"/></svg>
                                      </div>
                                      <div className="text-left">
                                          <div className="font-bold text-navy-900 dark:text-white">Bank Account</div>
                                          <div className="text-xs text-gray-500">Instant verification via Plaid</div>
                                      </div>
                                  </div>
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>

                              <button onClick={() => setLinkingStep('card-form')} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-800 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl border border-gray-200 dark:border-navy-700 transition-colors group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                      </div>
                                      <div className="text-left">
                                          <div className="font-bold text-navy-900 dark:text-white">Debit / Credit Card</div>
                                          <div className="text-xs text-gray-500">Securely processed by Stripe</div>
                                      </div>
                                  </div>
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>

                              <button onClick={handleAddApplePay} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-navy-800 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-xl border border-gray-200 dark:border-navy-700 transition-colors group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.6 9.48l1.83 5.4h-1.74l-.65-2.07h-2.5l-.62 2.07h-1.69l1.83-5.4h1.54zm-2.03 2.15l-.83-2.67-.85 2.67h1.68zM12.87 11.23c0-.84.67-1.39 1.83-1.39.4 0 .75.05 1.04.14v-.23c0-.52-.42-.82-1.07-.82-.47 0-.91.13-1.25.32l-.4-.85c.48-.3 1.1-.48 1.83-.48 1.45 0 2.4.81 2.4 2.37v4.6h-1.48v-1.01c-.41.67-1.07 1.12-1.92 1.12-1.28 0-2.2-.84-2.2-2.06 0-1.26 1-2.07 2.72-2.07.29 0 .57.03.82.08v-.15c0-.39-.31-.57-.82-.57h-.5zm1.18 1.25c-.2-.04-.41-.06-.63-.06-.82 0-1.25.37-1.25.96 0 .53.4.88 1.01.88.52 0 .87-.27.87-.82v-.96zM8.5 13.91l.37-1.42c.15-.55.22-1.03.22-1.47 0-1.03-.68-1.54-1.9-1.54-.7 0-1.28.18-1.68.41l.35.91c.29-.15.65-.3 1.07-.3.42 0 .61.18.61.52 0 .17-.03.38-.08.62l-1.28 4.77h1.58l.32-1.18h.02c.3.5.9.82 1.58.82 1.33 0 2.22-.98 2.22-2.45 0-1.58-1-2.58-2.65-2.58-.68 0-1.25.17-1.57.43l-.32-1.47H5.25l-.18.88h1.23l-1.05 3.88h1.6l.48-1.85c.32-.23.75-.41 1.17-.41.7 0 1.08.38 1.08 1.15 0 .65-.35 1.1-.98 1.1-.38 0-.62-.12-.85-.32l.75.01zM4.18 14.88h1.6l2.08-7.92H6.28l-1.35 6.4h-.03L3.25 6.96H1.58l2.6 7.92z"/></svg>
                                      </div>
                                      <div className="text-left">
                                          <div className="font-bold text-navy-900 dark:text-white">Apple Pay</div>
                                          <div className="text-xs text-gray-500">Fast & Secure</div>
                                      </div>
                                  </div>
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>
                          </div>
                      )}

                      {linkingStep === 'plaid-loading' && (
                          <div className="text-center py-10 space-y-4">
                              <div className="w-16 h-16 border-4 border-navy-900 dark:border-white border-t-gold-500 rounded-full animate-spin mx-auto"></div>
                              <div>
                                  <h4 className="font-bold text-navy-900 dark:text-white">Connecting to Plaid...</h4>
                                  <p className="text-sm text-gray-500">Initializing secure connection</p>
                              </div>
                          </div>
                      )}

                      {linkingStep === 'plaid-linking' && (
                          <div className="text-center py-10 space-y-4">
                              <div className="w-16 h-16 border-4 border-navy-900 dark:border-white border-t-gold-500 rounded-full animate-spin mx-auto"></div>
                              <div>
                                  <h4 className="font-bold text-navy-900 dark:text-white">Linking Account...</h4>
                                  <p className="text-sm text-gray-500">Setting up your bank connection</p>
                              </div>
                          </div>
                      )}

                      {linkingStep === 'plaid-success' && (
                          <div className="text-center py-10 space-y-4">
                              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <div>
                                  <h4 className="font-bold text-navy-900 dark:text-white">Success!</h4>
                                  <p className="text-sm text-gray-500">Your bank account has been linked.</p>
                              </div>
                          </div>
                      )}

                      {linkingStep === 'plaid-error' && (
                          <div className="text-center py-10 space-y-4">
                              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                              </div>
                              <div>
                                  <h4 className="font-bold text-navy-900 dark:text-white">Connection Failed</h4>
                                  <p className="text-sm text-gray-500">{plaidError || 'Please try again.'}</p>
                              </div>
                              <button
                                  onClick={() => { setLinkingStep('select'); setPlaidError(null); }}
                                  className="mt-4 px-6 py-2 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-lg transition-colors"
                              >
                                  Try Again
                              </button>
                          </div>
                      )}

                      {linkingStep === 'card-form' && (
                          <div className="space-y-4 text-center py-6">
                              <div className="w-16 h-16 bg-gray-100 dark:bg-navy-700 rounded-full flex items-center justify-center mx-auto">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                              </div>
                              <h4 className="font-bold text-navy-900 dark:text-white">Secure Card Payments Coming Soon</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Card payments will be processed securely through Stripe. Use bank transfer or wire in the meantime.</p>
                              <button
                                  onClick={() => setLinkingStep('select')}
                                  className="px-6 py-2 bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-navy-600 transition-colors"
                              >
                                  Back
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {methodToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-navy-800 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-navy-700">
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">Remove Payment Method?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to remove <strong>{methodToDelete.institution} •••• {methodToDelete.mask}</strong>?
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setMethodToDelete(null)}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
