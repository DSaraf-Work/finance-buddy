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
    <div className="bg-bg-secondary rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border p-4 sm:p-5 lg:p-6 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Date Range Presets */}
        <div className="lg:col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 sm:mb-3 uppercase tracking-wide">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => setDatePreset(preset.value)}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                  datePreset === preset.value
                    ? 'bg-brand-primary text-white shadow-[0_0_15px_rgba(107,76,230,0.4)] border border-[#6b4ce6]'
                    : 'bg-bg-elevated/30 text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary border border-border hover:border-brand-primary/50'
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
              <label htmlFor="start-date" className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 sm:mb-3 uppercase tracking-wide">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={customDateRange.start}
                onChange={e =>
                  setCustomDateRange({ ...customDateRange, start: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                aria-label="Start date"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 sm:mb-3 uppercase tracking-wide">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={customDateRange.end}
                onChange={e =>
                  setCustomDateRange({ ...customDateRange, end: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                aria-label="End date"
              />
            </div>
          </>
        )}

        {/* Sort Order */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 sm:mb-3 uppercase tracking-wide">
            Sort Order
          </label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200 cursor-pointer"
            aria-label="Sort order"
          >
            <option value="desc" className="bg-bg-secondary">Newest → Oldest</option>
            <option value="asc" className="bg-bg-secondary">Oldest → Newest</option>
          </select>
        </div>

        {/* Search Keyword */}
        <div>
          <label htmlFor="search-keyword" className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 sm:mb-3 uppercase tracking-wide">
            Search
          </label>
          <div className="relative">
            <input
              id="search-keyword"
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="Merchant, category, notes..."
              className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
              aria-label="Search transactions"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fetch Button */}
      <div className="mt-5 sm:mt-6 flex justify-end">
        <button
          onClick={onFetch}
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-bg-secondary transition-all duration-200 shadow-[0_0_15px_rgba(107,76,230,0.3)] hover:shadow-[0_0_20px_rgba(107,76,230,0.5)]"
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

