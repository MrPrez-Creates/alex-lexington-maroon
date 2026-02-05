
import React from 'react';

const Documents: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Secure Documents</h1>
      </div>

      <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl">
        <div className="w-16 h-16 bg-navy-50 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gold-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-navy-900 dark:text-white font-bold mb-2">Document Storage</h3>
        <p className="text-sm text-gray-500 mb-2">Secure document upload and storage coming soon.</p>
        <p className="text-xs text-gray-400">Upload invoices, receipts, and verification documents.</p>
      </div>
    </div>
  );
};

export default Documents;
