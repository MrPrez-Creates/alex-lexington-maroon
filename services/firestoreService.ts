
import firebase from 'firebase/compat/app';
import { db, storage } from '../firebaseConfig';
import { supabase } from '../lib/supabase';
import { BullionItem, Transaction, StoredFile, UserProfile, Address, PriceAlert, CustomerProfile, PurchaseOrder, PurchaseItem, AssetForm, WeightUnit, MetalType, PaymentMethod, MarketHistoryRecord, SupportTicket, TicketStatus, SharedCustomer, VaultHolding, SharedTransaction, SharedTask } from '../types';
import { syncCustomerToApi, updateCustomerProfile as updateApiCustomerProfile, USE_API_SYNC } from './apiService';

// Re-export types for consumers
export type { UserProfile, Address, CustomerProfile, SharedCustomer, VaultHolding, SharedTransaction, SharedTask };

// --- Helpers ---
const convertToFirestoreData = (data: any): any => {
  return JSON.parse(JSON.stringify(data));
};

const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  // Check for Firestore Timestamp (seconds, nanoseconds)
  if (typeof data === 'object' && data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Date(data.seconds * 1000 + data.nanoseconds / 1000000).toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const newData: any = {};
    for (const key in data) {
      newData[key] = sanitizeData(data[key]);
    }
    return newData;
  }
  
  return data;
};

// Remove keys with undefined values to prevent Firestore errors
const cleanPayload = (data: any): any => {
  if (data === null || data === undefined) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => cleanPayload(item)).filter(i => i !== undefined);
  }
  
  if (typeof data === 'object') {
    // Preserve Date objects, though usually serialized to ISO strings in this app
    if (data instanceof Date) return data;

    const newData: any = {};
    for (const key in data) {
      const value = data[key];
      if (value !== undefined) {
        newData[key] = cleanPayload(value);
      }
    }
    return newData;
  }
  
  return data;
};

// --- Auth Functions (Now using Supabase) ---

export const loginWithEmail = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass
  });

  if (error) throw error;

  // Sync to Command Center API on login (non-blocking)
  syncCustomerToApi().catch(e => console.warn('API sync failed:', e));

  return data;
};

export const registerWithEmail = async (email: string, pass: string, name: string, photoFile: File | null) => {
  // Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: name,
        display_name: name,
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed - no user returned');

  const user = data.user;

  // Upload profile photo if provided (still using Firebase Storage)
  let photoURL = null;
  if (photoFile) {
    const ref = storage.ref(`profile_photos/${user.id}`);
    await ref.put(photoFile);
    photoURL = await ref.getDownloadURL();
  }

  // Parse first/last name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Create User Profile Doc (Maroon app internal - still using Firestore)
  await db.collection('users').doc(user.id).set({
    uid: user.id,
    email: email,
    name: name,
    photoURL: photoURL,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    phoneNumber: '',
    kycStatus: 'unverified',
    billingAddress: {},
    cashBalance: 0,
    settings: { darkMode: true, currency: 'USD' }
  });

  // Create Shared Customer Doc (visible in Command Center)
  const sharedCustomer: SharedCustomer = {
    id: user.id,
    name: name,
    firstName: firstName,
    lastName: lastName,
    phone: '',
    email: email,
    type: 'RETAIL',
    kycStatus: 'unverified',
    maroonUserId: user.id, // Critical link field - now Supabase UID
    cashBalance: 0,
    lifetimeBuyTotal: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('customers').doc(user.id).set(cleanPayload(sharedCustomer));

  // Sync to Command Center API (non-blocking)
  syncCustomerToApi().catch(e => console.warn('API sync failed:', e));

  return data;
};

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        prompt: 'select_account'
      }
    }
  });

  if (error) throw error;

  // Note: API sync will happen on redirect back via onAuthStateChange
  return data;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
};

export const requestPhoneCode = async (phoneNumber: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber
  });
  if (error) throw error;
  return 'code_sent';
};

export const verifyPhoneCode = async (phoneNumber: string, code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: code,
    type: 'sms'
  });
  if (error) throw error;
  return data;
};

export const deleteUserAccount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await db.collection('users').doc(user.id).delete();
    // Note: Full account deletion requires admin privileges in Supabase
    await supabase.auth.signOut();
  }
};

// --- Helper to get current Supabase user ID ---
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

// Cached user ID for synchronous operations (updated via auth listener)
let cachedUserId: string | null = null;

// Initialize cached user ID
supabase.auth.getUser().then(({ data: { user } }) => {
  cachedUserId = user?.id ?? null;
});

// Update cached user ID on auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id ?? null;
});

