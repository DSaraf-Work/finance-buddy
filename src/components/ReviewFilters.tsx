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
    { value: 'today', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => setDatePreset(preset.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  datePreset === preset.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label={`Select ${preset.label} date range`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <>
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={customDateRange.start}
                onChange={e =>
                  setCustomDateRange({ ...customDateRange, start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Start date"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={customDateRange.end}
                onChange={e =>
                  setCustomDateRange({ ...customDateRange, end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="End date"
              />
            </div>
          </>
        )}

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort Order
          </label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Sort order"
          >
            <option value="desc">Newest → Oldest</option>
            <option value="asc">Oldest → Newest</option>
          </select>
        </div>

        {/* Search Keyword */}
        <div>
          <label htmlFor="search-keyword" className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            id="search-keyword"
            type="text"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            placeholder="Merchant, category, notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search transactions"
          />
        </div>
      </div>

      {/* Fetch Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onFetch}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Fetch transactions"
        >
          Fetch Transactions
        </button>
      </div>
    </div>
  );
};

export default ReviewFilters;

