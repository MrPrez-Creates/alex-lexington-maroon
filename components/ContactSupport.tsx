
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { createSupportTicket } from '../services/supportService';

interface ContactSupportProps {
  userProfile: UserProfile | null;
}

const ContactSupport: React.FC<ContactSupportProps> = ({ userProfile }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createSupportTicket(subject, message);
      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setError("Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-8 justify-center items-center text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Ticket Submitted</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
          Our team has received your request and will respond to <span className="font-bold text-navy-900 dark:text-white">{userProfile?.email}</span> shortly.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-navy-900 dark:bg-white dark:text-navy-900 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 space-y-6 animate-fade-in">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Contact Support</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Experiencing an issue with your vault or transactions? Let us know.
        </p>
      </div>

      <div className="bg-white dark:bg-navy-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              disabled 
              value={userProfile?.email || ''}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Subject
            </label>
            <input 
              type="text" 
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Issue with Wire Transfer"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Message
            </label>
            <textarea 
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Please describe your issue in detail..."
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-700 focus:border-gold-500 focus:outline-none text-navy-900 dark:text-white transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </span>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-gray-400 mt-4">
        Support Hours: Mon-Fri, 10AM - 4PM EST
        <br/>
        Atlanta, GA
      </div>
    </div>
  );
};

export default ContactSupport;
