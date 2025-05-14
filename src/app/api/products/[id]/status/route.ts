import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slugify } from '@/lib/utils';

// Define interface for product update data
interface ProductUpdateData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string; 
  status?: string;
  template_type?: string;
  image_url?: string;
  features?: any[];
  slug?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[API] Updating product with id: ${params.id}`);
  
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log(`[API] Unauthorized update attempt for product ${params.id}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    let body;
    try {
      body = await request.json();
      console.log(`[API] Update request body:`, body);
    } catch (error) {
      console.error(`[API] Error parsing request body:`, error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // First, check if the product exists and belongs to the user
    console.log(`[API] Checking if product ${params.id} exists and belongs to user ${session.user.id}`);
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('seller_id', session.user.id)
      .single();

    if (fetchError) {
      console.error(`[API] Error fetching product ${params.id}:`, fetchError);
      return NextResponse.json(
        { error: 'Error fetching product', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingProduct) {
      console.log(`[API] Product ${params.id} not found or does not belong to user ${session.user.id}`);
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Handle both simple status updates and full product updates
    let updateData: ProductUpdateData = {};
    
    if (Object.keys(body).length === 1 && 'status' in body) {
      // Simple status update
      const { status } = body;
      
      if (!['active', 'inactive', 'draft'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      
      updateData = { status };
    } else {
      // Full product update
      const { title, description, price, currency, status, template_type, image_url, features, slug } = body;
      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(status !== undefined && { status }),
        ...(template_type !== undefined && { template_type }),
        ...(image_url !== undefined && { image_url }),
        ...(features !== undefined && { features }),
        ...(slug !== undefined && { slug }),
      };
      
      // Only regenerate slug if title has changed
      if (title && title !== existingProduct.title) {
        const baseSlug = slugify(title);
        // Keep the unique part from the existing slug
        const uniqueId = existingProduct.slug.split('-').pop();
        updateData.slug = `${baseSlug}-${uniqueId}`;
      }
    }

    console.log(`[API] Updating product ${params.id} with data:`, updateData);

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', params.id)
      .eq('seller_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error(`[API] Error updating product ${params.id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Product ${params.id} updated successfully`);
    return NextResponse.json(product);
  } catch (error) {
    console.error(`[API] Unexpected error updating product ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 