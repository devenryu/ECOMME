import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Force this route to be dynamic as it uses request.url
export const dynamic = 'force-dynamic';

interface SizeCategory {
  id: string;
  name: string;
  description: string;
}

interface Size {
  id: string;
  value: string;
  display_order: number;
}

interface Color {
  id: string;
  name: string;
  hex_code: string;
  display_order: number;
}

export async function GET(request: Request) {
  try {
    // Skip authentication for now to simplify development
    // In a production app, you would want to authenticate the user here
    
    const { searchParams } = new URL(request.url);
    const sizeCategoryId = searchParams.get('size_category_id');
    
    const supabase = createClient();

    // Get all size categories
    const { data: sizeCategories, error: sizeCatError } = await supabase
      .from('size_categories')
      .select('id, name, description')
      .order('name');

    if (sizeCatError) {
      return NextResponse.json({ error: sizeCatError.message }, { status: 500 });
    }

    // Get standard sizes if a category id is provided
    let sizes: Size[] = [];
    if (sizeCategoryId) {
      const { data: sizesData, error: sizesError } = await supabase
        .from('standard_sizes')
        .select('id, value, display_order')
        .eq('size_category_id', sizeCategoryId)
        .order('display_order');

      if (sizesError) {
        return NextResponse.json({ error: sizesError.message }, { status: 500 });
      }

      sizes = sizesData || [];
    }

    // Get all standard colors
    const { data: colors, error: colorsError } = await supabase
      .from('standard_colors')
      .select('id, name, hex_code, display_order')
      .order('display_order');

    if (colorsError) {
      return NextResponse.json({ error: colorsError.message }, { status: 500 });
    }

    return NextResponse.json({
      sizeCategories: sizeCategories || [],
      sizes,
      colors: colors || []
    });
  } catch (error) {
    console.error('[API] Error fetching product options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product options' },
      { status: 500 }
    );
  }
} 