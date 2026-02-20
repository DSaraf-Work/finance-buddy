import { useState } from 'react';
import { Transaction, TransactionStatus } from '@/pages/transactions';
import {
  Calendar,
  Tag,
  Sparkles,
  ChevronDown,
  Pencil,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onReExtract?: (transactionId: string) => void;
  onStatusUpdate?: (transactionId: string, newStatus: TransactionStatus) => void;
}

export default function TransactionRow({ transaction, onEdit, onReExtract, onStatusUpdate }: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleReExtract = async () => {
    if (!onReExtract) return;

    setIsReExtracting(true);
    try {
      await onReExtract(transaction.id);
    } finally {
      setIsReExtracting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TransactionStatus) => {
    if (!onStatusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(transaction.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusClass = (status: TransactionStatus) => {
    switch (status) {
      case 'REVIEW': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'APPROVED': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'INVALID': return 'bg-border/30 text-foreground border-border';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-border/30 text-foreground border-border';
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case 'REVIEW': return 'Review';
      case 'APPROVED': return 'Approved';
      case 'INVALID': return 'Invalid';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount?: string | null, currency?: string | null) => {
    if (!amount) return 'N/A';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(numAmount);
  };

  const getDirectionClass = (direction?: string | null) => {
    switch (direction) {
      case 'debit': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'credit': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'transfer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-border/30 text-foreground border-border';
    }
  };

  const getConfidenceClass = (confidence?: string | null) => {
    if (!confidence) return 'bg-border/30 text-foreground';
    const conf = parseFloat(confidence);
    if (conf >= 0.8) return 'bg-green-500/10 text-green-400';
    if (conf >= 0.6) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/10 text-red-400';
  };

  const getCategoryIcon = (category?: string | null) => {
    switch (category?.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'shopping': return '🛍️';
      case 'bills': return '📄';
      case 'finance': return '🏦';
      case 'entertainment': return '🎬';
      case 'health': return '🏥';
      default: return '💳';
    }
  };

  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'bg-primary/5' : 'bg-card hover:bg-muted/20'}`}>
      {/* Main Row */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-6 flex-1">
          {/* Category Icon */}
          <div className="text-3xl p-2 bg-border/30 rounded-xl hover:bg-muted/30 transition-colors">
            {getCategoryIcon(transaction.category)}
          </div>

          {/* Transaction Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-2">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {transaction.merchant_name || 'Unknown Merchant'}
              </h3>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 ${getDirectionClass(transaction.direction)}`}>
                {transaction.direction || 'unknown'}
              </span>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border-2 ${getStatusClass(transaction.status)}`}>
                {getStatusLabel(transaction.status)}
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-muted-foreground/60" />
                <span>{formatDate(transaction.txn_time)}</span>
              </div>
              {transaction.category && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4 text-muted-foreground/60" />
                  <span className="capitalize font-medium">{transaction.category}</span>
                </div>
              )}
              {transaction.ai_notes && (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div className="flex space-x-1">
                    {transaction.ai_notes.split(',').slice(0, 3).map((note, index) => (
                      <span key={index} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        {note.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatAmount(transaction.amount, transaction.currency)}
            </div>
            <div className="flex items-center justify-end space-x-2">
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getConfidenceClass(transaction.confidence)}`}>
                {transaction.confidence ? `${Math.round(parseFloat(transaction.confidence) * 100)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-6">
          <button
            onClick={onEdit}
            className="p-3 text-muted-foreground hover:text-primary hover:bg-primary/20 rounded-xl transition-all duration-200 hover:scale-105"
            title="Edit transaction"
          >
            <Pencil className="w-5 h-5" />
          </button>

          {onReExtract && (
            <button
              onClick={handleReExtract}
              disabled={isReExtracting}
              className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                isReExtracting
                  ? 'text-muted-foreground bg-border/30 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/20'
              }`}
              title="Re-extract with AI"
            >
              <RotateCcw className={`w-5 h-5 ${isReExtracting ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Status Action Buttons */}
          {onStatusUpdate && (
            <>
              {transaction.status !== 'APPROVED' && (
                <button
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-muted-foreground bg-border/30 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-green-400 hover:bg-green-500/10'
                  }`}
                  title="Approve transaction"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}

              {transaction.status !== 'REJECTED' && (
                <button
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-muted-foreground bg-border/30 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/10'
                  }`}
                  title="Reject transaction"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {transaction.status !== 'INVALID' && (
                <button
                  onClick={() => handleStatusUpdate('INVALID')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-muted-foreground bg-border/30 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/30'
                  }`}
                  title="Mark as invalid"
                >
                  <AlertTriangle className="w-5 h-5" />
                </button>
              )}

              {transaction.status !== 'REVIEW' && (
                <button
                  onClick={() => handleStatusUpdate('REVIEW')}
                  disabled={isUpdatingStatus}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isUpdatingStatus
                      ? 'text-muted-foreground bg-border/30 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/20'
                  }`}
                  title="Mark for review"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
              isExpanded
                ? 'text-primary bg-primary/20'
                : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted/30'
            }`}
            title={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-8 pb-8 border-t border-border bg-muted/10">
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Transaction Details */}
            <div className="bg-card rounded-xl p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Pencil className="w-5 h-5 mr-2 text-primary" />
                Transaction Details
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Reference ID</dt>
                  <dd className="text-sm text-foreground font-mono bg-background/50 px-2 py-1 rounded mt-1">{transaction.reference_id || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Account Hint</dt>
                  <dd className="text-sm text-foreground mt-1">{transaction.account_hint || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                  <dd className="text-sm text-foreground mt-1">{transaction.location || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Account Type</dt>
                  <dd className="text-sm text-foreground mt-1">
                    {transaction.account_type ? (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                        {transaction.account_type.replace(/_/g, ' ')}
                      </span>
                    ) : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Transaction Type</dt>
                  <dd className="text-sm text-foreground mt-1">
                    {transaction.transaction_type ? (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        transaction.transaction_type === 'Dr'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {transaction.transaction_type === 'Dr' ? 'Dr (Debit)' : 'Cr (Credit)'}
                      </span>
                    ) : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Merchant Info */}
            <div className="bg-card rounded-xl p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-green-400" />
                Merchant Info
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Original Name</dt>
                  <dd className="text-sm text-foreground mt-1">{transaction.merchant_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Normalized</dt>
                  <dd className="text-sm text-foreground mt-1">{transaction.merchant_normalized || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd className="text-sm text-foreground capitalize mt-1">{transaction.category || 'Uncategorized'}</dd>
                </div>
              </dl>
            </div>

            {/* AI & User Notes */}
            <div className="bg-card rounded-xl p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                Notes
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">AI Keywords</dt>
                  <dd className="mt-2">
                    {transaction.ai_notes ? (
                      <div className="flex flex-wrap gap-2">
                        {transaction.ai_notes.split(',').map((note, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 text-xs bg-primary/20 text-primary rounded-full font-medium"
                          >
                            {note.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60 italic text-sm">No AI notes available</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">User Notes</dt>
                  <dd className="text-sm text-foreground mt-1">
                    {transaction.user_notes || (
                      <span className="text-muted-foreground/60 italic">No user notes</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Metadata & Actions */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Confidence: {transaction.confidence ? `${Math.round(parseFloat(transaction.confidence) * 100)}%` : 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4 text-muted-foreground/60" />
                  <span>Version: {transaction.extraction_version}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-muted-foreground/60" />
                  <span>Created: {formatDate(transaction.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReExtract}
                  disabled={isReExtracting}
                  className="text-primary border-primary/30 hover:bg-primary/10"
                >
                  Re-extract
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={isUpdatingStatus}
                  className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={isUpdatingStatus}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
