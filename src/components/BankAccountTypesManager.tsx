import { useState, useEffect } from 'react';

interface BankAccountTypesManagerProps {
  className?: string;
}

export default function BankAccountTypesManager({ className = '' }: BankAccountTypesManagerProps) {
  const [accountTypes, setAccountTypes] = useState<string[]>([]);
  const [newAccountType, setNewAccountType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccountTypes();
  }, []);

  const loadAccountTypes = async () => {
    try {
      const res = await fetch('/api/admin/config/bank-account-types');
      if (res.ok) {
        const data = await res.json();
        setAccountTypes(data.accountTypes || []);
      } else {
        console.error('Failed to load bank account types');
      }
    } catch (error) {
      console.error('Failed to load bank account types:', error);
    }
  };

  const addAccountType = async () => {
    if (!newAccountType.trim() || !newAccountType.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config/bank-account-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: newAccountType.trim().toLowerCase() }),
      });

      if (res.ok) {
        await loadAccountTypes();
        setNewAccountType('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to add account type');
      }
    } catch (error) {
      console.error('Failed to add account type:', error);
      setError('Failed to add account type');
    } finally {
      setLoading(false);
    }
  };

  const removeAccountType = async (accountType: string) => {
    if (!confirm(`Are you sure you want to remove ${accountType}?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config/bank-account-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType }),
      });

      if (res.ok) {
        await loadAccountTypes();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to remove account type');
      }
    } catch (error) {
      console.error('Failed to remove account type:', error);
      setError('Failed to remove account type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-bg-secondary rounded-lg shadow p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          🏦 Bank Account Types
        </h2>
        <p className="text-sm text-text-secondary">
          Manage email addresses from banks that send transaction notifications. 
          These will be used to filter and process financial emails.
        </p>
      </div>

      {/* Add Account Type Form */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="email"
            value={newAccountType}
            onChange={(e) => setNewAccountType(e.target.value)}
            placeholder="Enter bank email (e.g., alerts@bank.com)"
            className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && !loading && addAccountType()}
            disabled={loading}
          />
          <button
            onClick={addAccountType}
            disabled={loading}
            className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Account Types List */}
      <div>
        {accountTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No bank account types configured yet.</p>
            <p className="text-xs mt-1">Add your first bank email address above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accountTypes.map((accountType) => (
              <div
                key={accountType}
                className="flex items-center justify-between p-3 bg-bg-primary/50 rounded-lg hover:bg-bg-elevated/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📧</span>
                  <span className="font-mono text-sm text-text-secondary">{accountType}</span>
                </div>
                <button
                  onClick={() => removeAccountType(accountType)}
                  disabled={loading}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {accountTypes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>Total configured:</span>
            <span className="font-semibold text-text-primary">{accountTypes.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

