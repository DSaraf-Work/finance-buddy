interface TransactionEmptyStateProps {
  onRefresh: () => void;
}

export default function TransactionEmptyState({ onRefresh }: TransactionEmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
      <div className="text-center max-w-md mx-auto">
        {/* Illustration */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No Transactions Found
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          We couldn't find any transactions matching your criteria. Try adjusting your filters or process some emails to see transactions here.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onRefresh}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg shadow-blue-500/30 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Transactions
          </button>

          <a
            href="/emails"
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Process Emails
          </a>
        </div>

        {/* Tips */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">💡 Quick Tips:</p>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try expanding your date range to see more transactions
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Clear filters to see all available transactions
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Connect your Gmail account to start syncing emails
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

