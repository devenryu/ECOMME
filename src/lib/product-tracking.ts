/**
 * Utility functions for product tracking
 */

/**
 * Track a product view by making a request to the product-views API endpoint
 * @param productId - The UUID of the product being viewed
 * @returns Promise that resolves when the view is tracked
 */
export async function trackProductView(productId: string): Promise<void> {
  if (!productId) {
    console.error('[trackProductView] No product ID provided');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/product-views`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: productId }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[trackProductView] Failed to track view:', errorData);
    }
  } catch (error) {
    console.error('[trackProductView] Error tracking product view:', error);
  }
}

/**
 * Gets the view count for a product
 * @param productId - The UUID of the product
 * @param period - Time period for views: 'day', 'week', 'month', or 'all'
 * @returns Promise that resolves to the view count
 */
export async function getProductViewCount(
  productId: string,
  period: 'day' | 'week' | 'month' | 'all' = 'all'
): Promise<number> {
  if (!productId) {
    console.error('[getProductViewCount] No product ID provided');
    return 0;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/product-views/count?productId=${encodeURIComponent(productId)}&period=${period}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('[getProductViewCount] Error getting product view count:', error);
    return 0;
  }
} 