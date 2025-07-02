'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input } from './index';

export interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSortProps {
  sortOptions: SortOption[];
  filterOptions: FilterOption[];
  selectedSort: string;
  selectedFilters: string[];
  onSortChange: (sort: string) => void;
  onFilterChange: (filters: string[]) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export default function FilterSort({
  sortOptions,
  filterOptions,
  selectedSort,
  selectedFilters,
  onSortChange,
  onFilterChange,
  onSearch,
  searchPlaceholder = 'Search...',
  className = '',
}: FilterSortProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortChange = (sort: string) => {
    onSortChange(sort);
    setIsSortOpen(false);
  };

  const handleFilterToggle = (filterValue: string) => {
    const newFilters = selectedFilters.includes(filterValue)
      ? selectedFilters.filter(f => f !== filterValue)
      : [...selectedFilters, filterValue];
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const selectedSortLabel = sortOptions.find(option => option.value === selectedSort)?.label || 'Sort by';

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {/* Search */}
      {onSearch && (
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            leftIcon={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Sort Dropdown */}
      <div className="relative" ref={sortRef}>
        <Button
          variant="outline"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="min-w-[140px] justify-between"
        >
          <span>{selectedSortLabel}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isSortOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                  selectedSort === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span>{option.label}</span>
                {selectedSort === option.value && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Dropdown */}
      <div className="relative" ref={filterRef}>
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`min-w-[140px] justify-between ${
            selectedFilters.length > 0 ? 'border-blue-500 text-blue-600' : ''
          }`}
        >
          <span>
            Filters
            {selectedFilters.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                {selectedFilters.length}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isFilterOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                {selectedFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
            <div className="p-2">
              {filterOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFilters.includes(option.value)}
                    onChange={() => handleFilterToggle(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 