export default function TransactionSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Skeleton for transaction card */}
      <div className="bg-white rounded-airbnb-lg shadow-airbnb-sm border border-airbnb-border-light p-6 mb-4">
        <div className="flex items-center justify-between">
          {/* Left side - Icon and details */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Icon skeleton */}
            <div className="w-12 h-12 bg-airbnb-gray-light rounded-airbnb-lg"></div>

            {/* Details skeleton */}
            <div className="flex-1 space-y-3">
              {/* Merchant name */}
              <div className="h-5 bg-airbnb-gray-light rounded w-48"></div>

              {/* Meta info */}
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-airbnb-gray-light rounded w-24"></div>
                <div className="h-4 bg-airbnb-gray-light rounded w-20"></div>
                <div className="h-4 bg-airbnb-gray-light rounded w-32"></div>
              </div>
            </div>
          </div>

          {/* Right side - Amount and actions */}
          <div className="flex items-center space-x-6">
            {/* Amount */}
            <div className="text-right space-y-2">
              <div className="h-6 bg-airbnb-gray-light rounded w-32"></div>
              <div className="h-4 bg-airbnb-gray-light rounded w-24"></div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-airbnb-gray-light rounded-airbnb-md"></div>
              <div className="w-8 h-8 bg-airbnb-gray-light rounded-airbnb-md"></div>
              <div className="w-8 h-8 bg-airbnb-gray-light rounded-airbnb-md"></div>
              <div className="w-8 h-8 bg-airbnb-gray-light rounded-airbnb-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <TransactionSkeleton key={index} />
      ))}
    </div>
  );
}

