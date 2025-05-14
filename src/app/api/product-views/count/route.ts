import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  const period = searchParams.get('period') || 'all';
  
  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Check if the product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Call the database function to get the view count
    const { data, error } = await supabase.rpc(
      'get_product_view_count',
      {
        product_id: productId,
        period: period
      }
    );
    
    if (error) {
      console.error('Error getting view count:', error);
      return NextResponse.json(
        { error: 'Failed to get view count' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ count: data });
    
  } catch (error) {
    console.error('Unexpected error getting view count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 