import { useState, useEffect, useRef } from 'react';
import { TransactionKeyword } from '@/pages/api/keywords';

interface KeywordCategory {
  name: string;
  color: string;
  keywords: TransactionKeyword[];
}

interface InteractiveKeywordSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  merchantName?: string;
  transactionAmount?: number;
}

export default function InteractiveKeywordSelector({ 
  value, 
  onChange, 
  placeholder = "Select keywords to categorize this transaction...",
  className = "",
  merchantName,
  transactionAmount
}: InteractiveKeywordSelectorProps) {
  const [keywords, setKeywords] = useState<TransactionKeyword[]>([]);
  const [categories, setCategories] = useState<KeywordCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse current selected keywords
  const selectedKeywords = value ? value.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];

  useEffect(() => {
    fetchKeywords();
  }, []);

  useEffect(() => {
    organizeKeywordsByCategory();
  }, [keywords, searchTerm]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/keywords?active_only=true');
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeKeywordsByCategory = () => {
    const filteredKeywords = keywords.filter(keyword => 
      searchTerm === '' || keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categoryMap = new Map<string, KeywordCategory>();
    
    filteredKeywords.forEach(keyword => {
      const categoryName = keyword.category || 'Other';
      const categoryColor = keyword.color || '#6B7280';
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          color: categoryColor,
          keywords: []
        });
      }
      
      categoryMap.get(categoryName)!.keywords.push(keyword);
    });

    // Sort categories by keyword count and then alphabetically
    const sortedCategories = Array.from(categoryMap.values()).sort((a, b) => {
      if (a.keywords.length !== b.keywords.length) {
        return b.keywords.length - a.keywords.length;
      }
      return a.name.localeCompare(b.name);
    });

    setCategories(sortedCategories);
  };

  const toggleKeyword = (keyword: TransactionKeyword) => {
    const isSelected = selectedKeywords.includes(keyword.keyword);
    let newSelectedKeywords;

    if (isSelected) {
      newSelectedKeywords = selectedKeywords.filter(k => k !== keyword.keyword);
    } else {
      newSelectedKeywords = [...selectedKeywords, keyword.keyword];
    }

    onChange(newSelectedKeywords.join(', '));
  };

  const addNewKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      setIsAddingKeyword(true);
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          category: selectedCategory,
          color: getCategoryColor(selectedCategory),
          is_active: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newKeywordObj = data.keyword;
        
        // Add to local state
        setKeywords(prev => [...prev, newKeywordObj]);
        
        // Auto-select the new keyword
        const newSelectedKeywords = [...selectedKeywords, newKeywordObj.keyword];
        onChange(newSelectedKeywords.join(', '));
        
        // Reset form
        setNewKeyword('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
    } finally {
      setIsAddingKeyword(false);
    }
  };

  const getCategoryColor = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      'Food & Dining': '#10B981',
      'Health & Fitness': '#8B5CF6',
      'Shopping': '#F59E0B',
      'Entertainment': '#EF4444',
      'Personal': '#EC4899',
      'Transportation': '#3B82F6',
      'Utilities': '#6B7280',
      'Other': '#6B7280'
    };
    return colorMap[categoryName] || '#6B7280';
  };

  const getUsageBadge = (keyword: TransactionKeyword) => {
    if (keyword.usage_count > 10) return { text: 'Popular', class: 'bg-green-100 text-green-800' };
    if (keyword.usage_count > 3) return { text: 'Common', class: 'bg-blue-100 text-blue-800' };
    return { text: 'New', class: 'bg-gray-100 text-gray-800' };
  };

  const getSmartSuggestions = () => {
    if (!merchantName) return [];
    
    const merchant = merchantName.toLowerCase();
    const suggestions = [];
    
    if (merchant.includes('swiggy') || merchant.includes('zomato') || merchant.includes('food')) {
      suggestions.push('Food', 'Delivery');
    } else if (merchant.includes('uber') || merchant.includes('ola') || merchant.includes('transport')) {
      suggestions.push('Transport', 'Travel');
    } else if (merchant.includes('amazon') || merchant.includes('flipkart') || merchant.includes('shop')) {
      suggestions.push('Shopping', 'Online');
    } else if (merchant.includes('gym') || merchant.includes('fitness')) {
      suggestions.push('Fitness', 'Health');
    }
    
    return suggestions.filter(s => !selectedKeywords.includes(s));
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Keywords Display */}
      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">Selected:</span>
          {selectedKeywords.map((keyword, index) => {
            const keywordObj = keywords.find(k => k.keyword === keyword);
            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                style={{ backgroundColor: keywordObj?.color ? `${keywordObj.color}20` : undefined }}
              >
                {keyword}
                <button
                  onClick={() => {
                    const newSelected = selectedKeywords.filter(k => k !== keyword);
                    onChange(newSelected.join(', '));
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Smart Suggestions */}
      {merchantName && getSmartSuggestions().length > 0 && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-yellow-900">💡 Smart suggestions for {merchantName}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {getSmartSuggestions().map(suggestion => {
              const keywordObj = keywords.find(k => k.keyword === suggestion);
              return keywordObj ? (
                <button
                  key={suggestion}
                  onClick={() => toggleKeyword(keywordObj)}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
                >
                  + {suggestion}
                </button>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search keywords..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Keyword Categories */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {categories.map(category => (
          <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="px-4 py-2 font-medium text-white text-sm"
              style={{ backgroundColor: category.color }}
            >
              {category.name} ({category.keywords.length})
            </div>
            <div className="p-3 bg-white">
              <div className="flex flex-wrap gap-2">
                {category.keywords.map(keyword => {
                  const isSelected = selectedKeywords.includes(keyword.keyword);
                  const badge = getUsageBadge(keyword);
                  
                  return (
                    <button
                      key={keyword.id}
                      onClick={() => toggleKeyword(keyword)}
                      className={`relative inline-flex items-center px-3 py-2 text-sm rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{keyword.keyword}</span>
                      {keyword.usage_count > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${badge.class}`}>
                          {keyword.usage_count}
                        </span>
                      )}
                      {keyword.auto_generated && (
                        <span className="ml-1 text-xs text-purple-600">AI</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Keyword */}
      <div className="border-t pt-4">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            + Add Custom Keyword
          </button>
        ) : (
          <form onSubmit={addNewKeyword} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter new keyword..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Personal">Personal</option>
                <option value="Transportation">Transportation</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newKeyword.trim() || isAddingKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingKeyword ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewKeyword('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
