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

    // Call onChange to update parent state (but don't save to database yet)
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
    if (keyword.usage_count > 10) return { text: 'Popular', class: 'bg-green-50/20 text-green-700' };
    if (keyword.usage_count > 3) return { text: 'Common', class: 'bg-[#5D5FEF]/20 text-[#888BFF]' };
    return { text: 'New', class: 'bg-[#2A2C35] text-airbnb-text-tertiary' };
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
        <div className="h-32 bg-airbnb-white rounded-airbnb-md"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Keywords Display */}
      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-[#5D5FEF]/10 rounded-airbnb-md border border-[#5D5FEF]/30">
          <span className="text-sm font-medium text-airbnb-text-primary">Selected:</span>
          {selectedKeywords.map((keyword, index) => {
            const keywordObj = keywords.find(k => k.keyword === keyword);
            return (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-sm bg-[#5D5FEF]/20 text-airbnb-text-primary rounded-full border border-[#5D5FEF]/40"
                style={{ backgroundColor: keywordObj?.color ? `${keywordObj.color}20` : undefined }}
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => {
                    const newSelected = selectedKeywords.filter(k => k !== keyword);
                    onChange(newSelected.join(', '));
                  }}
                  className="ml-1 text-airbnb-text-primary hover:text-[#5D5FEF] transition-colors"
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
        <div className="p-3 bg-[#888BFF]/10 rounded-airbnb-md border border-[#888BFF]/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-airbnb-text-primary">💡 Smart suggestions for {merchantName}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {getSmartSuggestions().map(suggestion => {
              const keywordObj = keywords.find(k => k.keyword === suggestion);
              return keywordObj ? (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => toggleKeyword(keywordObj)}
                  className="px-3 py-1 text-sm bg-[#888BFF]/20 text-airbnb-text-primary rounded-full hover:bg-[#888BFF]/30 transition-colors border border-[#888BFF]/40"
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
          className="w-full px-4 py-2 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-airbnb-text-tertiary hover:text-airbnb-text-primary transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Keyword Categories */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {categories.map(category => (
          <div key={category.name} className="border border-airbnb-border-light rounded-airbnb-md overflow-hidden bg-airbnb-white">
            <div
              className="px-4 py-2 font-medium text-airbnb-text-primary text-sm"
              style={{ backgroundColor: category.color }}
            >
              {category.name} ({category.keywords.length})
            </div>
            <div className="p-3 bg-airbnb-white">
              <div className="flex flex-wrap gap-2">
                {category.keywords.map(keyword => {
                  const isSelected = selectedKeywords.includes(keyword.keyword);
                  const badge = getUsageBadge(keyword);

                  return (
                    <button
                      key={keyword.id}
                      type="button"
                      onClick={() => toggleKeyword(keyword)}
                      className={`relative inline-flex items-center px-3 py-2 text-sm rounded-airbnb-md border transition-all ${
                        isSelected
                          ? 'bg-[#5D5FEF]/20 border-[#5D5FEF] text-airbnb-text-primary shadow-sm'
                          : 'bg-airbnb-white border-airbnb-border-light text-airbnb-text-secondary hover:bg-airbnb-white hover:border-[#5D5FEF]/50'
                      }`}
                    >
                      <span>{keyword.keyword}</span>
                      {keyword.usage_count > 0 && (
                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${badge.class}`}>
                          {keyword.usage_count}
                        </span>
                      )}
                      {keyword.auto_generated && (
                        <span className="ml-1 text-xs text-[#888BFF]">AI</span>
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
      <div className="border-t border-airbnb-border-light pt-4">
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-2 text-sm text-[#5D5FEF] border border-[#5D5FEF]/50 rounded-airbnb-md hover:bg-[#5D5FEF]/10 transition-colors"
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
                className="flex-1 px-3 py-2 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary placeholder-[#6F7280] focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
                autoFocus
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-airbnb-white border border-airbnb-border-light rounded-airbnb-md text-airbnb-text-primary focus:ring-2 focus:ring-[#5D5FEF] focus:border-[#5D5FEF] transition-all"
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
                className="px-4 py-2 bg-gradient-to-r from-[#5D5FEF] to-[#888BFF] text-airbnb-text-primary rounded-airbnb-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingKeyword ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewKeyword('');
                }}
                className="px-4 py-2 text-airbnb-text-secondary border border-airbnb-border-light rounded-airbnb-md hover:bg-airbnb-white transition-colors"
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
