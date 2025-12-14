import React from 'react';

interface ReviewFiltersProps {
  datePreset: string;
  setDatePreset: (preset: string) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  onFetch: () => void;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  datePreset,
  setDatePreset,
  customDateRange,
  setCustomDateRange,
  sortOrder,
  setSortOrder,
  searchKeyword,
  setSearchKeyword,
  onFetch,
}) => {
  const presets = [
    { value: 'today', label: 'Today', icon: '📅' },
    { value: '7d', label: '7 Days', icon: '📆' },
    { value: '30d', label: '30 Days', icon: '🗓️' },
    { value: 'thisMonth', label: 'This Month', icon: '📊' },
    { value: 'custom', label: 'Custom', icon: '⚙️' },
  ];

  return (
    <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-[#2d1b4e] p-4 sm:p-5 lg:p-6 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Date Range Presets */}
        <div className="lg:col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 sm:mb-3 uppercase tracking-wide">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => setDatePreset(preset.value)}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
                  datePreset === preset.value
                    ? 'bg-[#6b4ce6] text-white shadow-[0_0_15px_rgba(107,76,230,0.4)] border border-[#6b4ce6]'
                    : 'bg-[#2d1b4e]/30 text-[#cbd5e1] hover:bg-[#2d1b4e]/50 hover:text-[#f8fafc] border border-[#2d1b4e] hover:border-[#6b4ce6]/50'
                }`}
                aria-label={`Select ${preset.label} date range`}
              >
                <span className="text-base sm:text-lg">{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <>
            <div>
              <label htmlFor="start-date" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 sm:mb-3 uppercase tracking-wide">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={customDateRange.start}
                onChange={e =>
                  setCustomDateRange({ ...customDateRange, start: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                aria-label="Start date"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 sm:mb-3 uppercase tracking-wide">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={customDateRange.end}
                onChange={e =>
                  setCustomDateRange({ ...customDateRange, end: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
                aria-label="End date"
              />
            </div>
          </>
        )}

        {/* Sort Order */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 sm:mb-3 uppercase tracking-wide">
            Sort Order
          </label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200 cursor-pointer"
            aria-label="Sort order"
          >
            <option value="desc" className="bg-[#1a1625]">Newest → Oldest</option>
            <option value="asc" className="bg-[#1a1625]">Oldest → Newest</option>
          </select>
        </div>

        {/* Search Keyword */}
        <div>
          <label htmlFor="search-keyword" className="block text-xs sm:text-sm font-medium text-[#cbd5e1] mb-2 sm:mb-3 uppercase tracking-wide">
            Search
          </label>
          <div className="relative">
            <input
              id="search-keyword"
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="Merchant, category, notes..."
              className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-[#0f0a1a] border border-[#2d1b4e] rounded-[var(--radius-md)] text-[#f8fafc] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#6b4ce6] focus:border-[#6b4ce6] transition-all duration-200"
              aria-label="Search transactions"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fetch Button */}
      <div className="mt-5 sm:mt-6 flex justify-end">
        <button
          onClick={onFetch}
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#6b4ce6] text-white font-medium rounded-[var(--radius-md)] hover:bg-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#6b4ce6] focus:ring-offset-2 focus:ring-offset-[#1a1625] transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)]"
          aria-label="Fetch transactions"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Fetch Transactions</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewFilters;

