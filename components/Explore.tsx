
import React from 'react';
import { ViewState } from '../types';

interface ExploreProps {
  onNavigate: (view: ViewState) => void;
  onStartChat: () => void;
}

const Explore: React.FC<ExploreProps> = ({ onNavigate, onStartChat }) => {
  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 space-y-6 animate-fade-in pb-24">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-navy-900 dark:text-white mb-1">Explore Maroon</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Discover tools, services, and intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Alex Lexington Promo Widget */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 relative overflow-hidden shadow-xl border border-gold-500/20 group md:col-span-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="inline-block bg-gold-500/20 text-gold-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest mb-2 border border-gold-500/30">
                        Trusted Partner
                    </div>
                    <h2 className="text-2xl font-serif text-white mb-2">Alex Lexington: Precious Metals</h2>
                    <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
                        Secure your legacy with a trusted name in bullion. Buy, sell, and trade gold, silver, and platinum with premier service and transparency.
                    </p>
                </div>
                <a 
                    href="https://wq5qnr-i1.myshopify.com/pages/invest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="whitespace-nowrap px-6 py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-transform active:scale-95 shadow-lg shadow-gold-500/20 flex items-center gap-2"
                >
                    Visit Store
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
            </div>
        </div>

        {/* Maroon AI Widget */}
        <div 
            onClick={onStartChat}
            className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 hover:border-gold-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-navy-900 dark:bg-white rounded-full flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <span className="font-serif font-bold text-xl text-white dark:text-navy-900">M</span>
                </div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1">Maroon Concierge</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    AI-powered vault auditing, market analysis, and voice-activated trading.
                </p>
                <div className="flex items-center text-xs font-bold text-purple-500 uppercase tracking-wider">
                    Start Conversation <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
            </div>
        </div>

        {/* Market Widget */}
        <div 
            onClick={() => onNavigate('market')}
            className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 hover:border-green-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1">Live Markets</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Real-time spot prices, charts, and trends for Gold, Silver, Platinum.
                </p>
                <div className="flex items-center text-xs font-bold text-green-500 uppercase tracking-wider">
                    View Charts <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
            </div>
        </div>

        {/* Vault Widget */}
        <div 
            onClick={() => onNavigate('vault')}
            className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 hover:border-gold-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl group-hover:bg-gold-500/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center mb-4 text-gold-600 dark:text-gold-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1">My Vault</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Manage your physical inventory, valuations, and storage details.
                </p>
                <div className="flex items-center text-xs font-bold text-gold-500 uppercase tracking-wider">
                    Open Vault <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
            </div>
        </div>

        {/* Documents Widget */}
        <div 
            onClick={() => onNavigate('documents')}
            className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-1">Documents</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Secure file storage for invoices, receipts, and verification docs.
                </p>
                <div className="flex items-center text-xs font-bold text-blue-500 uppercase tracking-wider">
                    Manage Files <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Explore;
