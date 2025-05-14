import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function getSizeCategories() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('size_categories')
    .select('id, name, description')
    .order('name');

  if (error) {
    console.error('Error fetching size categories:', error);
    return [];
  }

  return data || [];
}

export async function getStandardSizes(categoryId: string) {
  if (!categoryId) return [];
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('standard_sizes')
    .select('id, value, display_order')
    .eq('size_category_id', categoryId)
    .order('display_order');

  if (error) {
    console.error('Error fetching standard sizes:', error);
    return [];
  }

  return data || [];
}

export async function getStandardColors() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('standard_colors')
    .select('id, name, hex_code, display_order')
    .order('display_order');

  if (error) {
    console.error('Error fetching standard colors:', error);
    return [];
  }

  return data || [];
}

export async function getProductColors(productId: string) {
  if (!productId) return [];
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('product_colors')
    .select(`
      id, 
      product_id,
      color_id,
      custom_hex_code,
      standard_colors(id, name, hex_code)
    `)
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching product colors:', error);
    return [];
  }

  interface ProductColorItem {
    id: string;
    color_id: string | null;
    custom_hex_code: string | null;
    standard_colors: {
      id: string;
      name: string;
      hex_code: string;
    } | {
      id: string;
      name: string;
      hex_code: string;
    }[] | null;
  }

  return data.map((item: any) => {
    const standardColors = Array.isArray(item.standard_colors) 
      ? item.standard_colors[0] 
      : item.standard_colors;
      
    return {
      id: item.color_id || item.id,
      name: standardColors?.name || 'Custom',
      hex_code: item.custom_hex_code || standardColors?.hex_code,
      custom: !!item.custom_hex_code
    };
  }) || [];
}

// Function to save product colors
export async function saveProductColors(productId: string, colors: any[]) {
  if (!productId || !colors || colors.length === 0) return;
  
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // First delete existing product colors
  const { error: deleteError } = await supabase
    .from('product_colors')
    .delete()
    .eq('product_id', productId);

  if (deleteError) {
    console.error('Error deleting existing product colors:', deleteError);
    return false;
  }

  // Then insert new ones
  const productColors = colors.map(color => ({
    product_id: productId,
    color_id: color.custom ? null : color.id,
    custom_hex_code: color.custom ? color.hex_code : null
  }));

  const { error: insertError } = await supabase
    .from('product_colors')
    .insert(productColors);

  if (insertError) {
    console.error('Error inserting product colors:', insertError);
    return false;
  }

  return true;
}

// Function to transform color format for consistent use throughout the app
export function formatColorForDisplay(color: any) {
  if (!color) return null;
  
  // If it's already an object with the right structure
  if (typeof color === 'object' && color.hex_code) {
    return {
      id: color.id || `custom-${color.hex_code}`,
      name: color.name || 'Custom',
      hex_code: color.hex_code,
      custom: !!color.custom
    };
  }
  
  // If it's a string (hex code)
  if (typeof color === 'string' && color.startsWith('#')) {
    return {
      id: `custom-${color}`,
      name: 'Custom',
      hex_code: color,
      custom: true
    };
  }
  
  return null;
} 