// --- User Data Subscriptions ---

export const subscribeToUserProfile = (callback: (profile: UserProfile | null) => void) => {
    const userId = cachedUserId;
    if (!userId) {
        callback(null);
        return () => {};
    }
    return db.collection('users').doc(userId).onSnapshot(doc => {
        if (doc.exists) {
            callback(sanitizeData(doc.data()) as UserProfile);
        } else {
            callback(null);
        }
    });
};

export const subscribeToInventory = (callback: (items: BullionItem[]) => void) => {
    const userId = cachedUserId;
    if (!userId) return () => {};
    return db.collection('users').doc(userId).collection('inventory').onSnapshot(snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...sanitizeData(doc.data()) } as BullionItem));
        callback(items);
    });
};

export const subscribeToTransactions = (callback: (txs: Transaction[]) => void) => {
    const userId = cachedUserId;
    if (!userId) return () => {};
    return db.collection('users').doc(userId).collection('transactions').orderBy('date', 'desc').onSnapshot(snapshot => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...sanitizeData(doc.data()) } as Transaction));
        callback(txs);
    });
};

export const subscribeToAlerts = (callback: (alerts: PriceAlert[]) => void) => {
    const userId = cachedUserId;
    if (!userId) return () => {};
    return db.collection('users').doc(userId).collection('alerts').onSnapshot(snapshot => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...sanitizeData(doc.data()) } as PriceAlert));
        callback(alerts);
    });
};

export const subscribeToUserFiles = (callback: (files: StoredFile[]) => void) => {
    const userId = cachedUserId;
    if (!userId) return () => {};
    return db.collection('users').doc(userId).collection('files').orderBy('uploadedAt', 'desc').onSnapshot(snapshot => {
        const files = snapshot.docs.map(doc => ({ id: doc.id, ...sanitizeData(doc.data()) } as StoredFile));
        callback(files);
    });
};

// --- Data Operations ---

export const updateUserProfile = async (updates: Partial<UserProfile>, photoFile?: File) => {
    const userId = cachedUserId;
    if (!userId) return;

    let photoURL = updates.photoURL;
    if (photoFile) {
         const ref = storage.ref(`profile_photos/${userId}`);
         await ref.put(photoFile);
         photoURL = await ref.getDownloadURL();
         updates.photoURL = photoURL;
    }

    await db.collection('users').doc(userId).update(cleanPayload(updates));

    // Sync changes to shared customer collection for Command Center
    await syncToSharedCustomer(updates);
};

export const updateUserBalance = async (uid: string, newBalance: number) => {
    await db.collection('users').doc(uid).update({ cashBalance: newBalance });

    // Sync to shared customer collection
    try {
        await db.collection('customers').doc(uid).update({
            cashBalance: newBalance,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        // Customer doc might not exist yet
        console.warn("Could not sync balance to customers collection");
    }
};

export const updateUserSettings = async (settings: any) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).set({ settings: cleanPayload(settings) }, { merge: true });
};

// Inventory
export const addInventoryItem = async (item: BullionItem) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).collection('inventory').doc(item.id).set(cleanPayload(item));
};

export const updateInventoryItem = async (item: BullionItem) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).collection('inventory').doc(item.id).update(cleanPayload(item));
};

export const deleteInventoryItem = async (itemId: string) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).collection('inventory').doc(itemId).delete();
};

// Transactions
export const addTransaction = async (tx: Transaction) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).collection('transactions').doc(tx.id).set(cleanPayload(tx));
};

// Alerts
export const addPriceAlert = async (alert: PriceAlert) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).collection('alerts').doc(alert.id).set(cleanPayload(alert));
};

export const deletePriceAlert = async (alertId: string) => {
    const userId = cachedUserId;
    if (!userId) return;
    await db.collection('users').doc(userId).collection('alerts').doc(alertId).delete();
};

// Files
export const uploadUserFile = async (file: File, path: string = '', notes: string = '') => {
    const userId = cachedUserId;
    if (!userId) return;

    const fileId = Date.now().toString();
    const storagePath = `user_files/${userId}/${fileId}_${file.name}`;
    const ref = storage.ref(storagePath);
    await ref.put(file);
    const downloadURL = await ref.getDownloadURL();

    const storedFile: StoredFile = {
        id: fileId,
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        path: storagePath,
        notes: notes
    };

    await db.collection('users').doc(userId).collection('files').doc(fileId).set(cleanPayload(storedFile));
};

export const deleteUserFile = async (fileId: string, storagePath: string) => {
    const userId = cachedUserId;
    if (!userId) return;

    await storage.ref(storagePath).delete();
    await db.collection('users').doc(userId).collection('files').doc(fileId).delete();
};

