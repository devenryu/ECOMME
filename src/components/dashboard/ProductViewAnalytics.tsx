'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EyeIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';

interface ProductViewData {
  productId: string;
  viewCount: {
    day: number;
    week: number;
    month: number;
    all: number;
  };
  title: string;
}

interface ProductViewAnalyticsProps {
  productId?: string; // Optional - if provided, shows data for just one product
  className?: string;
}

export function ProductViewAnalytics({ productId, className }: ProductViewAnalyticsProps) {
  const [products, setProducts] = useState<ProductViewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductViews = async () => {
      try {
        setIsLoading(true);
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const url = productId 
          ? `${baseUrl}/api/analytics/product-views?productId=${productId}`
          : `${baseUrl}/api/analytics/product-views`;
        
        const response = await fetch(url, { 
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch product views');
        }
        
        const data = await response.json();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching product views:', err);
        setError('Failed to load product view data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductViews();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchProductViews, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [productId]);
  
  const getMostViewedProducts = (period: 'day' | 'week' | 'month' | 'all', limit: number = 5) => {
    return [...products]
      .sort((a, b) => b.viewCount[period] - a.viewCount[period])
      .slice(0, limit);
  };
  
  const getTotalViews = (period: 'day' | 'week' | 'month' | 'all') => {
    return products.reduce((sum, product) => sum + product.viewCount[period], 0);
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Views</CardTitle>
          <CardDescription>Loading view statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Product Views</CardTitle>
          <CardDescription>Error loading view statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeIcon className="h-5 w-5" />
          Product Views
        </CardTitle>
        <CardDescription>
          View statistics for your {productId ? 'product' : 'products'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
          
          {['day', 'week', 'month', 'all'].map((period) => (
            <TabsContent key={period} value={period} className="space-y-4">
              {!productId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Views</div>
                    <div className="text-2xl font-bold mt-1">
                      {getTotalViews(period as any).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {period === 'day' ? 'Today\'s' : 
                       period === 'week' ? 'This Week\'s' :
                       period === 'month' ? 'This Month\'s' : 'All-Time'} Performance
                    </div>
                    <div className="text-lg font-medium mt-1 flex items-center">
                      <TrendingUpIcon className="h-4 w-4 mr-1 text-green-500" />
                      <span className="text-green-500">
                        {(getTotalViews(period as any) / Math.max(products.length, 1)).toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">views per product</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {!productId ? 'Top Viewed Products' : 'View Statistics'}
                </h4>
                <div className="space-y-2">
                  {!productId ? (
                    getMostViewedProducts(period as any).map((product) => (
                      <div key={product.productId} className="flex items-center justify-between p-2 border rounded">
                        <div className="font-medium truncate max-w-[70%]">{product.title}</div>
                        <div className="flex items-center">
                          <EyeIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <span>{product.viewCount[period as keyof typeof product.viewCount].toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    products.map((product) => (
                      <div key={product.productId} className="flex flex-col p-3 border rounded">
                        <div className="font-medium mb-2">{product.title}</div>
                        <div className="text-3xl font-bold">
                          {product.viewCount[period as keyof typeof product.viewCount].toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          {period === 'day' ? 'Views today' : 
                           period === 'week' ? 'Views this week' :
                           period === 'month' ? 'Views this month' : 'Total views'}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {products.length === 0 && (
                    <div className="text-center p-4 border rounded">
                      <p className="text-muted-foreground">No product view data available</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 