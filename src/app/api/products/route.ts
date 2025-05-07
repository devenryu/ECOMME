import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slugify, generateProductId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Increased limit to ensure we get all products
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const archived = searchParams.get('archived');

    // Build query - removed RLS filter for is_deleted since we want to see all
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    
    // Paginate if needed
    if (page && limit) {
      query = query.range((page - 1) * limit, page * limit - 1);
    }

    // Add filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    // Filter by archived status if specified
    if (archived === 'true') {
      query = query.eq('is_deleted', true);
    } else if (archived === 'false') {
      query = query.eq('is_deleted', false);
    }
    // If not specified, return all products (including archived)

    // Execute query
    const { data: products, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Generate slug from title and unique ID
    const baseSlug = slugify(body.title);
    const uniqueId = generateProductId();
    const slug = `${baseSlug}-${uniqueId}`;

    // Insert new product
    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          ...body,
          sizes: body.sizes || [],
          colors: body.colors || [],
          images: body.images || [],
          seller_id: user.id,
          status: body.status || 'draft',
          slug,
          is_deleted: false // Explicitly set is_deleted to false for new products
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 