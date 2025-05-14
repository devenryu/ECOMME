import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { productIds, status } = await request.json();
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
    }
    
    if (!status || !['active', 'inactive', 'draft'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Verify the products belong to the current user
    const { data: productsCheck, error: productsCheckError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)
      .in('id', productIds)
      .eq('is_deleted', false); // Only update non-archived products
    
    if (productsCheckError) {
      return NextResponse.json({ error: 'Error verifying products ownership' }, { status: 500 });
    }
    
    // Filter out any products that don't belong to the user or are archived
    const validProductIds = productsCheck.map(p => p.id);
    
    if (validProductIds.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 });
    }
    
    // Update the status for all valid products
    const { data, error } = await supabase
      .from('products')
      .update({ status })
      .in('id', validProductIds)
      .select('id, title, status');
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: `Successfully updated ${validProductIds.length} products to ${status}`,
      products: data,
      updatedCount: validProductIds.length
    });
    
  } catch (error) {
    console.error('Error in batch status route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 