
import React, { useState, useRef } from 'react';
import { StoredFile } from '../types';
import { uploadUserFile, deleteUserFile } from '../services/firestoreService';

interface DocumentsProps {
  files: StoredFile[];
}

const Documents: React.FC<DocumentsProps> = ({ files }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadUserFile(file, '', 'Uploaded via Documents');
    } catch (error) {
      console.error("Upload failed", error);
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: StoredFile) => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
        try {
            await deleteUserFile(file.id, file.path);
            if (selectedFile?.id === file.id) setSelectedFile(null);
        } catch (error) {
            console.error("Delete failed", error);
        }
    }
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Secure Documents</h1>
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-50"
        >
            {isUploading ? (
                <>
                   <div className="w-4 h-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin"></div>
                   Uploading...
                </>
            ) : (
                <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   Upload File
                </>
            )}
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
        />
      </div>

      {uploadError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
              {uploadError}
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        {files.map(file => (
            <div 
                key={file.id} 
                className="bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-100 dark:border-navy-700 shadow-sm hover:border-gold-500/30 transition-all group relative"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-navy-50 dark:bg-navy-900 flex items-center justify-center flex-shrink-0 text-gold-500">
                             {file.type.startsWith('image/') ? (
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             ) : (
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                             )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-navy-900 dark:text-white truncate text-sm" title={file.name}>{file.name}</h3>
                            <p className="text-xs text-gray-500">{formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDelete(file)}
                        className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

                {file.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-navy-900/50 p-2 rounded">
                        {file.notes}
                    </p>
                )}

                {file.aiSummary && (
                    <div className="text-[10px] text-gray-500 flex items-start gap-1.5 mb-3">
                         <svg className="w-3 h-3 text-gold-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         <span className="line-clamp-2">{file.aiSummary}</span>
                    </div>
                )}

                <div className="flex gap-2 mt-auto">
                    <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 text-center py-2 rounded-lg bg-navy-50 dark:bg-navy-700 text-xs font-bold text-navy-900 dark:text-white hover:bg-gold-500 hover:text-navy-900 transition-colors"
                    >
                        View / Download
                    </a>
                </div>
            </div>
        ))}

        {files.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl">
                <div className="w-16 h-16 bg-navy-50 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-navy-900 dark:text-white font-bold mb-1">No documents yet</h3>
                <p className="text-sm text-gray-500 mb-4">Upload invoices, receipts, or verification documents.</p>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gold-500 font-bold text-sm hover:underline"
                >
                    Upload your first file
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
