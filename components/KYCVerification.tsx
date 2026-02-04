import React, { useState, useCallback, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOptions } from 'react-plaid-link';

interface KYCVerificationProps {
  customerId: number;
  linkToken: string;
  onSuccess: () => void;
  onExit: () => void;
  onError?: (error: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

const KYCVerification: React.FC<KYCVerificationProps> = ({
  customerId,
  linkToken,
  onSuccess,
  onExit,
  onError,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'verifying' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll for status after Plaid Link completes
  const checkVerificationStatus = useCallback(async (attempts = 0) => {
    if (attempts > 10) {
      // After 10 attempts (20 seconds), show manual check option
      setStatus('verifying');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/kyc/status/${customerId}`);
      const data = await response.json();

      if (data.status === 'verified') {
        setStatus('success');
        setTimeout(onSuccess, 1500);
      } else if (data.status === 'failed') {
        setStatus('failed');
        setErrorMessage(data.failure_reason || 'Verification failed. Please try again.');
      } else if (data.status === 'pending') {
        // Still pending, check again in 2 seconds
        setTimeout(() => checkVerificationStatus(attempts + 1), 2000);
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
    }
  }, [customerId, onSuccess]);

  // Handle Plaid Link success
  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    console.log('Plaid Link success:', metadata);
    setStatus('verifying');

    // Start polling for verification status
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  // Handle Plaid Link exit
  const handlePlaidExit = useCallback((err: any, metadata: any) => {
    console.log('Plaid Link exited:', err, metadata);
    if (err) {
      setErrorMessage(err.display_message || 'Verification was interrupted');
      onError?.(err.display_message || 'Verification error');
    }
    onExit();
  }, [onExit, onError]);

  // Plaid Link configuration
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
    onEvent: (eventName, metadata) => {
      console.log('Plaid event:', eventName, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Open Plaid Link
  const openPlaidLink = useCallback(() => {
    setStatus('loading');
    if (ready) {
      open();
    }
  }, [ready, open]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            {status === 'success' ? (
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : status === 'failed' ? (
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            {status === 'success' ? 'Verification Complete' :
             status === 'failed' ? 'Verification Failed' :
             status === 'verifying' ? 'Verifying Identity...' :
             'Identity Verification Required'}
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-6">
            {status === 'success' ? 'Your identity has been verified successfully.' :
             status === 'failed' ? errorMessage || 'Please try again or contact support.' :
             status === 'verifying' ? 'Please wait while we confirm your verification...' :
             'To comply with federal regulations, we need to verify your identity for transactions over $10,000.'}
          </p>

          {/* What to expect - only show on idle/loading */}
          {(status === 'idle' || status === 'loading') && (
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-amber-500 uppercase tracking-wider mb-3 font-semibold">What you'll need:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Government-issued photo ID
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Phone for SMS verification
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Camera for selfie verification
                </li>
              </ul>
            </div>
          )}

          {/* Verifying spinner */}
          {status === 'verifying' && (
            <div className="mb-6">
              <div className="w-12 h-12 mx-auto border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Success checkmark animation */}
          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-500/20 rounded-xl">
              <p className="text-green-400 text-sm">You can now proceed with your transaction.</p>
            </div>
          )}

          {/* Failed message */}
          {status === 'failed' && (
            <div className="mb-6 p-4 bg-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {status === 'idle' && (
              <button
                onClick={openPlaidLink}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 py-3 rounded-xl font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg"
              >
                Begin Verification
              </button>
            )}

            {status === 'loading' && (
              <button
                disabled
                className="w-full bg-amber-500/50 text-slate-900 py-3 rounded-xl font-bold cursor-wait"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </span>
              </button>
            )}

            {status === 'failed' && (
              <button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage(null);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 py-3 rounded-xl font-bold hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Try Again
              </button>
            )}

            {status === 'success' && (
              <button
                onClick={onSuccess}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-400 transition-colors"
              >
                Continue
              </button>
            )}

            {status !== 'verifying' && status !== 'success' && (
              <button
                onClick={onExit}
                className="w-full text-gray-400 py-2 text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secured by Plaid
              </span>
              <span>|</span>
              <span>256-bit encryption</span>
              <span>|</span>
              <span>Bank-level security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
