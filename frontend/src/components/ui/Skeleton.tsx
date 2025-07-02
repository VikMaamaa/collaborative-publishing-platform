'use client';

import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

interface SkeletonCardProps {
  title?: boolean;
  subtitle?: boolean;
  content?: boolean;
  className?: string;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  );
}

export function SkeletonText({ lines = 1, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <Skeleton className={`rounded-full ${sizeClasses[size]} ${className}`} />
  );
}

export function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <Skeleton className={`h-10 w-24 rounded-md ${className}`} />
  );
}

export function SkeletonCard({ title = true, subtitle = false, content = true, className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {title && (
        <Skeleton className="h-6 w-1/3 mb-2" />
      )}
      {subtitle && (
        <Skeleton className="h-4 w-1/2 mb-4" />
      )}
      {content && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-1/3' : 'flex-1'}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <SkeletonButton />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ cols = 3, rows = 2, className = '' }: { cols?: number; rows?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6 ${className}`}>
      {Array.from({ length: cols * rows }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4, className = '' }: { fields?: number; className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
} 