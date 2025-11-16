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
    sort?: 'asc' | 'desc';
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
    <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 mb-6 sm:mb-8">
      {/* Header - Modern Minimal */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-600 tracking-wide uppercase hover:text-blue-700 transition-colors"
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {activeFilterCount}
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
          className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Reset all filters"
        >
          Reset
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {isExpanded && (
        <div id="filter-panel" className="border-t border-gray-200 pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Date From */}
            <div>
              <label htmlFor="date-from" className="block text-xs font-medium text-gray-600 mb-2">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleChange('date_from', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                aria-label="Filter by start date"
              />
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date-to" className="block text-xs font-medium text-gray-600 mb-2">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleChange('date_to', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                aria-label="Filter by end date"
              />
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-xs font-medium text-gray-600 mb-2">
                Sort By
              </label>
              <select
                id="sort"
                value={filters.sort || 'desc'}
                onChange={(e) => handleChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                aria-label="Sort transactions"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-medium text-gray-600 mb-2">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
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
              <label htmlFor="direction" className="block text-xs font-medium text-gray-600 mb-2">
                Direction
              </label>
              <select
                id="direction"
                value={filters.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                aria-label="Filter by transaction direction"
              >
                <option value="">All Directions</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-gray-600 mb-2">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm capitalize"
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
            <div className="sm:col-span-2">
              <label htmlFor="merchant" className="block text-xs font-medium text-gray-600 mb-2">
                Merchant
              </label>
              <input
                id="merchant"
                type="text"
                value={filters.merchant}
                onChange={(e) => handleChange('merchant', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search merchant..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm placeholder-gray-400"
                aria-label="Filter by merchant name"
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Search transactions with current filters"
          >
            {loading ? 'Searching...' : 'Apply Filters'}
          </button>
        </div>
      )}
    </div>
  );
}

