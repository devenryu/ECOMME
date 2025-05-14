'use client';

import { useProductViews } from '@/lib/hooks/useProductViews';
import { EyeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ViewCounterProps {
  productId: string;
  period?: 'day' | 'week' | 'month' | 'all';
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  tooltipText?: string;
}

export function ViewCounter({
  productId,
  period = 'all',
  className,
  iconClassName,
  showIcon = true,
  tooltipText,
}: ViewCounterProps) {
  const { viewCount, isLoading, error } = useProductViews(productId, {
    period,
    refreshInterval: null, // Only fetch once
  });

  if (isLoading) {
    return (
      <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
        {showIcon && <EyeIcon className={cn("h-3.5 w-3.5 mr-1", iconClassName)} />}
        <span className="animate-pulse">···</span>
      </div>
    );
  }

  if (error || viewCount === undefined) {
    return null;
  }

  // Format view count
  const formattedCount = new Intl.NumberFormat().format(viewCount);
  
  const content = (
    <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
      {showIcon && <EyeIcon className={cn("h-3.5 w-3.5 mr-1", iconClassName)} />}
      <span>{formattedCount}</span>
    </div>
  );

  // Return with tooltip if text provided
  return tooltipText ? (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : content;
} 