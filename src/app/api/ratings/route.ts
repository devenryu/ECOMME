import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ratingSchema } from '@/lib/validations/rating';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    // Validate request data
    const { rating, comment } = ratingSchema.parse({
      rating: body.rating,
      comment: body.comment,
    });
    
    const orderId = body.orderId;
    const productId = body.productId;
    
    if (!orderId || !productId) {
      return NextResponse.json(
        { error: 'Order ID and Product ID are required' },
        { status: 400 }
      );
    }
    
    // Verify the order exists and belongs to the product
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('product_id', productId)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Invalid order or product' },
        { status: 400 }
      );
    }
    
    // Check if a rating already exists for this order
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    let result;
    
    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabase
        .from('ratings')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRating.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new rating
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          order_id: orderId,
          product_id: productId,
          rating,
          comment,
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    // Update product average rating
    await updateProductRating(supabase, productId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ratings API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Function to update product average rating
async function updateProductRating(supabase: any, productId: string) {
  try {
    // Get all ratings for the product
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('product_id', productId);
    
    if (error) throw error;
    
    if (ratings.length === 0) {
      // No ratings, set to null
      await supabase
        .from('products')
        .update({
          average_rating: null,
          ratings_count: 0,
        })
        .eq('id', productId);
    } else {
      // Calculate average rating
      const sum = ratings.reduce((acc: number, curr: any) => acc + curr.rating, 0);
      const average = sum / ratings.length;
      
      // Update product
      await supabase
        .from('products')
        .update({
          average_rating: average.toFixed(2),
          ratings_count: ratings.length,
        })
        .eq('id', productId);
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');
    
    if (!orderId && !productId) {
      return NextResponse.json(
        { error: 'Order ID or Product ID is required' },
        { status: 400 }
      );
    }
    
    let query = supabase.from('ratings').select('*');
    
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (orderId && data.length === 0) {
      return NextResponse.json(null);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ratings API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 