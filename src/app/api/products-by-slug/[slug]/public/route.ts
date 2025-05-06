import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Log request details for debugging
  console.log(`[PUBLIC API] Fetching product with slug: ${params.slug}`);
  
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Log RLS policies for debugging
    console.log(`[PUBLIC API] Checking product policies...`);
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_info');
    
    if (policiesError) {
      console.log(`[PUBLIC API] Error fetching policies: ${policiesError.message}`);
    } else {
      console.log(`[PUBLIC API] Available policies:`, policies);
    }

    // First try with auth to check if product exists at all
    console.log(`[PUBLIC API] Attempting admin query for product with slug: ${params.slug}`);
    const { data: adminCheck, error: adminError } = await supabase
      .from('products')
      .select('id, status, title')
      .eq('slug', params.slug)
      .single();

    if (adminError) {
      console.log(`[PUBLIC API] Admin query error for slug '${params.slug}':`, adminError);
    } else if (adminCheck) {
      console.log(`[PUBLIC API] Product exists with status: ${adminCheck.status}, title: ${adminCheck.title}`);
    } else {
      console.log(`[PUBLIC API] Product not found in admin check`);
    }

    // Fetch product data
    console.log(`[PUBLIC API] Fetching public product data for slug: ${params.slug}`);
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
        status
      `)
      .eq('slug', params.slug)
      .eq('status', 'active')  // Explicitly filter for active products
      .single();

    if (error) {
      console.error(`[PUBLIC API] Database error for slug '${params.slug}':`, error);
      
      // Check if it's a not found error
      if (error.code === 'PGRST116') {
        // Check if product exists but is not active
        if (adminCheck && adminCheck.status !== 'active') {
          return NextResponse.json(
            { error: 'Product not available', message: 'This product is not currently active.' },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { error: 'Product not found', message: 'The requested product does not exist.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    if (!product) {
      console.log(`[PUBLIC API] Product with slug '${params.slug}' not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log(`[PUBLIC API] Successfully fetched product: ${product.title}`);
    return NextResponse.json(product);
  } catch (error) {
    console.error(`[PUBLIC API] Unexpected error for slug '${params.slug}':`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 