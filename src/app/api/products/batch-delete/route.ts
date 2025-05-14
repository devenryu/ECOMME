import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
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
    
    // Check which products have associated orders
    const { data: productsWithOrders, error: ordersError } = await supabase
      .from('orders')
      .select('product_id')
      .in('product_id', validProductIds);
    
    if (ordersError) {
      return NextResponse.json({ error: 'Error checking for product orders' }, { status: 500 });
    }
    
    // Products with orders should be archived instead of deleted
    const productsToArchiveIds = [...new Set(productsWithOrders?.map(o => o.product_id) || [])];
    const productsToDeleteIds = validProductIds.filter(id => !productsToArchiveIds.includes(id));
    
    const results = {
      deletedIds: [] as string[],
      archivedIds: [] as string[],
      deletedCount: 0,
      archivedCount: 0
    };
    
    // Archive products with orders
    if (productsToArchiveIds.length > 0) {
      const { data: archivedProducts, error: archiveError } = await supabase
        .from('products')
        .update({ is_deleted: true })
        .in('id', productsToArchiveIds)
        .select('id');
      
      if (archiveError) {
        return NextResponse.json({ error: 'Failed to archive products with orders' }, { status: 500 });
      }
      
      results.archivedIds = archivedProducts?.map(p => p.id) || [];
      results.archivedCount = results.archivedIds.length;
    }
    
    // Delete products without orders
    if (productsToDeleteIds.length > 0) {
      const { data: deletedProducts, error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', productsToDeleteIds)
        .select('id');
      
      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
      }
      
      results.deletedIds = deletedProducts?.map(p => p.id) || [];
      results.deletedCount = results.deletedIds.length;
    }
    
    return NextResponse.json({
      message: `Processed ${validProductIds.length} products: deleted ${results.deletedCount}, archived ${results.archivedCount}`,
      ...results
    });
    
  } catch (error) {
    console.error('Error in batch delete route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 