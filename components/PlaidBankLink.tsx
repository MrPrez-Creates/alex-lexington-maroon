import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePlaidLink, PlaidLinkOptions } from 'react-plaid-link';

interface PlaidBankLinkProps {
  customerId: number;
  onSuccess: (accountInfo: BankAccountInfo) => void;
  onExit: () => void;
  onError?: (error: string) => void;
  receivedRedirectUri?: string;
}

interface BankAccountInfo {
  account_id: string;
  account_name: string;
  account_type: string;
  account_mask: string;
  institution_name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

// Timeout durations (ms)
const LOADING_TIMEOUT = 20000; // 20s for link token fetch
const LINKING_TIMEOUT = 30000; // 30s for token exchange

const PlaidBankLink: React.FC<PlaidBankLinkProps> = ({
  customerId,
  onSuccess,
  onExit,
  onError,
  receivedRedirectUri,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'linking' | 'success' | 'error'>('idle');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<BankAccountInfo | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stabilize callback props via refs — prevents parent re-renders (e.g. spot price ticker)
  // from causing link token refetches that kill active Plaid Link sessions
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Track if link token has been fetched (prevent re-fetches from parent re-renders)
  const tokenFetchedRef = useRef(false);

  // Clear any active timeout
  const clearActiveTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearActiveTimeout();
  }, [clearActiveTimeout]);

  // Fetch link token for bank connection
  const fetchLinkToken = useCallback(async (force = false) => {
    // Don't re-fetch if already fetched (unless forced by retry)
    if (tokenFetchedRef.current && !force) return;
    tokenFetchedRef.current = true;

    setStatus('loading');
    setErrorMessage(null);
    clearActiveTimeout();

    // Timeout: if link token takes too long, show error
    timeoutRef.current = setTimeout(() => {
      setErrorMessage('Connection timed out. Please check your internet connection and try again.');
      setStatus('error');
      tokenFetchedRef.current = false; // Allow retry
      onErrorRef.current?.('Link token request timed out');
    }, LOADING_TIMEOUT);

    try {
      // redirect_uri must be registered in Plaid dashboard for OAuth banks (Chase, Wells Fargo, etc.)
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

      clearActiveTimeout();
      setLinkToken(data.link_token);
      setStatus('idle');
    } catch (err: any) {
      clearActiveTimeout();
      console.error('Error fetching link token:', err);
      setErrorMessage(err.message || 'Failed to initialize bank connection');
      setStatus('error');
      tokenFetchedRef.current = false; // Allow retry
      onErrorRef.current?.(err.message);
    }
  }, [customerId, clearActiveTimeout]);

  // Fetch link token on mount ONLY
  useEffect(() => {
    fetchLinkToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle successful bank link
  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    console.log('Plaid bank link success:', metadata);
    setStatus('linking');
    clearActiveTimeout();

    // Timeout: if token exchange takes too long, show error with cancel option
    timeoutRef.current = setTimeout(() => {
      setErrorMessage('Linking is taking longer than expected. Please try again.');
      setStatus('error');
      onErrorRef.current?.('Token exchange timed out');
    }, LINKING_TIMEOUT);

    try {
      // Exchange public token for access token on backend
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

      clearActiveTimeout();

      const accountInfo: BankAccountInfo = {
        account_id: data.account_id,
        account_name: metadata.accounts[0]?.name || 'Bank Account',
        account_type: metadata.accounts[0]?.subtype || 'checking',
        account_mask: metadata.accounts[0]?.mask || '****',
        institution_name: metadata.institution?.name || 'Bank',
      };

      setLinkedAccount(accountInfo);
      setStatus('success');

      setTimeout(() => {
        onSuccessRef.current(accountInfo);
      }, 1500);
    } catch (err: any) {
      clearActiveTimeout();
      console.error('Error exchanging token:', err);
      setErrorMessage(err.message || 'Failed to link bank account');
      setStatus('error');
      onErrorRef.current?.(err.message);
    }
  }, [customerId, clearActiveTimeout]);

  // Track whether onSuccess already fired (prevent onExit from closing modal after success)
  const successFiredRef = useRef(false);
  // Track whether user has started interacting with an institution (prevents false "cancel" on OAuth exits)
  const institutionSelectedRef = useRef(false);

