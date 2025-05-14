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
      .select('id, status, title, is_deleted')
      .eq('slug', params.slug)
      .single();

    if (adminError) {
      console.log(`[PUBLIC API] Admin query error for slug '${params.slug}':`, adminError);
    } else if (adminCheck) {
      console.log(`[PUBLIC API] Product exists with status: ${adminCheck.status}, title: ${adminCheck.title}, archived: ${adminCheck.is_deleted}`);
      
      // If product is archived, return product not available
      if (adminCheck.is_deleted) {
        return NextResponse.json(
          { error: 'Product not available', message: 'This product is no longer available.' },
          { status: 403 }
        );
      }
    } else {
      console.log(`[PUBLIC API] Product not found in admin check`);
    }

    // Define a product type that includes colors
    interface ProductWithColors {
      id: string;
      title: string;
      description: string;
      price: number;
      currency: string;
      template_type: string;
      image_url: string;
      features: any[];
      slug: string;
      status: string;
      images: string[];
      sizes: string[];
      quantity: number;
      min_order_quantity: number;
      max_order_quantity: number | null;
      colors?: Array<{
        id: string;
        name: string;
        hex_code: string;
        custom?: boolean;
      }>;
    }

    // Fetch product data
    console.log(`[PUBLIC API] Fetching public product data for slug: ${params.slug}`);
    const { data, error } = await supabase
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
        sizes,
        quantity,
        min_order_quantity,
        max_order_quantity,
        colors
      `)
      .eq('slug', params.slug)
      .eq('status', 'active')  // Explicitly filter for active products
      .eq('is_deleted', false) // Ensure archived products aren't shown
      .single();

    if (error) {
      console.error(`[PUBLIC API] Database error for slug '${params.slug}':`, error);
      
      // Check if it's a not found error
      if (error.code === 'PGRST116') {
        // Check if product exists but is not active or is archived
        if (adminCheck) {
          if (adminCheck.is_deleted) {
            return NextResponse.json(
              { error: 'Product not available', message: 'This product is no longer available.' },
              { status: 403 }
            );
          } else if (adminCheck.status !== 'active') {
            return NextResponse.json(
              { error: 'Product not available', message: 'This product is not currently active.' },
              { status: 403 }
            );
          }
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

    if (!data) {
      console.log(`[PUBLIC API] Product with slug '${params.slug}' not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Cast the data to our product type
    const product = data as unknown as ProductWithColors;

    // Define proper types for color data
    interface ColorObject {
      id: string;
      name: string;
      hex_code: string;
      custom?: boolean;
    }

    let formattedColors: ColorObject[] = [];

    // Fetch product colors from relationship table
    console.log(`[PUBLIC API] Fetching colors for product ID: ${product.id}`);
    const { data: productColors, error: colorsError } = await supabase
      .from('product_colors')
      .select(`
        id,
        color_id,
        custom_hex_code,
        standard_colors(id, name, hex_code)
      `)
      .eq('product_id', product.id);

    console.log(`[PUBLIC API] Product colors data:`, productColors);

    if (colorsError) {
      console.error(`[PUBLIC API] Error fetching product colors: ${colorsError.message}`);
    } else if (productColors && productColors.length > 0) {
      // Define types for database objects
      interface StandardColor {
        id: string;
        name: string;
        hex_code: string;
      }
      
      interface ProductColor {
        id: string;
        color_id: string;
        custom_hex_code?: string | null;
        standard_colors?: StandardColor | null;
      }

      // Format colors to a consistent structure
      formattedColors = productColors.map((item: any) => ({
        id: item.color_id || item.id,
        name: item.standard_colors?.name || 'Custom',
        hex_code: item.custom_hex_code || item.standard_colors?.hex_code || '#000000', // Provide fallback color
        custom: !!item.custom_hex_code
      }));
      
      console.log(`[PUBLIC API] Formatted colors from product_colors table:`, formattedColors);
    } else {
      // Check if the product has colors directly in its data
      console.log(`[PUBLIC API] Checking product.colors:`, product.colors);
      
      if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
        console.log(`[PUBLIC API] Using colors from product.colors field (text[] of hex codes):`, product.colors);
        
        // Get standard colors to look up names
        const { data: standardColors, error: standardColorsError } = await supabase
          .from('standard_colors')
          .select('id, name, hex_code');
          
        if (standardColorsError) {
          console.error(`[PUBLIC API] Error fetching standard colors:`, standardColorsError);
        }
        
        formattedColors = [];
        
        // Process each color in the array
        for (const colorItem of product.colors) {
          if (typeof colorItem === 'string' && /^#[0-9A-Fa-f]{6}$/.test(colorItem)) {
            // It's a hex code string
            const hex: string = colorItem;
            const matchingStandardColor = standardColors?.find(sc => 
              sc.hex_code.toLowerCase() === hex.toLowerCase()
            );
            
            if (matchingStandardColor) {
              formattedColors.push({
                id: matchingStandardColor.id,
                name: matchingStandardColor.name,
                hex_code: matchingStandardColor.hex_code,
                custom: false
              });
            } else {
              formattedColors.push({
                id: `color-${hex}`,
                name: 'Custom',
                hex_code: hex,
                custom: true
              });
            }
          } else if (typeof colorItem === 'object' && colorItem !== null && 'hex_code' in colorItem) {
            // It's a legacy color object
            try {
              formattedColors.push({
                id: colorItem.id || `color-${colorItem.hex_code}`,
                name: colorItem.name || 'Unknown',
                hex_code: colorItem.hex_code || '#000000',
                custom: colorItem.custom || false
              });
            } catch (error) {
              console.error(`[PUBLIC API] Error processing legacy color format:`, error);
            }
          }
        }
        
        console.log(`[PUBLIC API] Processed ${formattedColors.length} colors from product.colors`);
      } else {
        console.log(`[PUBLIC API] No colors found in product_colors table or product.colors for product ${product.id}`);
        formattedColors = [];
      }
    }

    // Return the product with colors
    console.log(`[PUBLIC API] Returning product ${product.title} with ${formattedColors.length} colors`);
    return NextResponse.json({
      ...product,
      colors: formattedColors
    });
  } catch (error) {
    console.error(`[PUBLIC API] Unexpected error for slug '${params.slug}':`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 