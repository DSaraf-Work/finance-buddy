import { TransactionStatus } from '@/pages/transactions';

interface TransactionFiltersProps {
  filters: {
    date_from: string;
    date_to: string;
    status: TransactionStatus | '';
    direction: 'debit' | 'credit' | '';
    category: string;
    merchant: string;
  };
  categories: string[];
  onFilterChange: (filters: any) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function TransactionFilters({
  filters,
  categories,
  onFilterChange,
  onSearch,
  onReset,
}: TransactionFiltersProps) {
  const handleChange = (field: string, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h2>
        <button
          onClick={onReset}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Statuses</option>
            <option value="REVIEW">Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="INVALID">Invalid</option>
          </select>
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
          <select
            value={filters.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Directions</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all capitalize"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Merchant</label>
          <input
            type="text"
            value={filters.merchant}
            onChange={(e) => handleChange('merchant', e.target.value)}
            placeholder="Search merchant..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg shadow-blue-500/30 flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search Transactions
      </button>
    </div>
  );
}

