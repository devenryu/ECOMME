import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { MinimalTemplate } from '@/components/templates/minimal';
import { StandardTemplate } from '@/components/templates/standard';
import { PremiumTemplate } from '@/components/templates/premium';
import { trackProductView } from '@/lib/product-tracking';

// Force dynamic rendering and disable caching to resolve stale data issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  // Make sure we have a base URL, or default to localhost in development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/products-by-slug/${slug}/public`;
  
  console.log(`[ProductPage] Fetching product from: ${url}`);
  
  try {
    const response = await fetch(url, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    console.log(`[ProductPage] API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[ProductPage] Error fetching product:`, errorData || response.statusText);
      return null;
    }

    const product = await response.json();
    console.log(`[ProductPage] Successfully fetched product: ${product.title}`);
    console.log(`[ProductPage] Product colors:`, product.colors);
    return product;
  } catch (error) {
    console.error(`[ProductPage] Unexpected error fetching product:`, error);
    return null;
  }
}

export default async function ProductPage({ params }: PageProps) {
  console.log(`[ProductPage] Rendering page for slug: ${params.slug}`);
  
  const product = await getProduct(params.slug);

  // If product not found or not active, return 404
  if (!product) {
    console.log(`[ProductPage] Product not found for slug: ${params.slug}, returning 404`);
    notFound();
  }
  
  // Track product view on the server side
  await trackProductView(product.id);

  console.log(`[ProductPage] Rendering template: ${product.template_type} for product: ${product.title}`);
  
  // Render the appropriate template based on product.template_type
  switch (product.template_type) {
    case 'minimal':
      return <MinimalTemplate product={product} />;
    case 'standard':
      return <StandardTemplate product={product} />;
    case 'premium':
      return <PremiumTemplate product={product} />;
    default:
      console.log(`[ProductPage] Unknown template type: ${product.template_type}, falling back to standard template`);
      return <StandardTemplate product={product} />;
  }
} 