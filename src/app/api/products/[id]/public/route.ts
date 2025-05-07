import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Log request details for debugging
  console.log(`[PUBLIC API] Fetching product with id: ${params.id}`);
  
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Fetch product data
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price,
        currency,
        template_type,
        image_url,
        features,
        slug,
        status,
        images,
        colors,
        sizes,
        quantity,
        min_order_quantity,
        max_order_quantity
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error(`[PUBLIC API] Database error for id '${params.id}':`, error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    if (!product) {
      console.log(`[PUBLIC API] Product with id '${params.id}' not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check product status
    if (product.status !== 'active') {
      console.log(`[PUBLIC API] Product with id '${params.id}' is not active (status: ${product.status})`);
      return NextResponse.json(
        { error: 'Product not available', status: product.status },
        { status: 403 }
      );
    }

    console.log(`[PUBLIC API] Successfully fetched product: ${product.title}`);
    return NextResponse.json(product);
  } catch (error) {
    console.error(`[PUBLIC API] Unexpected error for id '${params.id}':`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 