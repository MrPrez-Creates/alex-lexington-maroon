
import React, { useState, useEffect } from 'react';
import { PaymentMethod, UserProfile } from '../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
  availableBalance?: number;
  userProfile: UserProfile | null;
  onConfirm: (amount: number, type: 'deposit' | 'withdraw') => void;
}

type Step = 'asset' | 'amount' | 'method' | 'add-method' | 'review' | 'speed';

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, type, availableBalance = 0, userProfile, onConfirm }) => {
  // Deposit skips "asset" selection as it's implicit (Cash)
  const [step, setStep] = useState<Step>(type === 'withdraw' ? 'asset' : 'amount');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [speed, setSpeed] = useState<'standard' | 'instant'>('standard');

  const methods = userProfile?.paymentMethods || [];
  
  // Set default method on open
  useEffect(() => {
      if (isOpen && methods.length > 0 && !selectedMethod) {
          const def = methods.find(m => m.isDefault) || methods[0];
          setSelectedMethod(def);
      }
  }, [isOpen, methods, selectedMethod]);

  // Handle Physical Keyboard Input for Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen || step !== 'amount') return;
        
        if (/^[0-9]$/.test(e.key)) {
            setAmount(prev => {
                if (prev === '0' && e.key === '0') return prev;
                if (prev === '0' && e.key !== '.') return e.key;
                return prev + e.key;
            });
        } else if (e.key === '.') {
            setAmount(prev => prev.includes('.') ? prev : prev + '.');
        } else if (e.key === 'Backspace') {
            setAmount(prev => prev.slice(0, -1));
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleNext = () => {
      if (step === 'asset') setStep('amount');
      else if (step === 'amount') setStep('method');
      else if (step === 'method') setStep('review');
  };

  const handleBack = () => {
      if (step === 'amount') {
          if (type === 'withdraw') setStep('asset');
          else onClose(); // Deposit starts at amount, so back closes
      }
      else if (step === 'method') setStep('amount');
      else if (step === 'add-method') setStep('method');
      else if (step === 'review') setStep('method');
      else if (step === 'speed') setStep('method');
  };

  const handleConfirmTransfer = () => {
      const val = parseFloat(amount);
      if (val > 0) {
          onConfirm(val, type);
      }
  };

  const handleKeypadInput = (val: number | string) => {
      if (val === '.') {
          setAmount(prev => prev.includes('.') ? prev : prev + '.');
      } else {
          setAmount(prev => {
              if (prev === '0' && val === 0) return prev;
              if (prev === '0') return String(val);
              return prev + String(val);
          });
      }
  };

  const getTitle = () => {
      if (step === 'asset') return `Select asset to withdraw`;
      if (step === 'amount') return `${type === 'deposit' ? 'Deposit cash' : 'Withdraw USD'}`;
      if (step === 'method') return `Payment methods`;
      if (step === 'add-method') return `Add payment method`;
      if (step === 'speed') return 'Transfer method';
      return 'Review Transfer';
  };

  const calculateFee = () => {
      if (type === 'withdraw' && speed === 'instant') return 25.00; // Wire
      
      // Card/Apple Pay Deposit Fee
      if (type === 'deposit' && selectedMethod && (selectedMethod.type === 'card' || selectedMethod.type === 'apple_pay')) {
          const val = parseFloat(amount) || 0;
          return val * 0.035;
      }
      return 0;
  };

  // Render Step Content
  const renderContent = () => {
      switch (step) {
          case 'asset':
              return (
                  <div className="space-y-4 animate-fade-in pt-4">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
                          <span>What can affect your available balance? <span className="underline cursor-pointer text-gray-400">See FAQ.</span></span>
                      </div>
                      <button 
                        onClick={() => setStep('amount')}
                        className="w-full flex items-center justify-between p-4 bg-navy-900 rounded-xl hover:bg-navy-800 transition-colors group border border-white/5"
                      >
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-white font-serif font-bold border border-white/10">
                                  $
                              </div>
                              <span className="text-white font-bold text-sm">USD</span>
                          </div>
                          <span className="text-white font-mono text-sm">${availableBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </button>
                  </div>
              );
          
          case 'amount':
              return (
                  <div className="flex flex-col h-full animate-fade-in">
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-6">
                          {/* Custom Amount Display (Replaces Native Input) */}
                          <div className="flex items-baseline justify-center gap-1 cursor-text" onClick={() => {}}>
                              <span className="text-4xl font-serif text-white/50 transition-colors">$</span>
                              <span className={`text-6xl font-serif font-medium tracking-tight ${!amount ? 'text-gray-700' : 'text-white'}`}>
                                  {amount || '0'}
                              </span>
                          </div>
                          
                          {type === 'withdraw' && (
                              <div className="text-gray-500 text-sm flex items-center gap-1">
                                  ${availableBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} available 
                                  <button className="text-gray-400 border border-gray-600 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px]">i</button>
                              </div>
                          )}
                      </div>
                      
                      <div className="mt-auto">
                        <div className="bg-navy-900 rounded-xl divide-y divide-white/5 mb-6 border border-white/5">
                             {selectedMethod ? (
                                 <button onClick={() => setStep('method')} className="w-full flex items-center justify-between p-4 hover:bg-navy-800 transition-colors rounded-t-xl">
                                     <div className="flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[8px] ${selectedMethod.type === 'bank' ? 'bg-navy-700' : selectedMethod.type === 'apple_pay' ? 'bg-black' : 'bg-blue-600'}`}>
                                             {selectedMethod.type === 'bank' ? 'BK' : selectedMethod.type === 'apple_pay' ? '' : 'CD'}
                                         </div>
                                         <div className="text-left">
                                             <div className="text-[10px] text-gray-400">{type === 'withdraw' ? 'Withdraw to' : 'Deposit from'}</div>
                                             <div className="text-sm text-white font-bold">{selectedMethod.institution} •• {selectedMethod.mask}</div>
                                         </div>
                                     </div>
                                     <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                 </button>
                             ) : (
                                 <button onClick={() => setStep('method')} className="w-full flex items-center justify-between p-4 hover:bg-navy-800 transition-colors rounded-t-xl">
                                     <span className="text-sm font-bold text-gold-500">Select Payment Method</span>
                                     <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                 </button>
                             )}

                             {type === 'withdraw' && (
                                 <button onClick={() => setStep('speed')} className="w-full flex items-center justify-between p-4 hover:bg-navy-800 transition-colors rounded-b-xl">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white border border-white/10">
                                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                         </div>
                                         <div className="text-left">
                                             <div className="text-sm text-white font-bold">{speed === 'standard' ? 'Free' : 'Same Day'}</div>
                                             <div className="text-[10px] text-gray-400">{speed === 'standard' ? '1-3 business days' : '$25 fee'}</div>
                                         </div>
                                     </div>
                                     <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                 </button>
                             )}
                        </div>

                        <button 
                            onClick={() => setStep('review')}
                            disabled={!amount || parseFloat(amount) <= 0 || (type === 'withdraw' && parseFloat(amount) > availableBalance) || !selectedMethod}
                            className={`w-full py-4 font-bold rounded-full transition-colors ${
                                type === 'deposit' ? 'bg-gold-500 hover:bg-gold-600 text-navy-900' : 'bg-navy-700 hover:bg-navy-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Review
                        </button>
                      </div>
                  </div>
              );

          case 'method':
              return (
                  <div className="space-y-4 animate-fade-in pt-4">
                      {methods.map(method => (
                          <div 
                            key={method.id}
                            onClick={() => { setSelectedMethod(method); setStep('amount'); }}
                            className={`bg-navy-900 rounded-xl p-4 border cursor-pointer transition-colors group relative overflow-hidden ${selectedMethod?.id === method.id ? 'border-gold-500 shadow-lg shadow-gold-500/10' : 'border-white/5 hover:border-gold-500/30'}`}
                          >
                              <div className="flex justify-between items-start mb-2 relative z-10">
                                  <span className="font-bold text-white text-sm">
                                      {method.type === 'bank' ? 'Bank Account' : method.type === 'apple_pay' ? 'Apple Pay' : 'Card'}
                                  </span>
                                  {selectedMethod?.id === method.id && <div className="w-3 h-3 rounded-full bg-gold-500"></div>}
                              </div>
                              <div className="text-xs text-gray-400 mb-2 leading-relaxed relative z-10">
                                  {method.type === 'bank' 
                                    ? <span className="font-bold">1-3 Days (ACH) • No fees</span> 
                                    : <span className="font-bold">Instant • 3.5% fee</span>
                                  }
                              </div>
                              <div className="flex items-center gap-3 pt-2 border-t border-white/5 relative z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] text-white font-bold shadow-sm ${method.type === 'bank' ? 'bg-navy-700' : method.type === 'apple_pay' ? 'bg-black' : 'bg-blue-600'}`}>
                                      {method.type === 'apple_pay' ? '' : method.institution.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-xs text-white font-bold block">{method.institution} - {method.mask}</span>
                                    <span className="text-[10px] text-gray-500 block">{method.name}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                      
                      <div className="pt-4 text-center">
                          <p className="text-xs text-gray-500 mb-4">Go to Payment Methods in menu to add new accounts.</p>
                      </div>
                  </div>
              );

          case 'speed':
              return (
                  <div className="space-y-1 animate-slide-up pt-4">
                      <div 
                         onClick={() => { setSpeed('standard'); setStep('amount'); }}
                         className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl cursor-pointer group"
                      >
                          <div>
                              <div className="text-white font-bold text-sm">Free (ACH)</div>
                              <div className="text-xs text-gray-400">1-3 business days</div>
                          </div>
                          {speed === 'standard' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      
                      <div 
                         onClick={() => { setSpeed('instant'); setStep('amount'); }}
                         className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl cursor-pointer group"
                      >
                          <div>
                              <div className="text-white font-bold text-sm">Same day* (Wire)</div>
                              <div className="text-xs text-gray-400">$25 fee (wire)</div>
                          </div>
                          {speed === 'instant' && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      
                      <div className="p-4 mt-4 border-t border-white/5">
                          <p className="text-[10px] text-gray-500">*Typically same day if submitted before 4:00 PM EST.</p>
                      </div>
                  </div>
              );

          case 'review':
              const fee = calculateFee();
              return (
                  <div className="space-y-6 animate-fade-in text-center pt-8">
                       <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">Amount</div>
                       <div className="text-5xl font-serif text-white">${amount}</div>
                       <div className="text-xs text-gray-500">
                           {type === 'deposit' ? 
                               (speed === 'instant' ? 'Funds available today' : 'Funds available in 1-3 days') : 
                               `$${parseFloat(amount).toFixed(2)} deducted immediately`
                           }
                       </div>
                       
                       <div className="bg-navy-900 rounded-xl p-4 text-left space-y-4 border border-white/5">
                           <div className="flex justify-between items-center">
                               <span className="text-gray-400 text-xs">From</span>
                               <div className="text-right">
                                   <div className="text-white font-bold text-sm">{type === 'deposit' ? `${selectedMethod?.institution} ...${selectedMethod?.mask}` : 'USD Balance'}</div>
                               </div>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-400 text-xs">To</span>
                               <div className="text-right">
                                   <div className="text-white font-bold text-sm">{type === 'deposit' ? 'USD Balance' : `${selectedMethod?.institution} ...${selectedMethod?.mask}`}</div>
                               </div>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-400 text-xs">Processing Fee</span>
                               <span className="text-white font-bold text-sm">
                                   {fee > 0 ? `$${fee.toFixed(2)}` : 'Free'}
                                   {fee > 0 && selectedMethod?.type !== 'bank' && <span className="text-[8px] text-gray-500 ml-1">(3.5%)</span>}
                               </span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-400 text-xs">Arrival</span>
                               <span className="text-white font-bold text-sm">{speed === 'instant' ? 'Same Day' : '1-3 Days'}</span>
                           </div>
                           <div className="flex justify-between items-center pt-2 border-t border-white/5">
                               <span className="text-gold-500 text-xs font-bold uppercase">Total</span>
                               <span className="text-gold-500 font-bold text-base">
                                   ${(parseFloat(amount) + (type === 'deposit' ? fee : 0)).toFixed(2)}
                               </span>
                           </div>
                       </div>

                       <button 
                            onClick={handleConfirmTransfer}
                            className={`w-full py-4 font-bold rounded-full transition-colors shadow-lg ${
                                type === 'deposit' ? 'bg-gold-500 hover:bg-gold-600 text-navy-900 shadow-gold-500/20' : 'bg-navy-700 hover:bg-navy-600 text-white border border-white/10'
                            }`}
                        >
                            Confirm {type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </button>
                  </div>
              );
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in sm:p-4">
      <div className="w-full sm:max-w-md bg-black border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 h-[90dvh] sm:h-auto flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center mb-4 relative z-10 min-h-[32px]">
            {step !== (type === 'withdraw' ? 'asset' : 'amount') && step !== 'review' && (
                <button onClick={handleBack} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}
            
            <h2 className={`text-lg font-bold text-white absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none ${step !== 'asset' && step !== 'amount' ? '' : ''}`}>
                {getTitle()}
            </h2>

            <button onClick={onClose} className="ml-auto p-2 bg-navy-900 rounded-full text-gray-400 hover:text-white hover:bg-navy-800 border border-white/5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
            {renderContent()}
        </div>

        {/* Numeric Keypad for Amount Step */}
        {step === 'amount' && (
             <div className="grid grid-cols-3 gap-2 mt-4 pb-[env(safe-area-inset-bottom)]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                    <button 
                        key={num}
                        onClick={() => handleKeypadInput(num)}
                        className="text-2xl font-bold text-white py-3 hover:bg-white/5 rounded-xl transition-colors active:scale-95"
                    >
                        {num}
                    </button>
                ))}
                <button 
                    onClick={() => setAmount(prev => prev.slice(0, -1))}
                    className="flex items-center justify-center text-white py-3 hover:bg-white/5 rounded-xl transition-colors active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default TransferModal;
