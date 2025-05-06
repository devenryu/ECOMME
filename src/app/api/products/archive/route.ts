import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Archive/Unarchive API endpoint
 * This endpoint handles:
 * - Archiving products that can't be fully deleted due to order history
 * - Unarchiving previously archived products (restoring them)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { productId, action } = await request.json();
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['archive', 'unarchive'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be either "archive" or "unarchive"' },
        { status: 400 }
      );
    }

    // Check if product exists and belongs to the authenticated user
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, is_deleted, status')
      .eq('id', productId)
      .eq('seller_id', user.id)
      .single();
    
    if (productError || !product) {
      console.error('Error checking product ownership:', productError);
      return NextResponse.json(
        { error: 'Product not found or you do not have permission to modify it' },
        { status: 404 }
      );
    }
    
    // Handle archive or unarchive action
    if (action === 'archive') {
      // If product is already archived, return success
      if (product.is_deleted === true) {
        return NextResponse.json({
          message: 'Product already archived',
          archived: true,
          productId
        });
      }
      
      // Archive the product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_deleted: true,
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error archiving product:', updateError);
        return NextResponse.json(
          { error: 'Failed to archive product', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Product archived successfully',
        archived: true,
        productId
      });
    } else { // Unarchive
      // If product is not archived, return success
      if (product.is_deleted === false) {
        return NextResponse.json({
          message: 'Product already active',
          archived: false,
          productId
        });
      }
      
      // Unarchive the product, restore to draft status for safety
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_deleted: false,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Error unarchiving product:', updateError);
        return NextResponse.json(
          { error: 'Failed to unarchive product', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Product unarchived successfully',
        archived: false,
        productId
      });
    }
  } catch (error) {
    console.error('Products API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
} 