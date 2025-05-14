import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  
  try {
    // First check if the user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If productId is provided, get view statistics for that specific product
    if (productId) {
      // Verify that the product belongs to the current user
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, seller_id')
        .eq('id', productId)
        .single();
      
      if (productError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Check if the user owns this product
      if (product.seller_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access this product' },
          { status: 403 }
        );
      }
      
      // Get view counts for different time periods
      const periods = ['day', 'week', 'month', 'all'];
      const viewCounts: Record<string, number> = {};
      
      for (const period of periods) {
        const { data, error } = await supabase.rpc(
          'get_product_view_count',
          {
            product_id: productId,
            period
          }
        );
        
        if (error) {
          console.error(`Error getting ${period} view count:`, error);
          viewCounts[period] = 0;
        } else {
          viewCounts[period] = data || 0;
        }
      }
      
      return NextResponse.json([{
        productId: product.id,
        title: product.title,
        viewCount: viewCounts
      }]);
    }
    
    // If no productId is provided, get all products for this seller with view counts
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .eq('seller_id', user.id)
      .eq('is_deleted', false);
      
    if (productsError) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
    
    // Get view counts for each product
    const productsWithViewCounts = await Promise.all(
      products.map(async (product) => {
        const viewCount: Record<string, number> = {
          day: 0,
          week: 0,
          month: 0,
          all: 0
        };
        
        for (const period of Object.keys(viewCount)) {
          const { data, error } = await supabase.rpc(
            'get_product_view_count',
            {
              product_id: product.id,
              period
            }
          );
          
          if (!error) {
            viewCount[period] = data || 0;
          }
        }
        
        return {
          productId: product.id,
          title: product.title,
          viewCount
        };
      })
    );
    
    return NextResponse.json(productsWithViewCounts);
  } catch (error) {
    console.error('Error in product views analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 