// Market History
export const saveMarketHistoryRecord = async (record: MarketHistoryRecord) => {
    // Using a shared collection for market history
    try {
        await db.collection('market_history').doc(record.date).set(cleanPayload(record));
        return true;
    } catch (e: any) {
        // Suppress permission-denied errors as standard users might not have write access
        // to the global market history collection.
        if (e.code !== 'permission-denied') {
            console.error("Error saving market history", e);
        }
        return false;
    }
};

export const getMarketHistory = async (): Promise<MarketHistoryRecord[]> => {
    try {
        const snapshot = await db.collection('market_history').orderBy('date', 'desc').limit(365).get();
        return snapshot.docs.map(doc => sanitizeData(doc.data()) as MarketHistoryRecord);
    } catch (e: any) {
        if (e.code !== 'permission-denied') {
            console.error("Error fetching market history", e);
        }
        return [];
    }
};

// Payment Methods
export const addPaymentMethod = async (method: PaymentMethod) => {
    const userId = cachedUserId;
    if (!userId) return;
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) return;
        const data = sanitizeData(doc.data()) as UserProfile;
        const methods = data.paymentMethods || [];
        if (methods.length === 0) method.isDefault = true;

        t.update(userRef, {
            paymentMethods: [...methods, cleanPayload(method)]
        });
    });
};

export const deletePaymentMethod = async (methodId: string) => {
    const userId = cachedUserId;
    if (!userId) return;
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) return;
        const data = sanitizeData(doc.data()) as UserProfile;
        const methods = data.paymentMethods || [];
        const newMethods = methods.filter(m => m.id !== methodId);

        t.update(userRef, {
            paymentMethods: newMethods
        });
    });
};

export const linkBankAccount = async (bankDetails: any) => {
    console.log("Linking bank", bankDetails);
};

// Admin / Customers
export const subscribeToCustomers = (callback: (customers: CustomerProfile[]) => void) => {
    // In a real app, this should be secured by admin claims
    return db.collection('customers').limit(100).onSnapshot(snapshot => {
        const customers = snapshot.docs.map(doc => ({ id: doc.id, ...sanitizeData(doc.data()) } as CustomerProfile));
        callback(customers);
    }, (error) => {
        console.warn("Customer subscription failed (likely insufficient permissions):", error.message);
    });
};

export const importWooCommerceData = async (csvText: string) => {
    const rows = csvText.split('\n').slice(1); // Skip header
    let success = 0;
    let errors = 0;
    
    const batch = db.batch();
    
    // We process up to 450 items to stay within Firestore batch limits, simplistic approach
    const limitRows = rows.slice(0, 450);

    limitRows.forEach((row, index) => {
        if (!row.trim()) return;
        try {
            const cols = row.split(',');
            if (cols.length < 3) return;
            
            const email = cols[3]?.trim();
            if (!email) return;

            const profile: CustomerProfile = {
                id: email, // use email as ID for dedupe
                firstName: cols[1]?.trim(),
                lastName: cols[2]?.trim(),
                email: email,
                totalSpent: parseFloat(cols[4] || '0'),
                lastActive: new Date().toISOString(),
                contact_info: { emails: [email], phones: [], known_names: [] },
                purchase_history: []
            };

            const ref = db.collection('customers').doc(email);
            batch.set(ref, cleanPayload(profile), { merge: true });
            success++;
        } catch (e) {
            errors++;
        }
    });

    if (success > 0) {
        await batch.commit();
    }
    return { success, errors };
};

// --- Support Ticketing System ---

export const createSupportTicket = async (subject: string, message: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) throw new Error("User not authenticated");

    const ticket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.full_name || 'Unknown User',
        subject: subject,
        message: message,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await db.collection('tickets').doc(ticket.id).set(cleanPayload(ticket));
    return ticket.id;
};

export const subscribeToSupportTickets = (callback: (tickets: SupportTicket[]) => void) => {
    // In a real app, this should be secured by admin claims
    return db.collection('tickets').orderBy('createdAt', 'desc').limit(100).onSnapshot(snapshot => {
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...sanitizeData(doc.data()) } as SupportTicket));
        callback(tickets);
    }, (error) => {
        console.warn("Ticket subscription failed:", error.message);
    });
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    await db.collection('tickets').doc(ticketId).update({
        status: status,
        updatedAt: new Date().toISOString()
    });
};

// ============================================================================
// SHARED COLLECTIONS (Command Center Integration)
// ============================================================================