  // Plaid Link configuration
  const plaidConfig: PlaidLinkOptions = {
    token: linkToken || '',
    receivedRedirectUri: receivedRedirectUri || undefined,
    onSuccess: (publicToken, metadata) => {
      console.log('[PlaidBankLink] onSuccess fired:', metadata);
      successFiredRef.current = true;
      institutionSelectedRef.current = false;
      handlePlaidSuccess(publicToken, metadata);
    },
    onExit: (err, metadata) => {
      console.log('[PlaidBankLink] onExit fired:', { err, status: (metadata as any)?.status, metadata });

      // IMPORTANT: Plaid fires onExit AFTER onSuccess in many flows.
      // Only close the modal if onSuccess hasn't already fired.
      if (successFiredRef.current) {
        console.log('[PlaidBankLink] onExit ignored — onSuccess already handled this flow');
        return;
      }

      const exitStatus = (metadata as any)?.status;

      if (err) {
        // Plaid reported an explicit error
        console.error('[PlaidBankLink] Plaid Link error:', err);
        setErrorMessage(err.display_message || err.error_message || 'Connection was interrupted. Please try again.');
        setStatus('error');
        onErrorRef.current?.(err.display_message || 'Connection error');
      } else if (exitStatus && exitStatus !== 'choose_device' && exitStatus !== 'requires_code') {
        // Flow was interrupted with a status (not a clean cancel).
        // Common statuses: requires_credentials, requires_questions, requires_selections,
        // institution_not_found, institution_not_supported, unknown
        console.warn('[PlaidBankLink] Plaid Link exited with status:', exitStatus);
        const statusMessages: Record<string, string> = {
          requires_credentials: 'Your bank requires additional verification. Please try again.',
          requires_questions: 'Security questions were not completed. Please try again.',
          requires_selections: 'Account selection was not completed. Please try again.',
          institution_not_found: 'This bank was not found. Please try a different institution.',
          institution_not_supported: 'This bank is not currently supported for ACH linking.',
        };
        setErrorMessage(statusMessages[exitStatus] || `Connection interrupted. Please try again.`);
        setStatus('error');
        // Fetch a fresh link token to avoid stale state on retry
        setLinkToken(null);
      } else if (institutionSelectedRef.current) {
        // User had selected an institution but onExit fired without error/status.
        // This happens with some OAuth banks (Wells Fargo, Chase) when the flow
        // is interrupted — treat as an error, not a cancel.
        console.warn('[PlaidBankLink] OAuth flow interrupted after institution selection');
        setErrorMessage('Bank connection was interrupted. Please try again.');
        setStatus('error');
        // Fetch a fresh link token to avoid stale OAuth state
        setLinkToken(null);
      } else {
        // Clean cancel — user closed Plaid Link before selecting a bank
        institutionSelectedRef.current = false;
        onExitRef.current();
      }
    },
    onEvent: (eventName, metadata) => {
      console.log('[PlaidBankLink] Plaid event:', eventName, metadata);
      // Track when user selects an institution — helps distinguish cancel from OAuth interruption
      if (eventName === 'SELECT_INSTITUTION' || eventName === 'HANDOFF' || eventName === 'OPEN_OAUTH') {
        institutionSelectedRef.current = true;
      }
    },
  };

  const { open, ready } = usePlaidLink(plaidConfig);

  // Auto-open Plaid Link on OAuth return — once link token is ready, resume the flow
  useEffect(() => {
    if (receivedRedirectUri && linkToken && ready) {
      console.log('[PlaidBankLink] OAuth return — auto-opening Plaid Link');
      successFiredRef.current = false;
      open();
    }
  }, [receivedRedirectUri, linkToken, ready, open]);

  // Open Plaid Link
  const openPlaidLink = useCallback(() => {
    if (!linkToken) {
      setErrorMessage('Link token not ready. Please wait or try again.');
      setStatus('error');
      return;
    }
    if (!ready) {
      setErrorMessage('Plaid is still loading. Please wait a moment.');
      setStatus('error');
      return;
    }
    successFiredRef.current = false;
    institutionSelectedRef.current = false;
    open();
  }, [linkToken, ready, open]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            {status === 'success' ? (
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : status === 'error' ? (
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            {status === 'success' ? 'Bank Account Linked' :
             status === 'error' ? 'Connection Failed' :
             status === 'linking' ? 'Linking Account...' :
             'Link Bank Account'}
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-6">
            {status === 'success' ? `${linkedAccount?.institution_name} account ending in ${linkedAccount?.account_mask} has been linked.` :
             status === 'error' ? errorMessage || 'Please try again.' :
             status === 'linking' ? 'Setting up your bank connection...' :
             'Connect your bank account to fund your Alex Lexington account via ACH transfer.'}
          </p>

          {/* Info section */}
          {status === 'idle' && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-blue-400 uppercase tracking-wider mb-3 font-semibold">How it works:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Securely connect your bank via Plaid</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Initiate ACH transfers to fund your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Funds available in 1-3 business days</span>
                </li>
              </ul>
            </div>
          )}

          {/* Linking spinner */}
          {status === 'linking' && (
            <div className="mb-6 space-y-3">
              <div className="w-12 h-12 mx-auto border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">This may take a few seconds...</p>
            </div>
          )}

          {/* Loading spinner */}
          {status === 'loading' && (
            <div className="mb-6 space-y-3">
              <div className="w-12 h-12 mx-auto border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">Initializing secure connection...</p>
            </div>
          )}

          {/* Success info */}
          {status === 'success' && linkedAccount && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-white font-medium">{linkedAccount.institution_name}</p>
                  <p className="text-gray-400 text-sm capitalize">{linkedAccount.account_type} ****{linkedAccount.account_mask}</p>
                </div>
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {status === 'idle' && (
              <button
                onClick={openPlaidLink}
                disabled={!linkToken}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkToken ? 'Connect Bank Account' : 'Loading...'}
              </button>
            )}

            {status === 'error' && (
              <button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage(null);
                  institutionSelectedRef.current = false;
                  successFiredRef.current = false;
                  setLinkToken(null);
                  fetchLinkToken(true);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:from-blue-400 hover:to-blue-500 transition-all"
              >
                Try Again
              </button>
            )}

            {status === 'success' && (
              <button
                onClick={() => onSuccessRef.current(linkedAccount!)}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-400 transition-colors"
              >
                Continue
              </button>
            )}

            {/* Cancel button — ALWAYS visible except during success (auto-continues) */}
            {status !== 'success' && (
              <button
                onClick={() => {
                  clearActiveTimeout();
                  onExitRef.current();
                }}
                className="w-full text-gray-400 py-2 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Security note */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secured by Plaid
              </span>
              <span>|</span>
              <span>Read-only access</span>
              <span>|</span>
              <span>No stored credentials</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlaidBankLink);
