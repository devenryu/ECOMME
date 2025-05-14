import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { productIds, action } = await request.json();
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
    }
    
    if (!action || !['archive', 'unarchive'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Verify the products belong to the current user
    const { data: productsCheck, error: productsCheckError } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)
      .in('id', productIds);
    
    if (productsCheckError) {
      return NextResponse.json({ error: 'Error verifying products ownership' }, { status: 500 });
    }
    
    // Filter out any products that don't belong to the user
    const validProductIds = productsCheck.map(p => p.id);
    
    if (validProductIds.length === 0) {
      return NextResponse.json({ error: 'No valid products found' }, { status: 400 });
    }
    
    // Update the is_deleted status based on action
    const { data, error } = await supabase
      .from('products')
      .update({ is_deleted: action === 'archive' })
      .in('id', validProductIds)
      .select();
    
    if (error) {
      return NextResponse.json({ error: `Failed to ${action} products` }, { status: 500 });
    }
    
    return NextResponse.json({
      message: `Successfully ${action === 'archive' ? 'archived' : 'unarchived'} ${validProductIds.length} products`,
      products: data
    });
    
  } catch (error) {
    console.error('Error in batch archive route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 