
import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { deleteUserAccount } from '../services/authService';
import { updateCustomerProfile } from '../services/apiService';
import { verifyAddress } from '../services/geminiService';
import { UserProfile, Address, ViewState } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userProfile: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate?: (view: ViewState) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, user, userProfile, onLogout, isDarkMode, toggleDarkMode, onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState<Address>({ street: '', street2: '', city: '', state: '', zip: '', country: '' });
  
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Use profile data if available, fallback to Auth user (Supabase format)
  const displayName = userProfile?.name || user?.user_metadata?.full_name || 'Valued Client';
  const displayEmail = userProfile?.email || user?.email || '';
  const displayPhoto = editPhotoPreview || userProfile?.photoURL || user?.user_metadata?.avatar_url;
  const kycStatus = userProfile?.kycStatus || 'unverified';
  const displayOrg = userProfile?.organization;
  const linkedMethodsCount = userProfile?.paymentMethods?.length || 0;

  const startEdit = () => {
    setEditName(displayName);
    setEditOrganization(userProfile?.organization || '');
    setEditPhone(userProfile?.phoneNumber || '');
    setEditAddress(userProfile?.billingAddress || { street: '', street2: '', city: '', state: '', zip: '', country: '' });
    setEditPhoto(null);
    setEditPhotoPreview(null);
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhoto(file);
      setEditPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditAddress(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const handleVerifyAddress = async () => {
      setIsVerifying(true);
      try {
          const result = await verifyAddress(editAddress);
          if (result.isFound) {
              setEditAddress(result.verifiedAddress);
              // Optional: Show success toast or visual indicator
          } else {
              alert("Address could not be verified by Google Maps. Please check for typos.");
          }
      } catch (error) {
          console.error("Verification failed", error);
          alert("Verification service unavailable.");
      } finally {
          setIsVerifying(false);
      }
  };

  const handleSaveProfile = async () => {
      try {
          await updateCustomerProfile({
              name: editName,
              phone: editPhone,
          });
          setIsEditing(false);
      } catch (e) {
          console.error("Failed to update profile", e);
          alert("Failed to update profile");
      }
  };

  const handleDeleteAccount = async () => {
      try {
          await deleteUserAccount();
          onClose(); // Will trigger logout flow in App.tsx due to auth state change
      } catch (e) {
          console.error("Failed to delete account", e);
          alert("Failed to delete account. You may need to re-login first.");
      }
  };

  const menuItems = [
    { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', label: 'Explore', sub: 'Discover features', action: () => onNavigate && onNavigate('explore') },
    { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Vault Status', sub: 'Active', action: () => onNavigate && onNavigate('vault') },
    { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Transaction History', action: () => onNavigate && onNavigate('history') },
    { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Payment Methods', sub: `${linkedMethodsCount} Linked`, action: () => onNavigate && onNavigate('payment-methods') },
    { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Documents & Files', action: () => onNavigate && onNavigate('documents') },
    { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Customers', sub: 'Admin', action: () => onNavigate && onNavigate('customers') },
    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Command Center', sub: 'Risk/ERP', action: () => onNavigate && onNavigate('admin-risk') },
    { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', label: 'Support Center', action: () => onNavigate && onNavigate('contact-support') },
    { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Admin: Tickets', sub: 'Internal', action: () => onNavigate && onNavigate('admin-support') },
    { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Preferences', action: toggleDarkMode, sub: isDarkMode ? 'Dark Mode On' : 'Light Mode On' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in">
      <div className="w-full h-full bg-navy-900 text-white flex flex-col overflow-hidden animate-slide-right">
        
        {/* Header */}
        <div className="pt-safe-top px-6 pb-6 pt-12 flex flex-col items-center relative border-b border-white/5">
          <button 
            onClick={onClose}
            className="absolute top-12 left-6 w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center hover:bg-navy-700 transition-colors border border-white/5"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {!isEditing ? (
             <>
                <div className="w-20 h-20 rounded-full bg-navy-800 border-2 border-gold-500/50 flex items-center justify-center mb-4 shadow-xl shadow-gold-500/10 overflow-hidden relative group">
                    {displayPhoto ? (
                        <img src={displayPhoto} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-serif font-bold text-2xl text-gold-500">
                            {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                    )}
                </div>
                
                <h2 className="text-xl font-bold tracking-tight">{displayName}</h2>
                {displayOrg && <p className="text-sm text-gold-500 font-medium">{displayOrg}</p>}
                
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">{displayEmail}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${kycStatus === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {kycStatus}
                    </span>
                </div>

                <button 
                    onClick={startEdit}
                    className="mt-4 text-xs font-bold text-gold-500 hover:text-white transition-colors border border-gold-500/30 px-4 py-1.5 rounded-full hover:bg-gold-500/10"
                >
                    Edit Profile
                </button>
             </>
          ) : (
             <div className="w-full max-w-sm animate-fade-in overflow-y-auto max-h-[85vh] pr-2 no-scrollbar">
                <div className="flex flex-col items-center mb-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-full bg-navy-800 border-2 border-dashed border-gold-500/50 flex items-center justify-center mb-2 overflow-hidden cursor-pointer hover:border-gold-500 transition-colors relative"
                    >
                        {displayPhoto ? (
                             <>
                                <img src={displayPhoto} alt="Preview" className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                             </>
                        ) : (
                             <svg className="w-8 h-8 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                    </div>
                    <span className="text-[10px] text-gray-400">Tap to change photo</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Full Name</label>
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Organization</label>
                        <input 
                            type="text" 
                            value={editOrganization}
                            onChange={(e) => setEditOrganization(e.target.value)}
                            placeholder="Company LLC"
                            className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Phone Number</label>
                        <input 
                            type="tel" 
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    
                    <div>
                         <div className="flex justify-between items-center mb-2 pt-2 border-t border-white/10 mt-2">
                             <label className="block text-[10px] uppercase text-gray-500 font-bold">Billing Address</label>
                             <button 
                                type="button" 
                                onClick={handleVerifyAddress}
                                disabled={isVerifying}
                                className="text-[10px] font-bold text-gold-500 hover:text-white flex items-center gap-1 disabled:opacity-50"
                             >
                                {isVerifying ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3 text-gold-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Verify with Google Maps
                                    </>
                                )}
                             </button>
                         </div>
                         <div className="space-y-2">
                             <input 
                                name="street"
                                type="text" 
                                value={editAddress.street}
                                onChange={handleAddressChange}
                                placeholder="Street Address"
                                className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                             />
                             <input 
                                name="street2"
                                type="text" 
                                value={editAddress.street2 || ''}
                                onChange={handleAddressChange}
                                placeholder="Apt, Suite, Unit, etc."
                                className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                             />
                             <div className="grid grid-cols-2 gap-2">
                                <input 
                                    name="city"
                                    type="text" 
                                    value={editAddress.city}
                                    onChange={handleAddressChange}
                                    placeholder="City"
                                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                                />
                                <input 
                                    name="state"
                                    type="text" 
                                    value={editAddress.state}
                                    onChange={handleAddressChange}
                                    placeholder="State/Prov"
                                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <input 
                                    name="zip"
                                    type="text" 
                                    value={editAddress.zip}
                                    onChange={handleAddressChange}
                                    placeholder="Zip/Postal"
                                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                                />
                                <input 
                                    name="country"
                                    type="text" 
                                    value={editAddress.country}
                                    onChange={handleAddressChange}
                                    placeholder="Country"
                                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
                                />
                             </div>
                         </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveProfile}
                        className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-lg text-xs font-bold transition-colors"
                    >
                        Save
                    </button>
                </div>

                <div className="mt-6 border-t border-white/5 pt-4 text-center pb-8">
                    {!showDeleteConfirm ? (
                        <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-xs text-red-500 hover:text-red-400 font-bold tracking-wide uppercase"
                        >
                            Delete Account
                        </button>
                    ) : (
                        <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <p className="text-[10px] text-red-200 mb-2">Are you sure? This cannot be undone.</p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={() => setShowDeleteConfirm(false)} className="text-[10px] text-gray-300 hover:text-white px-2 py-1">Cancel</button>
                                <button onClick={handleDeleteAccount} className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Confirm Delete</button>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          )}
        </div>

        {/* Content */}
        {!isEditing && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="border-t border-white/5 mt-6">
                    {menuItems.map((item, index) => (
                        <div 
                            key={index}
                            onClick={item.action}
                            className="flex items-center justify-between px-6 py-4 border-b border-white/5 hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{item.label}</div>
                                    {item.sub && <div className="text-[10px] text-gray-500">{item.sub}</div>}
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    ))}
                </div>
                <div className="p-6">
                    <button 
                        onClick={onLogout}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors mb-4 border border-white/10"
                    >
                        Log Out
                    </button>
                    <div className="text-center">
                        <div className="text-[10px] text-gray-600">Build 54565</div>
                        <div className="text-center text-[10px] text-gray-600">Version 25.1125.0/1</div>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right {
          animation: slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default SideMenu;
