
import React, { useState, useRef, useEffect } from 'react';
import { BullionItem, MetalType, AssetForm, WeightUnit, ProductTemplate } from '../types';
import { scanInvoice } from '../services/geminiService';
import { useProductCatalog, matchToCatalog } from '../services/productService';
import CameraScanner from './CameraScanner';
import { getStandardWeight } from '../utils/calculations';

interface AddItemProps {
  onAdd: (item: BullionItem) => void;
  onUpdate: (item: BullionItem) => void;
  onCancel: () => void;
  inventory: BullionItem[];
  initialItem?: BullionItem | null;
  autoStartCamera?: boolean;
}

const AddItem: React.FC<AddItemProps> = ({ onAdd, onUpdate, onCancel, inventory, initialItem, autoStartCamera = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(autoStartCamera);
  const [error, setError] = useState<string | null>(null);
  const [showConsolidateModal, setShowConsolidateModal] = useState<boolean>(false);
  const [duplicateItem, setDuplicateItem] = useState<BullionItem | null>(null);
  const [suggestions, setSuggestions] = useState<ProductTemplate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch product catalog from Supabase with fallback to static data
  const { products: productCatalog } = useProductCatalog();

  // Initial State Mapping
  const [formData, setFormData] = useState<Partial<BullionItem>>({
    metalType: MetalType.GOLD,
    form: AssetForm.COIN,
    weightAmount: 1, 
    weightUnit: WeightUnit.TROY_OZ,
    quantity: 1,
    purchasePrice: 0,
    acquiredAt: new Date().toISOString().split('T')[0],
    name: '',
    mint: '',
    purity: '',
    mintage: '',
    notes: '',
    sku: ''
  });

  // Check if this item is stored at Alex Lexington
  const isVaulted = initialItem ? (
      (initialItem.mint?.toLowerCase().includes('alex lexington')) ||
      initialItem.id?.startsWith('web-') ||
      initialItem.id?.startsWith('vault-') ||
      initialItem.notes?.includes('In Our Storage')
  ) : false;

  // Storage status display
  const storageStatus = isVaulted ? 'In Our Storage — Segregated' : '';

  // Populate form if editing
  useEffect(() => {
    if (initialItem) {
      setFormData({
        ...initialItem
      });
    }
  }, [initialItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Suggestion Logic for Name field - uses dynamic product catalog from Supabase
    if (name === 'name') {
      const filtered = productCatalog.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(value.length > 0 && filtered.length > 0);
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'weightAmount' || name === 'purchasePrice' || name === 'quantity' ? parseFloat(value) : value
    }));
  };

  const selectSuggestion = (product: ProductTemplate) => {
    setFormData(prev => ({
      ...prev,
      name: product.name,
      metalType: product.type,
      form: product.form,
      weightAmount: product.defaultWeight,
      weightUnit: product.defaultUnit,
      mint: product.mint,
      purity: product.purity
    }));
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const checkDuplicates = () => {
    const calculatedWeightOz = getStandardWeight(formData.weightAmount || 0, formData.weightUnit || 'oz');

    return inventory.find(item =>
      (!initialItem || item.id !== initialItem.id) &&
      item.name.toLowerCase() === formData.name?.toLowerCase() &&
      item.metalType === formData.metalType &&
      item.form === formData.form &&
      Math.abs(getStandardWeight(item.weightAmount, item.weightUnit) - calculatedWeightOz) < 0.0001
    );
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.weightAmount || formData.purchasePrice === undefined || !formData.quantity) {
      setError("Please fill in all required fields.");
      return;
    }

    // Skip duplicate check for vaulted items edits
    if (isVaulted) {
        finalizeAdd(false);
        return;
    }

    const existing = checkDuplicates();
    if (existing) {
      setDuplicateItem(existing);
      setShowConsolidateModal(true);
    } else {
      finalizeAdd(false);
    }
  };

  const finalizeAdd = (isConsolidation: boolean) => {
    if (isConsolidation && duplicateItem) {
      const updatedItem: BullionItem = {
        ...duplicateItem,
        quantity: duplicateItem.quantity + (formData.quantity || 0),
        purchasePrice: duplicateItem.purchasePrice + (formData.purchasePrice || 0),
        notes: duplicateItem.notes + (formData.notes ? `\n[${formData.acquiredAt}]: ${formData.notes}` : '')
      };
      onUpdate(updatedItem);
    } else {
      
      const itemData: BullionItem = {
        id: initialItem ? initialItem.id : Date.now().toString(),
        metalType: formData.metalType as string,
        form: formData.form as string,
        weightAmount: formData.weightAmount || 0, 
        weightUnit: formData.weightUnit || 'oz', 
        quantity: formData.quantity || 1,
        purchasePrice: formData.purchasePrice || 0,
        acquiredAt: formData.acquiredAt || new Date().toISOString().split('T')[0],
        name: formData.name || '',
        mint: formData.mint,
        purity: formData.purity,
        mintage: formData.mintage,
        notes: formData.notes,
        sku: formData.sku
      };

      if (initialItem) {
        onUpdate(itemData);
      } else {
        onAdd(itemData);
      }
    }
  };

  const processImage = async (base64Data: string) => {
    setIsScanning(true);
    setError(null);
    setShowCamera(false); 

    try {
      const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const extracted = await scanInvoice(cleanBase64);
      
      if (extracted) {
        // Try to match the AI result to a known product for accurate weight/purity
        const catalogMatch = matchToCatalog(extracted.name || '', extracted.metalType);

        if (catalogMatch && catalogMatch.confidence >= 0.6) {
          // High-confidence match: use database values for weight/purity/mint
          const p = catalogMatch.product;
          setFormData(prev => ({
            ...prev,
            metalType: p.type || extracted.metalType || prev.metalType,
            form: p.form || extracted.form || prev.form,
            weightAmount: p.defaultWeight,
            weightUnit: p.defaultUnit,
            quantity: extracted.quantity || 1,
            purchasePrice: extracted.purchasePrice || 0,
            acquiredAt: extracted.acquiredAt || new Date().toISOString().split('T')[0],
            name: p.name,
            purity: p.purity,
            mint: p.mint,
            mintage: extracted.mintage || prev.mintage
          }));
        } else {
          // No confident match: use raw AI extraction
          setFormData(prev => ({
            ...prev,
            metalType: extracted.metalType || prev.metalType,
            form: extracted.form || prev.form,
            weightAmount: extracted.weightAmount || prev.weightAmount,
            weightUnit: extracted.weightUnit || prev.weightUnit,
            quantity: extracted.quantity || 1,
            purchasePrice: extracted.purchasePrice || 0,
            acquiredAt: extracted.acquiredAt || new Date().toISOString().split('T')[0],
            name: extracted.name || prev.name,
            purity: extracted.purity || prev.purity,
            mint: extracted.mint || prev.mint,
            mintage: extracted.mintage || prev.mintage
          }));
        }
      } else {
          setError("Could not extract data clearly. Please fill manually.");
      }
    } catch (err) {
      setError("Failed to analyze image. Please try again or enter manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
       if (typeof reader.result === 'string') {
           processImage(reader.result);
       }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 pb-20 animate-fade-in-up overflow-y-auto no-scrollbar">
      
      {/* Camera UI Overlay */}
      {showCamera && !isVaulted && (
        <CameraScanner 
            onCapture={processImage} 
            onClose={() => setShowCamera(false)} 
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            {isVaulted ? 'View Vaulted Asset' : (initialItem ? 'Edit Item' : 'Add to Vault')}
        </h1>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
      </div>

      {isVaulted && (
          <div className="bg-navy-800/50 border border-gold-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="text-gold-500 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                  <h4 className="text-gold-500 font-bold text-sm mb-1">Managed Asset</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                      This item is securely stored in the Alex Lexington vault. 
                      Core details cannot be edited as they reflect the physical asset in custody. 
                      You can update your personal notes.
                  </p>
              </div>
          </div>
      )}

      {!initialItem && !isVaulted && (
        <div className="mb-6 relative group rounded-2xl overflow-hidden border border-gold-500/30 bg-navy-800 shadow-lg">
            {/* Grid Background */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-20" 
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            ></div>
            
            {/* Main Scan Area */}
            <div className="relative z-10 flex h-28">
                <button
                    onClick={() => setShowCamera(true)}
                    className="flex-1 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white/5 transition-colors relative border-r border-white/10"
                >
                    {isScanning ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gold-500 font-medium text-[10px] tracking-widest uppercase">Analyzing...</p>
                        </div>
                    ) : (
                        <>
                            {/* AI Vision Badge */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2">
                                <span className="text-[9px] font-bold tracking-[0.2em] text-gold-500 uppercase bg-black/40 px-2 py-0.5 rounded-full border border-gold-500/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                    AI Vision Active
                                </span>
                            </div>
                            
                            <div className="mt-4 flex flex-col items-center">
                                <svg className="w-5 h-5 text-white/50 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h3 className="font-bold text-white text-xs">Scan Item / Invoice</h3>
                                <p className="text-[9px] text-gray-400">Use camera to detect details</p>
                            </div>
                            
                            {/* Decorative Tech Corners */}
                            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-gold-500/30"></div>
                            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-gold-500/30"></div>
                            <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-gold-500/30"></div>
                            <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-gold-500/30"></div>
                        </>
                    )}
                </button>

                {/* Upload Button Area */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Upload</span>
                </div>
            </div>
            
            {error && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs py-1 text-center font-medium backdrop-blur-sm">
                    {error}
                </div>
            )}
        </div>
      )}

      <form onSubmit={handlePreSubmit} className="space-y-5">
        <div className="relative">
          <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Item Name</label>
          <input 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={isVaulted}
            onClick={(e) => e.stopPropagation()} 
            autoComplete="off"
            className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 transition-colors text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
            placeholder="Start typing to search products..."
            required
          />
          
          {showSuggestions && !isVaulted && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {suggestions.map((product, index) => (
                <div 
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectSuggestion(product);
                  }}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer border-b border-gray-50 dark:border-dark-700 last:border-none"
                >
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">{product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.type} • {product.defaultWeight} {product.defaultUnit} • {product.mint}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Metal Type</label>
            <select 
              name="metalType" 
              value={formData.metalType} 
              onChange={handleInputChange}
              disabled={isVaulted}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 appearance-none text-navy-900 dark:text-white capitalize ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {Object.values(MetalType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Form</label>
            <select 
              name="form" 
              value={formData.form} 
              onChange={handleInputChange}
              disabled={isVaulted}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 appearance-none text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {Object.values(AssetForm).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Weight</label>
            <div className="flex">
                <input 
                name="weightAmount"
                type="number"
                step="0.001"
                value={formData.weightAmount}
                onChange={handleInputChange}
                disabled={isVaulted}
                className={`w-2/3 bg-white dark:bg-dark-800 border border-r-0 border-gray-200 dark:border-dark-700 rounded-l-lg px-3 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="1.0"
                required
                />
                <select
                    name="weightUnit"
                    value={formData.weightUnit}
                    onChange={handleInputChange}
                    disabled={isVaulted}
                    className={`w-1/3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-700 rounded-r-lg px-1 py-3 text-sm focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    {Object.values(WeightUnit).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Quantity</label>
            <input 
              name="quantity"
              type="number"
              step="1"
              value={formData.quantity}
              onChange={handleInputChange}
              disabled={isVaulted}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="1"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Total Cost ($)</label>
            <input 
              name="purchasePrice"
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={handleInputChange}
              disabled={isVaulted}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Purity</label>
            <input 
              name="purity"
              value={formData.purity}
              onChange={handleInputChange}
              disabled={isVaulted}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder=".9999"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Mint</label>
            <input 
              name="mint"
              value={formData.mint}
              onChange={handleInputChange}
              disabled={isVaulted}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="e.g. US Mint"
            />
            {isVaulted && (
                <div className="mt-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div>
                    <span className="text-[10px] text-gold-500 font-bold tracking-wide uppercase">
                        Alex Lexington • {storageStatus} Storage
                    </span>
                </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Acquired Date</label>
                <input 
                    name="acquiredAt"
                    type="date"
                    value={formData.acquiredAt}
                    onChange={handleInputChange}
                    disabled={isVaulted}
                    className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
                    required
                />
            </div>
             <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">SKU (Optional)</label>
                <input 
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    disabled={isVaulted}
                    className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white ${isVaulted ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="e.g. gold-bar-pamp-1oz"
                />
            </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-2">Notes</label>
          <textarea 
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-4 py-3 focus:outline-none focus:border-gold-500 text-navy-900 dark:text-white"
            placeholder="Add any additional details about this asset..."
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-gold-500/30 transition-all active:scale-[0.98] mt-4"
        >
          {initialItem ? 'Save Changes' : 'Verify & Add to Vault'}
        </button>
      </form>

      {showConsolidateModal && duplicateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-800 w-full max-w-sm rounded-xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">Similar Item Found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              You already have <strong>{duplicateItem.quantity} x {duplicateItem.name}</strong> in your vault.
              <br/><br/>
              Would you like to combine this purchase with your existing holdings (update quantity & cost) or add it as a separate line item?
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => finalizeAdd(true)}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Consolidate (Qty: {duplicateItem.quantity} + {formData.quantity})
              </button>
              <button 
                onClick={() => finalizeAdd(false)}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg transition-colors"
              >
                Add as New Item
              </button>
              <button 
                onClick={() => setShowConsolidateModal(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddItem;
