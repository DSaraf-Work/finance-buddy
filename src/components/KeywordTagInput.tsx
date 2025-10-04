import { useState, useEffect, useRef } from 'react';
import { TransactionKeyword } from '@/pages/api/keywords';

interface KeywordTagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function KeywordTagInput({ 
  value, 
  onChange, 
  placeholder = "Add keywords...",
  className = ""
}: KeywordTagInputProps) {
  const [keywords, setKeywords] = useState<TransactionKeyword[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TransactionKeyword[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse current tags from value
  const currentTags = value ? value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

  useEffect(() => {
    fetchKeywords();
  }, []);

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = keywords.filter(keyword => 
        keyword.keyword.toLowerCase().includes(inputValue.toLowerCase()) &&
        !currentTags.some(tag => tag.toLowerCase() === keyword.keyword.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, keywords, currentTags]);

  const fetchKeywords = async () => {
    try {
      const response = await fetch('/api/keywords?active_only=true');
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().charAt(0).toUpperCase() + tag.trim().slice(1).toLowerCase();
    if (normalizedTag && !currentTags.some(t => t.toLowerCase() === normalizedTag.toLowerCase())) {
      const newTags = [...currentTags, normalizedTag];
      onChange(newTags.join(', '));
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    onChange(newTags.join(', '));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && inputValue === '' && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (keyword: TransactionKeyword) => {
    addTag(keyword.keyword);
  };

  const getUsageBadgeColor = (category: string) => {
    switch (category) {
      case 'frequent':
        return 'bg-green-50 border-green-200';
      case 'common':
        return 'bg-blue-50 border-blue-200';
      case 'rare':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Current Tags */}
          {currentTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
          
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={currentTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((keyword) => (
            <button
              key={keyword.id}
              type="button"
              onClick={() => handleSuggestionClick(keyword)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-l-2 ${getUsageBadgeColor(keyword.usage_category)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {keyword.keyword}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {keyword.usage_count} uses
                  </span>
                  {keyword.auto_generated && (
                    <span className="text-xs text-purple-600">AI</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Popular Keywords */}
      {currentTags.length === 0 && inputValue === '' && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Popular keywords:</div>
          <div className="flex flex-wrap gap-1">
            {keywords
              .filter(k => k.usage_category === 'frequent')
              .slice(0, 6)
              .map((keyword) => (
                <button
                  key={keyword.id}
                  type="button"
                  onClick={() => addTag(keyword.keyword)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {keyword.keyword}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
