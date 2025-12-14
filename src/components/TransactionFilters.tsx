import { useState, useMemo, useEffect } from 'react';
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

// Quick filter presets
const QUICK_FILTERS = [
  { label: 'Today', value: 'today', icon: '📍' },
  { label: 'Yesterday', value: 'yesterday', icon: '⏮️' },
  { label: 'This Month', value: 'this_month', icon: '📅' },
  { label: 'Last Month', value: 'last_month', icon: '📆' },
];

// Helper to get date range for quick filters
const getQuickFilterDates = (filterValue: string): { from: string; to: string } => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (filterValue) {
    case 'today':
      return {
        from: today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: yesterday.toISOString().split('T')[0],
        to: yesterday.toISOString().split('T')[0],
      };
    case 'this_month':
      return {
        from: new Date(year, month, 1).toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    case 'last_month':
      return {
        from: new Date(year, month - 1, 1).toISOString().split('T')[0],
        to: new Date(year, month, 0).toISOString().split('T')[0],
      };
    default:
      return { from: '', to: '' };
  }
};

export default function TransactionFilters({
  filters,
  categories,
  onFilterChange,
  onSearch,
  onReset,
  loading = false,
}: TransactionFiltersProps) {
  // Collapsed by default on mobile, expanded on desktop
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    onFilterChange({ ...filters, [field]: value });
    // Removed auto-search - user must click "Apply Filters" button
  };

  const handleQuickFilter = (filterValue: string) => {
    const dates = getQuickFilterDates(filterValue);
    setActiveQuickFilter(filterValue);
    onFilterChange({
      ...filters,
      date_from: dates.from,
      date_to: dates.to,
    });
    // Auto-apply for quick filters only (better UX for quick actions)
    setTimeout(() => onSearch(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Calculate active filters count (excluding dates and sort)
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
    <div className="relative">
      {/* Purple Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] rounded-t-xl"></div>

      {/* Compact Header with Quick Filters */}
      <div className="space-y-3">
        {/* Top Row: Toggle + Active Filters + Reset */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 text-sm font-medium text-[#F0F1F5] hover:text-[#888BFF] transition-colors"
            aria-expanded={isExpanded}
            aria-controls="filter-panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-[#5D5FEF] text-white text-xs font-bold rounded-md">
                {activeFilterCount}
              </span>
            )}
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSearch}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] hover:opacity-90 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              aria-label="Apply filters"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-medium text-[#B2B4C2] hover:text-[#F0F1F5] bg-[#1E2026] hover:bg-[#2A2C35] rounded-lg transition-all duration-200 border border-[#2A2C35]"
              aria-label="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Quick Filter Pills - Always Visible */}
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.value}
              onClick={() => handleQuickFilter(qf.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                activeQuickFilter === qf.value
                  ? 'bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-white shadow-md'
                  : 'bg-[#1E2026] text-[#B2B4C2] hover:text-[#F0F1F5] hover:bg-[#2A2C35] border border-[#2A2C35]'
              }`}
            >
              <span className="mr-1">{qf.icon}</span>
              {qf.label}
            </button>
          ))}
        </div>

        {/* Active Filter Chips - Show when collapsed */}
        {!isExpanded && activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2A2C35]">
            {activeFilters.map((filter) => (
              <div
                key={filter.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#5D5FEF]/10 text-[#888BFF] text-xs font-medium rounded-md border border-[#5D5FEF]/30"
              >
                <span className="capitalize">{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="hover:text-[#F0F1F5] transition-colors"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compact Collapsible Filter Panel */}
      {isExpanded && (
        <div id="filter-panel" className="relative mt-4 pt-4 border-t border-[#2A2C35]">
          {/* Compact Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Date From */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="date-from" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                From
              </label>
              <input
                id="date-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleChange('date_from', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5]"
                aria-label="Filter by start date"
              />
            </div>

            {/* Date To */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="date-to" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                To
              </label>
              <input
                id="date-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleChange('date_to', e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5]"
                aria-label="Filter by end date"
              />
            </div>

            {/* Status */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="status" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5]"
                aria-label="Filter by transaction status"
              >
                <option value="">All</option>
                <option value="REVIEW">Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="INVALID">Invalid</option>
              </select>
            </div>

            {/* Direction */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="direction" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                Type
              </label>
              <select
                id="direction"
                value={filters.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5]"
                aria-label="Filter by transaction direction"
              >
                <option value="">All</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            {/* Category */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="category" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5] capitalize"
                aria-label="Filter by transaction category"
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="sort" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                Sort
              </label>
              <select
                id="sort"
                value={filters.sort || 'desc'}
                onChange={(e) => handleChange('sort', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5]"
                aria-label="Sort transactions"
              >
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
            </div>

            {/* Merchant Search - Full Width */}
            <div className="col-span-4 sm:col-span-3 lg:col-span-6">
              <label htmlFor="merchant" className="block text-[10px] font-medium text-[#6F7280] mb-1">
                Merchant
              </label>
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6F7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="merchant"
                  type="text"
                  value={filters.merchant}
                  onChange={(e) => handleChange('merchant', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search merchant..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-[#1E2026] border border-[#2A2C35] rounded-lg focus:border-[#5D5FEF] focus:ring-1 focus:ring-[#5D5FEF]/20 transition-all text-xs text-[#F0F1F5] placeholder-[#6F7280]"
                  aria-label="Filter by merchant name"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

