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
    const { orderIds, status } = await request.json();
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Verify the orders are associated with the seller's products
    const { data: ordersCheck, error: ordersCheckError } = await supabase
      .from('orders')
      .select(`
        id,
        products!inner (
          seller_id
        )
      `)
      .eq('products.seller_id', user.id)
      .in('id', orderIds);
    
    if (ordersCheckError) {
      return NextResponse.json({ error: 'Error verifying orders' }, { status: 500 });
    }
    
    // Filter out any orders that don't belong to the seller
    const validOrderIds = ordersCheck?.map(order => order.id) || [];
    
    if (validOrderIds.length === 0) {
      return NextResponse.json({ error: 'No valid orders found' }, { status: 400 });
    }
    
    // Update orders with new status
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', validOrderIds)
      .select('id, status');
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: `Successfully updated ${validOrderIds.length} orders to ${status}`,
      updatedOrders: data,
      updatedCount: validOrderIds.length
    });
    
  } catch (error) {
    console.error('Error in batch status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 