
import React from 'react';
import { BullionItem, Transaction } from '../types';

interface HistoryProps {
  inventory: BullionItem[];
  transactions?: Transaction[];
}

const History: React.FC<HistoryProps> = ({ inventory, transactions = [] }) => {
  // Sort transactions by date in descending order
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Fallback to inventory if no transactions
  const sortedInventory = [...inventory].sort((a, b) => 
    new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-green-500 bg-green-500/10';
      case 'sell': return 'text-red-500 bg-red-500/10';
      case 'deposit': return 'text-blue-500 bg-blue-500/10';
      case 'withdrawal': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy': return '↓';
      case 'sell': return '↑';
      case 'deposit': return '+';
      case 'withdrawal': return '-';
      default: return '•';
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Transaction History</h1>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {sortedTransactions.length} transactions
        </div>
      </div>

      <div className="space-y-3 pb-20">
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getTypeColor(tx.type)}`}>
                  {getTypeIcon(tx.type)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <h3 className="font-bold text-sm text-navy-900 dark:text-white mt-0.5 leading-tight capitalize">
                    {tx.type} {tx.itemName || tx.metal || ''}
                  </h3>
                  {tx.amountOz && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {tx.amountOz.toFixed(4)} oz @ ${tx.pricePerOz?.toLocaleString()}/oz
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-bold text-sm ${String(tx.type) === 'sell' || String(tx.type) === 'withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                  {String(tx.type) === 'sell' || String(tx.type) === 'withdrawal' ? '-' : '+'}${tx.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                  String(tx.status) === 'Completed' ? 'bg-green-500/10 text-green-500' :
                  String(tx.status).includes('Pending') ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-gray-500/10 text-gray-500'
                }`}>
                  {tx.status}
                </p>
              </div>
            </div>
          ))
        ) : sortedInventory.length > 0 ? (
          // Fallback to showing inventory as purchase records
          sortedInventory.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-green-500 bg-green-500/10">
                  ↓
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.acquiredAt}</span>
                  <h3 className="font-bold text-sm text-navy-900 dark:text-white mt-0.5 leading-tight">{item.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="font-medium bg-gray-100 dark:bg-navy-700 px-1.5 rounded text-[10px] mr-2">{item.quantity}x</span>
                    <span className="capitalize">{item.metalType} {item.form}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-sm text-green-500">
                  +${item.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Purchase
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">No transaction history yet</p>
            <p className="text-sm mt-1">Your trades and transfers will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