// --- Sync Helper ---
export const syncToSharedCustomer = async (profile: Partial<UserProfile>) => {
    const userId = cachedUserId;
    if (!userId) return;

    const updates: Partial<SharedCustomer> = {};
    if (profile.name) {
        updates.name = profile.name;
        const nameParts = profile.name.trim().split(' ');
        updates.firstName = nameParts[0] || '';
        updates.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (profile.phoneNumber) updates.phone = profile.phoneNumber;
    if (profile.email) updates.email = profile.email;
    if (profile.kycStatus) updates.kycStatus = profile.kycStatus as SharedCustomer['kycStatus'];
    if (profile.cashBalance !== undefined) updates.cashBalance = profile.cashBalance;

    if (Object.keys(updates).length > 0) {
        try {
            await db.collection('customers').doc(userId).update({
                ...cleanPayload(updates),
                updatedAt: new Date().toISOString()
            });
        } catch (e) {
            console.warn("Could not sync to shared customer");
        }
    }
};

// --- Vault Holdings Functions ---

export const subscribeToVaultHoldings = (callback: (holdings: VaultHolding[]) => void) => {
    const userId = cachedUserId;
    if (!userId) {
        callback([]);
        return () => {};
    }

    return db.collection('vaultHoldings')
        .where('customerId', '==', userId)
        .orderBy('depositedAt', 'desc')
        .onSnapshot(snapshot => {
            const holdings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...sanitizeData(doc.data())
            } as VaultHolding));
            callback(holdings);
        }, (error) => {
            console.warn("Vault holdings subscription failed:", error.message);
            callback([]);
        });
};

export const addVaultHolding = async (holding: Omit<VaultHolding, 'id' | 'customerId' | 'depositedAt' | 'updatedAt'>): Promise<string> => {
    const userId = cachedUserId;
    if (!userId) throw new Error("User not authenticated");

    const holdingId = `vh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newHolding: VaultHolding = {
        id: holdingId,
        customerId: userId,
        ...holding,
        depositedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await db.collection('vaultHoldings').doc(holdingId).set(cleanPayload(newHolding));
    return holdingId;
};

export const getVaultTotals = async (): Promise<{ gold: number; silver: number; platinum: number; palladium: number }> => {
    const userId = cachedUserId;
    if (!userId) return { gold: 0, silver: 0, platinum: 0, palladium: 0 };

    const snapshot = await db.collection('vaultHoldings')
        .where('customerId', '==', userId)
        .where('status', '==', 'held')
        .get();

    const totals = { gold: 0, silver: 0, platinum: 0, palladium: 0 };

    snapshot.docs.forEach(doc => {
        const holding = doc.data() as VaultHolding;
        if (holding.metal in totals) {
            totals[holding.metal as keyof typeof totals] += holding.weightOzt || 0;
        }
    });

    return totals;
};

// --- Shared Transaction Functions ---

export const createSharedTransaction = async (
    tx: Omit<SharedTransaction, 'id' | 'customerId' | 'source' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    const userId = cachedUserId;
    if (!userId) throw new Error("User not authenticated");

    const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const sharedTx: SharedTransaction = {
        id: txId,
        customerId: userId,
        source: 'MAROON',
        ...tx,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await db.collection('transactions').doc(txId).set(cleanPayload(sharedTx));
    return txId;
};

export const subscribeToSharedTransactions = (callback: (txs: SharedTransaction[]) => void) => {
    const userId = cachedUserId;
    if (!userId) {
        callback([]);
        return () => {};
    }

    return db.collection('transactions')
        .where('customerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(snapshot => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...sanitizeData(doc.data())
            } as SharedTransaction));
            callback(txs);
        }, (error) => {
            console.warn("Shared transactions subscription failed:", error.message);
            callback([]);
        });
};

// --- Task Functions ---

export const createTask = async (
    task: Omit<SharedTask, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: SharedTask = {
        id: taskId,
        status: 'pending',
        ...task,
        createdAt: new Date().toISOString()
    };
    
    await db.collection('tasks').doc(taskId).set(cleanPayload(newTask));
    return taskId;
};

export const createKycReviewTask = async (userName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await createTask({
        type: 'kyc_review',
        label: 'KYC Verification Request',
        detail: `${userName} (${user.email}) submitted KYC verification from Maroon app`,
        priority: 'normal',
        entityType: 'customer',
        entityId: user.id
    });
};

export const createWithdrawalTask = async (metal: string, weightOzt: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await createTask({
        type: 'withdrawal_request',
        label: 'Vault Withdrawal Request',
        detail: `Request to withdraw ${weightOzt} oz ${metal} from vault`,
        priority: 'high',
        entityType: 'customer',
        entityId: user.id
    });
};
