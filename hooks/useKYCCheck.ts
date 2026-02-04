import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://al-business-api.andre-46c.workers.dev';

interface KYCCheckResult {
  required: boolean;
  reason?: string | null;
  current_status?: string;
  thresholds?: {
    trade: number;
    vault: number;
  };
  error?: boolean;
}

interface KYCSessionResult {
  link_token?: string;
  idv_id?: string;
  shareable_url?: string;
  error?: string;
}

interface KYCStatusResult {
  status: string;
  verified_at?: string | null;
  failure_reason?: string | null;
  attempts?: number;
}

export function useKYCCheck(customerId: number | null) {
  const [isChecking, setIsChecking] = useState(false);
  const [kycRequired, setKycRequired] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [kycReason, setKycReason] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);

  // Check if KYC is required for a given transaction amount
  const checkKYCRequired = useCallback(async (transactionAmount: number): Promise<KYCCheckResult> => {
    if (!customerId) {
      return { required: false };
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/kyc/check-required`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          transaction_amount: transactionAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check KYC requirement');
        return { required: false, error: true };
      }

      setKycRequired(data.required);
      setKycReason(data.reason);
      setKycStatus(data.current_status);

      return data;
    } catch (err) {
      console.error('KYC check error:', err);
      setError('Network error checking KYC requirement');
      return { required: false, error: true };
    } finally {
      setIsChecking(false);
    }
  }, [customerId]);

  // Initiate KYC verification session with Plaid
  const initiateKYC = useCallback(async (prefillData?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<KYCSessionResult | null> => {
    if (!customerId) {
      setError('Customer ID required to initiate KYC');
      return null;
    }

    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/kyc/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          prefill_data: prefillData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create verification session');
        return { error: data.error };
      }

      if (data.link_token) {
        setLinkToken(data.link_token);
        setKycStatus('pending');
      }

      return data;
    } catch (err) {
      console.error('Initiate KYC error:', err);
      setError('Network error creating verification session');
      return null;
    }
  }, [customerId]);

  // Get current KYC status
  const getKYCStatus = useCallback(async (): Promise<KYCStatusResult | null> => {
    if (!customerId) return null;

    try {
      const response = await fetch(`${API_BASE}/api/kyc/status/${customerId}`);
      const data = await response.json();

      if (response.ok) {
        setKycStatus(data.status);
        return data;
      }

      return null;
    } catch (err) {
      console.error('Get KYC status error:', err);
      return null;
    }
  }, [customerId]);

  // Retry KYC verification
  const retryKYC = useCallback(async (): Promise<KYCSessionResult | null> => {
    if (!customerId) {
      setError('Customer ID required to retry KYC');
      return null;
    }

    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/kyc/retry/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to retry verification');
        return { error: data.error };
      }

      if (data.link_token) {
        setLinkToken(data.link_token);
        setKycStatus('pending');
      }

      return data;
    } catch (err) {
      console.error('Retry KYC error:', err);
      setError('Network error retrying verification');
      return null;
    }
  }, [customerId]);

  // Clear KYC state
  const clearKYC = useCallback(() => {
    setKycRequired(false);
    setLinkToken(null);
    setKycReason(null);
    setError(null);
  }, []);

  return {
    // State
    isChecking,
    kycRequired,
    kycReason,
    linkToken,
    kycStatus,
    error,
    // Actions
    checkKYCRequired,
    initiateKYC,
    getKYCStatus,
    retryKYC,
    clearKYC,
  };
}

export default useKYCCheck;
