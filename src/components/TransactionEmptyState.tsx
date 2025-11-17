interface TransactionEmptyStateProps {
  onRefresh: () => void;
}

export default function TransactionEmptyState({ onRefresh }: TransactionEmptyStateProps) {
  return (
    <div className="relative bg-white rounded-2xl p-12 sm:p-16 shadow-sm">
      {/* Colorful Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      <div className="text-center max-w-lg mx-auto" role="status" aria-live="polite">
        {/* Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-violet-500 to-purple-500 rounded-3xl mb-6 shadow-lg">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-3xl font-bold text-slate-900 mb-4">
          No Transactions Found
        </h3>

        {/* Description */}
        <p className="text-slate-600 text-lg mb-10 leading-relaxed">
          We couldn't find any transactions matching your criteria. Try adjusting your filters or process some emails to see transactions here.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={onRefresh}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 font-semibold flex items-center justify-center"
            aria-label="Refresh transactions list"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Transactions
            </span>
          </button>

          <a
            href="/emails"
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border-2 border-slate-300 rounded-xl hover:border-violet-500 hover:text-violet-600 transition-all duration-300 font-semibold flex items-center justify-center"
            aria-label="Go to emails page to process new transactions"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Process Emails
            </span>
          </a>
        </div>

        {/* Tips */}
        <div className="pt-8 border-t border-slate-200">
          <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Tips
          </p>
          <ul className="text-sm text-slate-600 space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mt-1.5 flex-shrink-0"></div>
              <span>Try expanding your date range to see more transactions</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mt-1.5 flex-shrink-0"></div>
              <span>Clear filters to see all available transactions</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mt-1.5 flex-shrink-0"></div>
              <span>Connect your Gmail account to start syncing emails</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

