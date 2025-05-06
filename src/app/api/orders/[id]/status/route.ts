import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user - recommended by Supabase for security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    // Validate status value
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // First, check if the order exists and get product_id
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, product_id')
      .eq('id', params.id)
      .limit(1);
      
    if (orderError) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Error fetching order', details: orderError.message },
        { status: 500 }
      );
    }

    // Check if order exists
    if (!orderData || orderData.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify seller is authorized to update this order
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', orderData[0].product_id)
      .eq('seller_id', user.id)
      .limit(1);
      
    if (productError) {
      console.error('Error fetching product:', productError);
      return NextResponse.json(
        { error: 'Error verifying product ownership', details: productError.message },
        { status: 500 }
      );
    }
    
    // Check if product exists and is owned by this user
    if (!productData || productData.length === 0) {
      return NextResponse.json(
        { error: 'You are not authorized to update this order' },
        { status: 403 }
      );
    }
    
    console.log(`Updating order ${params.id} status to ${status}`);

    // Update order status - the RLS policy will handle authorization
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`Successfully updated order ${params.id} status to ${status}`);
    
    return NextResponse.json({
      message: 'Order status updated successfully',
      orderId: params.id,
      status: status
    });
  } catch (error) {
    console.error('Orders API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
} 