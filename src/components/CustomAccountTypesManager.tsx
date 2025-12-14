import { useState, useEffect } from 'react';

interface CustomAccountTypesManagerProps {
  className?: string;
}

export default function CustomAccountTypesManager({ className = '' }: CustomAccountTypesManagerProps) {
  const [customAccountTypes, setCustomAccountTypes] = useState<string[]>([]);
  const [newAccountType, setNewAccountType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomAccountTypes();
  }, []);

  const loadCustomAccountTypes = async () => {
    try {
      const res = await fetch('/api/admin/config/custom-account-types');
      if (res.ok) {
        const data = await res.json();
        setCustomAccountTypes(data.customAccountTypes || []);
      }
    } catch (error) {
      console.error('Failed to load custom account types:', error);
    }
  };

  const addAccountType = async () => {
    if (!newAccountType.trim()) {
      setError('Please enter an account type identifier');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config/custom-account-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: newAccountType.trim() }),
      });

      if (res.ok) {
        await loadCustomAccountTypes();
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

  const deleteAccountType = async (accountType: string) => {
    if (!confirm(`Are you sure you want to remove "${accountType}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config/custom-account-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType }),
      });

      if (res.ok) {
        await loadCustomAccountTypes();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to delete account type');
      }
    } catch (error) {
      console.error('Failed to delete account type:', error);
      setError('Failed to delete account type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-airbnb-white shadow rounded-airbnb-md ${className}`}>
      <div className="px-6 py-4 border-b border-airbnb-border-light">
        <h2 className="text-lg font-medium text-airbnb-text-primary">💳 Custom Account Types</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add custom account type identifiers (e.g., KIWI_YES_0421, HDFC_SWIGGY_7712, DCB_4277)
        </p>
      </div>

      <div className="p-6">
        {/* Add New Account Type */}
        <div className="mb-6">
          <label htmlFor="new-account-type" className="block text-sm font-medium text-airbnb-text-secondary mb-2">
            Add New Account Type
          </label>
          <div className="flex gap-2">
            <input
              id="new-account-type"
              type="text"
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAccountType()}
              placeholder="e.g., KIWI_YES_0421"
              className="flex-1 px-3 py-2 border border-airbnb-border-light rounded-airbnb-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={addAccountType}
              disabled={loading || !newAccountType.trim()}
              className="px-4 py-2 bg-airbnb-red text-white rounded-airbnb-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            💡 Tip: Use uppercase with underscores (e.g., BANK_CARD_1234). The AI will use these to categorize transactions.
          </p>
        </div>

        {/* List of Custom Account Types */}
        <div>
          <h3 className="text-sm font-medium text-airbnb-text-secondary mb-3">
            Current Custom Account Types ({customAccountTypes.length})
          </h3>
          {customAccountTypes.length === 0 ? (
            <div className="text-center py-8 bg-airbnb-gray-light/50 rounded-airbnb-md">
              <span className="text-4xl mb-2 block">💳</span>
              <p className="text-gray-500 text-sm">No custom account types configured</p>
              <p className="text-gray-400 text-xs mt-1">Add your first custom account type above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customAccountTypes.map((accountType) => (
                <div
                  key={accountType}
                  className="flex items-center justify-between p-3 bg-airbnb-gray-light/50 rounded-airbnb-md hover:bg-airbnb-gray-light/30 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <span className="text-sm font-medium text-airbnb-text-primary">{accountType}</span>
                  </div>
                  <button
                    onClick={() => deleteAccountType(accountType)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

