import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { OrderForm } from '@/components/orders/order-form';
import { formatCurrency } from '@/lib/utils';

interface PageProps {
  params: {
    slug: string;
  };
  searchParams: {
    quantity?: string;
    size?: string;
    color?: string;
  };
}

async function getProduct(slug: string) {
  // Make sure we have a base URL, or default to localhost in development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    console.log(`[Order Page] Fetching product with slug: ${slug} from ${baseUrl}`);
    
    const response = await fetch(
      `${baseUrl}/api/products-by-slug/${slug}/public`,
      { 
        next: { revalidate: 60 },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Order Page] Failed to fetch product: ${response.status} ${response.statusText}`);
      console.error(`[Order Page] Response body: ${text}`);
      return null;
    }

    try {
      const data = await response.json();
      console.log(`[Order Page] Successfully fetched product: ${data.title}`);
      return data;
    } catch (error) {
      console.error(`[Order Page] JSON parse error:`, error);
      return null;
    }
  } catch (error) {
    console.error(`[Order Page] Network error fetching product:`, error);
    return null;
  }
}

export default async function OrderPage({ params, searchParams }: PageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    console.log(`[Order Page] Product not found or error occurred, returning 404`);
    notFound();
  }

  // Parse and validate quantity
  const quantity = searchParams.quantity ? parseInt(searchParams.quantity) : product.min_order_quantity;
  const validQuantity = Math.max(
    product.min_order_quantity,
    Math.min(
      quantity,
      product.max_order_quantity ?? Infinity,
      product.quantity
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <div className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(product.price * validQuantity, product.currency)}
              </div>
              {validQuantity > 1 && (
                <div className="text-sm text-gray-500">
                  ({formatCurrency(product.price, product.currency)} each × {validQuantity} items)
                </div>
              )}
              {product.quantity < 10 && (
                <div className="text-sm text-red-500">
                  Only {product.quantity} left in stock
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Order Details</h2>
            <OrderForm 
              productId={product.id} 
              productSlug={product.slug}
              initialQuantity={validQuantity}
              initialSize={searchParams.size}
              initialColor={searchParams.color}
              product={{
                ...product,
                price: product.price,
                currency: product.currency
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 