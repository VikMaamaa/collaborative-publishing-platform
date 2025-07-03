'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/hooks';
import { Button, Card, CardHeader, CardBody, Badge, Pagination, FilterSort, ExportImport } from '@/components/ui';
import { usePerformanceMonitor } from '@/lib/performance';
import SEOHead, { SEOConfigs } from '@/components/seo/SEOHead';
import { LazyComponent } from '@/components/lazy/LazyComponents';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SearchPage() {
  const router = useRouter();
  const { searchResults, isLoading, searchAll, clearSearch } = useSearch();
  const { trackComponentRender, mark, measure } = usePerformanceMonitor();
  
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Track component render performance
    const startTime = performance.now();
    mark('search-render-start');
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackComponentRender('SearchPage', renderTime);
      measure('search-render', 'search-render-start');
    };
  }, [trackComponentRender, mark, measure]);

  const handleSearch = async (searchQuery: string) => {
    const startTime = performance.now();
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      await searchAll(searchQuery);
    } else {
      clearSearch();
    }
    const endTime = performance.now();
    trackComponentRender('SearchExecution', endTime - startTime);
  };

  const handleFilterChange = (newFilters: any) => {
    const startTime = performance.now();
    setFilters(newFilters);
    // TODO: Apply filters to search results
    const endTime = performance.now();
    trackComponentRender('FilterChange', endTime - startTime);
  };

  const handleSortChange = (newSortBy: string) => {
    const startTime = performance.now();
    setSortBy(newSortBy);
    // TODO: Apply sorting to search results
    const endTime = performance.now();
    trackComponentRender('SortChange', endTime - startTime);
  };

  const handlePageChange = (page: number) => {
    const startTime = performance.now();
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const endTime = performance.now();
    trackComponentRender('PageChange', endTime - startTime);
  };

  const handleImport = (data: any[]) => {
    // Handle imported data - this would typically update the store
    console.log('Imported data:', data);
  };

  const renderPostCard = (post: any) => (
    <Card key={post.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {post.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>By {post.author?.firstName} {post.author?.lastName}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <Badge variant={post.status === 'published' ? 'success' : 'warning'}>
                {post.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {post.excerpt && (
          <p className="text-gray-600 mb-3">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {post.organization?.name}
          </span>
          <button
            onClick={() => router.push(`/posts/${post.id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Read more →
          </button>
        </div>
      </CardBody>
    </Card>
  );

  const renderUserCard = (user: any) => (
    <Card key={user.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm">
            View Profile
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  const renderOrganizationCard = (org: any) => (
    <Card key={org.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {org.name}
            </h3>
            {org.description && (
              <p className="text-gray-600 mb-2">{org.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
              <span>{org.memberCount || 0} members</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {org.postCount || 0} posts
          </span>
          <Button variant="outline" size="sm">
            View Organization
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  const allResults = [
    ...searchResults.posts.map((post: any) => ({ ...post, type: 'post' })),
    ...searchResults.users.map((user: any) => ({ ...user, type: 'user' })),
    ...searchResults.organizations.map((org: any) => ({ ...org, type: 'organization' }))
  ];

  const paginatedResults = allResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <ProtectedRoute>
      <>
        <SEOHead {...SEOConfigs.search} />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
            <p className="text-gray-600">Find posts, users, and organizations</p>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="Search for posts, users, or organizations..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSearch(query)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters and Sort */}
          <LazyComponent>
            <div className="mb-6">
              <FilterSort
                filters={filters}
                sortBy={sortBy}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
              />
            </div>
          </LazyComponent>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          ) : query && allResults.length > 0 ? (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">
                    Found {allResults.length} results for "{query}"
                  </p>
                  <LazyComponent>
                    <ExportImport
                      data={allResults}
                      onImport={handleImport}
                      filename={`search-results-${query}`}
                    />
                  </LazyComponent>
                </div>
              </div>

              <div className="space-y-6">
                {paginatedResults.map((result: any) => {
                  switch (result.type) {
                    case 'post':
                      return renderPostCard(result);
                    case 'user':
                      return renderUserCard(result);
                    case 'organization':
                      return renderOrganizationCard(result);
                    default:
                      return null;
                  }
                })}
              </div>

              {/* Pagination */}
              {allResults.length > itemsPerPage && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(allResults.length / itemsPerPage)}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : query && allResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">Enter a search term to find posts, users, or organizations</p>
            </div>
          )}
        </div>
      </>
    </ProtectedRoute>
  );
} 