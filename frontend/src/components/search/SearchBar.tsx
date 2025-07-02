'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button } from '@/components/ui';
import { useSearch } from '@/lib/hooks';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function SearchBar({ 
  placeholder = 'Search posts, users, or organizations...',
  onSearch,
  className = '',
  variant = 'default'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { searchResults, searchPosts, searchUsers, isLoading } = useSearch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsSearching(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchPosts(value);
        searchUsers(value);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
      setIsSearching(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.title || suggestion.name || suggestion.email);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(suggestion.title || suggestion.name || suggestion.email);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = searchResults.posts.length > 0 || searchResults.users.length > 0;

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          leftIcon={
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          rightIcon={
            query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          }
          className="pr-10"
        />
        
        {variant === 'default' && (
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="absolute right-1 top-1"
            disabled={!query.trim() || isLoading}
          >
            Search
          </Button>
        )}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && (hasResults || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {/* Posts */}
              {searchResults.posts.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Posts
                  </div>
                  {searchResults.posts.slice(0, 3).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handleSuggestionClick(post)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {post.excerpt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Users */}
              {searchResults.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Users
                  </div>
                  {searchResults.users.slice(0, 3).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSuggestionClick(user)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.firstName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || 'Unnamed User'
                          }
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* View All Results */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowSuggestions(false);
                    if (onSearch) onSearch(query);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 