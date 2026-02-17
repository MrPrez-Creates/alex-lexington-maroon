
import React, { useState, useRef } from 'react';
import { loginWithEmail, registerWithEmail, loginWithGoogle, requestPhoneCode, verifyPhoneCode, sendPasswordReset } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationFlow: (isRegistering: boolean) => void;
}

type AuthMethod = 'email' | 'phone';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onRegistrationFlow }) => {
  const [method, setMethod] = useState<AuthMethod>('email');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Email Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Phone Form State
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setProfileImage(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
      }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        onRegistrationFlow(true); // Tell App.tsx to ignore auto-login updates
        await registerWithEmail(email, password, name, profileImage);
        setVerifiedEmail(email);
        setShowVerification(true);
        // Do not close modal. Show verification screen.
      } else {
        await loginWithEmail(email, password);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (isRegistering) onRegistrationFlow(false); // Reset on error

      // Handle Supabase Auth error codes
      const errorCode = err.code || '';
      const errorMessage = err.message || '';

      if (errorCode === 'auth/invalid-credential' || errorMessage.includes('invalid-credential')) {
         setError("Incorrect email or password.");
      } else if (errorCode === "auth/email-not-verified") {
         setVerifiedEmail(email);
         setShowVerification(true);
      } else if (errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
         setError("Incorrect email or password.");
      } else if (errorMessage.includes("already-in-use")) {
         setError("User Already exists. Sign In?");
      } else if (errorCode === 'auth/too-many-requests') {
         setError("Too many attempts. Please try again later.");
      } else {
         setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) {
          setError("Please enter your email address.");
          return;
      }
      setError(null);
      setIsLoading(true);
      try {
          await sendPasswordReset(email);
          setResetSent(true);
          setVerifiedEmail(email); // Use verifiedEmail state to display where we sent the link
      } catch (err: any) {
          setError(err.message || "Failed to send reset link.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
        await requestPhoneCode(phone);
        setCodeSent(true);
    } catch (err) {
        setError("Failed to send code. Try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        await verifyPhoneCode(phone, verificationCode);
        onClose();
    } catch (err: any) {
        setError(err.message || "Invalid code.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // App.tsx auth listener handles closing the modal on success
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setIsLoading(false);
      
      const errorCode = err.code || '';

      if (errorCode === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled.");
      } else if (errorCode === 'auth/popup-blocked') {
        setError("Popup blocked. Please allow popups for this site.");
      } else if (errorCode === 'auth/operation-not-supported-in-this-environment') {
        // Specific error for AI Studio / StackBlitz previews
        setError("Google Login is restricted in this preview pane. Please open the app in a new tab (↗) to sign in.");
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for authentication.");
      } else if (errorCode === 'auth/invalid-credential') {
        setError("Unable to authenticate with Google. Domain may not be authorized.");
      } else {
        // Clean up raw auth error messages for display
        const cleanMsg = err.message.replace(/^(Firebase|AuthApiError): /i, "").replace(/\(auth\/.*\)\.?/, "");
        setError(cleanMsg || "Google sign-in failed.");
      }
    }
  };

  const handleBackToLogin = () => {
      setShowVerification(false);
      setShowForgot(false);
      setResetSent(false);
      setIsRegistering(false);
      onRegistrationFlow(false);
      setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/90 backdrop-blur-md animate-fade-in p-4">
      <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-gray-100 dark:border-navy-700 relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-navy-900 dark:hover:text-white transition-colors z-10"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {showVerification ? (
             <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-4">Check Your Inbox</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-8 leading-relaxed">
                    We have sent you a verification email to <br/>
                    <span className="font-bold text-navy-900 dark:text-white">{verifiedEmail}</span>.
                    <br/><br/>
                    Verify it and log in.
                </p>
                <button 
                    onClick={handleBackToLogin}
                    className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20"
                >
                    Login
                </button>
            </div>
        ) : resetSent ? (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-4">Reset Link Sent</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-8 leading-relaxed">
                    We sent you a password change link to <br/>
                    <span className="font-bold text-navy-900 dark:text-white">{verifiedEmail}</span>.
                </p>
                <button 
                    onClick={handleBackToLogin}
                    className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20"
                >
                    Sign In
                </button>
            </div>
        ) : showForgot ? (
            <div className="p-8">
                <div className="text-center mb-8">
                     <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white">Reset Password</h2>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Enter your email to receive a reset link.
                    </p>
                </div>
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                     <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white"
                            placeholder="you@example.com"
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center animate-pulse font-medium bg-red-500/10 p-2 rounded">{error}</p>}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Get Reset Link'}
                    </button>

                    <div className="text-center">
                        <button 
                            type="button"
                            onClick={handleBackToLogin}
                            className="text-sm text-gray-500 hover:text-navy-900 dark:hover:text-white font-medium transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </form>
            </div>
        ) : (
            <div className="p-8">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gold-500 mx-auto transform rotate-45 flex items-center justify-center mb-4 shadow-lg shadow-gold-500/20">
                        <span className="font-serif font-bold text-navy-900 text-xl transform -rotate-45">M</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white">
                        {method === 'phone' ? 'Phone Access' : (isRegistering ? 'Create Account' : 'Welcome Back')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        {method === 'phone' ? 'Secure verification via SMS.' : (isRegistering ? 'Start building your legacy.' : 'Access your secure vault.')}
                    </p>
                </div>

                {/* Google Sign In (Primary) */}
                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-navy-900 dark:text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-sm"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Connecting...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-navy-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-navy-800 text-gray-500">Or continue with</span>
                    </div>
                </div>

                {/* Method Toggles */}
                <div className="flex bg-gray-100 dark:bg-navy-900 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setMethod('email')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${method === 'email' ? 'bg-white dark:bg-navy-800 shadow-sm text-navy-900 dark:text-white' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        Email
                    </button>
                    <button 
                        onClick={() => setMethod('phone')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${method === 'phone' ? 'bg-white dark:bg-navy-800 shadow-sm text-navy-900 dark:text-white' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        Phone
                    </button>
                </div>

                {/* EMAIL FORM */}
                {method === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {isRegistering && (
                            <div className="space-y-4">
                                {/* Profile Photo Upload */}
                                <div className="flex flex-col items-center justify-center mb-4">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 rounded-full bg-gray-100 dark:bg-navy-900 border-2 border-dashed border-gray-300 dark:border-navy-600 flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors overflow-hidden relative"
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-wide">Upload Photo</span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white"
                                        placeholder="Alex Lexington"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
                                {!isRegistering && (
                                    <button 
                                        type="button"
                                        onClick={() => setShowForgot(true)}
                                        className="text-[10px] font-bold text-gold-500 hover:text-white transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center animate-pulse font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
                        </button>
                        
                        <div className="text-center mt-2">
                            <button 
                                type="button"
                                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                                className="text-xs text-gold-500 font-bold hover:underline"
                            >
                                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                            </button>
                        </div>
                    </form>
                )}

                {/* PHONE FORM */}
                {method === 'phone' && (
                    <form onSubmit={codeSent ? handleVerifyCode : handleSendCode} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Phone Number</label>
                            <input 
                                type="tel" 
                                required 
                                disabled={codeSent}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white ${codeSent ? 'opacity-50' : ''}`}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        {codeSent && (
                            <div className="animate-fade-in-up">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Verification Code</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white text-center tracking-[0.5em] font-mono text-lg"
                                    placeholder="------"
                                    maxLength={6}
                                />
                                <p className="text-center text-xs text-gray-500 mt-2">Enter code: <span className="font-mono font-bold text-white">123456</span></p>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm text-center animate-pulse">{error}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : (codeSent ? 'Verify & Access' : 'Send Code')}
                        </button>

                        {codeSent && (
                            <button 
                                type="button"
                                onClick={() => { setCodeSent(false); setVerificationCode(''); setError(null); }}
                                className="w-full text-xs text-gray-500 hover:text-white mt-2"
                            >
                                Change Phone Number
                            </button>
                        )}
                    </form>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
