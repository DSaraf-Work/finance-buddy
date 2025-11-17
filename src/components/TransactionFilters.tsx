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
    <div className="relative bg-white rounded-2xl p-6 mb-8 shadow-sm">
      {/* Colorful Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-3 text-sm font-semibold text-slate-900 hover:text-violet-600 transition-colors"
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <span className="tracking-wide">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2.5 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold rounded-lg shadow-md">
              {activeFilterCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-300"
          aria-label="Reset all filters"
        >
          Reset All
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {isExpanded && (
        <div id="filter-panel" className="relative">
          {/* Divider */}
          <div className="h-px bg-slate-200 mb-6"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* Date From */}
            <div className="space-y-2">
              <label htmlFor="date-from" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                From Date
              </label>
              <div className="relative">
                <input
                  id="date-from"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleChange('date_from', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900"
                  aria-label="Filter by start date"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label htmlFor="date-to" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                To Date
              </label>
              <div className="relative">
                <input
                  id="date-to"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleChange('date_to', e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900"
                  aria-label="Filter by end date"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label htmlFor="sort" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                Sort By
              </label>
              <select
                id="sort"
                value={filters.sort || 'desc'}
                onChange={(e) => handleChange('sort', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900"
                aria-label="Sort transactions"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900"
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
            <div className="space-y-2">
              <label htmlFor="direction" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                Direction
              </label>
              <select
                id="direction"
                value={filters.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900"
                aria-label="Filter by transaction direction"
              >
                <option value="">All Directions</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900 capitalize"
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
            <div className="sm:col-span-2 space-y-2">
              <label htmlFor="merchant" className="block text-xs font-semibold text-slate-700 tracking-wider uppercase">
                Merchant
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="merchant"
                  type="text"
                  value={filters.merchant}
                  onChange={(e) => handleChange('merchant', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search merchant..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm text-slate-900 placeholder-slate-400"
                  aria-label="Filter by merchant name"
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={onSearch}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold rounded-xl hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              aria-label="Search transactions with current filters"
            >
              <span className="flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Apply Filters
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

