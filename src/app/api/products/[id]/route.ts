import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { slugify } from '@/lib/utils';

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

    // Extract colors to handle separately
    const colorsData = body.colors || [];
    const { colors, ...restBody } = body;

    // Prepare update data - only include fields that can be updated
    const { title, description, price, currency, status, template_type, image_url, features, sizes, images } = restBody;
    
    // Define the update data object with proper typing
    const updateData: {
      title?: string;
      description?: string;
      price?: number;
      currency?: string;
      status?: string;
      template_type?: string;
      image_url?: string;
      features?: any[];
      sizes?: string[];
      images?: string[];
      slug?: string;
    } = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(currency !== undefined && { currency }),
      ...(status !== undefined && { status }),
      ...(template_type !== undefined && { template_type }),
      ...(image_url !== undefined && { image_url }),
      ...(features !== undefined && { features }),
      ...(sizes !== undefined && { sizes }),
      ...(images !== undefined && { images }),
    };
    
    // Only regenerate slug if title has changed
    if (title && title !== existingProduct.title) {
      const baseSlug = slugify(title);
      // Keep the unique part from the existing slug
      const uniqueId = existingProduct.slug.split('-').pop();
      updateData.slug = `${baseSlug}-${uniqueId}`;
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

    // Update colors if they were provided
    if (colors !== undefined) {
      // First, delete existing colors
      const { error: deleteError } = await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', params.id);

      if (deleteError) {
        console.error(`[API] Error deleting existing colors for product ${params.id}:`, deleteError);
      } else if (colorsData.length > 0) {
        // Then insert new colors
        const productColors = colorsData.map((color: any) => ({
          product_id: params.id,
          color_id: color.custom ? null : color.id,
          custom_hex_code: color.custom ? color.hex_code : null
        }));

        const { error: insertError } = await supabase
          .from('product_colors')
          .insert(productColors);

        if (insertError) {
          console.error(`[API] Error inserting new colors for product ${params.id}:`, insertError);
        }
      }
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch product
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('seller_id', session.user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[API] Deleting product with id: ${params.id}`);
  
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user's session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log(`[API] Unauthorized delete attempt for product ${params.id}`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, check if the product exists and belongs to the user
    console.log(`[API] Checking if product ${params.id} exists and belongs to user ${user.id}`);
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('seller_id', user.id)
      .single();

    if (fetchError) {
      console.error(`[API] Error fetching product ${params.id}:`, fetchError);
      return NextResponse.json(
        { error: 'Error fetching product', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingProduct) {
      console.log(`[API] Product ${params.id} not found or does not belong to user ${user.id}`);
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if the product has any orders
    console.log(`[API] Checking if product ${params.id} has any orders`);
    const { count: ordersCount, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', params.id);
    
    if (countError) {
      console.error(`[API] Error checking for orders on product ${params.id}:`, countError);
      return NextResponse.json(
        { error: 'Failed to check if product has orders', details: countError.message },
        { status: 500 }
      );
    }
    
    // If product has orders, archive it (soft delete) instead of hard delete
    if (ordersCount && ordersCount > 0) {
      console.log(`[API] Product ${params.id} has ${ordersCount} orders, performing soft delete (archive)`);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_deleted: true,
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('seller_id', user.id);
      
      if (updateError) {
        console.error(`[API] Error archiving product ${params.id}:`, updateError);
        return NextResponse.json(
          { error: 'Failed to archive product', details: updateError.message },
          { status: 500 }
        );
      }
      
      console.log(`[API] Product ${params.id} archived successfully`);
      return NextResponse.json({
        message: 'Product archived successfully due to existing orders',
        archived: true,
        deleted: false
      });
    }
    
    // No orders associated, perform hard delete
    console.log(`[API] Product ${params.id} has no orders, performing hard delete`);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)
      .eq('seller_id', user.id);

    if (error) {
      console.error(`[API] Error deleting product ${params.id}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Product ${params.id} deleted successfully`);
    return NextResponse.json({
      message: 'Product deleted successfully',
      archived: false,
      deleted: true
    });
  } catch (error) {
    console.error(`[API] Unexpected error deleting product ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 