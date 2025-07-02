'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  FilterSort, 
  Pagination, 
  ExportImport, 
  Card, 
  CardHeader, 
  CardBody,
  Badge,
  SkeletonList,
  ErrorBoundary
} from '@/components/ui';
import SearchBar from '@/components/search/SearchBar';
import { useSearch, usePosts, useOrganizations } from '@/lib/hooks';
import SEOHead, { SEOConfigs } from '@/components/seo/SEOHead';
import { usePerformanceMonitor } from '@/lib/performance';
import { LazyComponent } from '@/components/lazy/LazyComponents';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'organizations'>('all');

  const { searchResults, searchAll, isLoading } = useSearch();
  const { posts } = usePosts();
  const { organizations } = useOrganizations();
  const { trackComponentRender, mark, measure } = usePerformanceMonitor();

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'author', label: 'Author' },
  ];

  // Filter options
  const filterOptions = [
    { value: 'published', label: 'Published', count: posts.filter(p => p.status === 'published').length },
    { value: 'draft', label: 'Draft', count: posts.filter(p => p.status === 'draft').length },
    { value: 'archived', label: 'Archived', count: posts.filter(p => p.status === 'archived').length },
  ];

  useEffect(() => {
    // Track component render performance
    const startTime = performance.now();
    mark('search-render-start');
    
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackComponentRender('SearchPage', renderTime);
      measure('search-render', 'search-render-start');
    };
  }, [query, trackComponentRender, mark, measure]);

  const performSearch = async (searchTerm: string) => {
    if (searchTerm.trim()) {
      const startTime = performance.now();
      await searchAll(searchTerm);
      const endTime = performance.now();
      trackComponentRender('SearchQuery', endTime - startTime);
    }
  };

  const handleSearch = (searchTerm: string) => {
    const startTime = performance.now();
    setSearchQuery(searchTerm);
    setCurrentPage(1);
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    const endTime = performance.now();
    trackComponentRender('SearchNavigation', endTime - startTime);
  };

  const handleSortChange = (sort: string) => {
    const startTime = performance.now();
    setSelectedSort(sort);
    setCurrentPage(1);
    const endTime = performance.now();
    trackComponentRender('SortChange', endTime - startTime);
  };

  const handleFilterChange = (filters: string[]) => {
    const startTime = performance.now();
    setSelectedFilters(filters);
    setCurrentPage(1);
    const endTime = performance.now();
    trackComponentRender('FilterChange', endTime - startTime);
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
      <CardBody>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-700">
              {user.firstName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.username || 'Unnamed User'
              }
            </h3>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const renderOrganizationCard = (org: any) => (
    <Card key={org.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {org.name}
        </h3>
        <p className="text-sm text-gray-500">
          Created {new Date(org.createdAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardBody>
        {org.description && (
          <p className="text-gray-600 mb-3">{org.description}</p>
        )}
        <button
          onClick={() => router.push(`/organizations/${org.id}`)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View organization →
        </button>
      </CardBody>
    </Card>
  );

  const renderResults = () => {
    if (isLoading) {
      return <SkeletonList items={6} />;
    }

    const allResults = [
      ...(searchResults.posts || []).map(p => ({ ...p, type: 'post' })),
      ...(searchResults.users || []).map(u => ({ ...u, type: 'user' })),
      ...(searchResults.organizations || []).map(o => ({ ...o, type: 'organization' })),
    ];

    if (allResults.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      );
    }

    // Apply filters and sorting
    let filteredResults = allResults;

    if (selectedFilters.length > 0) {
      filteredResults = filteredResults.filter(result => {
        if (result.type === 'post') {
          return selectedFilters.includes(result.status);
        }
        return true;
      });
    }

    // Apply sorting
    filteredResults.sort((a, b) => {
      switch (selectedSort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'author':
          if (a.type === 'post' && b.type === 'post') {
            return (a.author?.firstName || '').localeCompare(b.author?.firstName || '');
          }
          return 0;
        default:
          return 0;
      }
    });

    // Pagination
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    return (
      <div className="space-y-6">
        {paginatedResults.map((result) => {
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
        
        {filteredResults.length > itemsPerPage && (
          <LazyComponent>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredResults.length / itemsPerPage)}
              totalItems={filteredResults.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </LazyComponent>
        )}
      </div>
    );
  };

  return (
    <>
      <SEOHead {...SEOConfigs.search} />
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
            <p className="text-gray-600">
              Find posts, users, and organizations across the platform
            </p>
          </div>

          <div className="mb-6">
            <LazyComponent>
              <SearchBar
                value={searchQuery}
                onSearch={handleSearch}
                placeholder="Search posts, users, organizations..."
              />
            </LazyComponent>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 space-y-6">
              <LazyComponent>
                <FilterSort
                  sortOptions={sortOptions}
                  filterOptions={filterOptions}
                  selectedSort={selectedSort}
                  selectedFilters={selectedFilters}
                  onSortChange={handleSortChange}
                  onFilterChange={handleFilterChange}
                />
              </LazyComponent>

              <LazyComponent>
                <ExportImport
                  onImport={handleImport}
                  data={searchResults}
                  type="search"
                />
              </LazyComponent>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <ErrorBoundary>
                {renderResults()}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 