import { useState, useEffect } from 'react';
import { getProductViewCount } from '@/lib/product-tracking';

type ViewPeriod = 'day' | 'week' | 'month' | 'all';

interface UseProductViewsOptions {
  initialValue?: number;
  period?: ViewPeriod;
  refreshInterval?: number | null;
}

/**
 * Hook to get view count for a product
 * @param productId - The UUID of the product
 * @param options - Configuration options
 * @returns Object with view count and loading state
 */
export function useProductViews(
  productId: string | null | undefined,
  options: UseProductViewsOptions = {}
) {
  const {
    initialValue = 0,
    period = 'all',
    refreshInterval = null,
  } = options;
  
  const [viewCount, setViewCount] = useState<number>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    
    const fetchViewCount = async () => {
      try {
        setIsLoading(true);
        const count = await getProductViewCount(productId, period);
        
        if (isMounted) {
          setViewCount(count);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching product view count:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch view count'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Fetch view count immediately
    fetchViewCount();
    
    // Set up interval if needed
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchViewCount, refreshInterval);
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [productId, period, refreshInterval]);
  
  return {
    viewCount,
    isLoading,
    error,
  };
} 