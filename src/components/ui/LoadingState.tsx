'use client';

import { Spinner } from './Spinner';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonForm } from './Skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'card' | 'table' | 'form';
  message?: string;
  fullScreen?: boolean;
  className?: string;
  rows?: number;
  columns?: number;
  fields?: number;
}

export function LoadingState({
  type = 'spinner',
  message = 'Loading...',
  fullScreen = false,
  className,
  rows,
  columns,
  fields
}: LoadingStateProps) {
  const content = () => {
    switch (type) {
      case 'skeleton':
        return <Skeleton className={className} />;
      case 'card':
        return <SkeletonCard className={className} />;
      case 'table':
        return <SkeletonTable rows={rows} columns={columns} className={className} />;
      case 'form':
        return <SkeletonForm fields={fields} className={className} />;
      case 'spinner':
      default:
        return (
          <div className="flex flex-col items-center space-y-4">
            <Spinner size="lg" />
            {message && <p className="text-gray-600 font-medium">{message}</p>}
          </div>
        );
    }
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">{content()}</div>
      </div>
    );
  }

  return <div className={cn('flex items-center justify-center p-8', className)}>{content()}</div>;
}
