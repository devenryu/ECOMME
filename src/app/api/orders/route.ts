import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { orderSchema } from '@/lib/validations/order';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        *,
        products (
          title,
          price,
          currency,
          seller_id,
          quantity,
          min_order_quantity,
          max_order_quantity
        )
      `)
      .order('created_at', { ascending: false });

    // Add product filter if specified
    if (productId) {
      query = query.eq('product_id', productId);
    }

    // Only fetch orders for products owned by the current user
    query = query.eq('products.seller_id', session.user.id);

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    // Validate request body
    const validatedData = orderSchema.parse(body);

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get product details to calculate total amount and validate quantity
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, quantity, min_order_quantity, max_order_quantity')
      .eq('id', body.productId)
      .single();

    if (productError) {
      throw productError;
    }

    // Validate quantity
    const orderQuantity = validatedData.quantity;
    if (orderQuantity < product.min_order_quantity) {
      return NextResponse.json(
        { error: `Minimum order quantity is ${product.min_order_quantity}` },
        { status: 400 }
      );
    }
    if (product.max_order_quantity && orderQuantity > product.max_order_quantity) {
      return NextResponse.json(
        { error: `Maximum order quantity is ${product.max_order_quantity}` },
        { status: 400 }
      );
    }
    if (orderQuantity > product.quantity) {
      return NextResponse.json(
        { error: `Only ${product.quantity} items available in stock` },
        { status: 400 }
      );
    }

    // Create order in database with all required fields
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        product_id: body.productId,
        full_name: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        shipping_address: validatedData.shippingAddress,
        notes: validatedData.notes,
        status: 'pending',
        user_id: session?.user?.id ? session.user.id : '00000000-0000-0000-0000-000000000000',
        total_amount: product.price * orderQuantity,
        quantity: orderQuantity,
        size: validatedData.size,
        color: validatedData.color
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update product quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: product.quantity - orderQuantity })
      .eq('id', body.productId);

    if (updateError) {
      // If updating quantity fails, we should roll back the order
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      throw updateError;
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Orders API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 