import { useState, useEffect } from 'react';
import { TransactionKeyword } from '@/pages/api/keywords';

interface KeywordManagerProps {
  className?: string;
}

export default function KeywordManager({ className = '' }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<TransactionKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/keywords');
      if (!response.ok) {
        throw new Error('Failed to fetch keywords');
      }
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Error fetching keywords:', error);
      setError('Failed to load keywords');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      setIsAdding(true);
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          is_active: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add keyword');
      }

      setNewKeyword('');
      await fetchKeywords();
    } catch (error: any) {
      console.error('Error adding keyword:', error);
      setError(error.message || 'Failed to add keyword');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleKeyword = async (keywordId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/keywords/${keywordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update keyword');
      }

      await fetchKeywords();
    } catch (error) {
      console.error('Error updating keyword:', error);
      setError('Failed to update keyword');
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) {
      return;
    }

    try {
      const response = await fetch(`/api/keywords/${keywordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete keyword');
      }

      await fetchKeywords();
    } catch (error) {
      console.error('Error deleting keyword:', error);
      setError('Failed to delete keyword');
    }
  };

  const getUsageBadgeColor = (category: string) => {
    switch (category) {
      case 'frequent':
        return 'bg-accent-emerald/10 text-accent-emerald';
      case 'common':
        return 'bg-blue-100 text-blue-800';
      case 'rare':
        return 'bg-bg-elevated/30 text-gray-800';
      default:
        return 'bg-bg-elevated/30 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`bg-bg-secondary rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-secondary rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-medium text-text-primary flex items-center">
          <span className="mr-2">🏷️</span>
          Transaction Keywords
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage keywords used for transaction categorization
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-error text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add New Keyword Form */}
        <form onSubmit={handleAddKeyword} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter new keyword..."
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isAdding}
            />
            <button
              type="submit"
              disabled={isAdding || !newKeyword.trim()}
              className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Keywords List */}
        <div className="space-y-2">
          {keywords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No keywords found. Add your first keyword above.
            </p>
          ) : (
            keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-text-primary">
                    {keyword.keyword}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUsageBadgeColor(
                      keyword.usage_category
                    )}`}
                  >
                    {keyword.usage_count} uses
                  </span>
                  {keyword.auto_generated && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      AI Generated
                    </span>
                  )}
                  {!keyword.is_active && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-error/10 text-error">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleKeyword(keyword.id, keyword.is_active)}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      keyword.is_active
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-accent-emerald/10 text-accent-emerald hover:bg-green-200'
                    }`}
                  >
                    {keyword.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteKeyword(keyword.id)}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-error/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Statistics */}
        {keywords.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {keywords.filter(k => k.is_active).length}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {keywords.filter(k => k.auto_generated).length}
                </div>
                <div className="text-sm text-gray-500">AI Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {keywords.filter(k => k.usage_category === 'frequent').length}
                </div>
                <div className="text-sm text-gray-500">Frequent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {keywords.reduce((sum, k) => sum + k.usage_count, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Uses</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
