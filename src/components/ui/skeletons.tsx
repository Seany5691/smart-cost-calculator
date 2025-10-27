'use client';

import { cn } from '@/lib/utils';

/**
 * Base skeleton component with pulsing animation
 */
function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
        'animate-pulse rounded-lg',
        className
      )}
    />
  );
}

/**
 * Skeleton loader for StatCard component
 * Matches the layout of StatCard from modern/StatCard.tsx
 */
export function StatCardSkeleton({ 
  className,
  isMobile = false 
}: { 
  className?: string;
  isMobile?: boolean;
}) {
  return (
    <div 
      className={cn(
        'relative bg-gradient-to-br from-white to-gray-50 rounded-2xl',
        isMobile ? 'p-4' : 'p-6',
        'shadow-lg border border-gray-200',
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>
      
      <div className="relative">
        {/* Icon skeleton */}
        <SkeletonBase 
          className={cn(
            'rounded-xl',
            isMobile ? 'w-10 h-10' : 'w-12 h-12'
          )} 
        />
        
        {/* Value skeleton */}
        <div className={cn('space-y-2', isMobile ? 'mt-3' : 'mt-4')}>
          <SkeletonBase 
            className={cn(
              'rounded',
              isMobile ? 'h-8 w-24' : 'h-10 w-32'
            )} 
          />
          <SkeletonBase 
            className={cn(
              'rounded',
              isMobile ? 'h-3 w-20' : 'h-4 w-24'
            )} 
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for ActivityTimeline card
 * Matches the layout of activity items in ActivityTimeline.tsx
 */
export function ActivityCardSkeleton({ 
  className,
  isMobile = false 
}: { 
  className?: string;
  isMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start space-x-4 bg-white/60 rounded-lg border border-gray-100',
        isMobile ? 'p-3' : 'p-4',
        className
      )}
    >
      {/* Activity Icon skeleton */}
      <SkeletonBase 
        className={cn(
          'rounded-lg flex-shrink-0',
          isMobile ? 'w-8 h-8' : 'w-9 h-9'
        )} 
      />

      {/* Activity Details skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Activity label */}
            <SkeletonBase 
              className={cn(
                'rounded',
                isMobile ? 'h-4 w-24' : 'h-5 w-32'
              )} 
            />
            {/* Deal name */}
            <SkeletonBase 
              className={cn(
                'rounded',
                isMobile ? 'h-3 w-32' : 'h-4 w-40'
              )} 
            />
          </div>
          {/* Timestamp */}
          <SkeletonBase 
            className={cn(
              'rounded ml-4',
              isMobile ? 'h-3 w-16' : 'h-3 w-20'
            )} 
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Complete dashboard skeleton combining all loading states
 * Used during initial dashboard load
 */
export function DashboardSkeleton({ 
  isMobile = false 
}: { 
  isMobile?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Stats skeleton - 3 stat cards */}
      <div className={cn(
        'grid gap-6',
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
      )}>
        <StatCardSkeleton isMobile={isMobile} />
        <StatCardSkeleton isMobile={isMobile} />
        <StatCardSkeleton isMobile={isMobile} />
      </div>

      {/* Activity timeline skeleton */}
      <div className={cn(
        'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-glass',
        isMobile ? 'p-4' : 'p-6'
      )}>
        {/* Timeline header */}
        <div className="flex items-center space-x-2 mb-4">
          <SkeletonBase className="w-5 h-5 rounded" />
          <SkeletonBase className={cn(
            'rounded',
            isMobile ? 'h-6 w-32' : 'h-7 w-40'
          )} />
        </div>

        {/* Activity cards - show 5 skeleton cards */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <ActivityCardSkeleton 
              key={index} 
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
