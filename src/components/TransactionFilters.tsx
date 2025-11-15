import { useState, useMemo } from 'react';
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
  loading?: boolean;
}

export default function TransactionFilters({
  filters,
  categories,
  onFilterChange,
  onSearch,
  onReset,
  loading = false,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field: string, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.direction) count++;
    if (filters.category) count++;
    if (filters.merchant) count++;
    return count;
  }, [filters]);

  // Get active filter chips
  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; value: string }> = [];
    if (filters.status) chips.push({ key: 'status', label: 'Status', value: filters.status });
    if (filters.direction) chips.push({ key: 'direction', label: 'Direction', value: filters.direction });
    if (filters.category) chips.push({ key: 'category', label: 'Category', value: filters.category });
    if (filters.merchant) chips.push({ key: 'merchant', label: 'Merchant', value: filters.merchant });
    return chips;
  }, [filters]);

  const removeFilter = (key: string) => {
    handleChange(key, '');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            aria-expanded={isExpanded}
            aria-controls="filter-panel"
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {activeFilterCount} active
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onReset}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center transition-colors"
            aria-label="Reset all filters"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
              >
                <span className="font-medium">{filter.label}:</span>
                <span className="capitalize">{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Filter Panel */}
      {isExpanded && (
        <div id="filter-panel" className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Date From */}
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleChange('date_from', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by start date"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleChange('date_to', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by end date"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by transaction status"
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
              <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-2">
                Direction
              </label>
              <select
                id="direction"
                value={filters.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by transaction direction"
              >
                <option value="">All Directions</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all capitalize"
                aria-label="Filter by transaction category"
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
              <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
                Merchant
              </label>
              <input
                id="merchant"
                type="text"
                value={filters.merchant}
                onChange={(e) => handleChange('merchant', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search merchant..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Filter by merchant name"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            aria-label="Search transactions with current filters"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Transactions
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

