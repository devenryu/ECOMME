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
    const { orderIds, dateRange, status } = await request.json();
    
    // Build the query
    let query = supabase
      .from('orders')
      .select(`
        *,
        products!inner (
          title,
          price,
          currency,
          seller_id,
          template_type
        )
      `)
      .eq('products.seller_id', user.id);
    
    // Apply order ID filter if specified
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      query = query.in('id', orderIds);
    }
    
    // Apply date range filter if specified
    if (dateRange) {
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to);
      }
    }
    
    // Apply status filter if specified
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute the query
    const { data: orders, error: ordersError } = await query.order('created_at', { ascending: false });
    
    if (ordersError) {
      return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
    }
    
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }
    
    // Format orders for export
    const formattedOrders = orders.map(order => ({
      order_id: order.id,
      order_date: order.created_at,
      customer_name: order.full_name || 'N/A',
      customer_email: order.email || 'N/A',
      product_title: order.products.title,
      product_template: order.products.template_type,
      quantity: order.quantity || 1,
      status: order.status,
      total_amount: order.total_amount,
      currency: order.currency || order.products.currency,
      shipping_address: order.shipping_address ? JSON.stringify(order.shipping_address) : 'N/A',
      notes: order.notes || 'N/A',
      updated_at: order.updated_at
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedOrders,
      count: formattedOrders.length
    });
    
  } catch (error) {
    console.error('Error in export orders route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 