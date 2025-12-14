import { useState, useEffect } from 'react';

interface CategoriesManagerProps {
  className?: string;
}

export default function CategoriesManager({ className = '' }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/config/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) {
      setError('Please enter a category name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory.trim() }),
      });

      if (res.ok) {
        await loadCategories();
        setNewCategory('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      setError('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (category: string) => {
    if (!confirm(`Are you sure you want to remove "${category}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/config/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (res.ok) {
        await loadCategories();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-airbnb-white shadow rounded-airbnb-md ${className}`}>
      <div className="px-6 py-4 border-b border-airbnb-border-light">
        <h2 className="text-lg font-medium text-airbnb-text-primary">🏷️ Transaction Categories</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage categories for AI transaction classification (e.g., food, transport, shopping)
        </p>
      </div>

      <div className="p-6">
        {/* Add New Category */}
        <div className="mb-6">
          <label htmlFor="new-category" className="block text-sm font-medium text-airbnb-text-secondary mb-2">
            Add New Category
          </label>
          <div className="flex gap-2">
            <input
              id="new-category"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="e.g., groceries"
              className="flex-1 px-3 py-2 border border-airbnb-border-light rounded-airbnb-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={addCategory}
              disabled={loading || !newCategory.trim()}
              className="px-4 py-2 bg-airbnb-red text-white rounded-airbnb-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            💡 Tip: Use lowercase with underscores (e.g., food_delivery). The AI will categorize transactions using these.
          </p>
        </div>

        {/* List of Categories */}
        <div>
          <h3 className="text-sm font-medium text-airbnb-text-secondary mb-3">
            Current Categories ({categories.length})
          </h3>
          {categories.length === 0 ? (
            <div className="text-center py-8 bg-airbnb-gray-light/50 rounded-airbnb-md">
              <span className="text-4xl mb-2 block">🏷️</span>
              <p className="text-gray-500 text-sm">No categories configured</p>
              <p className="text-gray-400 text-xs mt-1">Add your first category above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-airbnb-gray-light/50 rounded-airbnb-md hover:bg-airbnb-gray-light/30 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-2">🏷️</span>
                    <span className="text-sm font-medium text-airbnb-text-primary capitalize">{category.replace(/_/g, ' ')}</span>
                  </div>
                  <button
                    onClick={() => deleteCategory(category)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                  >
                    ×
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

